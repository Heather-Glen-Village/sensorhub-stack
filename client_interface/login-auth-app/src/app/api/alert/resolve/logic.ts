import { NextRequest, NextResponse } from 'next/server';

const SENSOR_THRESHOLDS = {
  temperature: {
    high: 70.5,
    low: 9.5,
    highMessage: '🔥 High temperature detected',
    lowMessage: '❄️ Low temperature detected'
  },
  humidity: {
    high: 80,
    low: 20,
    highMessage: '💧 High humidity detected',
    lowMessage: '🌵 Low humidity detected'
  },
  co2: {
    high: 1000,
    low: 400,
    highMessage: '🟡 High CO₂ levels detected',
    lowMessage: '🟢 Low CO₂ levels detected'
  }
};

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

// CORS preflight handler
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// POST request handler
export async function POST(req: NextRequest) {
  try {
    const sensorRows: SensorRow[] = await req.json();
    const alerts: TriggeredAlert[] = [];

    for (const row of sensorRows) {
      const thresholds = SENSOR_THRESHOLDS[row.sensor_type as keyof typeof SENSOR_THRESHOLDS];
      if (!thresholds) continue;

      const value = parseFloat(row.measurement);
      if (isNaN(value)) continue;

      if (value > thresholds.high) {
        alerts.push({
          user_id: row.user_id,
          sensor_type: row.sensor_type,
          measurement: value,
          severity: 'high',
          message: thresholds.highMessage
        });
      } else if (value < thresholds.low) {
        alerts.push({
          user_id: row.user_id,
          sensor_type: row.sensor_type,
          measurement: value,
          severity: 'low',
          message: thresholds.lowMessage
        });
      }
    }

    return new NextResponse(JSON.stringify(alerts), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // ⚠️ Replace '*' with frontend domain in production
      },
    });

  } catch (err) {
    console.error('❌ Error evaluating alerts:', err);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });
  }
}
