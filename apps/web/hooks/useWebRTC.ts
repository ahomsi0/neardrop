'use client';
import { useRef, useCallback, useEffect, useState } from 'react';
import type { Peer } from '@neardrop/shared';

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  ...(process.env.NEXT_PUBLIC_TURN_URL ? [{
    urls: process.env.NEXT_PUBLIC_TURN_URL,
    username: process.env.NEXT_PUBLIC_TURN_USER ?? '',
    credential: process.env.NEXT_PUBLIC_TURN_CRED ?? '',
  }] : []),
];

export interface WebRTCHandlers {
  onChannel: (peerId: string, channel: RTCDataChannel) => void;
  onSendSignal: (to: string, type: 'offer' | 'answer' | 'ice', payload: unknown) => void;
  onConnectionChange?: (peerId: string, state: RTCPeerConnectionState) => void;
}

export function useWebRTC(handlers: WebRTCHandlers) {
  const connections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const channels    = useRef<Map<string, RTCDataChannel>>(new Map());
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  const connStateMap = useRef<Map<string, RTCPeerConnectionState>>(new Map());
  const [peerStates, setPeerStates] = useState<Map<string, RTCPeerConnectionState>>(new Map());

  useEffect(() => {
    return () => {
      for (const pc of connections.current.values()) pc.close();
      connections.current.clear();
      channels.current.clear();
    };
  }, []);

  const setupChannel = (peerId: string, channel: RTCDataChannel) => {
    channels.current.set(peerId, channel);
    channel.onopen  = () => handlersRef.current.onChannel(peerId, channel);
    channel.onclose = () => channels.current.delete(peerId);
  };

  const closeConnection = useCallback((peerId: string) => {
    connections.current.get(peerId)?.close();
    connections.current.delete(peerId);
    channels.current.delete(peerId);
  }, []);

  const createConnection = useCallback((peerId: string, isInitiator: boolean) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        handlersRef.current.onSendSignal(peerId, 'ice', e.candidate.toJSON());
      }
    };

    pc.onconnectionstatechange = () => {
      connStateMap.current.set(peerId, pc.connectionState);
      setPeerStates(new Map(connStateMap.current));
      handlersRef.current.onConnectionChange?.(peerId, pc.connectionState);
      if (pc.connectionState === 'failed') closeConnection(peerId);
    };

    if (isInitiator) {
      const channel = pc.createDataChannel('transfer', { ordered: true });
      setupChannel(peerId, channel);
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          handlersRef.current.onSendSignal(peerId, 'offer', pc.localDescription!.toJSON());
        })
        .catch(() => closeConnection(peerId));
    } else {
      pc.ondatachannel = (e) => setupChannel(peerId, e.channel);
    }

    connections.current.set(peerId, pc);
    return pc;
  }, [closeConnection]);

  const handleSignal = useCallback(async (
    from: string,
    type: 'offer' | 'answer' | 'ice',
    payload: unknown
  ) => {
    let pc = connections.current.get(from);
    if (type === 'offer') {
      pc = createConnection(from, false);
      await pc.setRemoteDescription(payload as RTCSessionDescriptionInit);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      handlersRef.current.onSendSignal(from, 'answer', pc.localDescription!.toJSON());
    } else if (type === 'answer' && pc) {
      await pc.setRemoteDescription(payload as RTCSessionDescriptionInit);
    } else if (type === 'ice' && pc) {
      await pc.addIceCandidate(new RTCIceCandidate(payload as RTCIceCandidateInit));
    }
  }, [createConnection]);

  const initiateConnection = useCallback((peer: Peer) => {
    if (!connections.current.has(peer.id)) {
      createConnection(peer.id, true);
    }
  }, [createConnection]);

  const getChannel = useCallback((peerId: string) => channels.current.get(peerId), []);
  const getConnection = useCallback((peerId: string) => connections.current.get(peerId), []);

  const getQuality = useCallback(async (peerId: string): Promise<'direct' | 'relay' | 'unknown'> => {
    const pc = connections.current.get(peerId);
    if (!pc) return 'unknown';
    try {
      const stats = await pc.getStats();
      for (const report of stats.values()) {
        const r = report as unknown as { type: string; state: string; nominated: boolean; localCandidateId: string; candidateType: string };
        if (r.type === 'candidate-pair' && r.state === 'succeeded' && r.nominated) {
          const local = stats.get(r.localCandidateId) as unknown as { candidateType: string } | undefined;
          if (local?.candidateType === 'relay') return 'relay';
          return 'direct';
        }
      }
    } catch { /* ignore */ }
    return 'unknown';
  }, []);

  return { initiateConnection, handleSignal, closeConnection, getChannel, getConnection, peerStates, getQuality };
}
