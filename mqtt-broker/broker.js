const aedes = require('aedes')();
const net = require('net');
const express = require('express');
const client = require('prom-client');

// MQTT broker setup
const MQTT_PORT = 1883;
const mqttServer = net.createServer(aedes.handle);

mqttServer.listen(MQTT_PORT, () => {
  console.log(`🚀 MQTT broker is running on port ${MQTT_PORT}`);
});

// Prometheus metrics setup
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics(); // collects Node.js-level metrics

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

// Get or create a Gauge for a specific sensor type
function getGauge(sensorType) {
  const sanitizedName = sensorType.replace(/[^a-zA-Z0-9_]/g, '_');

  if (!sensorGauges[sensorType]) {
    sensorGauges[sensorType] = new client.Gauge({
      name: `sensor_${sanitizedName}_measurement`,
      help: `Current measurement for ${sensorType} sensors`,
      labelNames: ['client_room', 'sensor_id', 'sensor_type'],
    });
  }

  return sensorGauges[sensorType];
}

// MQTT message handling
aedes.on('publish', async (packet, clientInfo) => {
  if (clientInfo) {
    const payload = packet.payload.toString();
    console.log(`📩 Received from ${clientInfo.id} on topic "${packet.topic}": ${payload}`);
    messagesReceived.inc({ topic: packet.topic, client_id: clientInfo.id });

    try {
      const parsed = JSON.parse(payload);
      const dataArray = Array.isArray(parsed) ? parsed : [parsed];

      for (const data of dataArray) {
        const { clientRoom, sensorId, sensorType, measurement } = data;

        if (
          typeof clientRoom === 'string' &&
          typeof sensorId === 'string' &&
          typeof sensorType === 'string' &&
          typeof measurement === 'number'
        ) {
          const gauge = getGauge(sensorType);
          gauge.set(
            {
              client_room: clientRoom,
              sensor_id: sensorId,
              sensor_type: sensorType,
            },
            measurement
          );
        } else {
          console.warn(`⚠️ Invalid sensor data structure: ${JSON.stringify(data)}`);
          malformedMessages.inc();
        }
      }
    } catch (err) {
      console.warn('⚠️ Invalid payload format:', err.message);
      malformedMessages.inc();
    }
  }
});

// HTTP server to expose Prometheus metrics
const METRICS_PORT = 9090;
const app = express();

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

app.listen(METRICS_PORT, () => {
  console.log(`📊 Prometheus metrics available at http://localhost:${METRICS_PORT}/metrics`);
});
