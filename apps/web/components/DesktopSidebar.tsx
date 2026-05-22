import type { Peer } from '@neardrop/shared';
import { Button } from '@/components/ui/button';
import type { SignalingStatus } from '@/hooks/useSignaling';
import { IconSend, IconZap, IconHome, IconSave } from '@/components/icons';

interface Props {
  me: Peer;
  peers: Peer[];
  selectedPeerId: string | null;
  roomCode: string | null;
  unreadPeerIds: Set<string>;
  signalingStatus: SignalingStatus;
  peerStates: Map<string, RTCPeerConnectionState>;
  peerQuality: Map<string, 'direct' | 'relay' | 'unknown'>;
  broadcastSelected: boolean;
  onBroadcastSelect: () => void;
  onSelectPeer: (peer: Peer) => void;
  onNewRoom: () => void;
  onJoinRoom: () => void;
  dark: boolean;
  onToggleDark: () => void;
  myRoomCode: string | null;
  currentRoomCode: string | null;
  onJoinMyRoom: () => void;
  onSaveAsMyRoom: () => void;
}

function shortId(id: string) {
  return id.slice(-4).toUpperCase();
}

function StatusDot({ status }: { status: SignalingStatus }) {
  const colors: Record<SignalingStatus, string> = {
    connected:    'bg-green-500',
    connecting:   'bg-yellow-400 animate-pulse',
    disconnected: 'bg-red-500',
  };
  const labels: Record<SignalingStatus, string> = {
    connected:    'Connected',
    connecting:   'Reconnecting…',
    disconnected: 'Offline',
  };
  return (
    <span title={labels[status]} className={`w-2 h-2 rounded-full inline-block shrink-0 ${colors[status]}`} />
  );
}

function hashHue(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % 360;
}

