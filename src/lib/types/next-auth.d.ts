import 'next-auth';
import 'next-auth/jwt';


interface AuthorizeUser {
  id: string;
  email: string;
  name: string;
  role: string;
  accessToken: string;
}

declare module 'next-auth' {
 
  interface Session {
    accessToken?: string; // Token added to the root session object
    user: {
      id: string;
      role: string;
      // Include default properties like name, email, image if needed
    } & DefaultSession['user']; 
  }

  
  interface User extends AuthorizeUser {}
}

declare module 'next-auth/jwt' {
  /**
   * Extends the built-in JWT token payload type
   */
  interface JWT {
    accessToken?: string; // Backend access token
    role?: string;        // User role
    
  }
}
