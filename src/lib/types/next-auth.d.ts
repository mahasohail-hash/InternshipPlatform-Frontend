import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";
import { UserRole } from '../src/common/enums/user-role.enum'; // CRITICAL FIX: Correct import path for UserRole

// 1. Define the custom User type that is consistent across `authorize` return, `JWT`, and `Session.user`
interface CustomUser extends DefaultUser {
    _id: string | undefined;
    isVerified: boolean | undefined;
    isAcceptingMessages: boolean | undefined;
    id: string; // UUID from backend
    email: string;
    role: UserRole; // Use our UserRole enum
    firstName: string; // Added from backend response
    lastName: string;  // Added from backend response
    name: string; // Will be derived from firstName/lastName if not explicitly sent by backend
}

// 2. Extend the Session object (what useSession() returns)
declare module "next-auth" {
    interface Session extends DefaultSession {
        user: CustomUser; // Use our custom user type here
        accessToken: string; // Expose the JWT token from your NestJS backend at the top level
        firstName:string;
        lastName:string
    }

    // Also extend the User type, though Session.user is most important for client components
interface CustomUser extends DefaultUser {
    id: string;
    email: string;
    role: UserRole;
    firstName?: string; // <-- make optional
    lastName?: string;  // <-- make optional
    isVerified?: boolean;
    isAcceptingMessages?: boolean;
}
}

// 3. Extend the JWT Token (what is stored in the cookie and accessed in middleware)
declare module "next-auth/jwt" {
    interface JWT extends DefaultJWT {
        // These properties are directly on the token payload
        accessToken: string; // Your NestJS backend JWT
        role: UserRole;        // User role (use enum)
        id: string;          // User ID
        email: string;
        name: string;        // User's full name
        // Add other properties that are directly stored in the JWT payload if needed
    }
}