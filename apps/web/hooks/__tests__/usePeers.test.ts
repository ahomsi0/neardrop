import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { usePeers } from '../usePeers';

const peer1 = { id: 'p1', displayName: 'Swift Fox', emoji: '🦊', deviceType: 'desktop' as const };
const peer2 = { id: 'p2', displayName: 'Bold Penguin', emoji: '🐧', deviceType: 'mobile' as const };

describe('usePeers', () => {
  beforeEach(() => {
    usePeers.getState().reset();
  });

  it('sets peers on room-joined', () => {
    act(() => usePeers.getState().setRoomJoined('ABC123', [peer1]));
    const { peers, roomCode } = usePeers.getState();
    expect(peers).toHaveLength(1);
    expect(roomCode).toBe('ABC123');
  });

  it('adds a peer', () => {
    act(() => usePeers.getState().setRoomJoined('R1', [peer1]));
    act(() => usePeers.getState().addPeer(peer2));
    expect(usePeers.getState().peers).toHaveLength(2);
  });

  it('removes a peer', () => {
    act(() => usePeers.getState().setRoomJoined('R1', [peer1, peer2]));
    act(() => usePeers.getState().removePeer('p1'));
    expect(usePeers.getState().peers).toHaveLength(1);
    expect(usePeers.getState().peers[0].id).toBe('p2');
  });

  it('reset clears state', () => {
    act(() => usePeers.getState().setRoomJoined('R1', [peer1]));
    act(() => usePeers.getState().reset());
    expect(usePeers.getState().peers).toHaveLength(0);
    expect(usePeers.getState().roomCode).toBeNull();
  });
});
