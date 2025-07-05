// thresholds with hysteresis to reduce flickering
const HIGH_THRESHOLD = 70.5;
const LOW_THRESHOLD = 9.5;

interface SensorRow {
    user_id: string;
    sensor_type: string;
    measurement: string;
}

interface TriggeredAlert {
    user_id: string;
    sensor_type: string;
    measurement: number;
    severity: 'high' | 'low';
    message: string;
}

export async function getTriggeredAlerts(sensorRows: SensorRow[]): Promise<TriggeredAlert[]> {
    const triggeredAlerts: TriggeredAlert[] = [];

    for (const row of sensorRows) {
        if (row.sensor_type === 'temperature') {
            const temp = parseFloat(row.measurement);

            if (temp > HIGH_THRESHOLD) {
                triggeredAlerts.push({
                    user_id: row.user_id,
                    sensor_type: row.sensor_type,
                    measurement: temp,
                    severity: 'high',
                    message: '🔥 High temperature detected'
                });
            } else if (temp < LOW_THRESHOLD) {
                triggeredAlerts.push({
                    user_id: row.user_id,
                    sensor_type: row.sensor_type,
                    measurement: temp,
                    severity: 'low',
                    message: '❄️ Low temperature detected'
                });
            }
        }

        // Extend here for humidity, CO₂, etc.
    }

    return triggeredAlerts;
}
