import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RoomManager } from '../rooms';

describe('RoomManager', () => {
  let rm: RoomManager;

  beforeEach(() => { rm = new RoomManager(); });
  afterEach(() => { rm.destroy(); });

  it('creates a room and returns a code', () => {
    const code = rm.createRoom();
    expect(code).toHaveLength(6);
    expect(rm.roomExists(code)).toBe(true);
  });

  it('creates a room with explicit code', () => {
    const code = rm.createRoom('WOLF42');
    expect(code).toBe('WOLF42');
  });

  it('returns same room for same IP', () => {
    const c1 = rm.getOrCreateIpRoom('1.2.3.4');
    const c2 = rm.getOrCreateIpRoom('1.2.3.4');
    expect(c1).toBe(c2);
  });

  it('returns different rooms for different IPs', () => {
    const c1 = rm.getOrCreateIpRoom('1.2.3.4');
    const c2 = rm.getOrCreateIpRoom('5.6.7.8');
    expect(c1).not.toBe(c2);
  });

  it('adds and retrieves peers', () => {
    const code = rm.createRoom();
    rm.addPeer(code, { id: 'peer1', displayName: 'Swift Fox', emoji: '🦊', deviceType: 'desktop' });
    expect(rm.getPeers(code)).toHaveLength(1);
    expect(rm.getPeers(code)[0].id).toBe('peer1');
  });

  it('removes peer and deletes empty room', () => {
    const code = rm.createRoom();
    rm.addPeer(code, { id: 'p1', displayName: 'A', emoji: '🦊', deviceType: 'mobile' });
    rm.removePeer('p1');
    expect(rm.roomExists(code)).toBe(false);
  });

  it('getPeers returns others when removing one of two peers', () => {
    const code = rm.createRoom();
    rm.addPeer(code, { id: 'p1', displayName: 'A', emoji: '🦊', deviceType: 'mobile' });
    rm.addPeer(code, { id: 'p2', displayName: 'B', emoji: '🐧', deviceType: 'desktop' });
    rm.removePeer('p1');
    expect(rm.getPeers(code)).toHaveLength(1);
    expect(rm.getPeers(code)[0].id).toBe('p2');
  });

  it('cleans up IP mapping when room deleted', () => {
    const ip = '1.2.3.4';
    const code = rm.getOrCreateIpRoom(ip);
    rm.addPeer(code, { id: 'p1', displayName: 'A', emoji: '🦊', deviceType: 'mobile' });
    rm.removePeer('p1');
    const newCode = rm.getOrCreateIpRoom(ip);
    expect(newCode).not.toBe(code);
  });
});
