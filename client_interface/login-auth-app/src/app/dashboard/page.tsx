'use client';
import { useEffect, useState, useRef } from 'react';

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
  const [readings, setReadings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  const userRef = useRef<User | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/me');
        if (!res.ok) throw new Error('Unauthorized');
        const data = await res.json();
        setUser(data.user);
        setToken(data.token);
        console.log('✅ Fetched user:', data.user);
      } catch (err) {
        console.error('❌ Failed to load user:', err);
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const wsUrl = 'ws://localhost:3001'; // Change if needed
    console.log(`🔌 Attempting to connect to WebSocket: ${wsUrl}`);
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('🟢 WebSocket connection opened');
    };

    socket.onmessage = (event) => {
      try {
        const user = userRef.current;
        if (!user) return;

        console.log('📩 Raw message:', event.data);

        const rows: SensorReading[] = JSON.parse(event.data);
        const userReadings = rows.filter(r => r.user_id === user.id);

        const grouped: Record<string, string> = {};
        for (const r of userReadings) {
          grouped[r.sensor_type] = r.measurement;
        }

        console.log('📦 Parsed sensor data:', grouped);
        setReadings(grouped);
      } catch (err) {
        console.error('❌ Error parsing WebSocket data:', err);
      }
    };

    socket.onerror = (e) => {
      console.error('🔴 WebSocket error:', e);
    };

    socket.onclose = (e) => {
      console.warn('🔌 WebSocket closed:', e.code, e.reason);
    };

    return () => {
      console.log('🔌 Closing WebSocket connection');
      socket.close();
    };
  }, [user]);

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>You are not authorized. Please log in.</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Welcome, {user.username}!</h1>

        {Object.keys(readings).length > 0 ? (
          <div className="bg-white shadow rounded-lg p-4 border border-gray-200">
            <h2 className="text-xl font-semibold text-blue-700 mb-2">Your Sensor Data</h2>
            <ul className="space-y-1 text-gray-800">
              {Object.entries(readings).map(([type, value]) => (
                <li key={type}>
                  <strong>{type.charAt(0).toUpperCase() + type.slice(1)}:</strong> {value}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p>No sensor data found for your account.</p>
        )}
      </div>
    </div>
  );
}
