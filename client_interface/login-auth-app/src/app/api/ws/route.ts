import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({
    message: 'This is the WebSocket endpoint. Please connect via WS protocol.',
  });
}
