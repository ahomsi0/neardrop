'use client';
import { useRef, useCallback } from 'react';
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
}

export function useWebRTC(handlers: WebRTCHandlers) {
  const connections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const channels    = useRef<Map<string, RTCDataChannel>>(new Map());
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

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
      if (pc.connectionState === 'failed') {
        closeConnection(peerId);
      }
    };

    if (isInitiator) {
      const channel = pc.createDataChannel('transfer', { ordered: true });
      setupChannel(peerId, channel);

      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          handlersRef.current.onSendSignal(peerId, 'offer', pc.localDescription!.toJSON());
        });
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

  return { initiateConnection, handleSignal, closeConnection, getChannel };
}
