import Fastify from 'fastify';
import { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@neardrop/shared';
import { RoomManager } from './rooms';
import { registerHandlers } from './handlers';

const PORT = Number(process.env.PORT ?? 3001);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:3000';

const app = Fastify({ logger: true });
const rooms = new RoomManager();
const rateLimiter = new Map<string, { count: number; resetAt: number }>();

app.get('/health', async () => ({ status: 'ok' }));

const io = new Server<ClientToServerEvents, ServerToClientEvents>(app.server, {
  cors: { origin: CLIENT_ORIGIN, methods: ['GET', 'POST'] },
  transports: ['websocket', 'polling'],
});

io.on('connection', (socket) => {
  registerHandlers(io, socket, rooms, rateLimiter);
  socket.on('disconnect', () => rateLimiter.delete(socket.id));
});

app.listen({ port: PORT, host: '0.0.0.0' }).then(() => {
  console.log(`Signaling server running on port ${PORT}`);
});
