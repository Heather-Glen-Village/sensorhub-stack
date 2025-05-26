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
collectDefaultMetrics(); // collects default Node.js metrics

// Counter: total MQTT messages received
const messagesReceived = new client.Counter({
  name: 'mqtt_messages_received_total',
  help: 'Total number of MQTT messages received',
  labelNames: ['topic', 'client_id'],
});

// Store dynamic gauges per sensor type
const sensorGauges = {};

// Helper to get or create a gauge for a given sensor type
// Helper function to get or create a Prometheus Gauge for a given sensor type
function getGauge(sensorType) {
  // Check if we already created a gauge for this sensorType
  // If yes, reuse it — Prometheus metrics must not be redefined
  if (!sensorGauges[sensorType]) {

    // Sanitize the sensor type name to make it safe for use in a Prometheus metric name
    // Prometheus metric names must contain only letters, numbers, and underscores
    // Example: "temperature-humidity" becomes "temperature_humidity"
    const sanitizedName = sensorType.replace(/[^a-zA-Z0-9_]/g, '_');

    // Create a new Gauge metric in prom-client
    sensorGauges[sensorType] = new client.Gauge({
      // Metric name will be something like:
      // "sensor_temperature_measurement" or "sensor_light_measurement"
      name: `sensor_${sanitizedName}_measurement`,

      // Human-readable description of what this metric tracks
      help: `Current measurement for ${sensorType} sensors`,

      // Labels let you attach metadata to the metric values
      // These allow Prometheus to store multiple values under the same metric name
      // For example: room101 sensor01 vs room102 sensor02
      labelNames: ['client_room', 'sensor_id', 'sensor_type'],
    });
  }

  // Return the existing or newly created Gauge
  return sensorGauges[sensorType];
}


// Handle MQTT messages
aedes.on('publish', async (packet, clientInfo) => {
  if (clientInfo) {
    const payload = packet.payload.toString();
    console.log(`📩 Received from ${clientInfo.id} on topic "${packet.topic}": ${payload}`);

    messagesReceived.inc({ topic: packet.topic, client_id: clientInfo.id });

    try {
      const data = JSON.parse(payload);
      const { clientRoom, sensorId, sensorType, measurement } = data;

      if (
        typeof clientRoom === 'string' &&
        typeof sensorId === 'string' &&
        typeof sensorType === 'string' &&
        typeof measurement === 'number'
      ) {
        // Optional: enforce short numeric sensorId like "01"
        if (!/^\d{2}$/.test(sensorId)) {
          console.warn(`❌ Invalid sensorId format: "${sensorId}"`);
          return;
        }

        const gauge = getGauge(sensorType);
        gauge.set(
          {
            client_room: clientRoom,
            sensor_id: sensorId,
            sensor_type: sensorType,
          },
          measurement
        );
      }
    } catch (err) {
      console.warn('⚠️ Invalid payload format:', err.message);
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
