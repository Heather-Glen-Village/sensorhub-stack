'use client';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/me');
        if (!res.ok) throw new Error('Unauthorized');
        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        console.error('Failed to load user:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  if (loading) return <div>Loading...</div>;

  if (!user) return <div>You are not authorized. Please log in.</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Welcome, {user.username}!</h1>
      <p>User ID: {user.id}</p>
      {/* Add more personalized info below if needed */}
    </div>
  );
}
