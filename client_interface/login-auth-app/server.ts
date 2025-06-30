import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { subscribeToSensorData } from './src/lib/db-websocket-bridge';

// Create a standalone WebSocket server
const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (ws) => {
  console.log('🟢 Frontend connected to /api/ws');

  const unsubscribe = subscribeToSensorData((data) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(data));
    }
  });

  ws.on('close', () => {
    console.log('🔴 Frontend disconnected from /api/ws');
    unsubscribe();
  });
});

// Create a minimal HTTP server that only handles WS upgrades
const server = createServer();

server.on('upgrade', (req, socket, head) => {
  if (req.url === '/api/ws') {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  } else {
    socket.destroy();
  }
});

const port = parseInt(process.env.PORT || '3001', 10);
server.listen(port, () => {
  console.log(`🧭 WebSocket relay running on http://localhost:${port}/api/ws`);
});
