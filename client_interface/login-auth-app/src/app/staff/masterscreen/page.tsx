'use client';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SensorData from './sensordata';
import AlertPanel from './alert';

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
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <SensorData readingsByUser={readingsByUser} isMaster={user.username === 'masterscreen'} />
          </div>
          <div className="w-full lg:w-80 shrink-0">
            <AlertPanel alerts={alerts} />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
