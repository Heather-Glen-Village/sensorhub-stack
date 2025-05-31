import 'dotenv/config'; // Add this line FIRST
import pkg from 'pg';
const { Pool } = pkg;

// Now process.env.DATABASE_URL will be defined
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});


const getRandomValue = (min, max, suffix = '') =>
  `${(Math.random() * (max - min) + min).toFixed(1)}${suffix}`;

async function updateSensorData(userId) {
  const sensor1 = `temp:${getRandomValue(20, 30)}`;
  const sensor2 = `humidity:${getRandomValue(40, 60)}%`;
  const sensor3 = `motion:${Math.random() > 0.5 ? 'yes' : 'no'}`;
  const sensor4 = `light:${getRandomValue(100, 300)}lx`;

  try {
    await pool.query(
      `
      UPDATE sensordata
      SET sensor1 = $1, sensor2 = $2, sensor3 = $3, sensor4 = $4
      WHERE user_id = $5
      `,
      [sensor1, sensor2, sensor3, sensor4, userId]
    );

    console.log(`✅ Updated data for user ${userId}`);
  } catch (err) {
    console.error(`❌ Error updating user ${userId}:`, err.message);
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
