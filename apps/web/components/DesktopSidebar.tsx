import type { Peer } from '@neardrop/shared';
import { Button } from '@/components/ui/button';

interface Props {
  me: Peer;
  peers: Peer[];
  selectedPeerId: string | null;
  roomCode: string | null;
  unreadPeerIds: Set<string>;
  onSelectPeer: (peer: Peer) => void;
  onNewRoom: () => void;
  onJoinRoom: () => void;
}

export function DesktopSidebar({ me, peers, selectedPeerId, unreadPeerIds, onSelectPeer, onNewRoom, onJoinRoom }: Props) {
  return (
    <aside className="hidden md:flex w-56 flex-col bg-stone-100 border-r border-stone-200 shrink-0">
      {/* App header */}
      <div className="p-4 pb-3 border-b border-stone-200">
        <h1 className="text-lg font-extrabold text-stone-900 tracking-tight">NearDrop</h1>
      </div>

      {/* Your identity */}
      <div className="px-3 py-3 border-b border-stone-200">
        <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-2">You</p>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-base border border-stone-200 shrink-0">
            {me.emoji}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-stone-900 truncate">{me.displayName}</p>
            <p className="text-[10px] text-green-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
              online
            </p>
          </div>
        </div>
      </div>

      {/* Nearby devices */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-2">Nearby</p>
        {peers.length === 0 ? (
          <p className="text-[11px] text-stone-400 leading-relaxed">
            No devices found yet. Open NearDrop on another device on the same network.
          </p>
        ) : (
          <div className="space-y-1">
            {peers.map(p => (
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
                  <p className="text-xs font-bold text-stone-900 truncate">{p.displayName}</p>
                  <p className="text-[10px] text-green-600 flex items-center gap-1">
                    <span className="w-1 h-1 bg-green-500 rounded-full inline-block" />
                    connected
                  </p>
                </div>
                {unreadPeerIds.has(p.id) && (
                  <span className="w-2 h-2 bg-stone-900 rounded-full shrink-0" />
                )}
              </button>
            ))}
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
