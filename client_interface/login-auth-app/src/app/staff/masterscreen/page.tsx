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
  id: number;
  user_id: number;
  sensor_type: string;
  measurement: string;
  severity: string;
  message: string;
  helpText: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_NEXT_BACK_IP;
const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_IP;

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
    if (!user || !token || !WEBSOCKET_URL) return;

    const socketUrl = `${WEBSOCKET_URL}?token=${token}`;
    const socket = new WebSocket(socketUrl);
    window.websocket = socket;

    socket.onopen = () => console.log('🟢 WebSocket connected');
    socket.onerror = (e) => console.error('❌ WebSocket error:', e);
    socket.onclose = (e) => console.log('🔌 WebSocket closed:', e);

    socket.onmessage = (event) => {
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
          setAlerts(user.username === 'masterscreen' ? data : []);
        }
      } catch (err) {
        console.error('❗ Error parsing WebSocket message:', err);
      }
    };

    return () => socket.close();
  }, [user, token]);

  const handleResolveAlert = async (alert: Alert) => {
    if (!token || !BACKEND_URL) {
      console.warn('⚠️ Missing token or BACKEND_URL');
      return;
    }

    try {
      console.log('🧪 Resolving alert with token:', token);
      const res = await fetch(`${BACKEND_URL}/api/alert/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: alert.user_id,
          sensor_type: alert.sensor_type,
          measurement: alert.measurement,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Unknown error');
      }

      console.log('✅ Alert resolved:', result);
      setAlerts(prev => prev.filter(a => a.id !== alert.id));
    } catch (err) {
      console.error('❌ Error resolving alert:', err);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>You are not authorized. Please log in.</div>;

  return (
    <>
      <Header />
      <div className="min-h-[50vh] bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-w-[300px]">
            <SensorData
              readingsByUser={readingsByUser}
              isMaster={user.username === 'masterscreen'}
            />
          </div>
          <div className="w-full max-w-[500px] shrink-0">
            <AlertPanel
              alerts={alerts}
              onResolve={handleResolveAlert}
            />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
