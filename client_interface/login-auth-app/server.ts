import { WebSocketServer } from 'ws';
import WebSocket from 'ws';

const PORT = 3001;
const wss = new WebSocketServer({ port: PORT });

console.log(`✅ WebSocket relay running on ws://localhost:${PORT}`);

// Connect to internal sensor WebSocket server
const internalWS = new WebSocket('ws://host.docker.internal:8080?token=masterscreen');

internalWS.on('open', () => {
  console.log('🔗 Connected to internal sensor WebSocket server');
});

internalWS.on('error', (err) => {
  console.error('❌ Internal WS error:', err.message);
});

const clients = new Set<WebSocket>();

wss.on('connection', (ws) => {
  console.log('🟢 Frontend connected');
  clients.add(ws);

  ws.on('close', () => {
    console.log('🔴 Frontend disconnected');
    clients.delete(ws);
  });
});

// Forward sensor data to all connected frontend clients
internalWS.on('message', (data) => {
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data.toString());
    }
  }
});
