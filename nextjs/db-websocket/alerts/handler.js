import { pool } from '../db.js';

export async function saveAndBroadcastAlerts(alerts, wss) {
  if (!alerts.length) return;

  for (const alert of alerts) {
    await pool.query(
      `INSERT INTO alerts (user_id, sensor_type, measurement, severity, message)
       VALUES ($1, $2, $3, $4, $5)`,
      [alert.user_id, alert.sensor_type, alert.measurement, alert.severity, alert.message]
    );
  }

  // Fetch unresolved alerts to broadcast
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
