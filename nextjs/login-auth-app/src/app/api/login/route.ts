import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

interface User {
  id: number;
  username: string;
  password: string;
}

interface LoginRequestBody {
  username: string;
  password: string;
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(req: NextRequest) {
  if (!process.env.JWT_SECRET) {
    throw new Error('Missing JWT_SECRET in environment variables');
  }

  const body = (await req.json()) as LoginRequestBody;
  const { username, password } = body;

  const result = await pool.query<User>('SELECT * FROM users WHERE username = $1', [username]);
  const user = result.rows[0];

  if (!user || user.password !== password) {
    return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  // Decide the frontend redirect route
  const redirectTo =
    user.username === 'heather_admin' ? '/staff/masterscreen' : '/dashboard';

  // Build response with Set-Cookie and JSON body
  const res = NextResponse.json({ redirectTo }, { status: 200 });

  res.headers.set(
    'Set-Cookie',
    `token=${token}; HttpOnly; Path=/; Max-Age=3600; ${
      process.env.NODE_ENV === 'production' ? 'Secure; SameSite=Strict' : ''
    }`
  );

  return res;
}
