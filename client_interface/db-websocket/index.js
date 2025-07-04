import { WebSocketServer } from 'ws';
import { URL } from 'url';

import {evaluateAlerts} from './alerts/evaluate.js';
import {saveAndBroadcastAlerts} from './alerts/handler.js';

import { verifyToken } from './auth.js';
import { getLatestSensorData, getLatestAlertData } from './sensor.js';

const wss = new WebSocketServer({ port: 8080 });
console.log('📡 WebSocket server listening on ws://localhost:8080');

let lastSensorData = null;
let latestAlerts = [];

let alerts = [];

async function checkSensorData() {
  console.log('🔁 Checking sensor data...');

  const sensorRows = await getLatestSensorData();
  const alertsToInsert = await evaluateAlerts(sensorRows);
  await saveAndBroadcastAlerts(alertsToInsert, wss);

  console.log('📈 Sensor data:', sensorRows);
  console.log('📋 New alerts:', alertsToInsert);

  const sensorJson = JSON.stringify(sensorRows);
  const sensorDataChanged = sensorJson !== lastSensorData;
  if (sensorDataChanged) {
    console.log('✅ Sensor data changed');
    lastSensorData = sensorJson;
  } else {
    console.log('➖ No change in sensor data');
  }

  // Refresh latest unresolved + unacknowledged alerts
  latestAlerts = await getLatestAlertData();
  const alertPayload = { type: 'alert', data: latestAlerts };

  wss.clients.forEach((client) => {
    if (client.readyState !== 1 || !client.user) {
      console.log('⚠️ Skipping inactive/unauthenticated client');
      return;
    }

    const isMaster = client.user.username === 'masterscreen';
    const userSensorRows = isMaster
      ? sensorRows
      : sensorRows.filter((r) => r.user_id === client.user.id);

    if (sensorDataChanged) {
      console.log(`📤 Sending sensor data to ${client.user.username}`);
      client.send(JSON.stringify({ type: 'sensor', data: userSensorRows }));
    }

    if (isMaster) {
      console.log(`🚨 Sending alert data to ${client.user.username}`);
      client.send(JSON.stringify(alertPayload));
    }
  });

  console.log(
    `🟢 Broadcast complete: ${sensorDataChanged ? 'Sensor data sent' : 'No change'}, alerts sent to masterscreen`
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
