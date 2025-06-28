function isEqual(a, b) {
  return Object.keys(a).length === Object.keys(b).length &&
    Object.keys(a).every(k => a[k] === b[k]);
}

const index = alerts.findIndex(a => isEqual(a, target));



//this is a very slow and inefficient way to do these checks and in the case we
//have many more readings and readings in shorter intervals this will not scale well
export function evaluateAlerts(sensorRows) {
  const alerts = [];

  for (const row of sensorRows) {
    if (row.sensor_type === 'temperature') {

      if (parseFloat(row.measurement) > 70){
        alerts.push({
        user_id: row.user_id,
        sensor_type: row.sensor_type,
        measurement: row.measurement,
        severity: 'high',
        message: '🔥 High temperature detected'
        });
      }

      else if (parseFloat(row.measurement)>0){

        //safe and readable way of doing this
        //however it is planned we switch over to a hashmap or simular structure for O(1) lookups
        for (let i = alerts.length - 1; i >= 0; i--) {
          if (isEqual(alerts[i], row)) {
            alerts.splice(i, 1);
          }
        }
      }
    }
    // Add more rules here




  }

  return alerts;
}
