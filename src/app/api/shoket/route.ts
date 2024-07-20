import { Server as SocketIOServer } from 'socket.io';
import { NextApiRequest } from 'next';
import { NextApiResponseServerIO } from '../../../types/next';

const SocketHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (res.socket.server.io) {
    console.log('Socket is already running');
  } else {
    console.log('Socket is initializing');
    const io = new SocketIOServer(res.socket.server as any);
    res.socket.server.io = io;

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
  }
  res.end();
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default SocketHandler;