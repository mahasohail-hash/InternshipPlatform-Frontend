// app/auth/signin/page.tsx
'use client';
import { Form, Input, Button, Card, Typography, Space, notification } from 'antd';
import { MailOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { signIn } from 'next-auth/react'; // CRITICAL: Import the signIn function
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

const { Title, Text } = Typography;

export default function SignInPage() {
    const router = useRouter();
    const searchParams = useSearchParams(); // Used to check for authentication errors
    const error = searchParams.get('error');

    // Display a notification if an authentication error occurs
    useEffect(() => {
        if (error) {
            // Map common NextAuth error names to user-friendly messages
            let errorMessage = "An unknown login error occurred.";
            if (error === "CredentialsSignin") {
                errorMessage = "Invalid email or password. Please try again.";
            } else if (error.includes("Could not reach backend API")) {
                errorMessage = "Network Error: Could not connect to the server (port 3001).";
            } else {
                errorMessage = error; // Use the specific error message thrown from the backend
            }
            notification.error({
                message: "Login Failed",
                description: errorMessage,
                duration: 5,
            });
        }
    }, [error]);

    const onFinish = async (values: any) => {
        // 1. Call the NextAuth signIn function
        const result = await signIn('credentials', {
            redirect: false, // Prevents automatic redirect on success/failure
            email: values.email, // Pass form values directly to NextAuth credentials
            password: values.password,
        });

        // 2. Handle the result (redirect to dashboard or display error)
        if (result?.error) {
            // Redirect with the error parameter to trigger the useEffect notification above
            router.push(`/auth/signin?error=${result.error}`);
        } else {
            // SUCCESS: Redirect to the main HR dashboard page
            router.push('/hr-dashboard'); 
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
                    onFinish={onFinish} // CRITICAL: onFinish calls our async logic
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