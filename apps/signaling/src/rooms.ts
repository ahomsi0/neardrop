import { Peer } from '@neardrop/shared';
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6);

interface RoomEntry {
  peers: Map<string, Peer>;
  lastActivity: number;
  passwordHash?: string;
  roomName?: string;
}

export class RoomManager {
  private rooms = new Map<string, RoomEntry>();
  private ipToRoom = new Map<string, string>();
  private timer: ReturnType<typeof setInterval>;

  constructor() {
    this.timer = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  createRoom(code?: string, passwordHash?: string, roomName?: string): string {
    const roomCode = code ?? nanoid();
    if (!this.rooms.has(roomCode)) {
      this.rooms.set(roomCode, { peers: new Map(), lastActivity: Date.now(), passwordHash, roomName });
    }
    return roomCode;
  }

  getRoomName(code: string): string | undefined {
    return this.rooms.get(code)?.roomName;
  }

  getOrCreateIpRoom(ip: string): string {
    const existing = this.ipToRoom.get(ip);
    if (existing && this.rooms.has(existing)) return existing;
    const code = this.createRoom();
    this.ipToRoom.set(ip, code);
    return code;
  }

  /** Returns null if ok, or an error code string if password mismatch */
  checkPassword(roomCode: string, providedHash?: string): string | null {
    const room = this.rooms.get(roomCode);
    if (!room) return null;
    if (!room.passwordHash) return null;
    if (room.passwordHash === providedHash) return null;
    return 'WRONG_PASSWORD';
  }

  addPeer(roomCode: string, peer: Peer): void {
    const room = this.rooms.get(roomCode);
    if (!room) throw new Error(`Room not found: ${roomCode}`);
    room.peers.set(peer.id, peer);
    room.lastActivity = Date.now();
  }

  removePeer(peerId: string): string | null {
    for (const [code, room] of this.rooms) {
      if (!room.peers.has(peerId)) continue;
      room.peers.delete(peerId);
      if (room.peers.size === 0) {
        this.rooms.delete(code);
        for (const [ip, rc] of this.ipToRoom) {
          if (rc === code) this.ipToRoom.delete(ip);
        }
      }
      return code;
    }
    return null;
  }

  getPeers(roomCode: string): Peer[] {
    return [...(this.rooms.get(roomCode)?.peers.values() ?? [])];
  }

  roomExists(code: string): boolean {
    return this.rooms.has(code);
  }

  private cleanup(): void {
    const cutoff = Date.now() - 10 * 60 * 1000;
    for (const [code, room] of this.rooms) {
      if (room.peers.size === 0 && room.lastActivity < cutoff) {
        this.rooms.delete(code);
      }
    }
  }

  destroy(): void {
    clearInterval(this.timer);
  }
}
