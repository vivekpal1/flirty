import { Server as SocketIOServer } from 'socket.io';
import { NextApiRequest } from 'next';
import { NextResponse } from 'next/server';

let io: SocketIOServer;

export async function GET(req: NextApiRequest) {
  if (!io) {
    console.log('Socket is initializing');
    // For Next.js 14 App Router, we don't have access to req.socket.server
    // We'll need to create a new SocketIOServer instance
    io = new SocketIOServer({
      path: '/api/socketio',
      addTrailingSlash: false,
    });

    io.on('connection', (socket) => {
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
  } else {
    console.log('Socket is already initialized');
  }

  return NextResponse.json({ message: 'Socket server is running' }, { status: 200 });
}

export const config = {
  api: {
    bodyParser: false,
  },
};