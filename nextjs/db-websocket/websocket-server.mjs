// websocket-server.js

import dotenv from 'dotenv';
dotenv.config();

import { WebSocketServer } from 'ws';
import pkg from 'pg';
const { Pool } = pkg;

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Verify connection
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

// Get latest sensor readings (most recent per user + sensor_type)
async function getLatestSensorData() {
  const query = `
    SELECT DISTINCT ON (user_id, sensor_type) *
    FROM sensordata
    ORDER BY user_id, sensor_type, created_at DESC;
  `;

  const result = await pool.query(query);
  return JSON.stringify(result.rows);
}

// Check DB and broadcast changes
async function checkSensorData() {
  try {
    const data = await getLatestSensorData();

    if (data !== lastData) {
      wss.clients.forEach(client => {
        if (client.readyState === client.OPEN) {
          client.send(data);
        }
      });
      lastData = data;
      console.log('📤 Broadcasted updated sensor data');
    }
  } catch (err) {
    console.error('❌ Error querying sensor data:', err.message);
  }
}

setInterval(checkSensorData, 1000);

// Send cached data to new connections
wss.on('connection', ws => {
  console.log('🧩 New client connected');
  if (lastData) {
    ws.send(lastData);
  }
});
