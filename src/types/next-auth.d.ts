// types/next-auth.d.ts
import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

// 1. Define the custom User type we get from our authorize() function
interface CustomUser extends DefaultUser {
    id: string; // UUID from backend
    email: string;
    role: 'HR' | 'MENTOR' | 'INTERN' | 'ADMIN' | 'OBSERVER'; // Your custom roles
    firstName: string; // Added from backend response
    lastName: string;  // Added from backend response
    // name: string; // Will be derived from firstName/lastName if not explicitly sent by backend
}

// 2. Extend the Session object (what useSession() returns)
declare module "next-auth" {
    interface Session extends DefaultSession {
        user: CustomUser; // Replace DefaultUser with our custom user type
        accessToken: string; // Expose the JWT token at the top level
    }
    
    // Also extend the User type, though Session is most important
    interface User extends CustomUser {}
}

// 3. Extend the JWT Token (what is stored in the cookie and accessed in middleware)
declare module "next-auth/jwt" {
    interface JWT extends DefaultJWT {
        // These properties are directly on the token payload
        accessToken: string; // Your NestJS backend JWT
        role: string;        // User role
        id: string;          // User ID
        email: string;
        name: string;        // User's full name
        // Add other properties that are directly stored in the JWT payload if needed
    }
}