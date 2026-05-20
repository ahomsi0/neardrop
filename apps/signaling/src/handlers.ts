import type { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents, JoinRoomPayload, SignalPayload } from '@neardrop/shared';
import { z } from 'zod';
import { RoomManager } from './rooms';
import { getClientIp } from './discovery';

const joinSchema = z.object({
  roomCode: z.string().min(1).max(20).optional(),
  displayName: z.string().min(1).max(50),
  emoji: z.string().min(1).max(8),
  deviceType: z.enum(['mobile', 'desktop']),
});

const signalSchema = z.object({
  to: z.string().min(1),
  type: z.enum(['offer', 'answer', 'ice']),
  payload: z.unknown(),
});

export function registerHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  rooms: RoomManager,
  rateLimiter: Map<string, { count: number; resetAt: number }>
): void {
  let currentRoomCode: string | null = null;

  function checkRate(): boolean {
    const now = Date.now();
    const entry = rateLimiter.get(socket.id) ?? { count: 0, resetAt: now + 1000 };
    if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + 1000; }
    entry.count++;
    rateLimiter.set(socket.id, entry);
    return entry.count <= 30;
  }

  socket.on('join-room', (raw: JoinRoomPayload) => {
    if (!checkRate()) return socket.emit('error', { code: 'RATE_LIMIT', message: 'Too many events' });
    const result = joinSchema.safeParse(raw);
    if (!result.success) return socket.emit('error', { code: 'INVALID', message: 'Bad payload' });
    const { roomCode, displayName, emoji, deviceType } = result.data;

    const ip = getClientIp(
      socket.handshake.headers['x-forwarded-for'] as string | undefined,
      socket.handshake.address
    );

    const code = roomCode
      ? (rooms.roomExists(roomCode) ? roomCode : rooms.createRoom(roomCode))
      : rooms.getOrCreateIpRoom(ip);

    const peers = rooms.getPeers(code);
    if (peers.length >= 10) {
      return socket.emit('error', { code: 'ROOM_FULL', message: 'Room is full' });
    }

    currentRoomCode = code;
    rooms.addPeer(code, { id: socket.id, displayName, emoji, deviceType });
    socket.join(code);

    socket.emit('room-joined', { roomCode: code, peers });
    socket.to(code).emit('peer-joined', {
      peer: { id: socket.id, displayName, emoji, deviceType },
    });
  });

  socket.on('signal', (raw: SignalPayload) => {
    if (!checkRate()) return;
    const result = signalSchema.safeParse(raw);
    if (!result.success) return;
    const { to, type, payload } = result.data;
    io.to(to).emit('signal', { from: socket.id, type, payload });
  });

  socket.on('leave-room', () => {
    if (!currentRoomCode) return;
    rooms.removePeer(socket.id);
    socket.leave(currentRoomCode);
    socket.to(currentRoomCode).emit('peer-left', { peerId: socket.id });
    currentRoomCode = null;
  });

  socket.on('disconnect', () => {
    if (!currentRoomCode) return;
    rooms.removePeer(socket.id);
    socket.to(currentRoomCode).emit('peer-left', { peerId: socket.id });
  });
}
