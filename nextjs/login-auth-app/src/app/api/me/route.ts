import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );

    const userId = payload.id;
    if (!userId) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    // Optional: Fetch user-specific data from DB
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];

    return NextResponse.json({ user });
  } catch (err) {
    console.error('Token verification failed:', err);
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
}
