import 'dotenv/config'; // Add this line FIRST
import pkg from 'pg';
const { Pool } = pkg;

// Now process.env.DATABASE_URL will be defined
const pool = new Pool({
  connectionString: "postgres://postgres:postgres@localhost:5432/authdb"
});


const getRandomValue = (min, max, suffix = '') =>
  `${(Math.random() * (max - min) + min).toFixed(1)}${suffix}`;

async function updateSensorData(userId) {
  const readings = [
    { sensor_type: 'temperature', measurement: getRandomValue(90, 120) },
    { sensor_type: 'humidity', measurement: getRandomValue(40, 60, '%') },
    { sensor_type: 'motion', measurement: Math.random() > 0.5 ? 'yes' : 'no' },
    { sensor_type: 'light', measurement: getRandomValue(100, 300, 'lx') }
  ];

  try {
    for (const reading of readings) {
      await pool.query(
        `
        INSERT INTO sensordata (user_id, sensor_type, measurement)
        VALUES ($1, $2, $3)
        `,
        [userId, reading.sensor_type, reading.measurement]
      );
    }

    console.log(`✅ Inserted readings for user ${userId}`);
  } catch (err) {
    console.error(`❌ Error inserting data for user ${userId}:`, err.message);
  }
}


async function feedLoop() {
  const userIds = [1, 2, 3];
  setInterval(() => {
    userIds.forEach(updateSensorData);
  }, 1000);
}

// Connect and start feeding
pool
  .connect()
  .then(client => {
    console.log('📡 Connected to DB, starting feed loop...');
    client.release();
    feedLoop();
  })
  .catch(err => {
    console.error('❌ Failed to connect to DB:', err.message);
  });
