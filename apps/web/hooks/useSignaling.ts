'use client';
import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type {
  ClientToServerEvents, ServerToClientEvents,
  JoinRoomPayload, SignalPayload, Peer,
} from '@neardrop/shared';

export type SignalingSocket = Socket<ServerToClientEvents, ClientToServerEvents>;
export type SignalingStatus = 'connecting' | 'connected' | 'disconnected';

export interface SignalingHandlers {
  onRoomJoined:  (payload: { roomCode: string; peers: Peer[] }) => void;
  onPeerJoined:  (payload: { peer: Peer }) => void;
  onPeerLeft:    (payload: { peerId: string }) => void;
  onSignal:      (payload: { from: string; type: 'offer' | 'answer' | 'ice'; payload: unknown }) => void;
  onError?:      (payload: { code: string; message: string }) => void;
  onDisconnect?: () => void;
  onReconnect?:  () => void;
}

const SIGNALING_URL = process.env.NEXT_PUBLIC_SIGNALING_URL ?? 'http://localhost:3001';

export function useSignaling(handlers: SignalingHandlers) {
  const socketRef = useRef<SignalingSocket | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  const [signalingStatus, setSignalingStatus] = useState<SignalingStatus>('connecting');

  useEffect(() => {
    const socket: SignalingSocket = io(SIGNALING_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 8000,
    });

    socketRef.current = socket;

    socket.on('connect',       () => setSignalingStatus('connected'));
    socket.on('disconnect',    () => { setSignalingStatus('disconnected'); handlersRef.current.onDisconnect?.(); });
    socket.on('connect_error', () => setSignalingStatus('disconnected'));
    socket.io.on('reconnect_attempt', () => setSignalingStatus('connecting'));
    socket.io.on('reconnect',         () => { setSignalingStatus('connected'); handlersRef.current.onReconnect?.(); });

    socket.on('room-joined', (p) => handlersRef.current.onRoomJoined(p));
    socket.on('peer-joined', (p) => handlersRef.current.onPeerJoined(p));
    socket.on('peer-left',   (p) => handlersRef.current.onPeerLeft(p));
    socket.on('signal',      (p) => handlersRef.current.onSignal(p));
    socket.on('error',       (p) => handlersRef.current.onError?.(p));

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

  return { joinRoom, sendSignal, leaveRoom, signalingStatus };
}
