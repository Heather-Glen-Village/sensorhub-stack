import { pool } from '../db.js';

export async function saveAndBroadcastAlerts(alerts, wss) {
  if (!alerts.length) return;

  for (const alert of alerts) {
    // Check for existing unresolved & unacknowledged duplicate
    const { rowCount } = await pool.query(
      `SELECT 1 FROM alerts
       WHERE user_id = $1 AND sensor_type = $2 AND measurement = $3
         AND severity = $4 AND message = $5
         AND resolved = FALSE AND acknowledged = FALSE`,
      [alert.user_id, alert.sensor_type, alert.measurement, alert.severity, alert.message]
    );

    // Only insert if it doesn't already exist
    if (rowCount === 0) {
      await pool.query(
        `INSERT INTO alerts (user_id, sensor_type, measurement, severity, message)
         VALUES ($1, $2, $3, $4, $5)`,
        [alert.user_id, alert.sensor_type, alert.measurement, alert.severity, alert.message]
      );
    }
  }

  // Broadcast all unresolved alerts
  const { rows: activeAlerts } = await pool.query(
    `SELECT * FROM alerts WHERE resolved = FALSE AND acknowledged = FALSE`
  );

  wss.clients.forEach(client => {
    if (client.readyState === client.OPEN && client.user) {
      const relevantAlerts = client.user.username === 'masterscreen'
        ? activeAlerts
        : activeAlerts.filter(a => a.user_id === client.user.id);

      client.send(JSON.stringify({ type: 'alerts', data: relevantAlerts }));
    }
  });
}
