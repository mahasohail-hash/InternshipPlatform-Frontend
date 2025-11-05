import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { UserRole } from './src/common/enums/user-role.enum'; // CRITICAL FIX: Correct import path

export default withAuth(
  function middleware(req) {
    // CRITICAL FIX: Access the 'role' directly from the token's root
    const role = req.nextauth.token?.role as UserRole | undefined; // Cast to UserRole
    const { pathname } = req.nextUrl;

    // ==========================================================
    // ROLE-BASED ACCESS CONTROL
    // ==========================================================

    // 1. HR Access Check
    if (pathname.startsWith('/hr-dashboard') && role !== UserRole.HR) {
      console.warn(`ACCESS DENIED: Role ${role} attempting to access HR route.`);
      return NextResponse.redirect(new URL('/access-denied', req.url));
    }

    // 2. MENTOR Access Check
    if (pathname.startsWith('/mentor') && role !== UserRole.MENTOR) {
      console.warn(`ACCESS DENIED: Role ${role} attempting to access Mentor route.`);
      return NextResponse.redirect(new URL('/access-denied', req.url));
    }

    // 3. INTERN Access Check
    if (pathname.startsWith('/intern') && role !== UserRole.INTERN) {
      console.warn(`ACCESS DENIED: Role ${role} attempting to access Intern route.`);
      return NextResponse.redirect(new URL('/access-denied', req.url));
    }

    // 4. OBSERVER Access Check (New Role)
    if (pathname.startsWith('/observer-dashboard') && role !== UserRole.OBSERVER) {
      console.warn(`ACCESS DENIED: Role ${role} attempting to access Observer route.`);
      return NextResponse.redirect(new URL('/access-denied', req.url));
    }

    // 5. Default Dashboard Redirection if at root '/'
    if (pathname === '/') {
      if (role === UserRole.HR) {
        return NextResponse.redirect(new URL('/hr-dashboard', req.url)); // Redirect to base dashboard path
      }
      if (role === UserRole.MENTOR) {
        return NextResponse.redirect(new URL('/mentor/dashboard', req.url));
      }
      if (role === UserRole.INTERN) {
        return NextResponse.redirect(new URL('/intern/dashboard', req.url));
      }
      if (role === UserRole.OBSERVER) {
        return NextResponse.redirect(new URL('/observer-dashboard', req.url));
      }
      // If authenticated but no specific role-based dashboard, redirect to a generic dashboard
      if (role) { // If a role exists but didn't match above, send to generic.
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    // If all checks pass, allow the request to proceed
    return NextResponse.next();
  },
  {
    callbacks: {
      // This checks if the user is logged in at all (token exists).
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
    '/((?!api|_next/static|_next/image|auth/login|auth/signin/login|favicon.ico).*)', // CRITICAL FIX: Allow /auth/login and /auth/signin/login to be public
  ],
};