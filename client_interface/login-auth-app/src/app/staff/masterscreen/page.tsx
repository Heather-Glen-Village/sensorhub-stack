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
        console.log('👤 User fetched:', data.user);
        console.log('🔐 Token fetched:', data.token);
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
    if (!user || !token) {
      console.warn('⚠️ Skipping WebSocket setup (missing user or token)', { user, token });
      return;
    }

    const socketUrl = `ws://localhost:8080?token=${token}`;
    console.log('🌐 Connecting WebSocket to:', socketUrl);

    const socket = new WebSocket(socketUrl);
    window.websocket = socket;

    socket.onopen = () => console.log('🟢 WebSocket connected');
    socket.onerror = (e) => console.error('❌ WebSocket error:', e);
    socket.onclose = (e) => console.log('🔌 WebSocket closed:', e);
    
    socket.onmessage = (event) => {
      console.log('📩 WebSocket received:', event.data);
      try {
        const { type, data } = JSON.parse(event.data);
        console.log('🔍 Parsed message type:', type);
        console.log('📦 Parsed data:', data);

        //so much redundancy here, but can be helpful i guess...

        if (type === 'sensor') {
          const filteredRows = user.username === 'masterscreen'
            ? data
            : data.filter((r: SensorReading) => r.user_id === user.id);

          console.log('📊 Filtered sensor rows:', filteredRows);

          const grouped: Record<number, Record<string, string>> = {};
          for (const r of filteredRows) {
            if (!grouped[r.user_id]) grouped[r.user_id] = {};
            grouped[r.user_id][r.sensor_type] = r.measurement;
          }

          console.log('📈 Grouped readings by user:', grouped);
          setReadingsByUser(grouped);
        }

        if (type === 'alert') {
          if (user.username === 'masterscreen') {
            console.log('🚨 Masterscreen alerts:', data);
            setAlerts(data);
          } else {
            console.log('🔕 Non-master user – ignoring alert data');
            setAlerts([]); // Optional: clear existing alerts
          }
        }

      } catch (err) {
        console.error('❗ Error parsing WebSocket message:', err);
      }
    };

    return () => {
      console.log('🧹 Cleaning up WebSocket connection');
      socket.close();
    };
  }, [user, token]);

  if (loading) {
    console.log('⏳ Loading user...');
    return <div>Loading...</div>;
  }
  if (!user) {
    console.log('⛔ User not authenticated');
    return <div>You are not authorized. Please log in.</div>;
  }

  return (
    <>
      <Header />
      <div className="min-h-[50vh] bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
          {/* Sensor Data Panel */}
          <div className="flex-1 min-w-[300px]">
            <SensorData readingsByUser={readingsByUser} isMaster={user.username === 'masterscreen'} />
          </div>

          {/* Alert Panel */}
          <div className="w-full max-w-[500px] shrink-0">
            <AlertPanel
              alerts={alerts}
                onResolve={async (alert) => {
                try {
                  const res = await fetch(`http://<YOUR_API_HOST>/api/resolve-alert`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ alertId: alert.id }),
                  });

                  if (!res.ok) throw new Error(`Failed to resolve alert: ${res.status}`);

                  const result = await res.json();
                  console.log('✅ Alert resolved:', result);
                  // Optional: refresh alert list after server confirms resolution
                } catch (err) {
                  console.error('❌ Error resolving alert:', err);
                }
              }}

            />
          </div>
        </div>
      </div>


      <Footer />
    </>
  );
}
