'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import MainLayout from './components/MainLayout';
import { ConfigProvider, theme } from 'antd';
import { AntdRegistry } from '@ant-design/nextjs-registry';

interface RootProvidersProps {
  children: React.ReactNode;
}

export default function RootProviders({ children }: RootProvidersProps) {
  return (
    <SessionProvider refetchInterval={300}>
      <AntdRegistry>
        <ConfigProvider
          theme={{
            algorithm: theme.defaultAlgorithm,
            token: { colorPrimary: '#1890ff', borderRadius: 6 },
            components: {
              Layout: { siderBg: '#001529', headerBg: '#ffffff' },
              Menu: { darkItemBg: '#001529', darkItemSelectedBg: '#1890ff' },
              Card: {
                boxShadow:
                  '0 1px 2px -2px rgba(0,0,0,.16), 0 3px 6px 0 rgba(0,0,0,.12), 0 5px 12px 4px rgba(0,0,0,.09)',
              },
            },
          }}
        >
          <MainLayout>{children}</MainLayout>
        </ConfigProvider>
      </AntdRegistry>
    </SessionProvider>
  );
}
