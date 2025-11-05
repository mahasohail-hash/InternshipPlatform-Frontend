import NextAuth, { NextAuthOptions, DefaultUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axios, { isAxiosError } from "axios";
import 'next-auth/jwt'; // Keep this for JWT module augmentation

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
const LOGIN_API_URL = `${BACKEND_BASE_URL}/api/auth/login`;

// Updated: This interface now matches a FLAT backend response structure as commonly used.
interface BackendLoginResponse {
  accessToken: string;
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
}

// Type for authorize return object (internal to NextAuth flow)
// This should extend DefaultUser to satisfy NextAuth's internal types,
// and include our custom fields.
interface AuthorizeUser extends DefaultUser {
  id: string; // Ensure id is string
  email: string;
  name: string; // Combined first + last name
  role: string;
  accessToken: string;
}

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: (async (credentials: { email: any; password: any; }) => {
        if (!credentials?.email || !credentials.password) {
          console.error("[NextAuth Authorize] Missing email or password.");
          throw new Error('Missing email or password.');
        }

        try {
          console.log(`[NextAuth Authorize] Attempting login for ${credentials.email} to ${LOGIN_API_URL}`);

          const axiosResponse = await axios.post<BackendLoginResponse>(LOGIN_API_URL, {
            email: credentials.email,
            password: credentials.password,
          }, {
            headers: { 'Accept': 'application/json' },
          });

          console.log("[NextAuth Authorize] Backend login successful. Response data:", axiosResponse.data);

          const backendData = axiosResponse.data;

          if (!backendData || !backendData.accessToken || !backendData.id || !backendData.role) {
             console.error("[NextAuth Authorize] Backend response missing essential data (accessToken, id, or role). Received:", backendData);
             throw new Error('Backend response missing essential user data.');
          }

          const { accessToken, id, email, role, firstName, lastName } = backendData;

          // Construct the object NextAuth needs internally for `user`
          const nextAuthUser: AuthorizeUser = {
            id: id,
            email: email,
            name: `${firstName} ${lastName}`, // Combine names for convenience
            role: role,
            accessToken: accessToken,
          };
          console.log("[NextAuth Authorize] Returning user object for JWT:", nextAuthUser);
          return nextAuthUser;

        } catch (error) {
          if (isAxiosError(error)) {
            const status = error.response?.status;
            const backendMessage = error.response?.data?.message || error.message || 'Login failed';
            console.error(`[NextAuth Authorize] AxiosError during login: Status ${status}, Message: ${backendMessage}`, error.response?.data);
            throw new Error(backendMessage); // Throw error for NextAuth to catch and display
          } else {
            console.error("[NextAuth Authorize] Non-Axios error during login:", error);
            throw new Error('An unexpected network or configuration error occurred.');
          }
        }
      }) as any, // Cast needed for complex NextAuth authorize signature
    }),
  ],
  callbacks: {
    // This callback runs *before* the session callback and stores info in the JWT token (cookie)
    async jwt({ token, user }) {
      // 'user' is the object returned from the `authorize` function
      if (user) {
        const u = user as unknown as AuthorizeUser; // Cast to our custom user type
        token.sub = u.id; // NextAuth uses 'sub' for user ID
        token.role = u.role; // Store role directly on token
        token.accessToken = u.accessToken; // Store backend token directly on token
        // Ensure token.email, token.name are also set if needed by session.user
        token.email = u.email;
        token.name = u.name;
      }
      return token;
    },
    // This callback runs *after* the JWT callback and shapes the 'session' object
    async session({ session, token }) {
      // 'session.user' is mutable, modify it to include custom fields
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string;
        // Name and email should already be on session.user from DefaultSession,
        // but explicitly setting them from token ensures consistency.
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      // Add the backend accessToken to the session object root
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days (JWT expiration should match this for consistent behavior)
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login', // Redirect back to login page on error
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };