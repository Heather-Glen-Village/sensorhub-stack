import { pool } from '../db.js';

// thresholds with hysteresis to reduce flickering
const HIGH_THRESHOLD = 70.5;
const LOW_THRESHOLD = 9.5;

export async function evaluateAlerts(sensorRows) {
  for (const row of sensorRows) {
    if (row.sensor_type === 'temperature') {
      const temp = parseFloat(row.measurement);

      if (temp > HIGH_THRESHOLD) {
        await pool.query(
          `INSERT INTO alerts (user_id, sensor_type, measurement, severity, message, resolved)
           VALUES ($1, $2, $3, $4, $5, FALSE)
           ON CONFLICT (user_id, sensor_type)
           DO UPDATE SET
             measurement = EXCLUDED.measurement,
             severity = EXCLUDED.severity,
             message = EXCLUDED.message,
             resolved = FALSE`,
          [row.user_id, row.sensor_type, temp, 'high', '🔥 High temperature detected']
        );
      }

      else if (temp < LOW_THRESHOLD) {
        await pool.query(
          `INSERT INTO alerts (user_id, sensor_type, measurement, severity, message, resolved)
           VALUES ($1, $2, $3, $4, $5, FALSE)
           ON CONFLICT (user_id, sensor_type)
           DO UPDATE SET
             measurement = EXCLUDED.measurement,
             severity = EXCLUDED.severity,
             message = EXCLUDED.message,
             resolved = FALSE`,
          [row.user_id, row.sensor_type, temp, 'low', '❄️ Low temperature detected']
        );
      }

      else {
        // value is within normal range, mark existing alert as resolved if needed
        await pool.query(
          `UPDATE alerts
           SET resolved = TRUE
           WHERE user_id = $1 AND sensor_type = $2 AND resolved = FALSE`,
          [row.user_id, row.sensor_type]
        );
      }
    }

    // Add other sensor types here in the same structure
  }

  return []; // Return an empty array since we're handling DB updates directly
}
