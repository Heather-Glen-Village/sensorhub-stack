import dotenv from 'dotenv';

dotenv.config();

import { WebSocketServer } from 'ws';
import { jwtVerify } from 'jose';
import { URL } from 'url';
import pkg from 'pg';
const { Pool } = pkg;

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.connect()
  .then(client => {
    console.log('✅ Connected to PostgreSQL');
    client.release();
  })
  .catch(err => {
    console.error('❌ Failed to connect to PostgreSQL:', err.message);
    process.exit(1);
  });

// WebSocket server
const wss = new WebSocketServer({ port: 8080 });
console.log('📡 WebSocket server listening on ws://localhost:8080');

let lastData = null;

// Query latest data: 1 row per (user_id, sensor_type)
async function getLatestSensorData() {
  const query = `
    SELECT DISTINCT ON (user_id, sensor_type) *
    FROM sensordata
    ORDER BY user_id, sensor_type, created_at DESC;
  `;
  const result = await pool.query(query);
  return result.rows;
}

// Broadcast updates only when new data appears
async function checkSensorData() {
  try {
    const rows = await getLatestSensorData();
    const rawJson = JSON.stringify(rows);

    if (rawJson !== lastData) {
      wss.clients.forEach(client => {
        if (client.readyState === client.OPEN && client.user) {
          const { id, username } = client.user;
          const dataToSend = username === 'masterscreen'
            ? rows
            : rows.filter(r => r.user_id === id);
          client.send(JSON.stringify(dataToSend));
        }
      });

      lastData = rawJson;
      console.log('📤 Broadcasted updated sensor data');
    }
  } catch (err) {
    console.error('❌ Error querying sensor data:', err.message);
  }
}

setInterval(checkSensorData, 1000);

// Handle new connections with JWT auth
wss.on('connection', async (ws, req) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      console.warn('⚠️ Connection rejected: No token provided');
      ws.close(1008, 'Token missing');
      return;
    }

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );

    const user = {
      id: payload.id,
      username: payload.username
    };

    if (!user.id || !user.username) {
      console.warn('❌ Invalid token payload');
      ws.close(1008, 'Invalid token payload');
      return;
    }

    ws.user = user;
    console.log(`🧩 Authenticated: ${user.username} (ID: ${user.id})`);

    // Send data immediately
    if (lastData) {
      const rows = JSON.parse(lastData);
      const userData = user.username === 'masterscreen'
        ? rows
        : rows.filter(r => r.user_id === user.id);
      ws.send(JSON.stringify(userData));
    }

  } catch (err) {
    console.error('❌ JWT verification failed:', err.message);
    ws.close(1008, 'Invalid token');
  }
});
