import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // --- THIS IS THE FIX ---
    // The role is stored at the ROOT of the token, not inside 'user'.
    const role = req.nextauth.token?.role;
    // --- END FIX ---
    
    const { pathname } = req.nextUrl;

    // ==========================================================
    // ROLE-BASED ACCESS CONTROL
    // ==========================================================

    // 1. HR Access Check
    if (pathname.startsWith('/hr-dashboard') && role !== 'HR') {
      console.warn(`ACCESS DENIED: Role ${role} attempting to access HR route.`);
      return NextResponse.redirect(new URL('/access-denied', req.url));
    }

    // 2. MENTOR Access Check
    if (pathname.startsWith('/mentor') && role !== 'MENTOR') {
      console.warn(`ACCESS DENIED: Role ${role} attempting to access Mentor route.`);
      return NextResponse.redirect(new URL('/access-denied', req.url));
    }

    // 3. INTERN Access Check
    if (pathname.startsWith('/intern') && role !== 'INTERN') {
      console.warn(`ACCESS DENIED: Role ${role} attempting to access Intern route.`);
      return NextResponse.redirect(new URL('/access-denied', req.url));
    }
    
    // 4. Default Dashboard Redirection
    if (pathname === '/') {
      if (role === 'HR') {
        return NextResponse.redirect(new URL('/hr-dashboard/dashboard', req.url));
      }
      if (role === 'MENTOR') {
        return NextResponse.redirect(new URL('/mentor/dashboard', req.url));
      }
      if (role === 'INTERN') {
        return NextResponse.redirect(new URL('/intern/dashboard', req.url));
      }
    }

    // If all checks pass, allow the request
    return NextResponse.next();
  },
  {
    callbacks: {
      // This checks if the user is logged in at all.
      authorized: ({ token }) => !!token,
    },
    pages: {
      // This tells 'withAuth' where to send users if they are not logged in.
      signIn: '/auth/login',
    },
  }
);

// This 'matcher' is perfect. It protects all your app routes
// and correctly ignores all public/api/static routes.
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|auth|favicon.ico).*)',
  ],
};

