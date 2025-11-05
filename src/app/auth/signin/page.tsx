// This file is largely redundant if `/auth/login` is your primary sign-in page.
// NextAuth's `pages.signIn` configuration points to `/auth/login`.
// Keeping it for completeness but recommending consolidation.

'use client';
import { Form, Input, Button, Card, Typography, Space, notification } from 'antd';
import { MailOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

const { Title, Text } = Typography;

export default function SignInPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const error = searchParams.get('error');

    useEffect(() => {
        if (error) {
            let errorMessage = "An unknown login error occurred.";
            if (error === "CredentialsSignin") {
                errorMessage = "Invalid email or password. Please try again.";
            } else if (error.includes("Could not reach backend API")) {
                errorMessage = "Network Error: Could not connect to the server (port 3001).";
            } else {
                errorMessage = decodeURIComponent(error); // Decode the error message
            }
            notification.error({
                message: "Login Failed",
                description: errorMessage,
                duration: 5,
            });
        }
    }, [error]);

    const onFinish = async (values: any) => {
        const result = await signIn('credentials', {
            redirect: false,
            email: values.email,
            password: values.password,
        });

        if (result?.error) {
            router.push(`/auth/login?error=${encodeURIComponent(result.error)}`); // Redirect to /auth/login
        } else {
            router.push('/'); // Redirect to root, middleware handles dashboard
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
            <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <Title level={3}>Internship Platform Login</Title>
                    <Text type="secondary">Sign in with your credentials.</Text>
                </div>
                <Form
                    name="login_form"
                    initialValues={{ remember: true }}
                    onFinish={onFinish}
                    layout="vertical"
                >
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[{ required: true, message: 'Please input your Email!' }, { type: 'email' }]}
                    >
                        <Input prefix={<MailOutlined />} placeholder="hr@company.com" />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        label="Password"
                        rules={[{ required: true, message: 'Please input your Password!' }]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="password123" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" block icon={<LoginOutlined />}>
                            Log in
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
}