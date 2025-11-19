// src/app/mentor/interns/[internId]/edit/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, Form, Input, Button, Spin, notification, Typography, Alert } from 'antd';
import api from '../../../../../lib/api';

const { Title, Text } = Typography;

interface Intern {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  github_username?: string;
}

export default function EditInternPage() {
  const params = useParams();
  const router = useRouter();
  const raw = params?.internId;
  const internId = Array.isArray(raw) ? raw[0] : raw;
  const [intern, setIntern] = useState<Intern | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [isValidUsername, setIsValidUsername] = useState<boolean | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (!internId) {
      notification.error({ message: 'Intern ID missing' });
      router.push('/mentor');
      return;
    }
    const fetchIntern = async () => {
      try {
        const res = await api.get(`/users/interns/${internId}`);
        setIntern(res.data);
        form.setFieldsValue({
          github_username: res.data.github_username || '',
        });
      } catch (err: any) {
        notification.error({
          message: 'Failed to load intern data',
          description: err.response?.data?.message || 'Intern not found',
        });
        router.push('/mentor');
      } finally {
        setLoading(false);
      }
    };
    fetchIntern();
  }, [internId, form, router]);

  const verifyGitHubUsername = async (username: string) => {
    if (!username) {
      setIsValidUsername(null);
      return;
    }

    setVerifying(true);
    try {
      const res = await api.post(`/github/verify-username`, { username });
      setIsValidUsername(res.data.valid);
      if (!res.data.valid) {
        notification.warning({
          message: 'Invalid GitHub Username',
          description: 'This GitHub username does not exist or is invalid.'
        });
      } else {
        notification.success({
          message: 'GitHub Username Verified',
          description: 'This GitHub username is valid.'
        });
      }
    } catch (err: any) {
      setIsValidUsername(false);
      notification.error({
        message: 'Verification Failed',
        description: err.response?.data?.message || 'Could not verify GitHub username'
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (values: { github_username: string }) => {
    try {
      const res = await api.patch(`/users/interns/${internId}`, values);
      notification.success({
        message: 'GitHub username updated successfully!',
        description: `Username ${values.github_username} has been set.`
      });

      // Redirect to GitHub page after successful update
      router.push(`/mentor/interns/${internId}/github`);
    } catch (err: any) {
      notification.error({
        message: 'Failed to update GitHub username',
        description: err.response?.data?.message || 'Please try again',
      });
    }
  };

  if (loading) return <Spin size="large" tip="Loading intern data..." />;
  if (!intern) return <Text>Intern not found.</Text>;

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Edit Intern: {intern.firstName} {intern.lastName}</Title>
      <Card style={{ maxWidth: 600 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="github_username"
            label="GitHub Username"
            rules={[{ required: true, message: 'Please input the GitHub username!' }]}
            help={isValidUsername === false ? "This GitHub username doesn't exist" : ""}
            validateStatus={isValidUsername === false ? "error" : ""}
          >
            <Input
              placeholder="e.g., octocat"
              onBlur={(e) => verifyGitHubUsername(e.target.value)}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={verifying}>
              Save Changes
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
