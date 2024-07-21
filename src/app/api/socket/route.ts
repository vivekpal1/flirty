import { Server as SocketIOServer } from 'socket.io';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

let io: SocketIOServer;

export async function GET(req: NextRequest) {
  if (!io) {
    console.log('Socket is initializing');
    // @ts-ignore
    io = new SocketIOServer(req.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
    });

    io.on('connection', socket => {
      console.log('A user connected');

      socket.on('join', (publicKey: string) => {
        socket.join(publicKey);
        console.log(`User ${publicKey} joined`);
      });

      socket.on('message', (message: any) => {
        io.to(message.recipient).emit('message', message);
      });

      socket.on('disconnect', () => {
        console.log('A user disconnected');
      });
    });

    // @ts-ignore
    req.socket.server.io = io;
  } else {
    console.log('Socket is already initialized');
  }

  return NextResponse.json({ message: 'Socket server is running' }, { status: 200 });
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';