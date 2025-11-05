'use client';

import React from 'react';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { SessionProvider } from 'next-auth/react';
import { ConfigProvider, theme } from 'antd'; // Import ConfigProvider and theme

// This component uses client-side libraries/hooks (SessionProvider, AntdRegistry, ConfigProvider)
// It applies Ant Design theme globally and provides NextAuth session context.
export default function ClientRootLayout({ children }: React.PropsWithChildren) {
  return (
    <SessionProvider> {/* Make SessionProvider the outermost client-side provider */}
      <AntdRegistry>
        <ConfigProvider
          theme={{
            algorithm: theme.defaultAlgorithm,
            token: {
              colorPrimary: '#1890ff', // Example primary color
              colorLink: '#1890ff',
              borderRadius: 6,
            },
            components: {
                Layout: {
                    siderBg: '#001529',
                    headerBg: '#ffffff',
                },
                Menu: {
                    darkItemBg: '#001529',
                    darkItemSelectedBg: '#1890ff',
                    darkItemHoverBg: 'rgba(24, 144, 255, 0.2)', // A subtle hover for dark menu
                },
                Card: {
                    boxShadow: '0 1px 2px -2px rgba(0,0,0,.16), 0 3px 6px 0 rgba(0,0,0,.12), 0 5px 12px 4px rgba(0,0,0,.09)',
                }
            },
          }}
        >
          {children}
        </ConfigProvider>
      </AntdRegistry>
    </SessionProvider>
  );
}