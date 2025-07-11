'use client';
import { useState } from 'react';

export default function ControlPage() {
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const sendCommand = async (command: string) => {
    setStatus('sending');
    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });
      const data = await res.json();

      if (res.ok && data?.nanoResponse?.includes('200')) {
        setStatus('success');
        setMessage(data.nanoResponse);
      } else {
        setStatus('error');
        setMessage(data.nanoResponse || 'Unknown error');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Failed to contact server');
    }

    setTimeout(() => setStatus('idle'), 3000);
  };

  return (
    <div className="min-h-screen bg-white p-6 flex flex-col items-center gap-4">
      <h1 className="text-2xl font-bold">Heather Glen Control Panel</h1>

      <div className="flex gap-4">
        <button
          onClick={() => sendCommand('heat/on')}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
        >
          Turn Heat On
        </button>
        <button
          onClick={() => sendCommand('heat/off')}
          className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
        >
          Turn Heat Off
        </button>
      </div>

      {status !== 'idle' && (
        <p className={`mt-4 ${status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {status === 'sending' ? 'Sending...' : message}
        </p>
      )}
    </div>
  );
}
