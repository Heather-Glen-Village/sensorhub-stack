import { WebSocketServer } from 'ws';
import { URL } from 'url';

import { verifyToken } from './auth.js';
import { getLatestSensorData, getLatestAlertData } from './sensor.js';

const wss = new WebSocketServer({ port: 8080 });
console.log('📡 WebSocket server listening on ws://localhost:8080');

let lastSensorData = null;
let latestAlerts = [];

async function checkSensorData() {
  console.log('🔁 Running checkSensorData');

  const rows = await getLatestSensorData();
  console.log('📦 Latest sensor rows:', rows);

  const rawJson = JSON.stringify(rows);
  const sensorDataChanged = rawJson !== lastSensorData;

  if (sensorDataChanged) {
    console.log('✅ Sensor data changed');
    lastSensorData = rawJson;
  } else {
    console.log('➖ Sensor data unchanged');
  }

  const alerts = await getLatestAlertData();
  console.log("📢 getLatestAlertData returned:", alerts);

  latestAlerts = alerts;

  const alertMessage = {
    type: 'alert',
    data: alerts,
  };

  wss.clients.forEach((client) => {
    if (client.readyState !== 1 || !client.user) {
      console.log('⚠️ Skipping inactive or unauthenticated client');
      return;
    }

    const isMaster = client.user.username === 'masterscreen';
    console.log(`📨 Preparing data for ${client.user.username}`);

    const userRows = isMaster
      ? rows
      : rows.filter((r) => r.user_id === client.user.id);

    if (sensorDataChanged) {
      console.log(`📤 Sending sensor data to ${client.user.username}`);
      client.send(JSON.stringify({ type: 'sensor', data: userRows }));
    }

    if (isMaster) {
      console.log(`🚨 Sending alert data to ${client.user.username}`);
      client.send(JSON.stringify(alertMessage));
    }
  });

  console.log(
    `🟢 Broadcast complete: ${sensorDataChanged ? 'Sensor data sent' : 'No sensor change'}, alerts always sent to masterscreen`
  );
}

setInterval(checkSensorData, 1000);

wss.on('connection', async (ws, req) => {
  console.log('🔌 WebSocket connection received');

  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    if (!token) {
      console.warn('🚫 Token missing, closing connection');
      return ws.close(1008, 'Token missing');
    }

    const user = await verifyToken(token);
    ws.user = user;

    console.log(`✅ Authenticated: ${user.username} (ID: ${user.id})`);

    if (lastSensorData) {
      const rows = JSON.parse(lastSensorData);
      const userRows =
        user.username === 'masterscreen'
          ? rows
          : rows.filter((r) => r.user_id === user.id);

      ws.send(JSON.stringify({ type: 'sensor', data: userRows }));

      if (user.username === 'masterscreen') {
        ws.send(JSON.stringify({ type: 'alert', data: latestAlerts }));
      }
    }
  } catch (err) {
    console.error('❌ Auth error:', err.message);
    ws.close(1008, 'Invalid token');
  }
});
