import { create } from 'zustand';
import type { Peer } from '@neardrop/shared';

interface PeersState {
  peers: Peer[];
  roomCode: string | null;
  setRoomJoined: (roomCode: string, peers: Peer[]) => void;
  addPeer: (peer: Peer) => void;
  removePeer: (peerId: string) => void;
  reset: () => void;
}

export const usePeers = create<PeersState>((set) => ({
  peers: [],
  roomCode: null,
  setRoomJoined: (roomCode, peers) => set({ roomCode, peers }),
  addPeer: (peer) => set((s) => ({ peers: [...s.peers, peer] })),
  removePeer: (peerId) => set((s) => ({ peers: s.peers.filter((p) => p.id !== peerId) })),
  reset: () => set({ peers: [], roomCode: null }),
}));
