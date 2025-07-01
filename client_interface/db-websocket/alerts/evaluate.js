import { pool } from '../db.js'; // assumes pool is exported from your db module

async function alertExists(row) {
  const result = await pool.query(
    `SELECT 1 FROM alerts WHERE user_id = $1 AND sensor_type = $2 AND measurement = $3 LIMIT 1`,
    [row.user_id, row.sensor_type, row.measurement]
  );
  return result.rowCount > 0;
}

export async function evaluateAlerts(sensorRows) {
  const alertsToInsert = [];
  // Optional: const alertsToResolve = [];

  for (const row of sensorRows) {
    if (row.sensor_type === 'temperature') {
      const temp = parseFloat(row.measurement);

      if (temp > 70) {
        const exists = await alertExists(row);
        if (!exists) {
          alertsToInsert.push({
            user_id: row.user_id,
            sensor_type: row.sensor_type,
            measurement: row.measurement,
            severity: 'high',
            message: '🔥 High temperature detected'
          });
        }
      }

      // Optional: track resolved alerts instead of deleting them here
      // else if (temp > 0) {
      //   alertsToResolve.push({
      //     user_id: row.user_id,
      //     sensor_type: row.sensor_type
      //   });
      // }
    }

    // Add more sensor types and alert logic here
  }

  return alertsToInsert;
  // Or return both:
  // return { alertsToInsert, alertsToResolve };
}
