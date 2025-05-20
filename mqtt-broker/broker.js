const aedes = require('aedes')();
const net = require('net');

const PORT = 1883;
const server = net.createServer(aedes.handle);

server.listen(PORT, () => {
  console.log(`🚀 MQTT broker is running on port ${PORT}`);
});

// 🧠 Print message whenever a client publishes something
aedes.on('publish', async (packet, client) => {
  // Ignore broker's own internal $SYS messages
  if (client) {
    console.log(`📩 Received from ${client.id} on topic "${packet.topic}": ${packet.payload.toString()}`);
  }
});
