import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({ password: '' }));

  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

  if (!ADMIN_PASSWORD) {
    console.error('ADMIN_PASSWORD not set');
    return NextResponse.json(
      { error: 'Server misconfigured' },
      { status: 500 },
    );
  }

  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: 'Invalid password' },
      { status: 401 },
    );
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set('admin', '1', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 hours
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set('admin', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return res;
}


