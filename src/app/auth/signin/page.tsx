// This file is largely redundant if `/auth/login` is your primary sign-in page.
// NextAuth's `pages.signIn` configuration points to `/auth/login`.
// Keeping it for completeness but recommending consolidation.

'use client';
import { Form, Input, Button, Card, Typography, Space, notification, Alert } from 'antd';
import { MailOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const { Title, Text } = Typography;

export default function SignInPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const urlError = searchParams.get('error');
    const [form] = Form.useForm();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (urlError) {
            let errorMsg = "An unknown login error occurred.";
            if (urlError === "CredentialsSignin") {
                errorMsg = "Invalid email or password. Please try again.";
            } else if (urlError.includes("Could not reach backend API")) {
                errorMsg = "Network Error: Could not connect to the server (port 3001).";
            } else {
                errorMsg = decodeURIComponent(urlError);
            }
            setErrorMessage(errorMsg);
            notification.error({
                message: "Login Failed",
                description: errorMsg,
                duration: 5,
            });
        }
    }, [urlError]);

    const onFinish = async (values: any) => {
        setErrorMessage(null); // Clear any previous errors
        
        const result = await signIn('credentials', {
            redirect: false,
            email: values.email,
            password: values.password,
        });

        if (result?.error) {
            // Show error inline without redirecting
            const error = result.error || 'Invalid credentials. Please try again.';
            setErrorMessage(error);
            form.setFieldsValue({ password: '' }); // Clear password field
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
                
                {/* Show inline error message */}
                {errorMessage && (
                    <Alert
                        message="Login Failed"
                        description={errorMessage}
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