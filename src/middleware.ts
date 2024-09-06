import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase/auth';
import { getUser } from './components/hooks/users';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/admin')) {
    const user = await getUser();
    
    if (!user || user.access === 'user') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
