'use client';
import { useEffect, useState, useCallback } from 'react';
import { nanoid } from 'nanoid';
import type { Peer } from '@neardrop/shared';
import { getOrCreateIdentity, updateDisplayName } from '@/lib/deviceName';
import { useSignaling } from '@/hooks/useSignaling';
import { usePeers } from '@/hooks/usePeers';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useTransfer } from '@/hooks/useTransfer';
import { RadialCanvas } from '@/components/RadialCanvas';
import { SendSheet } from '@/components/SendSheet';
import { SendPanel } from '@/components/SendPanel';
import { DesktopSidebar } from '@/components/DesktopSidebar';
import { IncomingAlert } from '@/components/IncomingAlert';
import { QRCodePanel } from '@/components/QRCodePanel';
import { RoomCodeInput } from '@/components/RoomCodeInput';
import { NameEntry } from '@/components/NameEntry';
import type { IncomingTransfer } from '@/hooks/useTransfer';
import type { Message } from '@/components/SendPanel';
import { loadHistory, saveHistory, type HistoryEntry } from '@/lib/history';

const NAME_SET_KEY = 'neardrop-name-set';

export default function HomePage() {
  const [identity, setIdentity] = useState(getOrCreateIdentity);
  const [nameReady, setNameReady] = useState(() => {
    try { return !!localStorage.getItem(NAME_SET_KEY); } catch { return false; }
  });

  const { peers, roomCode, setRoomJoined, addPeer, removePeer } = usePeers();
  const [selectedPeer, setSelectedPeer] = useState<Peer | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [pendingTransfer, setPendingTransfer] = useState<IncomingTransfer | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unread, setUnread] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);

  const { outgoing, sendFile, sendText, acceptTransfer, rejectTransfer, handleChannelMessage } =
    useTransfer();

  const { joinRoom, sendSignal, leaveRoom, signalingStatus } = useSignaling({
    onRoomJoined: ({ roomCode: code, peers: existingPeers }) => {
      setRoomJoined(code, existingPeers);
      existingPeers.forEach(p => initiateConnection(p));
    },
    onPeerJoined: ({ peer }) => {
      addPeer(peer);
    },
    onPeerLeft: ({ peerId }) => removePeer(peerId),
    onSignal: ({ from, type, payload }) => handleSignal(from, type, payload),
  });

  const { initiateConnection, handleSignal, getChannel, getConnection, peerStates } = useWebRTC({
    onChannel: (peerId, channel) => {
      channel.onmessage = (e) =>
        handleChannelMessage(
          peerId, e,
          (content) => {
            setMessages(m => [...m, {
              id: nanoid(), peerId, content, direction: 'received', timestamp: Date.now(),
            }]);
            setUnread(u => new Set(u).add(peerId));
          },
          (t) => setPendingTransfer(t),
        );
    },
    onSendSignal: (to, type, payload) => sendSignal({ to, type, payload }),
  });

  useEffect(() => {
    if (!nameReady) return;
    const joinCode = sessionStorage.getItem('neardrop-join-code') ?? undefined;
    if (joinCode) sessionStorage.removeItem('neardrop-join-code');
    joinRoom({
      roomCode: joinCode,
      displayName: identity.displayName,
      emoji: identity.emoji,
      deviceType: identity.deviceType,
    });
    return () => leaveRoom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nameReady]);

  const addHistory = useCallback((entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => {
    const full: HistoryEntry = { ...entry, id: nanoid(), timestamp: Date.now() };
    setHistory(h => {
      const next = [...h, full];
      saveHistory(next);
      return next;
    });
  }, []);

  const handleNameSet = useCallback((name: string) => {
    const updated = updateDisplayName(name);
    setIdentity(updated);
    try { localStorage.setItem(NAME_SET_KEY, '1'); } catch { /* ignore */ }
    setNameReady(true);
  }, []);

  const handleSendFiles = useCallback((files: File[]) => {
    if (!selectedPeer) return;
    const channel = getChannel(selectedPeer.id);
    if (!channel) return;
    files.forEach(f => {
      sendFile(selectedPeer.id, f, channel).then(() => {
        addHistory({ peerId: selectedPeer.id, kind: 'file', name: f.name, direction: 'sent', status: 'done' });
      }).catch(() => {
        addHistory({ peerId: selectedPeer.id, kind: 'file', name: f.name, direction: 'sent', status: 'error' });
      });
    });
  }, [selectedPeer, getChannel, sendFile, addHistory]);

  const handleSendText = useCallback((text: string) => {
    if (!selectedPeer) return;
    const channel = getChannel(selectedPeer.id);
    if (!channel) return;
    sendText(channel, text);
    setMessages(m => [...m, {
      id: nanoid(), peerId: selectedPeer.id, content: text, direction: 'sent', timestamp: Date.now(),
    }]);
    addHistory({ peerId: selectedPeer.id, kind: 'text', name: text.slice(0, 40), direction: 'sent', status: 'done' });
  }, [selectedPeer, getChannel, sendText, addHistory]);

  if (!nameReady) {
    return <NameEntry onComplete={handleNameSet} />;
  }

  const me: Peer = {
    id: identity.id,
    displayName: identity.displayName,
    emoji: identity.emoji,
    deviceType: identity.deviceType,
  };

  return (
    <div className="flex h-dvh overflow-hidden">
      <DesktopSidebar
        me={me} peers={peers}
        selectedPeerId={selectedPeer?.id ?? null}
        roomCode={roomCode}
        unreadPeerIds={unread}
        signalingStatus={signalingStatus}
        peerStates={peerStates}
        onSelectPeer={(p) => { setSelectedPeer(p); setUnread(u => { const n = new Set(u); n.delete(p.id); return n; }); }}
        onNewRoom={() => setQrOpen(true)}
        onJoinRoom={() => setJoinOpen(true)}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="md:hidden flex items-center justify-between px-4 pt-4 pb-2">
          <h1 className="text-base font-extrabold text-stone-900">NearDrop</h1>
          <div className="flex gap-2">
            <button onClick={() => setQrOpen(true)}
              className="text-xs font-bold bg-stone-900 text-white px-3 py-1.5 rounded-lg">
              Invite
            </button>
            <button onClick={() => setJoinOpen(true)}
              className="text-xs font-bold bg-white border border-stone-200 text-stone-900 px-3 py-1.5 rounded-lg">
              Join
            </button>
          </div>
        </div>

        <div className="md:hidden flex-1 flex flex-col px-4">
          <RadialCanvas
            me={me} peers={peers}
            selectedPeerId={selectedPeer?.id ?? null}
            onSelectPeer={(p) => { setSelectedPeer(p); setSheetOpen(true); }}
          />
          {peers.length === 0 && (
            <p className="text-center text-xs text-stone-400 pb-8">
              Waiting for nearby devices…
            </p>
          )}
        </div>

        <div className="hidden md:flex flex-1 p-6 overflow-auto">
          {selectedPeer ? (
            <SendPanel
              peer={selectedPeer}
              messages={messages.filter(m => m.peerId === selectedPeer.id)}
              onSendFiles={handleSendFiles}
              onSendText={handleSendText}
              outgoing={Array.from(outgoing.values()).filter(t => t.peerId === selectedPeer.id)}
              history={history.filter(h => h.peerId === selectedPeer.id)}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-stone-300">
              <span className="text-5xl mb-3">←</span>
              <p className="text-sm font-medium">Select a device to send files</p>
            </div>
          )}
        </div>
      </main>

      <SendSheet
        peer={selectedPeer} open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSendFiles={handleSendFiles}
        onSendText={handleSendText}
        outgoing={Array.from(outgoing.values())}
        messages={messages}
        history={history}
      />

      <IncomingAlert
        transfer={pendingTransfer}
        fromName={peers.find(p => p.id === pendingTransfer?.peerId)?.displayName ?? 'Someone'}
        onAccept={(id) => {
          const channel = getChannel(pendingTransfer!.peerId);
          if (channel) acceptTransfer(id, channel);
          if (pendingTransfer) {
            addHistory({ peerId: pendingTransfer.peerId, kind: 'file', name: pendingTransfer.name, direction: 'received', status: 'done' });
          }
          setPendingTransfer(null);
        }}
        onReject={(id) => {
          const channel = getChannel(pendingTransfer!.peerId);
          if (channel) rejectTransfer(id, channel);
          setPendingTransfer(null);
        }}
      />

      <QRCodePanel roomCode={roomCode} open={qrOpen} onClose={() => setQrOpen(false)} />
      <RoomCodeInput open={joinOpen} onClose={() => setJoinOpen(false)}
        onJoin={(code) => joinRoom({ roomCode: code, displayName: identity.displayName, emoji: identity.emoji, deviceType: identity.deviceType })}
      />
    </div>
  );
}
