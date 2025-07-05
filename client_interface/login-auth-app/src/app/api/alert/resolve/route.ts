// src/app/api/alert/resolve/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { jwtVerify } from 'jose';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

export async function POST(req: NextRequest) {
  try {
    // Step 1: Authenticate with JWT
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized (no token)' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    const username = payload.username;

    if (username !== 'masterscreen') {
      return NextResponse.json({ error: 'Forbidden – must be masterscreen' }, { status: 403 });
    }

    // Step 2: Parse request body
    const body = await req.json();
    const { user_id, sensor_type, measurement } = body;

    if (!user_id || !sensor_type || !measurement) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Step 3: Delete the alert
    const result = await pool.query(
      `DELETE FROM alerts
       WHERE user_id = $1 AND sensor_type = $2 AND measurement = $3
       RETURNING *`,
      [user_id, sensor_type, measurement]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ message: 'No matching alert found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Alert resolved and removed', deleted: result.rows });
  } catch (err: any) {
    console.error('❌ Error resolving alert:', err.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
