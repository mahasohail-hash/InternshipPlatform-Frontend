'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import { ConfigProvider, theme } from 'antd';

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * This component wraps the entire application with client-side providers:
 * 1. SessionProvider: Makes the NextAuth.js session (useSession) available everywhere.
 * 2. ConfigProvider: Sets up the global theme and settings for Ant Design.
 */
export default function Providers({ children }: ProvidersProps) {
  return (
    // SessionProvider makes `useSession()` work in any client component
    <SessionProvider>
      {/* ConfigProvider provides global theme settings to all Ant Design components */}
      <ConfigProvider
        theme={{
          // Use the default light theme algorithm
          algorithm: theme.defaultAlgorithm,
          // Or uncomment this for a dark theme:
          // algorithm: theme.darkAlgorithm,

          // Global design tokens
          token: {
            colorPrimary: '#1890ff',
            colorLink: '#1890ff',
            borderRadius: 6,
          },

          // Component-specific overrides
          components: {
            Layout: {
              siderBg: '#001529',
              headerBg: '#ffffff',
            },
            Menu: {
              darkItemBg: '#001529',
              darkItemSelectedBg: '#1890ff',
            },
          },
        }}
      >
        {children} {/* This renders the rest of your application */}
      </ConfigProvider>
    </SessionProvider>
  );
}
