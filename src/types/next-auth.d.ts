// types/next-auth.d.ts
import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

// 1. Define the custom User type we get from our authorize() function
interface CustomUser extends DefaultUser {
    id: string;
    email: string;
    role: 'HR' | 'MENTOR' | 'INTERN' | 'ADMIN' | 'OBSERVER'; // Your custom roles
    accessToken: string; // The JWT from your NestJS backend
    firstName: string;
    lastName: string;
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
        // The token structure is slightly different: it holds the full user object
        user: CustomUser; // Attach the full custom user object
        accessToken: string;
    }
}