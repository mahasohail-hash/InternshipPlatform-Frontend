// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { UserRole } from "./src/common/enums/user-role.enum"; 

export default withAuth(

  async function middleware(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    const role = token?.role as UserRole | undefined;
    const { pathname } = req.nextUrl;

    // ================================
    // ROLE-BASED ACCESS CONTROL
    // ================================

    // HR routes
    if (pathname.startsWith("/hr-dashboard") && role !== UserRole.HR) {
      return NextResponse.redirect(new URL("/access-denied", req.url));
    }

    // Mentor routes
    if (pathname.startsWith("/mentor") && role !== UserRole.MENTOR) {
      return NextResponse.redirect(new URL("/access-denied", req.url));
    }

    // Intern routes
    if (pathname.startsWith("/intern") && role !== UserRole.INTERN) {
      return NextResponse.redirect(new URL("/access-denied", req.url));
    }

    // Observer routes
    if (pathname.startsWith("/observer-dashboard") && role !== UserRole.OBSERVER) {
      return NextResponse.redirect(new URL("/access-denied", req.url));
    }

    // Redirect root "/" to respective dashboard
    if (pathname === "/") {
      if (role === UserRole.HR)
        return NextResponse.redirect(new URL("/hr-dashboard", req.url));

      if (role === UserRole.MENTOR)
        return NextResponse.redirect(new URL("/mentor/dashboard", req.url));

      if (role === UserRole.INTERN)
        return NextResponse.redirect(new URL("/intern/dashboard", req.url));

      if (role === UserRole.OBSERVER)
        return NextResponse.redirect(new URL("/observer-dashboard", req.url));

      // User is logged in but role not matched
      if (role) return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      
      authorized: ({ token }) => !!token, // FIX: your version had wrong key "authorizedh"
    },
    pages: {
      signIn: "/auth/login", // FIX: your version had typo "/aut/login"
    },
  }
);


export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|auth/login|favicon.ico).*)",
    "/auth/login",
    "/",
    "/hr-dashboard/:path*",
    "/mentor/dashboard/:path*",
    "/intern/dashboard/:path*",
    "/observer-dashboard/:path*",
  ],
};
