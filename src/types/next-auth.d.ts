// next-auth.d.ts
import "next-auth";
import "next-auth/jwt";

type UserRole = "HR" | "MENTOR" | "INTERN" | "ADMIN" | "OBSERVER";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: UserRole;
      provider: string; // ✅ Add provider here
      firstName?: string;
      lastName?: string;
      _id?: string;
      isVerified?: boolean;
      isAcceptingMessages?: boolean;
    };
    accessToken: string;
  }

  interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    provider: string; // ✅ Add provider here
    firstName?: string;
    lastName?: string;
    accessToken: string;
    _id?: string;
    isVerified?: boolean;
    isAcceptingMessages?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    provider: string; // ✅ Add provider here
    firstName?: string;
    lastName?: string;
    accessToken: string;
    _id?: string;
    isVerified?: boolean;
    isAcceptingMessages?: boolean;
  }
}
