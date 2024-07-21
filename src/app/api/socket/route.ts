import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

const clients = new Map<string, WebSocket>();

export function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const publicKey = searchParams.get('publicKey');

  if (!publicKey) {
    return new NextResponse('Missing publicKey', { status: 400 });
  }

  const upgradeHeader = req.headers.get('Upgrade');
  if (upgradeHeader !== 'websocket') {
    return new NextResponse('Expected Upgrade: websocket', { status: 426 });
  }
  try {
    const { socket, response } = (req as any).upgradeWebSocket();
    
    socket.onopen = () => {
      console.log(`WebSocket opened for ${publicKey}`);
      clients.set(publicKey, socket);
    };

    socket.onmessage = (event: { data: string; }) => {
      const message = JSON.parse(event.data);
      const recipientSocket = clients.get(message.recipient);
      if (recipientSocket) {
        recipientSocket.send(JSON.stringify(message));
      }
    };

    socket.onclose = () => {
      console.log(`WebSocket closed for ${publicKey}`);
      clients.delete(publicKey);
    };

    return response;
  } catch (err) {
    console.error(err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  
  if (data.event === 'message') {
    const recipientSocket = clients.get(data.recipient);
    if (recipientSocket) {
      recipientSocket.send(JSON.stringify(data));
      return NextResponse.json({ message: 'Message sent' }, { status: 200 });
    } else {
      return NextResponse.json({ error: 'Recipient not connected' }, { status: 404 });
    }
  }

  return NextResponse.json({ error: 'Invalid event' }, { status: 400 });
}