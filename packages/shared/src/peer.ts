// packages/shared/src/peer.ts
export interface Peer {
  id: string;
  displayName: string;
  emoji: string;
  deviceType: 'mobile' | 'desktop';
}
