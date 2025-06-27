import axios from 'axios';

const baseURL = 'http://localhost:9091/api/v1';

async function queryTotalMessagesLastTwoHours() {
  const query = 'mqtt_messages_received_total';


  try {
    const res = await axios.get(`${baseURL}/query`, {
      params: { query },
    });

    const result = res.data.data.result;

    if (result.length === 0) {
      console.log('⚠️ No messages received in the past 2 hours.');
      return;
    }

    console.log('📥 Total MQTT messages received in the last 2 hours:');
    for (const series of result) {
      const { topic, client_id } = series.metric;
      const count = series.value[1];
      console.log(`• Topic: ${topic}, Client: ${client_id} => ${count} messages`);
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

queryTotalMessagesLastTwoHours();
