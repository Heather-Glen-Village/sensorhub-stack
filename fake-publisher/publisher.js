const mqtt = require('mqtt');

// Connect to local MQTT broker
const client = mqtt.connect('mqtt://localhost:1883', {
  clientId: 'fluctuating-temp-publisher',
  clean: true
});

// Utility: generate fluctuating temperature
function generateFluctuatingTemp(base = 24, variation = 3) {
  const wave = Math.sin(Date.now() / 3000) * variation;
  const jitter = (Math.random() - 0.5) * 2;
  return +(base + wave + jitter).toFixed(2);
}

// Utility: pick a random user_id between 1 and 4
function randomUserId() {
  return Math.floor(Math.random() * 4) + 1;
}

client.on('connect', () => {
  console.log('✅ Connected to MQTT broker');

  setInterval(() => {
    const payload = {
      user_id: randomUserId(),
      readings: [
        {
          sensorType: 'temperature',
          measurement: generateFluctuatingTemp(24).toString()
        },
        {
          sensorType: 'humidity',
          measurement: (40 + Math.random() * 20).toFixed(1) + '%'
        },
        {
          sensorType: 'co2',
          measurement: (350 + Math.random() * 100).toFixed(0) + 'ppm'
        },
        {
          sensorType: 'motion',
          measurement: Math.random() > 0.5 ? 'Motion detected' : 'No motion'
        }
      ]
    };

    client.publish('sensor/data', JSON.stringify(payload));
    console.log('📤 Published:', payload);
  }, 1000);
});

client.on('error', (err) => {
  console.error('❌ MQTT connection error:', err);
  client.end();
});
