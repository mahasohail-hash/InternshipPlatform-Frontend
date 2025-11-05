'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import { Typography, Card, Form, Input, Button, notification, Spin, Row, Col, Result } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, SaveOutlined } from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import api from '../../lib/api';
import { isAxiosError } from 'axios';

const { Title, Text } = Typography;

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [isPasswordSubmitting, setIsPasswordSubmitting] = React.useState(false);
  const [isProfileSubmitting, setIsProfileSubmitting] = React.useState(false); // Add for profile form

  const userId = session?.user?.id; // Get current user ID

  // Placeholder for profile update (requires backend endpoint)
  const handleUpdateProfile = async (values: any) => {
    // This functionality is typically not critical for MVP.
    // If implemented, it would call a PATCH /api/users/me endpoint.
    notification.info({ message: 'Update Profile Clicked', description: 'This feature is currently not implemented on the backend.' });
    // setIsProfileSubmitting(true);
    // try {
    //   await api.patch(`/users/${userId}`, {
    //     firstName: values.firstName,
    //     lastName: values.lastName,
    //     // email usually not changeable here, or needs verification
    //   });
    //   notification.success({ message: 'Profile updated successfully!' });
    //   // Refresh session if name changed
    //   // await update(); // from useSession()
    // } catch (error) {
    //   // ... handle error
    // } finally {
    //   setIsProfileSubmitting(false);
    // }
  };

  const handleChangePassword = async (values: any) => {
    if (values.newPassword !== values.confirmPassword) {
      notification.error({ message: 'New passwords do not match!' });
      return;
    }
    if (!userId) {
        notification.error({ message: 'Authentication Error', description: 'User ID not found in session.' });
        return;
    }

    setIsPasswordSubmitting(true);
    try {
      // CRITICAL FIX: Calls PATCH /api/users/me/password
      await api.patch('/users/me/password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      notification.success({ message: 'Password changed successfully!' });
      passwordForm.resetFields(); // Clear form
    } catch (error: any) {
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

  // Set initial profile form values
  useEffect(() => {
    if (session?.user) {
      profileForm.setFieldsValue({
        firstName: session.user.firstName, // Assuming firstName exists on session.user
        lastName: session.user.lastName,   // Assuming lastName exists on session.user
        email: session.user.email,
      });
    }
  }, [session, profileForm]);

  if (status === 'loading') {
    return <MainLayout><div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" tip="Loading settings..." /></div></MainLayout>;
  }

  if (!session) {
     return <MainLayout><Result status="403" title="Access Denied" subTitle="Please log in to view settings." /></MainLayout>;
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
                    <Form.Item name="firstName" label="First Name" rules={[{ required: true, message: 'First name is required!' }]}>
                        <Input prefix={<UserOutlined />} placeholder="First Name" />
                    </Form.Item>
                    <Form.Item name="lastName" label="Last Name" rules={[{ required: true, message: 'Last name is required!' }]}>
                        <Input prefix={<UserOutlined />} placeholder="Last Name" />
                    </Form.Item>
                    <Form.Item name="email" label="Email Address" rules={[{ required: true, type: 'email' }]}>
                        <Input prefix={<MailOutlined />} placeholder="Email" disabled />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} disabled={isProfileSubmitting || true}>
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