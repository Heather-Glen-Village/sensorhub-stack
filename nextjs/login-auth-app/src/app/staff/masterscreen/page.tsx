'use client';
import { useEffect, useState } from 'react';

interface User {
  id: number;
  username: string;
}

interface SensorReading {
  user_id: number;
  sensor_type: string;
  measurement: string;
  created_at: string;
}

export default function SensorDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [readingsByUser, setReadingsByUser] = useState<Record<number, Record<string, string>>>({});

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/me');
        if (!res.ok) throw new Error('Unauthorized');
        const data = await res.json();
        setUser(data.user);
        setToken(data.token);
      } catch (err) {
        console.error('Failed to load user:', err);
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  useEffect(() => {
    if (!user || !token) return;

    const socket = new WebSocket(`ws://localhost:8080?token=${token}`);

    socket.onmessage = (event) => {
      try {
        const rows: SensorReading[] = JSON.parse(event.data);

        const filteredRows = user.username === 'masterscreen'
          ? rows
          : rows.filter(r => r.user_id === user.id);

        const grouped: Record<number, Record<string, string>> = {};

        for (const r of filteredRows) {
          if (!grouped[r.user_id]) grouped[r.user_id] = {};
          grouped[r.user_id][r.sensor_type] = r.measurement;
        }

        setReadingsByUser(grouped);
      } catch (err) {
        console.error('Error parsing WebSocket data:', err);
      }
    };

    return () => socket.close();
  }, [user, token]);

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>You are not authorized. Please log in.</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Welcome, {user.username}!</h1>

        {Object.keys(readingsByUser).length > 0 ? (
          <div className="bg-white shadow rounded-lg p-4 border border-gray-200 space-y-6">
            <h2 className="text-xl font-semibold text-blue-700">Sensor Data</h2>
            {Object.entries(readingsByUser).map(([userId, sensors]) => (
              <div key={userId} className="border-t pt-2">
                {user.username === 'masterscreen' && (
                  <h3 className="text-md font-semibold text-gray-600">User ID: {userId}</h3>
                )}
                <ul className="text-gray-800">
                  {Object.entries(sensors).map(([type, value]) => (
                    <li key={type}>
                      <strong>{type.charAt(0).toUpperCase() + type.slice(1)}:</strong> {value}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p>No sensor data found.</p>
        )}
      </div>
    </div>
  );
}
