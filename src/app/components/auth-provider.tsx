// components/AuthProvider.tsx
'use client';
import React from 'react';

type Props = {
  children: React.ReactNode;
};
import { SessionProvider } from 'next-auth/react';

// Wraps the entire application to provide session context (user data, token)
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}