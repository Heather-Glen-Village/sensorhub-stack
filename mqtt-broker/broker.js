const aedes = require('aedes')();
const net = require('net');
const express = require('express');
const { Pool } = require('pg');
const client = require('prom-client');

//hello

// --- PostgreSQL Connections ---

// Auth DB (postgres-db)
const authDb = new Pool({
  user: 'postgres',
  host: 'host.docker.internal',
  database: 'authdb',
  password: 'postgres',
  port: 5432,
});

// Timestamp DB (postgres-timestamps)
const timestampDb = new Pool({
  user: 'postgres',
  host: 'host.docker.internal',
  database: 'timestampsdb',
  password: 'postgres',
  port: 5435,
});

// --- MQTT Broker Setup ---
const MQTT_PORT = 1883;
const mqttServer = net.createServer(aedes.handle);
mqttServer.listen(MQTT_PORT, () => {
  console.log(`🚀 MQTT broker is running on port ${MQTT_PORT}`);
});

// --- Prometheus Metrics Setup ---
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

const messagesReceived = new client.Counter({
  name: 'mqtt_messages_received_total',
  help: 'Total number of MQTT messages received',
  labelNames: ['topic', 'client_id'],
});

const malformedMessages = new client.Counter({
  name: 'mqtt_malformed_messages_total',
  help: 'Number of malformed or invalid MQTT messages',
});

const sensorGauges = {};

function getGauge(sensorType) {
  const sanitized = sensorType.replace(/[^a-zA-Z0-9_]/g, '_');
  if (!sensorGauges[sensorType]) {
    sensorGauges[sensorType] = new client.Gauge({
      name: `sensor_${sanitized}_measurement`,
      help: `Current measurement for ${sensorType}`,
      labelNames: ['user_id', 'sensor_type'],
    });
  }
  return sensorGauges[sensorType];
}

// --- MQTT Publish Handler ---
aedes.on('publish', async (packet, clientInfo) => {
  if (!clientInfo) return;

  const payload = packet.payload.toString();
  console.log(`📩 Received from ${clientInfo.id} on topic "${packet.topic}": ${payload}`);
  messagesReceived.inc({ topic: packet.topic, client_id: clientInfo.id });

  try {
    const data = JSON.parse(payload);
    if (!('user_id' in data) || !Array.isArray(data.readings)) {
      throw new Error('Missing user_id or invalid readings[]');
    }

    const { user_id, readings } = data;
    if (typeof user_id !== 'number') throw new Error('user_id must be a number');

    for (const reading of readings) {
      const { sensorType, measurement } = reading;

      if (typeof sensorType !== 'string' || typeof measurement !== 'string') {
        throw new Error(`Invalid reading: ${JSON.stringify(reading)}`);
      }

      const timestamp = new Date();

      // Insert into authdb (basic storage)
      await authDb.query(
        'INSERT INTO sensordata (user_id, sensor_type, measurement) VALUES ($1, $2, $3)',
        [user_id, sensorType, measurement]
      );

      // Insert into timestampsdb (with recorded_at)
      await timestampDb.query(
        'INSERT INTO sensordata (user_id, sensor_type, measurement, recorded_at) VALUES ($1, $2, $3, $4)',
        [user_id, sensorType, measurement, timestamp]
      );

      // Prometheus numeric metrics
      const numericValue = parseFloat(measurement);
      if (!isNaN(numericValue)) {
        const gauge = getGauge(sensorType);
        gauge.set({ user_id: String(user_id), sensor_type: sensorType }, numericValue);
      }
    }

    console.log(`✅ Inserted ${readings.length} readings for user ${user_id}`);
  } catch (err) {
    console.warn('⚠️ Invalid payload or DB error:', err.message);
    malformedMessages.inc();
  }
});

// --- HTTP Server for Prometheus Metrics ---
const METRICS_PORT = 9090;
const app = express();

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

app.listen(METRICS_PORT, () => {
  console.log(`📊 Prometheus metrics available at http://localhost:${METRICS_PORT}/metrics`);
});
