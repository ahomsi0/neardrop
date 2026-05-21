import type { Peer } from '@neardrop/shared';
import { Button } from '@/components/ui/button';
import type { SignalingStatus } from '@/hooks/useSignaling';

interface Props {
  me: Peer;
  peers: Peer[];
  selectedPeerId: string | null;
  roomCode: string | null;
  unreadPeerIds: Set<string>;
  signalingStatus: SignalingStatus;
  peerStates: Map<string, RTCPeerConnectionState>;
  onSelectPeer: (peer: Peer) => void;
  onNewRoom: () => void;
  onJoinRoom: () => void;
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

export function DesktopSidebar({ me, peers, selectedPeerId, unreadPeerIds, signalingStatus, peerStates, onSelectPeer, onNewRoom, onJoinRoom }: Props) {
  const activePeer = peers.find(p => p.id === selectedPeerId) ?? null;

  return (
    <aside className="hidden md:flex w-60 flex-col bg-stone-100 border-r border-stone-200 shrink-0">
      {/* App header */}
      <div className="p-4 pb-3 border-b border-stone-200">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-extrabold text-stone-900 tracking-tight">NearDrop</h1>
          <StatusDot status={signalingStatus} />
        </div>
      </div>

      {/* Your identity */}
      <div className="px-3 py-3 border-b border-stone-200">
        <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-2">You</p>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-base border border-stone-200 shrink-0">
            {me.emoji}
          </div>
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5">
              <p className="text-xs font-bold text-stone-900 truncate">{me.displayName}</p>
              <span className="text-[9px] font-mono text-stone-400 shrink-0">#{shortId(me.id)}</span>
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
        <div className="px-3 py-3 border-b border-stone-200 bg-stone-50">
          <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-2">Room</p>
          <div className="bg-white rounded-xl border border-stone-200 px-3 py-2.5 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">{me.emoji}</span>
              <div className="min-w-0">
                <div className="flex items-baseline gap-1">
                  <p className="text-[11px] font-bold text-stone-900 truncate">{me.displayName}</p>
                  <span className="text-[9px] font-mono text-stone-400">#{shortId(me.id)}</span>
                </div>
              </div>
            </div>
            <div className="border-t border-stone-100" />
            <div className="flex items-center gap-2">
              <span className="text-sm">{activePeer.emoji}</span>
              <div className="min-w-0">
                <div className="flex items-baseline gap-1">
                  <p className="text-[11px] font-bold text-stone-900 truncate">{activePeer.displayName}</p>
                  <span className="text-[9px] font-mono text-stone-400">#{shortId(activePeer.id)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nearby devices */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-2">Nearby</p>
        {peers.length === 0 ? (
          <p className="text-[11px] text-stone-400 leading-relaxed">
            No devices found yet. Open NearDrop on another device on the same network.
          </p>
        ) : (
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
                      ? 'bg-white border border-stone-900 shadow-sm'
                      : 'bg-white border border-stone-200 hover:border-stone-300',
                  ].join(' ')}
                >
                  <span className="text-base">{p.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-1.5">
                      <p className="text-xs font-bold text-stone-900 truncate">{p.displayName}</p>
                      <span className="text-[9px] font-mono text-stone-400 shrink-0">#{shortId(p.id)}</span>
                    </div>
                    <p className={`text-[10px] flex items-center gap-1 ${isConnected ? 'text-green-600' : 'text-yellow-600'}`}>
                      <span className={`w-1 h-1 rounded-full inline-block ${isConnected ? 'bg-green-500' : 'bg-yellow-400'}`} />
                      {connState ?? 'connecting…'}
                    </p>
                  </div>
                  {unreadPeerIds.has(p.id) && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-3 border-t border-stone-200 grid grid-cols-2 gap-1.5">
        <Button size="sm" onClick={onNewRoom}
          className="bg-stone-900 text-white hover:bg-stone-700 rounded-lg text-[10px] h-8">
          Invite
        </Button>
        <Button size="sm" variant="outline" onClick={onJoinRoom}
          className="border-stone-200 text-stone-900 rounded-lg text-[10px] h-8">
          Join
        </Button>
      </div>
    </aside>
  );
}
