// internship-platform-frontend/src/app/RootProviders.tsx
'use client';

import React from 'react';
// Correct import paths for components (adjust based on your exact structure)
import AuthProvider from './components/auth-provider'; 
import MainLayout from './components/MainLayout';
import { ConfigProvider, theme } from 'antd';
import { AntdRegistry } from '@ant-design/nextjs-registry'; // Recommended Ant Design package

// This component handles all client-side logic and context providers
export default function RootProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {/* Use AntdRegistry to ensure styles are injected correctly */}
      <AntdRegistry> 
        <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm }}>
          {/* MainLayout is also client-side because it uses useSession() */}
          <MainLayout>
            {children}
          </MainLayout>
        </ConfigProvider>
      </AntdRegistry>
    </AuthProvider>
  );
}