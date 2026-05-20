'use client';
import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type {
  ClientToServerEvents, ServerToClientEvents,
  JoinRoomPayload, SignalPayload,
} from '@neardrop/shared';

export type SignalingSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export interface SignalingHandlers {
  onRoomJoined: (payload: { roomCode: string; peers: import('@neardrop/shared').Peer[] }) => void;
  onPeerJoined: (payload: { peer: import('@neardrop/shared').Peer }) => void;
  onPeerLeft:   (payload: { peerId: string }) => void;
  onSignal:     (payload: { from: string; type: 'offer' | 'answer' | 'ice'; payload: unknown }) => void;
}

const SIGNALING_URL = process.env.NEXT_PUBLIC_SIGNALING_URL ?? 'http://localhost:3001';

export function useSignaling(handlers: SignalingHandlers) {
  const socketRef = useRef<SignalingSocket | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const socket: SignalingSocket = io(SIGNALING_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 8000,
    });

    socket.on('room-joined', (p) => handlersRef.current.onRoomJoined(p));
    socket.on('peer-joined', (p) => handlersRef.current.onPeerJoined(p));
    socket.on('peer-left',   (p) => handlersRef.current.onPeerLeft(p));
    socket.on('signal',      (p) => handlersRef.current.onSignal(p));

    socketRef.current = socket;
    return () => { socket.disconnect(); };
  }, []);

  const joinRoom = useCallback((payload: JoinRoomPayload) => {
    socketRef.current?.emit('join-room', payload);
  }, []);

  const sendSignal = useCallback((payload: SignalPayload) => {
    socketRef.current?.emit('signal', payload);
  }, []);

  const leaveRoom = useCallback(() => {
    socketRef.current?.emit('leave-room');
  }, []);

  return { joinRoom, sendSignal, leaveRoom };
}
