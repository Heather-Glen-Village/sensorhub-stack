'use client';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

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

interface Alert {
  user_id: number;
  sensor_type: string;
  measurement: string;
  severity: string;
  message: string;
}

export default function SensorDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [readingsByUser, setReadingsByUser] = useState<Record<number, Record<string, string>>>({});
  const [alerts, setAlerts] = useState<Alert[]>([]);

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
        const data = JSON.parse(event.data);

        // Assume socket sends both sensor rows and alerts
        const rows: SensorReading[] = data.sensorRows ?? data;
        const alertRows: Alert[] = data.alerts ?? [];

        const filteredRows = user.username === 'masterscreen'
          ? rows
          : rows.filter(r => r.user_id === user.id);

        const grouped: Record<number, Record<string, string>> = {};
        for (const r of filteredRows) {
          if (!grouped[r.user_id]) grouped[r.user_id] = {};
          grouped[r.user_id][r.sensor_type] = r.measurement;
        }
        setReadingsByUser(grouped);

        const filteredAlerts = user.username === 'masterscreen'
          ? alertRows
          : alertRows.filter(a => a.user_id === user.id);
        setAlerts(filteredAlerts);

      } catch (err) {
        console.error('Error parsing WebSocket data:', err);
      }
    };

    return () => socket.close();
  }, [user, token]);

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>You are not authorized. Please log in.</div>;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Welcome, {user.username}!</h1>

          {/* Sensor Readings */}
          {Object.keys(readingsByUser).length > 0 ? (
            <div className="bg-white shadow rounded-lg p-4 border border-gray-200 space-y-6 mb-8">
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

          {/* Alerts Section */}
          <div className="bg-white shadow rounded-lg p-4 border border-gray-200 space-y-4">
            <h2 className="text-xl font-semibold text-red-600">Active Alerts</h2>
            {alerts.length > 0 ? (
              <ul className="space-y-2">
                {alerts.map((alert, index) => (
                  <li key={index} className="text-sm text-gray-700">
                    <span className="font-semibold">{alert.sensor_type}:</span> {alert.message} – 
                    <span className="ml-1 text-xs text-gray-500">({alert.measurement})</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No active alerts.</p>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
