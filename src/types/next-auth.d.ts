import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

interface CustomUser extends DefaultUser {
    id: string; 
    email: string;
    role: 'HR' | 'MENTOR' | 'INTERN' | 'ADMIN' | 'OBSERVER'; 
    firstName: string; 
    lastName: string; 
}

declare module "next-auth" {
    interface Session extends DefaultSession {
        user: CustomUser; 
        accessToken: string; 
    }
    
    interface User extends CustomUser {}
}

declare module "next-auth/jwt" {
    interface JWT extends DefaultJWT {
        accessToken: string; 
        role: string;       
        id: string;          
        email: string;
        name: string;        
    }
}