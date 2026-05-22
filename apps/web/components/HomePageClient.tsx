'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { nanoid } from 'nanoid';
import type { Peer } from '@neardrop/shared';
import { getOrCreateIdentity, updateIdentity } from '@/lib/deviceName';
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
import { loadPersistedMessages, savePersistedMessages, clearPersistedMessages } from '@/lib/messages';
import { useDarkMode } from '@/hooks/useDarkMode';
import { hashPassword } from '@/lib/hashPassword';
import { playSend, playReceive } from '@/lib/sounds';
import { requestNotificationPermission, notifyReceived } from '@/lib/notify';
import { formatBytes } from '@/lib/fileIcons';
import { IconSend, IconArrowLeft, IconFile } from '@/components/icons';

const NAME_SET_KEY = 'neardrop-name-set';
const MY_ROOM_KEY = 'neardrop-my-room';

export default function HomePage() {
  const [identity, setIdentity] = useState(getOrCreateIdentity);
  const [nameReady, setNameReady] = useState(() => {
    try { return !!localStorage.getItem(NAME_SET_KEY); } catch { return false; }
  });

  const { dark, toggle: toggleDark } = useDarkMode();
  const { peers, roomCode, setRoomJoined, addPeer, removePeer, reset: resetPeers } = usePeers();
  const peersRef = useRef(peers);
  useEffect(() => { peersRef.current = peers; }, [peers]);
  const identityRef = useRef(identity);
  useEffect(() => { identityRef.current = identity; }, [identity]);
  const [selectedPeer, setSelectedPeer] = useState<Peer | null>(null);
  const [broadcastMode, setBroadcastMode] = useState(false);
  const broadcastFileRef = useRef<HTMLInputElement>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [passwordSet, setPasswordSet] = useState(false);
  const [pendingTransfer, setPendingTransfer] = useState<IncomingTransfer | null>(null);
  const [messages, setMessages] = useState<Message[]>(() => loadPersistedMessages());
  const [unread, setUnread] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);
  const [myRoomCode, setMyRoomCode] = useState<string | null>(() => {
    try { return localStorage.getItem(MY_ROOM_KEY); } catch { return null; }
  });

  const { outgoing, incoming, sendFile, sendText, acceptTransfer, rejectTransfer, handleChannelMessage } =
    useTransfer();

  const closeAllRef = useRef<(() => void) | null>(null);

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
    onDisconnect: () => {
      closeAllRef.current?.();
      resetPeers();
    },
    onReconnect: () => {
      const id = identityRef.current;
      joinRoom({ displayName: id.displayName, emoji: id.emoji, deviceType: id.deviceType });
    },
  });

  const [peerQuality, setPeerQuality] = useState<Map<string, 'direct' | 'relay' | 'unknown'>>(new Map());

  const { initiateConnection, handleSignal, closeAll, getChannel, getConnection, peerStates, getQuality } = useWebRTC({
    onChannel: (peerId, channel) => {
      channel.onmessage = (e) =>
        handleChannelMessage(
          peerId, e,
          (content) => {
            playReceive();
            const senderName = peersRef.current.find(p => p.id === peerId)?.displayName ?? 'Someone';
            notifyReceived('NearDrop', `${senderName}: ${content.slice(0, 60)}`);
            setMessages(m => [...m, {
              id: nanoid(), peerId, peerName: senderName, content, direction: 'received', timestamp: Date.now(),
            }]);
            setUnread(u => new Set(u).add(peerId));
          },
          (t) => {
            playReceive();
            const senderName = peersRef.current.find(p => p.id === t.peerId)?.displayName ?? 'Someone';
            notifyReceived('NearDrop', `${senderName} wants to send ${t.name} (${formatBytes(t.size)})`);
            setPendingTransfer(t);
          },
        );
    },
    onSendSignal: (to, type, payload) => sendSignal({ to, type, payload }),
    onConnectionChange: (peerId, state) => {
      if (state === 'connected') {
        setTimeout(async () => {
          const q = await getQuality(peerId);
          setPeerQuality(m => new Map(m).set(peerId, q));
        }, 1500);
      }
    },
  });

  useEffect(() => { closeAllRef.current = closeAll; }, [closeAll]);

  // Persist messages to localStorage whenever they change
  useEffect(() => { savePersistedMessages(messages); }, [messages]);

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

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const addHistory = useCallback((entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => {
    const full: HistoryEntry = { ...entry, id: nanoid(), timestamp: Date.now() };
    setHistory(h => {
      const next = [...h, full];
      saveHistory(next);
      return next;
    });
  }, []);

  const handleCreateRoom = useCallback(async (password: string | null) => {
    const hash = password ? await hashPassword(password) : undefined;
    setPasswordSet(!!password);
    joinRoom({
      roomCode: undefined,
      displayName: identity.displayName,
      emoji: identity.emoji,
      deviceType: identity.deviceType,
      passwordHash: hash,
    });
  }, [identity, joinRoom]);

  const handleNameSet = useCallback((name: string, emoji: string) => {
    const updated = updateIdentity(name, emoji);
    setIdentity(updated);
    try { localStorage.setItem(NAME_SET_KEY, '1'); } catch { /* ignore */ }
    setNameReady(true);
  }, []);

  const handleSendFiles = useCallback((files: File[]) => {
    const targets = broadcastMode ? peers : (selectedPeer ? [selectedPeer] : []);
    targets.forEach(target => {
      const channel = getChannel(target.id);
      if (!channel) return;
      files.forEach(f => {
        playSend();
        sendFile(target.id, f, channel).then(() => {
          addHistory({ peerId: target.id, peerName: target.displayName, kind: 'file', name: f.name, direction: 'sent', status: 'done' });
        }).catch(() => {
          addHistory({ peerId: target.id, peerName: target.displayName, kind: 'file', name: f.name, direction: 'sent', status: 'error' });
        });
      });
    });
  }, [broadcastMode, peers, selectedPeer, getChannel, sendFile, addHistory]);

  const handleSendText = useCallback((text: string) => {
    const targets = broadcastMode ? peers : (selectedPeer ? [selectedPeer] : []);
    targets.forEach(target => {
      const channel = getChannel(target.id);
      if (!channel) return;
      playSend();
      sendText(channel, text);
      setMessages(m => [...m, {
        id: nanoid(), peerId: target.id, peerName: target.displayName, content: text, direction: 'sent', timestamp: Date.now(),
      }]);
      addHistory({ peerId: target.id, peerName: target.displayName, kind: 'text', name: text.slice(0, 40), direction: 'sent', status: 'done' });
    });
  }, [broadcastMode, peers, selectedPeer, getChannel, sendText, addHistory]);

  // Capture OS share target params (text/URL shared from another app)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const sharedText = params.get('text') || params.get('url') || params.get('title');
    if (!sharedText) return;
    sessionStorage.setItem('neardrop-shared-text', sharedText);
    window.history.replaceState({}, '', '/');
  }, []);

  // Auto-send stored share target text when a peer is selected
  useEffect(() => {
    if (!selectedPeer) return;
    const sharedText = sessionStorage.getItem('neardrop-shared-text');
    if (!sharedText) return;
    sessionStorage.removeItem('neardrop-shared-text');
    handleSendText(sharedText);
  }, [selectedPeer, handleSendText]);

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
        peerQuality={peerQuality}
        broadcastSelected={broadcastMode}
        onBroadcastSelect={() => { setBroadcastMode(true); setSelectedPeer(null); }}
        onSelectPeer={(p) => {
          setBroadcastMode(false);
          setSelectedPeer(p);
          setUnread(u => { const n = new Set(u); n.delete(p.id); return n; });
        }}
        onNewRoom={() => setQrOpen(true)}
        onJoinRoom={() => setJoinOpen(true)}
        dark={dark}
        onToggleDark={toggleDark}
        myRoomCode={myRoomCode}
        currentRoomCode={roomCode}
        onJoinMyRoom={() => {
          if (!myRoomCode || !identity) return;
          joinRoom({ roomCode: myRoomCode, displayName: identity.displayName, emoji: identity.emoji, deviceType: identity.deviceType });
        }}
        onSaveAsMyRoom={() => {
          if (!roomCode) return;
          try { localStorage.setItem(MY_ROOM_KEY, roomCode); } catch { /* ignore */ }
          setMyRoomCode(roomCode);
        }}
      />

      <main className="flex-1 flex flex-col overflow-hidden bg-stone-50 dark:bg-stone-950">
        <div className="md:hidden flex items-center justify-between px-4 pt-4 pb-2">
          <h1 className="text-base font-extrabold text-stone-900 dark:text-stone-100">NearDrop</h1>
          <div className="flex gap-2">
            <button onClick={() => setQrOpen(true)}
              className="text-xs font-bold bg-stone-900 dark:bg-stone-100 dark:text-stone-900 text-white px-3 py-1.5 rounded-lg"
              title="Share a link or QR code so someone on a different network can join">
              Invite
            </button>
            <button onClick={() => setJoinOpen(true)}
              className="text-xs font-bold bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 px-3 py-1.5 rounded-lg"
              title="Enter a room code to join someone on a different network">
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

        <div className="hidden md:flex flex-1 p-6 overflow-auto bg-stone-50 dark:bg-stone-950">
          {broadcastMode ? (
            <div className="flex-1 flex flex-col h-full w-full">
              <div className="flex items-center gap-3 pb-3 border-b border-stone-100 dark:border-stone-800">
                <div className="w-9 h-9 bg-stone-900 dark:bg-stone-100 rounded-full flex items-center justify-center text-white dark:text-stone-900 shrink-0"><IconSend className="w-4 h-4" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-stone-900 dark:text-stone-100">Everyone</p>
                  <p className="text-[10px] text-stone-400">{peers.length} device{peers.length !== 1 ? 's' : ''}</p>
                </div>
                <input ref={broadcastFileRef} type="file" multiple className="hidden"
                  onChange={(e) => { const f = Array.from(e.target.files ?? []); if (f.length) handleSendFiles(f); }} />
                <button onClick={() => broadcastFileRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs font-bold bg-stone-900 dark:bg-stone-100 dark:text-stone-900 text-white px-3 py-1.5 rounded-lg hover:bg-stone-700 dark:hover:bg-stone-300 transition-colors">
                  <IconFile className="w-3.5 h-3.5" /> File
                </button>
              </div>
              <div className="flex-1 flex items-center justify-center text-stone-400 dark:text-stone-600">
                <p className="text-sm text-center">Files and messages sent here will be delivered to all {peers.length} connected device{peers.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          ) : selectedPeer ? (
            <SendPanel
              peer={selectedPeer}
              messages={messages.filter(m => m.peerName === selectedPeer.displayName)}
              onSendFiles={handleSendFiles}
              onSendText={handleSendText}
              outgoing={Array.from(outgoing.values()).filter(t => t.peerId === selectedPeer.id)}
              incoming={Array.from(incoming.values()).filter(t => t.peerId === selectedPeer.id)}
              history={history.filter(h => (h.peerName ?? h.peerId) === (selectedPeer.displayName ?? selectedPeer.id))}
              onClearHistory={() => {
                setHistory(h => { const next = h.filter(e => (e.peerName ?? e.peerId) !== (selectedPeer.displayName ?? selectedPeer.id)); saveHistory(next); return next; });
                setMessages(m => { const next = m.filter(msg => msg.peerName !== selectedPeer.displayName); savePersistedMessages(next); return next; });
              }}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-stone-300 dark:text-stone-700">
              <IconArrowLeft className="w-10 h-10 mb-3" />
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
        incoming={Array.from(incoming.values())}
        messages={selectedPeer ? messages.filter(m => m.peerName === selectedPeer.displayName) : messages}
        history={selectedPeer ? history.filter(h => (h.peerName ?? h.peerId) === selectedPeer.displayName) : history}
        onClearHistory={() => {
          if (!selectedPeer) return;
          setHistory(h => { const next = h.filter(e => (e.peerName ?? e.peerId) !== selectedPeer.displayName); saveHistory(next); return next; });
          setMessages(m => { const next = m.filter(msg => msg.peerName !== selectedPeer.displayName); savePersistedMessages(next); return next; });
        }}
      />

      <IncomingAlert
        transfer={pendingTransfer}
        fromName={peers.find(p => p.id === pendingTransfer?.peerId)?.displayName ?? 'Someone'}
        onAccept={(id) => {
          const channel = getChannel(pendingTransfer!.peerId);
          if (channel) acceptTransfer(id, channel);
          if (pendingTransfer) {
            const senderName = peers.find(p => p.id === pendingTransfer.peerId)?.displayName ?? 'Someone';
            addHistory({ peerId: pendingTransfer.peerId, peerName: senderName, kind: 'file', name: pendingTransfer.name, direction: 'received', status: 'done' });
          }
          setPendingTransfer(null);
        }}
        onReject={(id) => {
          const channel = getChannel(pendingTransfer!.peerId);
          if (channel) rejectTransfer(id, channel);
          setPendingTransfer(null);
        }}
      />

      <QRCodePanel
        roomCode={roomCode}
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        onCreateWithPassword={handleCreateRoom}
        passwordSet={passwordSet}
      />
      <RoomCodeInput open={joinOpen} onClose={() => setJoinOpen(false)}
        onJoin={async (code, password) => {
          const hash = password ? await hashPassword(password) : undefined;
          joinRoom({ roomCode: code, displayName: identity.displayName, emoji: identity.emoji, deviceType: identity.deviceType, passwordHash: hash });
        }}
      />
    </div>
  );
}
