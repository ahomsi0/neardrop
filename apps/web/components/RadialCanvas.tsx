import type { Peer } from '@neardrop/shared';
import { DeviceNode } from './DeviceNode';

interface Props {
  me: Peer;
  peers: Peer[];
  selectedPeerId: string | null;
  onSelectPeer: (peer: Peer) => void;
}

export function RadialCanvas({ me, peers, selectedPeerId, onSelectPeer }: Props) {
  const RING_RADIUS = 38; // % of container

  return (
    <div className="relative w-full flex-1 flex items-center justify-center select-none">
      {/* Pulse rings */}
      <div className="absolute w-[220px] h-[220px] rounded-full border border-stone-200 animate-pulse-ring" />
      <div className="absolute w-[170px] h-[170px] rounded-full border border-stone-200 animate-pulse-ring [animation-delay:1s]" />
      <div className="absolute w-[120px] h-[120px] rounded-full border border-stone-200" />

      {/* You — center */}
      <DeviceNode
        peer={me}
        isYou
        style={{ position: 'absolute', top: '50%', left: '50%' }}
      />

      {/* Peers — arranged in a circle */}
      {peers.map((peer, i) => {
        const angle = (i / Math.max(peers.length, 1)) * 2 * Math.PI - Math.PI / 2;
        const top  = `${50 + RING_RADIUS * Math.sin(angle)}%`;
        const left = `${50 + RING_RADIUS * Math.cos(angle)}%`;
        return (
          <DeviceNode
            key={peer.id}
            peer={peer}
            isSelected={peer.id === selectedPeerId}
            onClick={() => onSelectPeer(peer)}
            style={{ position: 'absolute', top, left }}
          />
        );
      })}
    </div>
  );
}
