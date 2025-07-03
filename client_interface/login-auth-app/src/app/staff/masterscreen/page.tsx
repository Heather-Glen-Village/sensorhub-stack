'use client';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SensorData from './sensordata';
import AlertPanel from './alert';

declare global {
  interface Window {
    websocket?: WebSocket;
  }
}

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
  helpText: string; // optional if not used yet
}

export default function SensorDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [readingsByUser, setReadingsByUser] = useState<Record<number, Record<string, string>>>({});
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Fetch authenticated user
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

  // Setup WebSocket connection
  useEffect(() => {
    if (!user || !token) return;

    const socket = new WebSocket(`ws://localhost:8080?token=${token}`);
    window.websocket = socket;

    socket.onopen = () => console.log("🟢 WebSocket connected");
    socket.onerror = (e) => console.error("❌ WebSocket error", e);
    socket.onclose = () => console.log("🔌 WebSocket closed");

    socket.onmessage = (event) => {
      console.log("📩 WebSocket received:", event.data);

      try {
        const { type, data } = JSON.parse(event.data);

        if (type === 'sensor') {
          const filteredRows = user.username === 'masterscreen'
            ? data
            : data.filter((r: SensorReading) => r.user_id === user.id);

          const grouped: Record<number, Record<string, string>> = {};
          for (const r of filteredRows) {
            if (!grouped[r.user_id]) grouped[r.user_id] = {};
            grouped[r.user_id][r.sensor_type] = r.measurement;
          }
          setReadingsByUser(grouped);
        }

        if (type === 'alert') {
          const filteredAlerts = user.username === 'masterscreen'
            ? data
            : data.filter((a: Alert) => a.user_id === user.id);
          setAlerts(filteredAlerts);
        }

      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    return () => socket.close();
  }, [user, token]);

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>You are not authorized. Please log in.</div>;

  return (
    <>
      <Header />
      <div className="min-h-[50vh] bg-gray-100 p-6">
        <div className="max-w-xl mx-auto flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <SensorData readingsByUser={readingsByUser} isMaster={user.username === 'masterscreen'} />
          </div>
          <div className="w-[90vw] shrink-0">
            <AlertPanel
              alerts={alerts}
              onResolve={(alert) => {
                setAlerts(prev => prev.filter(a => a !== alert));
              }}
            />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
