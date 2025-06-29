import WebSocket from 'ws';

const internalWS = new WebSocket('ws://localhost:8080?token=masterscreen');

const listeners = new Set<(data: any[]) => void>();

internalWS.on('message', (msg) => {
  try {
    const rows = JSON.parse(msg.toString());
    listeners.forEach((fn) => fn(rows));
  } catch (err) {
    console.error('❌ Error parsing upstream WS message:', err);
  }
});

export function subscribeToSensorData(callback: (rows: any[]) => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}
