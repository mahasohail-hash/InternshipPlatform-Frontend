// components/AuthProvider.tsx
'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';

type AuthProviderProps = {
  children: React.ReactNode;
  session?: any; // Optional: pass server-side session if available
};

export default function AuthProvider({ children, session }: AuthProviderProps) {
  return (
    <SessionProvider
      session={session}
      refetchInterval={5 * 60} // refetch session every 5 minutes
      refetchOnWindowFocus={true} // refresh session on tab focus
    >
      {children}
    </SessionProvider>
  );
}
