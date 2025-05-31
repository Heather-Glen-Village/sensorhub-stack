'use client';

import { useEffect, useState } from 'react';

interface SensorData {
  user_id: number;
  sensor1: string;
  sensor2: string;
  sensor3: string;
  sensor4: string;
}

export default function SensorDashboard() {
  const [data, setData] = useState<SensorData[]>([]);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080');

    socket.onmessage = (event: MessageEvent) => {
      try {
        const updatedData: SensorData[] = JSON.parse(event.data);
        setData(updatedData);
      } catch (err) {
        console.error('Error parsing WebSocket data:', err);
      }
    };

    return () => socket.close();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Live Sensor Data</h2>
      <div className="space-y-2">
        {data.map((row) => (
          <div key={row.user_id} className="bg-gray-100 p-4 rounded-lg shadow">
            <strong>User {row.user_id}</strong><br />
            Sensor1: {row.sensor1}, Sensor2: {row.sensor2},<br />
            Sensor3: {row.sensor3}, Sensor4: {row.sensor4}
          </div>
        ))}
      </div>
    </div>
  );
}
