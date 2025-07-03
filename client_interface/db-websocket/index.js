import { WebSocketServer } from 'ws';
import { URL } from 'url';

import { verifyToken } from './auth.js';

import { getLatestSensorData, getLatestAlertData } from './sensor.js';

import { evaluateAlerts } from './alerts/evaluate.js';
import { saveAndBroadcastAlerts } from './alerts/handler.js';

const wss = new WebSocketServer({ port: 8080 });
console.log('WebSocket server listening on ws://localhost:8080');

let lastSensorData = null;
let latestAlerts = [];

async function checkSensorData() {
  const rows = await getLatestSensorData();
  const rawJson = JSON.stringify(rows);

  const sensorDataChanged = rawJson !== lastSensorData;
  if (sensorDataChanged) {
    lastSensorData = rawJson;
  }

  const alerts = await getLatestAlertData(); // Fetch all alerts (with status)
  latestAlerts = alerts;

  const alertMessage = {
    type: 'alert',
    data: alerts,
  };

  wss.clients.forEach((client) => {
    if (client.readyState !== 1 || !client.user) return;

    const isMaster = client.user.username === 'masterscreen';

    const userRows = isMaster
      ? rows
      : rows.filter((r) => r.user_id === client.user.id);

    // Send updated sensor data if changed
    if (sensorDataChanged) {
      client.send(JSON.stringify({ type: 'sensor', data: userRows }));
    }

    // Always send alert data to masterscreen
    if (isMaster) {
      client.send(JSON.stringify(alertMessage));
    }
  });

  console.log(
    `📤 ${sensorDataChanged ? 'Sensor data' : 'No sensor change'}, alerts sent to masterscreen`
  );
}
setInterval(checkSensorData, 1000);

wss.on('connection', async (ws, req) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    if (!token) return ws.close(1008, 'Token missing');

    const user = await verifyToken(token);
    ws.user = user;

    console.log(`Authenticated: ${user.username} (ID: ${user.id})`);

    // Send initial sensor data and alerts
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
    console.error('Auth error:', err.message);
    ws.close(1008, 'Invalid token');
  }
});
