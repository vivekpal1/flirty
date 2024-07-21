import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const publicKey = req.nextUrl.searchParams.get('publicKey');

  if (!publicKey) {
    return NextResponse.json({ error: 'Missing public key' }, { status: 400 });
  }

  // TODO: actual Twitter API integration here
  const mockUser = {
    id: '123456',
    name: 'John Doe',
    username: 'johndoe',
    profileImageUrl: 'https://pbs.twimg.com/profile_images/1234567890/avatar.jpg',
  };

  return NextResponse.json(mockUser);
}