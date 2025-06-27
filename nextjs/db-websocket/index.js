import { WebSocketServer } from 'ws';
import { URL } from 'url';
import { verifyToken } from './auth.js';
import { getLatestSensorData } from './sensor.js';
import { broadcastToClients } from './broadcast.js';
import { evaluateAlerts } from './alerts/evaluate.js';
import { saveAndBroadcastAlerts } from './alerts/handler.js';

const wss = new WebSocketServer({ port: 8080 });
console.log('📡 WebSocket server listening on ws://localhost:8080');

let lastData = null;

async function checkSensorData() {
  const rows = await getLatestSensorData();
  const rawJson = JSON.stringify(rows);

  if (rawJson !== lastData) {
    broadcastToClients(wss, rows);
    lastData = rawJson;

    const alerts = evaluateAlerts(rows);
    await saveAndBroadcastAlerts(alerts, wss);

    console.log('📤 Broadcasted updated sensor data + alerts');
  }
}

setInterval(checkSensorData, 1000);

wss.on('connection', async (ws, req) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    if (!token) return ws.close(1008, 'Token missing');

    const user = await verifyToken(token);
    ws.user = user;

    console.log(`🧩 Authenticated: ${user.username} (ID: ${user.id})`);

    // Send initial sensor data and alerts
    if (lastData) {
      const rows = JSON.parse(lastData);
      const dataToSend = user.username === 'masterscreen'
        ? rows
        : rows.filter(r => r.user_id === user.id);

      ws.send(JSON.stringify(dataToSend));
    }

  } catch (err) {
    console.error('❌ Auth error:', err.message);
    ws.close(1008, 'Invalid token');
  }
});
