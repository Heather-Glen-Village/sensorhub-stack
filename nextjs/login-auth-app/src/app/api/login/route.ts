import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
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

  const result = await pool.query<User>(
    'SELECT * FROM users WHERE username = $1',
    [username]
  );
  const user = result.rows[0];

  // Plain-text password check (NOT safe for production)
  if (!user || user.password !== password) {
    return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  return new NextResponse(null, {
    status: 200,
    headers: {
      'Set-Cookie': `token=${token}; HttpOnly; Path=/; Max-Age=3600; ${
        process.env.NODE_ENV === 'production' ? 'Secure; SameSite=Strict' : ''
      }`,
    },
  });
}