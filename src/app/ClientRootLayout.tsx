// src/app/ClientRootLayout.tsx

'use client'; // <-- THIS DIRECTIVE MARKS THIS FILE AS CLIENT-SIDE

import { AntdRegistry } from '@ant-design/nextjs-registry';
import AuthProvider from './components/auth-provider'; // Your NextAuth provider

// This component uses client-side libraries/hooks (AuthProvider, AntdRegistry)
export default function ClientRootLayout({ children }: React.PropsWithChildren) {
  return (
    <AuthProvider>
      <AntdRegistry>{children}</AntdRegistry>
    </AuthProvider>
  );
}