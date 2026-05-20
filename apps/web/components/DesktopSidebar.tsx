import type { Peer } from '@neardrop/shared';
import { RadialCanvas } from './RadialCanvas';
import { Button } from '@/components/ui/button';

interface Props {
  me: Peer;
  peers: Peer[];
  selectedPeerId: string | null;
  roomCode: string | null;
  onSelectPeer: (peer: Peer) => void;
  onNewRoom: () => void;
  onJoinRoom: () => void;
}

export function DesktopSidebar({ me, peers, selectedPeerId, roomCode, onSelectPeer, onNewRoom, onJoinRoom }: Props) {
  return (
    <aside className="hidden md:flex w-56 flex-col bg-stone-100 border-r border-stone-200 shrink-0">
      <div className="p-4 pb-2">
        <h1 className="text-lg font-extrabold text-stone-900 tracking-tight">NearDrop</h1>
        <p className="text-[11px] text-stone-400">Nearby devices</p>
      </div>

      {/* Mini radial */}
      <div className="h-32 relative px-2">
        <RadialCanvas
          me={me}
          peers={peers}
          selectedPeerId={selectedPeerId}
          onSelectPeer={onSelectPeer}
        />
      </div>

      {/* Device list */}
      {peers.length > 0 && (
        <div className="px-2 mb-2">
          <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest px-2 mb-1">Nearby</p>
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
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-stone-900 truncate">{p.displayName}</p>
                  <p className="text-[8px] text-green-600 flex items-center gap-1">
                    <span className="w-1 h-1 bg-green-500 rounded-full inline-block" />
                    connected
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-auto p-2 grid grid-cols-2 gap-1.5">
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
