// import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

// dotenv.config();

console.log('DATABASE_URL used:', process.env.DATABASE_URL);

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.connect()
  .then(client => {
    console.log('✅ Connected to PostgreSQL');
    client.release();
  })
  .catch(err => {
    console.error('❌ PostgreSQL connection error:', err.message);
    process.exit(1);
  });
