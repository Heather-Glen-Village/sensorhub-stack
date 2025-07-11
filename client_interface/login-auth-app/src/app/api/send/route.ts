// app/api/send/route.ts
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {

  const body = await req.json();
  
  const { command } = body;

  if (!command || typeof command !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing or invalid command' }), { status: 400 });
  }

  try {
    const nanoRes = await fetch(`http://192.168.3.123/${command}`);
    const text = await nanoRes.text();
    return new Response(JSON.stringify({ nanoResponse: text }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to reach Nano' }), { status: 500 });
  }
}
