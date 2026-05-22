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
  previewUrl?: string;
  mimeType?: string;
}

export interface IncomingTransfer {
  id: string; peerId: string; name: string; size: number; mimeType: string;
  totalChunks: number; sha256: string;
  status: 'pending' | 'accepted' | 'receiving' | 'done' | 'error';
  progress: number;
  previewUrl?: string;
}

export function useTransfer() {
  const [outgoing, setOutgoing] = useState<Map<string, OutgoingTransfer>>(new Map());
  const [incoming, setIncoming] = useState<Map<string, IncomingTransfer>>(new Map());
  const assemblers = useRef<Map<string, MemoryAssembler | IndexedDBAssembler>>(new Map());
  // Ref mirror of incoming — lets stable callbacks read current state without closure staleness
  const incomingRef = useRef<Map<string, IncomingTransfer>>(new Map());

  // Always update ref inside the functional updater so it stays in sync with React state
  const setIncomingWithRef = useCallback(
    (updater: (m: Map<string, IncomingTransfer>) => Map<string, IncomingTransfer>) => {
      setIncoming(m => {
        const n = updater(m);
        incomingRef.current = n;
        return n;
      });
    },
    [],
  );

  const sendFile = useCallback(async (peerId: string, file: File, channel: RTCDataChannel) => {
    const id = nanoid();
    const totalChunks = getTotalChunks(file.size);
    const sha256 = await computeFileSHA256(file);

    const offer: TransferOffer = {
      type: 'TRANSFER_OFFER', id,
      name: file.name, size: file.size, mimeType: file.type,
      totalChunks, sha256,
    };
    const isPreviewableOutgoing = file.type.startsWith('image/')
      || file.type.startsWith('audio/')
      || file.type.startsWith('video/');
    const previewUrl = isPreviewableOutgoing ? URL.createObjectURL(file) : undefined;
    channel.send(JSON.stringify(offer));

    setOutgoing(m => new Map(m).set(id, {
      id, peerId, name: file.name, size: file.size, progress: 0, status: 'pending',
      mimeType: file.type, previewUrl,
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
        setOutgoing(m => {
          const n = new Map(m);
          const prev = n.get(id);
          if (prev?.previewUrl) {
            const revokeDelay = (prev.mimeType?.startsWith('audio/') || prev.mimeType?.startsWith('video/'))
              ? 600_000 : 60_000;
            setTimeout(() => URL.revokeObjectURL(prev.previewUrl!), revokeDelay);
          }
          n.set(id, { ...prev!, status: 'done' });
          return n;
        });
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
    setIncomingWithRef(m => { const n = new Map(m); n.set(id, { ...n.get(id)!, status: 'receiving' }); return n; });
  }, [setIncomingWithRef]);

  const rejectTransfer = useCallback((id: string, channel: RTCDataChannel) => {
    channel.send(JSON.stringify({ type: 'TRANSFER_REJECT', id }));
    setIncomingWithRef(m => { const n = new Map(m); n.delete(id); return n; });
    assemblers.current.delete(id);
  }, [setIncomingWithRef]);

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
        setIncomingWithRef(m => new Map(m).set(msg.id, transfer));
        onIncomingOffer(transfer);
      }

      if (msg.type === 'TRANSFER_DONE') {
        // Read from ref — avoids stale closure when state updates have occurred since last render
        const transfer = incomingRef.current.get(msg.id);
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
              setIncomingWithRef(m => { const n = new Map(m); n.set(msg.id, { ...n.get(msg.id)!, status: 'error' }); return n; });
              return;
            }

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = transfer.name; a.click();
            setTimeout(() => URL.revokeObjectURL(url), 60_000);
            const isPreviewable = transfer.mimeType.startsWith('image/')
              || transfer.mimeType.startsWith('video/')
              || transfer.mimeType.startsWith('audio/');
            const previewUrl = isPreviewable ? URL.createObjectURL(blob) : undefined;
            // Images: revoke after 60s. Video/audio: 10 min — avoids breaking mid-playback.
            if (previewUrl) {
              const revokeDelay = transfer.mimeType.startsWith('image/') ? 60_000 : 600_000;
              setTimeout(() => URL.revokeObjectURL(previewUrl), revokeDelay);
            }
            setIncomingWithRef(m => { const n = new Map(m); n.set(msg.id, { ...n.get(msg.id)!, status: 'done', previewUrl }); return n; });
            assemblers.current.delete(msg.id);
          } catch {
            setIncomingWithRef(m => { const n = new Map(m); n.set(msg.id, { ...n.get(msg.id)!, status: 'error' }); return n; });
          }
        })();
      }

      if (msg.type === 'TEXT_MESSAGE') {
        onText(msg.content, peerId);
      }
    } else {
      // Binary: a chunk
      const { index, data: chunkData } = decodeChunk(data);

      // Find the receiving transfer via ref — ref is always current, no stale-closure risk
      let targetId: string | null = null;
      for (const [id, transfer] of incomingRef.current) {
        if (transfer.peerId === peerId && transfer.status === 'receiving') {
          targetId = id;
          break;
        }
      }
      if (targetId === null) return;

      const asm = assemblers.current.get(targetId);
      if (!asm) return;

      if (asm instanceof MemoryAssembler) {
        asm.addChunk(index, chunkData);
      } else {
        // storeChunk is async — call outside state updater so rejections surface and are handled
        (asm as IndexedDBAssembler).storeChunk(targetId, index, chunkData).catch(() => {
          setIncomingWithRef(m => {
            const n = new Map(m);
            n.set(targetId!, { ...n.get(targetId!)!, status: 'error' });
            return n;
          });
        });
      }

      const id = targetId;
      setIncomingWithRef(m => {
        const t = m.get(id);
        if (!t) return m;
        const n = new Map(m);
        n.set(id, { ...t, progress: Math.round(((index + 1) / t.totalChunks) * 100) });
        return n;
      });
    }
  }, [setIncomingWithRef]);

  return { outgoing, incoming, sendFile, sendText, acceptTransfer, rejectTransfer, handleChannelMessage };
}
