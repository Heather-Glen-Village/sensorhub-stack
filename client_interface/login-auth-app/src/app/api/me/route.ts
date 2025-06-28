import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { Pool } from '../../../../node_modules/@types/pg';

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

    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const sensorResult = await pool.query(
      'SELECT * FROM sensordata WHERE user_id = $1',
      [userId]
    );
    const sensorData = sensorResult.rows;

    // ✅ Return token as part of the response
    return NextResponse.json({ user, sensorData, token });
  } catch (err) {
    console.error('Token verification failed:', err);
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
}
