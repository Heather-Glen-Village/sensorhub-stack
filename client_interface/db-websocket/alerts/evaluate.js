import { pool } from './db'; // assuming pool is exported from your db module

async function alertExists(row) {
  const result = await pool.query(
    `SELECT 1 FROM alerts WHERE user_id = $1 AND sensor_type = $2 AND measurement = $3 LIMIT 1`,
    [row.user_id, row.sensor_type, row.measurement]
  );
  return result.rowCount > 0;
}

export async function evaluateAlerts(sensorRows) {
  const newAlerts = [];

  for (const row of sensorRows) {
    if (row.sensor_type === 'temperature') {
      const temp = parseFloat(row.measurement);

      if (temp > 70) {
        const exists = await alertExists(row);
        if (!exists) {
          const alert = {
            user_id: row.user_id,
            sensor_type: row.sensor_type,
            measurement: row.measurement,
            severity: 'high',
            message: '🔥 High temperature detected'
          };

          await pool.query(
            `INSERT INTO alerts (user_id, sensor_type, measurement, severity, message)
             VALUES ($1, $2, $3, $4, $5)`,
            [alert.user_id, alert.sensor_type, alert.measurement, alert.severity, alert.message]
          );

          newAlerts.push(alert);
        }
      } else if (temp > 0) {
        // Remove resolved alerts from DB
        await pool.query(
          `DELETE FROM alerts WHERE user_id = $1 AND sensor_type = $2`,
          [row.user_id, row.sensor_type]
        );
      }
    }

    // You can extend this block with more sensor types and logic
  }

  return newAlerts;
}
