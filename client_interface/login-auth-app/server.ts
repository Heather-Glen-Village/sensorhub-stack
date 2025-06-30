import { WebSocketServer } from 'ws';

const PORT = 3001;
const wss = new WebSocketServer({ port: PORT });

console.log(`✅ WebSocket server is running on ws://localhost:${PORT}`);

wss.on('connection', (ws) => {
  console.log('🟢 Client connected');

  ws.send('Welcome to the WebSocket server!');

  ws.on('message', (msg) => {
    console.log('📩 Received:', msg.toString());
    ws.send(`Echo: ${msg.toString()}`);
  });

  ws.on('close', () => {
    console.log('🔴 Client disconnected');
  });
});
