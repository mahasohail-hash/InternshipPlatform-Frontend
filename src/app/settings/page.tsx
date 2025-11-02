'use client';

import React from 'react';
import MainLayout from '../components/MainLayout'; // Adjust path if needed
import { Typography, Card, Form, Input, Button, notification, Spin, Row, Col } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, SaveOutlined } from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import api from '../../lib/api'; // Import your configured API client
import { isAxiosError } from 'axios'; // Import isAxiosError

const { Title, Text } = Typography;

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [isPasswordSubmitting, setIsPasswordSubmitting] = React.useState(false); // Loading state

  // Placeholder for profile update
  const handleUpdateProfile = async (values: any) => {
    notification.info({ message: 'Update Profile Clicked (Not Implemented)', description: JSON.stringify(values) });
  };

  // --- UPDATED: Calls the backend API ---
  const handleChangePassword = async (values: any) => {
    if (values.newPassword !== values.confirmPassword) {
      notification.error({ message: 'New passwords do not match!' });
      return;
    }
    setIsPasswordSubmitting(true);
    try {
      // Calls PATCH /api/users/me/password
      await api.patch('/users/me/password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        // confirmPassword is only needed for frontend validation, not usually sent
      });
      notification.success({ message: 'Password changed successfully!' });
      passwordForm.resetFields(); // Clear form
    } catch (error) {
      console.error("Change Password Error:", error);
      let msg = 'Failed to change password.';
      if (isAxiosError(error) && error.response) {
        msg = error.response.data.message || 'Check server logs.';
      }
      notification.error({ message: 'Error Changing Password', description: msg });
    } finally {
      setIsPasswordSubmitting(false);
    }
  };
  // --- END UPDATE ---

  // Set initial profile form values
  React.useEffect(() => {
    if (session?.user) {
      profileForm.setFieldsValue({
        name: session.user.name,
        email: session.user.email,
      });
    }
  }, [session, profileForm]);

  if (status === 'loading') {
    return <MainLayout><div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div></MainLayout>;
  }

  if (!session) {
     return <MainLayout><p>Please log in to view settings.</p></MainLayout>;
  }

  return (
    <MainLayout>
      <Title level={2}>Settings</Title>
      <Text type="secondary">Manage your profile information and account settings.</Text>

      <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
         {/* Profile Information Card */}
         <Col xs={24} md={12}>
            <Card title="Profile Information">
                 <Form form={profileForm} layout="vertical" onFinish={handleUpdateProfile}>
                    <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                        <Input prefix={<UserOutlined />} placeholder="Full Name" />
                    </Form.Item>
                    <Form.Item name="email" label="Email Address" rules={[{ required: true, type: 'email' }]}>
                        <Input prefix={<MailOutlined />} placeholder="Email" disabled />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} disabled>
                            Save Profile (Not Implemented)
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
         </Col>

         {/* Change Password Card */}
         <Col xs={24} md={12}>
            <Card title="Change Password">
                 <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword}>
                    <Form.Item
                        name="currentPassword"
                        label="Current Password"
                        rules={[{ required: true, message: 'Please input your current password!' }]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Current Password" />
                    </Form.Item>
                    <Form.Item
                        name="newPassword"
                        label="New Password"
                        rules={[
                            { required: true, message: 'Please input your new password!' },
                            { min: 8, message: 'Password must be at least 8 characters long!' }
                        ]}
                        hasFeedback
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="New Password" />
                    </Form.Item>
                    <Form.Item
                        name="confirmPassword"
                        label="Confirm New Password"
                        dependencies={['newPassword']}
                        hasFeedback
                        rules={[
                            { required: true, message: 'Please confirm your new password!' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                if (!value || getFieldValue('newPassword') === value) {
                                    return Promise.resolve();
                                }
                                return Promise.reject(new Error('The two passwords that you entered do not match!'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Confirm New Password" />
                    </Form.Item>
                     <Form.Item>
                        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={isPasswordSubmitting}>
                            {isPasswordSubmitting ? 'Changing...' : 'Change Password'}
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
         </Col>
      </Row>
    </MainLayout>
  );
}

