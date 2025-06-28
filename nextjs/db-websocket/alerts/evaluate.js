export function evaluateAlerts(sensorRows) {
  const alerts = [];

  for (const row of sensorRows) {
    if (row.sensor_type === 'temperature' && parseFloat(row.measurement) > 70) {

      alerts.push({
        user_id: row.user_id,
        sensor_type: row.sensor_type,
        measurement: row.measurement,
        severity: 'high',
        message: '🔥 High temperature detected'
      });
    }
    // Add more rules here
  }

  return alerts;
}
