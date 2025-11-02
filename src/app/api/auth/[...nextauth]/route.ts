import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axios, { isAxiosError } from "axios";
import 'next-auth/jwt';

// --- ENVIRONMENT SETUP ---
const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
const LOGIN_API_URL = `${BACKEND_BASE_URL}/api/auth/login`;
// -------------------------

// --- FIX: Update this interface to match the FLAT backend response ---
interface NestjsAuthResponse {
  accessToken: string;
  // User properties are directly on the response, not nested
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  // username?: string | null; // Include if backend sends it
}
// --- End Fix ---

// Type for authorize return object (internal to NextAuth flow)
interface AuthorizeUser {
  id: string;
  email: string;
  name: string;
  role: string;
  accessToken: string;
}

// Type for the credentials parameter in authorize
type CredentialsType = Record<"email" | "password", string | undefined>;

// Full NextAuth configuration object
const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      // --- AUTHORIZE FUNCTION ---
      authorize: (async (credentials: CredentialsType | undefined) => {
        if (!credentials?.email || !credentials.password) {
          console.error("[NextAuth Authorize] Missing email or password.");
          return null;
        }

        try {
          console.log(`[NextAuth Authorize] Attempting login for ${credentials.email} to ${LOGIN_API_URL}`);

          const axiosResponse = await axios.post<NestjsAuthResponse>(LOGIN_API_URL, {
            email: credentials.email,
            password: credentials.password,
          }, {
            headers: { 'Accept': 'application/json' },
          });

          console.log("[NextAuth Authorize] Backend login successful. Response data:", axiosResponse.data);

          const backendData = axiosResponse.data;

          // Check for accessToken and id directly on backendData
          if (!backendData || !backendData.accessToken || !backendData.id) {
             console.error("[NextAuth Authorize] Backend response missing expected data (accessToken or id). Received:", backendData);
             return null; // Return null if essential data is missing
          }

          // --- FIX: Extract user details and token correctly ---
          const { accessToken, id, email, role, firstName, lastName } = backendData;
          // --- End Fix ---

          // Construct the object NextAuth needs internally
          const nextAuthUser: AuthorizeUser = {
            id: id,
            email: email,
            name: `${firstName} ${lastName}`, // Combine names
            role: role,
            accessToken: accessToken, // Pass token to jwt callback
          };
          console.log("[NextAuth Authorize] Returning user object for JWT:", nextAuthUser);
          return nextAuthUser; // Return the user object on success

        } catch (error) {
          if (isAxiosError(error)) {
            const status = error.response?.status;
            const backendMessage = error.response?.data?.message || error.message || 'Login failed';
            console.error(`[NextAuth Authorize] AxiosError during login: Status ${status}, Message: ${backendMessage}`, error.response?.data);
            throw new Error(backendMessage);
          } else {
            console.error("[NextAuth Authorize] Non-Axios error during login:", error);
            throw new Error('An unexpected network or configuration error occurred.');
          }
        }
      }) as any, // Cast needed for complex NextAuth authorize signature
    }), // End CredentialsProvider
  ], // End providers
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as AuthorizeUser;
        token.sub = u.id;
        token.role = u.role;
        token.accessToken = u.accessToken; // Persist the backend token
      }
      return token;
    },
    async session({ session, token }) {
      // Add the backend accessToken to the session object root
      session.accessToken = token.accessToken as string;
      // Add custom properties to session.user
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: '/auth/login', // Your CUSTOM frontend login page route
    error: '/auth/login', // Redirect back to login page on error
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };


