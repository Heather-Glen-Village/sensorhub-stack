'use client';
import { useEffect, useState, useRef } from 'react';
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

export default function SensorDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [readings, setReadings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  const userRef = useRef<User | null>(null);

  // fetch current user & token
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/me');
        if (!res.ok) throw new Error('Unauthorized');
        const { user, token } = await res.json();
        setUser(user);
        setToken(token);
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

  // keep ref in sync
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // websocket subscription
  useEffect(() => {
    if (!token || !user) return;

    const socket = new WebSocket(`ws://localhost:8080?token=${token}`);
    console.log('⏳ Connecting to WebSocket with token:', token);

    socket.onmessage = (event) => {
      try {
        console.log('🔔 Raw WS message:', event.data);
        const parsed = JSON.parse(event.data);

        // normalize to SensorReading[]
        let rows: SensorReading[] = [];
        if (Array.isArray(parsed)) {
          rows = parsed;
        } else if (parsed.data && Array.isArray(parsed.data)) {
          rows = parsed.data;
        } else if (parsed.rows && Array.isArray(parsed.rows)) {
          rows = parsed.rows;
        } else {
          console.warn('WS payload not an array, data, or rows:', parsed);
          return;
        }

        const currentUser = userRef.current;
        if (!currentUser) {
          console.warn('No currentUser in ref');
          return;
        }

        // now safe to filter
        const userReadings = rows.filter(r => r.user_id === currentUser.id);

        const grouped: Record<string, string> = {};
        for (const r of userReadings) {
          grouped[r.sensor_type] = r.measurement;
        }
        setReadings(grouped);
      } catch (err) {
        console.error('❌ Error handling WS data:', err);
      }
    };

    socket.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

    return () => {
      socket.close();
      console.log('🔒 WebSocket closed');
    };
  }, [token, user]);

  if (loading) return <div>Loading...</div>;
  if (!user)  return <div>You are not authorized. Please log in.</div>;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">
            Welcome, {user.username}!
          </h1>

          {Object.keys(readings).length > 0 ? (
            <div className="bg-white shadow rounded-lg p-4 border border-gray-200">
              <h2 className="text-xl font-semibold text-blue-700 mb-2">
                Your Sensor Data
              </h2>
              <ul className="space-y-1 text-gray-800">
                {Object.entries(readings).map(([type, value]) => (
                  <li key={type}>
                    <strong>
                      {type.charAt(0).toUpperCase() + type.slice(1)}:
                    </strong>{' '}
                    {value}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p>No sensor data found for your account.</p>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