export function PeerAvatar({ peer, size = 'md' }: { peer: { id: string; emoji: string; displayName: string }; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-7 h-7 text-sm' : 'w-8 h-8 text-base';
  if (peer.emoji) {
    return (
      <div className={`${dim} bg-white rounded-full flex items-center justify-center border border-stone-200 shrink-0 dark:bg-stone-800 dark:border-stone-700`}>
        {peer.emoji}
      </div>
    );
  }
  const initials = peer.displayName
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const hue = hashHue(peer.id);
  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center border shrink-0 font-bold text-white text-[10px]`}
      style={{ backgroundColor: `hsl(${hue},60%,50%)`, borderColor: `hsl(${hue},60%,40%)` }}
    >
      {initials}
    </div>
  );
}

export function DesktopSidebar({ me, peers, selectedPeerId, unreadPeerIds, signalingStatus, peerStates, peerQuality, broadcastSelected, onBroadcastSelect, onSelectPeer, onNewRoom, onJoinRoom, dark, onToggleDark, myRoomCode, currentRoomCode, onJoinMyRoom, onSaveAsMyRoom }: Props) {
  const activePeer = peers.find(p => p.id === selectedPeerId) ?? null;

  return (
    <aside className="hidden md:flex w-60 flex-col bg-stone-100 border-r border-stone-200 shrink-0 dark:bg-stone-900 dark:border-stone-800">
      {/* App header */}
      <div className="p-4 pb-3 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-extrabold text-stone-900 tracking-tight dark:text-stone-100">NearDrop</h1>
          <StatusDot status={signalingStatus} />
          <button
            onClick={onToggleDark}
            className="ml-auto text-[10px] font-bold text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 tracking-wide transition-colors"
          >
            {dark ? 'Light' : 'Dark'}
          </button>
        </div>
      </div>

      {/* Your identity */}
      <div className="px-3 py-3 border-b border-stone-200 dark:border-stone-800">
        <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-2 dark:text-stone-500">You</p>
        <div className="flex items-center gap-2">
          <PeerAvatar peer={me} />
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5">
              <p className="text-xs font-bold text-stone-900 truncate dark:text-stone-100">{me.displayName}</p>
              <span className="text-[9px] font-mono text-stone-400 shrink-0 dark:text-stone-500">#{shortId(me.id)}</span>
            </div>
            <p className="text-[10px] text-green-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
              online
            </p>
          </div>
        </div>
      </div>

      {/* Active room */}
      {activePeer && (
        <div className="px-3 py-3 border-b border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-800">
          <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-2 dark:text-stone-500">Room</p>
          <div className="bg-white rounded-xl border border-stone-200 px-3 py-2.5 space-y-2 dark:bg-stone-900 dark:border-stone-700">
            <div className="flex items-center gap-2">
              <PeerAvatar peer={me} size="sm" />
              <div className="min-w-0">
                <div className="flex items-baseline gap-1">
                  <p className="text-[11px] font-bold text-stone-900 truncate dark:text-stone-100">{me.displayName}</p>
                  <span className="text-[9px] font-mono text-stone-400 dark:text-stone-500">#{shortId(me.id)}</span>
                </div>
              </div>
            </div>
            <div className="border-t border-stone-100 dark:border-stone-700" />
            <div className="flex items-center gap-2">
              <PeerAvatar peer={activePeer} size="sm" />
              <div className="min-w-0">
                <div className="flex items-baseline gap-1">
                  <p className="text-[11px] font-bold text-stone-900 truncate dark:text-stone-100">{activePeer.displayName}</p>
                  <span className="text-[9px] font-mono text-stone-400 dark:text-stone-500">#{shortId(activePeer.id)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nearby devices */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-1 dark:text-stone-500">Nearby</p>
        <p className="text-[9px] text-stone-400 dark:text-stone-600 mb-2">Devices on the same Wi-Fi appear here automatically</p>
        {/* My Room shortcut */}
        {(myRoomCode || currentRoomCode) && (
          <div className="mb-2">
            {myRoomCode && myRoomCode !== currentRoomCode && (
              <button
                onClick={onJoinMyRoom}
                className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-bold text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
              >
                <IconHome className="w-3.5 h-3.5 shrink-0" /> Rejoin My Room ({myRoomCode})
              </button>
            )}
            {currentRoomCode && currentRoomCode !== myRoomCode && (
              <button
                onClick={onSaveAsMyRoom}
                className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-bold text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
              >
                <IconSave className="w-3.5 h-3.5 shrink-0" /> Save as My Room
              </button>
            )}
            {currentRoomCode && currentRoomCode === myRoomCode && (
              <p className="text-[10px] text-stone-400 dark:text-stone-500 px-2 py-1 flex items-center gap-1.5">
                <IconHome className="w-3.5 h-3.5 shrink-0" /> My Room ({myRoomCode})
              </p>
            )}
          </div>
        )}
        {peers.length === 0 ? (
          <p className="text-[11px] text-stone-400 leading-relaxed dark:text-stone-500">
            No devices found yet. Open NearDrop on another device on the same network.
          </p>
        ) : (
          <>
          {peers.length > 0 && (
            <button
              onClick={onBroadcastSelect}
              className={[
                'w-full flex items-center gap-2 px-2 py-2 rounded-xl text-left transition-colors mb-1',
                broadcastSelected
                  ? 'bg-white border border-stone-900 shadow-sm dark:bg-stone-800 dark:border-stone-400'
                  : 'bg-white border border-stone-200 hover:border-stone-300 dark:bg-stone-800 dark:border-stone-700 dark:hover:border-stone-600',
              ].join(' ')}
            >
              <div className="w-7 h-7 rounded-full bg-stone-900 dark:bg-stone-100 flex items-center justify-center text-white dark:text-stone-900 shrink-0">
                <IconSend className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-stone-900 dark:text-stone-100">Everyone</p>
                <p className="text-[10px] text-stone-400">{peers.length} device{peers.length !== 1 ? 's' : ''}</p>
              </div>
            </button>
          )}
          <div className="space-y-1">
            {peers.map(p => {
              const connState = peerStates.get(p.id);
              const isConnected = connState === 'connected';
              return (
                <button
                  key={p.id}
                  onClick={() => onSelectPeer(p)}
                  className={[
                    'w-full flex items-center gap-2 px-2 py-2 rounded-xl text-left transition-colors',
                    p.id === selectedPeerId
                      ? 'bg-white border border-stone-900 shadow-sm dark:bg-stone-800 dark:border-stone-400'
                      : 'bg-white border border-stone-200 hover:border-stone-300 dark:bg-stone-800 dark:border-stone-700 dark:hover:border-stone-600',
                  ].join(' ')}
                >
                  <PeerAvatar peer={p} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-1.5">
                      <p className="text-xs font-bold text-stone-900 truncate dark:text-stone-100">{p.displayName}</p>
                      <span className="text-[9px] font-mono text-stone-400 shrink-0 dark:text-stone-500">#{shortId(p.id)}</span>
                    </div>
                    <p className={`text-[10px] flex items-center gap-1 ${isConnected ? 'text-green-600' : 'text-yellow-600'}`}>
                      <span className={`w-1 h-1 rounded-full inline-block ${isConnected ? 'bg-green-500' : 'bg-yellow-400'}`} />
                      {connState ?? 'connecting…'}
                    </p>
                    {peerQuality.has(p.id) && peerQuality.get(p.id) !== 'unknown' && (
                      <span className={[
                        'text-[9px] font-mono px-1.5 py-0.5 rounded-full flex items-center gap-0.5 w-fit',
                        peerQuality.get(p.id) === 'direct'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700',
                      ].join(' ')}>
                        <IconZap className="w-2.5 h-2.5" />
                        {peerQuality.get(p.id) === 'relay' ? 'relay' : 'direct'}
                      </span>
                    )}
                  </div>
                  {unreadPeerIds.has(p.id) && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="p-3 border-t border-stone-200 space-y-1.5 dark:border-stone-800">
        <p className="text-[9px] text-stone-400 dark:text-stone-600 px-0.5">Not on the same Wi-Fi?</p>
        <div className="grid grid-cols-2 gap-1.5">
          <div className="flex flex-col gap-0.5">
            <Button size="sm" onClick={onNewRoom}
              className="bg-stone-900 text-white hover:bg-stone-700 rounded-lg text-[10px] h-8 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-300">
              Invite
            </Button>
            <p className="text-[8px] text-stone-400 dark:text-stone-600 text-center leading-tight">Share a link or QR code</p>
          </div>
          <div className="flex flex-col gap-0.5">
            <Button size="sm" variant="outline" onClick={onJoinRoom}
              className="border-stone-200 text-stone-900 rounded-lg text-[10px] h-8 dark:border-stone-700 dark:text-stone-100">
              Join
            </Button>
            <p className="text-[8px] text-stone-400 dark:text-stone-600 text-center leading-tight">Enter a room code</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
