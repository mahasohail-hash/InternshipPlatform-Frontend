'use client';

import { useSession, signOut } from 'next-auth/react';
import { Button, Typography, Space } from 'antd'; // Assuming Ant Design is installed
import { LogoutOutlined, UserOutlined } from '@ant-design/icons'; // Add UserOutlined
import { UserRole } from '../../common/enums/user-role.enum'; // CRITICAL FIX: Correct import path

export default function Component() {
  const { data: session, status } = useSession()

  if (status === "authenticated") {
    return <p>Signed in as {session.user.email}</p>
  }

  return <a href="/api/auth/signin">Sign in</a>
}
const { Text, Paragraph } = Typography;

export function UserStatus() {
  const { data: session, status } = useSession(); // The useSession hook gives you session data and loading status

  if (status === 'loading') {
    return <Paragraph>Loading session...</Paragraph>;
  }

  if (session && session.user) { // Ensure session.user exists
    // User is logged in
    return (
      <Space direction="vertical">
        <Paragraph>Welcome back, {session.user.name || session.user.email}!</Paragraph>
        <Paragraph>You are logged in as: <Text strong>{session.user.email}</Text> (Role: <Text strong>{session.user.role}</Text>)</Paragraph>
        <Button
            type="primary"
            icon={<LogoutOutlined />}
            onClick={() => signOut({ redirect: false })}>
            Logout
        </Button>
      </Space>
    );
  }

  // User is not logged in
  return (
    <Space direction="vertical">
      <Paragraph>You are not logged in.</Paragraph>
      {/* You might provide a link to the sign-in page here */}
      <Button type="primary" onClick={() => window.location.href = '/auth/login'}>Log In</Button>
    </Space>
  );
}