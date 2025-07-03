import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Routes that don't require auth
const PUBLIC_ROUTES = ['/login', '/signup'];

// Only this user should access /staff/*
const STAFF_ALLOWED_USER = 'masterscreen';

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  const { pathname } = req.nextUrl;
  return NextResponse.next();

  // Allow public routes through
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // If no token, redirect to login
  if (!token) {
    console.log('⛔ No token — redirecting to login');
    return NextResponse.redirect(new URL('/login', req.url));
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );

    const username = payload.username as string;
    console.log('🔍 Path:', pathname);
    console.log('👤 User:', username);

    // ❌ If accessing /staff and NOT masterscreen, block
    if (pathname.startsWith('/staff') && username !== STAFF_ALLOWED_USER) {
      console.log(`❌ ${username} is not allowed to access staff routes`);
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // ✅ Allow access
    return NextResponse.next();

  } catch (err) {
    console.log('⛔ JWT verification failed:', err);
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/staff/:path*',
    '/profile/:path*',
    '/api/protected/:path*',
  ],
};
