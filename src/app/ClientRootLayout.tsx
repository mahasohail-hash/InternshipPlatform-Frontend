'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import { ConfigProvider, theme } from 'antd';
import { AntdRegistry } from '@ant-design/nextjs-registry';

interface Props {
  children: React.ReactNode;
}

export default function ClientRootLayout({ children }: Props) {
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
            },
          }}
        >
          {children}
        </ConfigProvider>
      </AntdRegistry>
    </SessionProvider>
  );
}
