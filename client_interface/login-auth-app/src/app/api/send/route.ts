// app/api/send/route.ts
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  console.log('🔵 [API] Received POST /api/send');

  const body = await req.json();
  console.log('📦 [API] Request Body:', body);

  const { command } = body;

  if (!command || typeof command !== 'string') {
    console.warn('⚠️ [API] Invalid command received');
    return new Response(JSON.stringify({ error: 'Missing or invalid command' }), { status: 400 });
  }

  try {
    console.log(`➡️ [API] Forwarding to Nano: http://192.168.3.123/${command}`);
    const nanoRes = await fetch(`http://192.168.3.123/${command}`);
    const text = await nanoRes.text();
    console.log('✅ [API] Response from Nano:', text);

    return new Response(JSON.stringify({ nanoResponse: text }), { status: 200 });
  } catch (err) {
    console.error('❌ [API] Failed to contact Nano:', err);
    return new Response(JSON.stringify({ error: 'Failed to reach Nano' }), { status: 500 });
  }
}
