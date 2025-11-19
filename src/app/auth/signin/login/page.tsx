'use client';

import React, { useState, Suspense } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Spin } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation'; 
//import form from 'antd/es/form';
const { Title } = Typography;

function LoginForm() {
  const [form] = Form.useForm();

  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error'); // Get error from URL

  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);

    const result = await signIn('credentials', {
      redirect: false,
      email: values.email,
      password: values.password,
    });

    setLoading(false);

    if (result?.ok) {
      router.push('/');
      router.refresh();
    } else {
      // Failed login. Redirect back to login page with an error message.
      // This uses the 'error' from your authOptions pages config or a custom error.
      const errorMessage = result?.error || 'Invalid credentials. Please try again.';
      router.replace(`/auth/login?error=${encodeURIComponent(errorMessage)}`);
    }
  };

  function setErrorMessage(arg0: null): void {
    throw new Error('Function not implemented.');
  }

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
          closable
          onClose={() => setErrorMessage(null)}
        />
      )}

      <Form
        form={form}
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
      {/* Suspense is required to use useSearchParams() in the component above,
          but since we removed useSearchParams, it's technically not strictly needed here
          if LoginForm itself handles all internal state. However, it doesn't hurt. */}
      <Suspense fallback={<Spin size="large" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}