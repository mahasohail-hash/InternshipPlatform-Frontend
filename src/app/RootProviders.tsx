'use client';

import React from 'react';
// Correct import paths for components (adjust based on your exact structure)
import { SessionProvider } from 'next-auth/react'; // Directly import SessionProvider
import MainLayout from './components/MainLayout';
import { ConfigProvider, theme } from 'antd';
import { AntdRegistry } from '@ant-design/nextjs-registry';

// This component handles all client-side logic and context providers
export default function RootProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AntdRegistry>
        <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm }}>
          {/* If MainLayout is intended to wrap the entire authenticated app, place it here */}
          {/* Note: If MainLayout itself handles session loading/redirects,
           it should be inside the SessionProvider but before children. */}
          <MainLayout>
            {children}
          </MainLayout>
        </ConfigProvider>
      </AntdRegistry>
    </SessionProvider>
  );
}