'use client';
import { useState, useCallback, useRef } from 'react';
import { nanoid } from 'nanoid';
import type { TransferMessage, TransferOffer } from '@neardrop/shared';
import { chunkFile, decodeChunk, getTotalChunks } from '@/lib/chunker';
import { computeFileSHA256, computeSHA256 } from '@/lib/checksum';
import { MemoryAssembler, IndexedDBAssembler, LARGE_FILE_THRESHOLD } from '@/lib/assembler';

const BUFFER_THRESHOLD = 16 * 1024 * 1024; // 16MB

export interface OutgoingTransfer {
  id: string; peerId: string; name: string;
  size: number; progress: number; status: 'pending' | 'sending' | 'done' | 'error';
}

export interface IncomingTransfer {
  id: string; peerId: string; name: string; size: number; mimeType: string;
  totalChunks: number; sha256: string;
  status: 'pending' | 'accepted' | 'receiving' | 'done' | 'error';
  progress: number;
}

export function useTransfer() {
  const [outgoing, setOutgoing] = useState<Map<string, OutgoingTransfer>>(new Map());
  const [incoming, setIncoming] = useState<Map<string, IncomingTransfer>>(new Map());
  const assemblers = useRef<Map<string, MemoryAssembler | IndexedDBAssembler>>(new Map());

  const sendFile = useCallback(async (peerId: string, file: File, channel: RTCDataChannel) => {
    const id = nanoid();
    const totalChunks = getTotalChunks(file.size);
    const sha256 = await computeFileSHA256(file);

    const offer: TransferOffer = {
      type: 'TRANSFER_OFFER', id,
      name: file.name, size: file.size, mimeType: file.type,
      totalChunks, sha256,
    };
    channel.send(JSON.stringify(offer));

    setOutgoing(m => new Map(m).set(id, {
      id, peerId, name: file.name, size: file.size, progress: 0, status: 'pending',
    }));

    await new Promise<void>((resolve, reject) => {
      const closeHandler = () => reject(new Error('Channel closed'));
      channel.addEventListener('close', closeHandler);

      const acceptHandler = async (event: MessageEvent) => {
        let msg: TransferMessage;
        try { msg = JSON.parse(event.data as string); } catch { return; }
        if (msg.type !== 'TRANSFER_ACCEPT' || msg.id !== id) return;

        channel.removeEventListener('message', acceptHandler);
        channel.removeEventListener('close', closeHandler);
        setOutgoing(m => { const n = new Map(m); n.set(id, { ...n.get(id)!, status: 'sending' }); return n; });

        let sent = 0;
        for await (const { encoded } of chunkFile(file)) {
          while (channel.bufferedAmount > BUFFER_THRESHOLD) {
            await new Promise(r => {
              channel.bufferedAmountLowThreshold = BUFFER_THRESHOLD / 2;
              channel.addEventListener('bufferedamountlow', r, { once: true });
            });
          }
          channel.send(encoded);
          sent++;
          setOutgoing(m => {
            const n = new Map(m);
            n.set(id, { ...n.get(id)!, progress: Math.round((sent / totalChunks) * 100) });
            return n;
          });
        }

        channel.send(JSON.stringify({ type: 'TRANSFER_DONE', id, sha256 }));
        setOutgoing(m => { const n = new Map(m); n.set(id, { ...n.get(id)!, status: 'done' }); return n; });
        resolve();
      };
      channel.addEventListener('message', acceptHandler);
    });
  }, []);

  const sendText = useCallback((channel: RTCDataChannel, content: string) => {
    channel.send(JSON.stringify({ type: 'TEXT_MESSAGE', id: nanoid(), content, timestamp: Date.now() }));
  }, []);

  const acceptTransfer = useCallback((id: string, channel: RTCDataChannel) => {
    channel.send(JSON.stringify({ type: 'TRANSFER_ACCEPT', id }));
    setIncoming(m => { const n = new Map(m); n.set(id, { ...n.get(id)!, status: 'receiving' }); return n; });
  }, []);

  const rejectTransfer = useCallback((id: string, channel: RTCDataChannel) => {
    channel.send(JSON.stringify({ type: 'TRANSFER_REJECT', id }));
    setIncoming(m => { const n = new Map(m); n.delete(id); return n; });
    assemblers.current.delete(id);
  }, []);

  const handleChannelMessage = useCallback(async (
    peerId: string,
    event: MessageEvent,
    onText: (content: string, from: string) => void,
    onIncomingOffer: (transfer: IncomingTransfer) => void,
  ) => {
    const data = event.data as string | ArrayBuffer;

    if (typeof data === 'string') {
      const msg = JSON.parse(data) as TransferMessage;

      if (msg.type === 'TRANSFER_OFFER') {
        const transfer: IncomingTransfer = {
          id: msg.id, peerId, name: msg.name, size: msg.size,
          mimeType: msg.mimeType, totalChunks: msg.totalChunks, sha256: msg.sha256,
          status: 'pending', progress: 0,
        };
        const asm = msg.size >= LARGE_FILE_THRESHOLD
          ? new IndexedDBAssembler() : new MemoryAssembler(msg.mimeType, msg.totalChunks);
        if (asm instanceof IndexedDBAssembler) await asm.open();
        assemblers.current.set(msg.id, asm);
        setIncoming(m => new Map(m).set(msg.id, transfer));
        onIncomingOffer(transfer);
      }

      if (msg.type === 'TRANSFER_DONE') {
        const transfer = incoming.get(msg.id);
        if (!transfer) return;
        const asm = assemblers.current.get(msg.id);
        if (!asm) return;

        (async () => {
          try {
            let blob: Blob;
            if (asm instanceof MemoryAssembler) {
              blob = asm.assemble();
            } else {
              blob = await (asm as IndexedDBAssembler).assemble(msg.id, transfer.totalChunks, transfer.mimeType);
              await (asm as IndexedDBAssembler).cleanup(msg.id, transfer.totalChunks);
            }

            const actualHash = await computeSHA256(await blob.arrayBuffer());
            if (actualHash !== msg.sha256) {
              setIncoming(m => { const n = new Map(m); n.set(msg.id, { ...n.get(msg.id)!, status: 'error' }); return n; });
              return;
            }

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = transfer.name; a.click();
            setTimeout(() => URL.revokeObjectURL(url), 60_000);
            setIncoming(m => { const n = new Map(m); n.set(msg.id, { ...n.get(msg.id)!, status: 'done' }); return n; });
            assemblers.current.delete(msg.id);
          } catch {
            setIncoming(m => { const n = new Map(m); n.set(msg.id, { ...n.get(msg.id)!, status: 'error' }); return n; });
          }
        })();
      }

      if (msg.type === 'TEXT_MESSAGE') {
        onText(msg.content, peerId);
      }
    } else {
      // Binary: a chunk
      const { index, data: chunkData } = decodeChunk(data);
      setIncoming(currentIncoming => {
        for (const [id, transfer] of currentIncoming) {
          if (transfer.peerId !== peerId || transfer.status !== 'receiving') continue;
          const asm = assemblers.current.get(id);
          if (!asm) continue;
          if (asm instanceof MemoryAssembler) {
            asm.addChunk(index, chunkData);
          } else {
            (asm as IndexedDBAssembler).storeChunk(id, index, chunkData);
          }
          const updated = new Map(currentIncoming);
          const t = { ...updated.get(id)! };
          t.progress = Math.round(((index + 1) / t.totalChunks) * 100);
          updated.set(id, t);
          return updated;
        }
        return currentIncoming;
      });
    }
  }, [incoming]);

  return { outgoing, incoming, sendFile, sendText, acceptTransfer, rejectTransfer, handleChannelMessage };
}
