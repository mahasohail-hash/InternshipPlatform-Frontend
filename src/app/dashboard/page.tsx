// internship-platform-frontend/src/app/dashboard/page.tsx
'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { Typography, Space, Button } from 'antd';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;

const DashboardPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return <Title level={4}>Loading dashboard...</Title>;
  }

  // This check is mostly for robustness, MainLayout should handle redirect
  if (status === 'unauthenticated') {
    return (
      <Space direction="vertical">
        <Title level={4} type="danger">Access Denied</Title>
        <Text>You must be logged in to view this page.</Text>
        <Button type="primary" onClick={() => router.push('/auth/signin')}>Go to Login</Button>
      </Space>
    );
  }

  // status is 'authenticated' here
  return (
    <Space direction="vertical">
      <Title level={2}>Welcome to Your Dashboard, {session?.user?.name || session?.user?.email}!</Title>
      <Text>Your role: <Text strong>{session?.user?.role}</Text></Text>
      <Text>User ID: <Text code>{session?.user?.id}</Text></Text>
      {/* You can display the access token here for debugging, but hide it in production */}
      {/* <Text>Access Token: <Text code>{session?.accessToken?.substring(0, 30)}...</Text></Text> */}
      <Text>This is a protected page. Only authenticated users can see this content.</Text>
    </Space>
  );
};

export default DashboardPage;