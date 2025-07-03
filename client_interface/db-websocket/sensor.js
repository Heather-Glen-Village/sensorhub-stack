import { pool } from './db.js';

export async function getLatestSensorData() {
  const result = await pool.query(`
    SELECT DISTINCT ON (user_id, sensor_type) *
    FROM sensordata
    ORDER BY user_id, sensor_type, created_at DESC;
  `);
  return result.rows;
}

export async function getLatestAlertData() {
  const result = await pool.query(`
    SELECT id, user_id, sensor_type, measurement, severity, message, status, created_at
    FROM alerts
    ORDER BY created_at DESC
  `);

  return result.rows;
}

