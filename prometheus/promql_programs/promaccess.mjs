import axios from 'axios';

const baseURL = 'http://localhost:9091/api/v1'; // Prometheus exposed on 9091 in your docker-compose

async function queryRange() {
  const query = 'sensor_temperature_measurement';
  const end = Math.floor(Date.now() / 1000); // current time (in seconds)
  const start = end - 60 * 60; // 1 hour ago

  try {
    const res = await axios.get(`${baseURL}/query_range`, {
      params: {
        query,
        start,
        end,
        step: '15s', // match your scrape interval
      },
    });

    const result = res.data.data.result;

    console.log('📈 Time Series Result:');
    for (const series of result) {
      console.log(`Metric:`, series.metric);
      console.log(`Values:`);
      for (const [timestamp, value] of series.values) {
        console.log(`  ${new Date(timestamp * 1000).toISOString()} = ${value}`);
      }
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

queryRange();
