// packages/shared/src/events.ts
import type { Peer } from './peer';

export interface JoinRoomPayload {
  roomCode?: string;
  displayName: string;
  emoji: string;
  deviceType: 'mobile' | 'desktop';
  passwordHash?: string;  // SHA-256 hex of the room password, if set
}

export interface SignalPayload {
  to: string;
  type: 'offer' | 'answer' | 'ice';
  payload: unknown;
}

export interface ClientToServerEvents {
  'join-room': (payload: JoinRoomPayload) => void;
  'signal': (payload: SignalPayload) => void;
  'leave-room': () => void;
}

export interface ServerToClientEvents {
  'room-joined': (payload: { roomCode: string; peers: Peer[] }) => void;
  'peer-joined': (payload: { peer: Peer }) => void;
  'peer-left': (payload: { peerId: string }) => void;
  'signal': (payload: { from: string; type: 'offer' | 'answer' | 'ice'; payload: unknown }) => void;
  'error': (payload: { code: string; message: string }) => void;
}
