'use client';

import React, { useState, Suspense } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Spin } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

const { Title } = Typography;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error'); // Get error from URL

  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);

    // Use NextAuth's signIn function
    const result = await signIn('credentials', {
      redirect: false, // We will handle the redirect manually
      email: values.email,
      password: values.password,
    });

    setLoading(false);

    if (result?.ok) {
      // Success! Redirect to a default dashboard.
      // MainLayout will then see the new role and show the correct menu.
      // The middleware handles redirection to the correct role-based dashboard after successful authentication.
      router.push('/'); // Redirect to root, middleware will handle /hr/dashboard, /mentor/dashboard etc.
      router.refresh(); // Force refresh to get new session
    } else {
      // Failed login. Redirect back to login page with an error message.
      // This uses the 'error' from your authOptions pages config or a custom error.
      const errorMessage = result?.error || 'Invalid credentials. Please try again.';
      router.replace(`/auth/login?error=${encodeURIComponent(errorMessage)}`);
    }
  };

  return (
    <Card style={{ width: 400, margin: 'auto' }}>
      <Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>
        Internship Platform Login
      </Title>

      {/* Show an error message if the URL contains one */}
      {error && (
        <Alert
          message="Login Failed"
          description={decodeURIComponent(error)}
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      <Form
        name="login_form"
        initialValues={{ remember: true }}
        onFinish={onFinish}
      >
        <Form.Item
          name="email"
          rules={[{ required: true, message: 'Please input your Email!' }, { type: 'email', message: 'Please enter a valid email!' }]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="Email"
            type="email"
          />
        </Form.Item>
        <Form.Item
          name="password"
          rules={[{ required: true, message: 'Please input your Password!' }]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Password"
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            style={{ width: '100%' }}
            loading={loading}
          >
            {loading ? 'Logging in...' : 'Log in'}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}

/**
 * Main page component.
 * This sets up the centered layout and Suspense boundary.
 */
export default function LoginPage() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#f0f2f5',
      }}
    >
      {/* Suspense is required to use useSearchParams() in the component above */}
      <Suspense fallback={<Spin size="large" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}