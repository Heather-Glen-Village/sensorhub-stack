const mqtt = require('mqtt');

// CONNECT TO BROKER
const client = mqtt.connect('mqtt://localhost:1883', {
  clientId: 'test-publisher-1',
  clean: true
});

client.on('connect', () => {
  console.log('✅ Connected to MQTT broker');

  // Publish messages every 3 seconds
  setInterval(() => {
  const topic = 'sensor/temp';
  const message = JSON.stringify({ temperature: (Math.random() * 30 + 10).toFixed(2) });
  client.publish(topic, message);
  console.log(`📤 Published to ${topic}: ${message}`);
}, 1000); // 🔥 1 second

});

client.on('error', (err) => {
  console.error('❌ MQTT connection error:', err);
  client.end();
});
