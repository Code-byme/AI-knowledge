import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // For now, just pass through all requests
  // You can add authentication logic here later if needed
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile']
};
