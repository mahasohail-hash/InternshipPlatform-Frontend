'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { Typography, Space, Button } from 'antd';
import { useRouter } from 'next/navigation';
import MainLayout from '../components/MainLayout'; // Import MainLayout

const { Title, Text } = Typography;

const DashboardPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return (
      <MainLayout>
        <Title level={4}>Loading dashboard...</Title>
      </MainLayout>
    );
  }

  // This check is mostly for robustness, MainLayout should handle redirect
  if (status === 'unauthenticated') {
    return (
      <MainLayout>
        <Space direction="vertical">
          <Title level={4} type="danger">Access Denied</Title>
          <Text>You must be logged in to view this page.</Text>
          <Button type="primary" onClick={() => router.push('/auth/login')}>Go to Login</Button>
        </Space>
      </MainLayout>
    );
  }

  // If authenticated and no specific role-based dashboard, show a generic welcome
  return (
    <MainLayout>
      <Space direction="vertical">
        <Title level={2}>Welcome to Your Dashboard, {session?.user?.name || session?.user?.email}!</Title>
        <Text>Your role: <Text strong>{session?.user?.role}</Text></Text>
        <Text>User ID: <Text code>{session?.user?.id}</Text></Text>
        <Text>This is a protected page. You should be redirected to your specific role-based dashboard soon.</Text>
        <Text>If not, ensure your middleware is configured correctly.</Text>
      </Space>
    </MainLayout>
  );
};

export default DashboardPage;