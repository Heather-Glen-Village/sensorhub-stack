const aedes = require('aedes')();
const net = require('net');
const express = require('express');
const client = require('prom-client');

// Start MQTT broker
const MQTT_PORT = 1883;
const mqttServer = net.createServer(aedes.handle);

mqttServer.listen(MQTT_PORT, () => {
  console.log(`🚀 MQTT broker is running on port ${MQTT_PORT}`);
});

// Prometheus setup
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics(); // Node.js default metrics

// Custom metric: count of messages received
const messagesReceived = new client.Counter({
  name: 'mqtt_messages_received_total',
  help: 'Total number of MQTT messages received',
  labelNames: ['topic', 'client_id'],
});

// Track published MQTT messages
aedes.on('publish', async (packet, client) => {
  if (client) {
    console.log(`📩 Received from ${client.id} on topic "${packet.topic}": ${packet.payload.toString()}`);
    messagesReceived.inc({ topic: packet.topic, client_id: client.id });
  }
});

// HTTP server to expose /metrics for Prometheus
const METRICS_PORT = 9090;
const app = express();

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

app.listen(METRICS_PORT, () => {
  console.log(`📊 Prometheus metrics available at http://localhost:${METRICS_PORT}/metrics`);
});
