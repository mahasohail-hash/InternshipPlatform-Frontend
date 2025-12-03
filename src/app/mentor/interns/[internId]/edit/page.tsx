"use client";
import React, { useEffect, useState, useCallback } from 'react';
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
  const rawInternId = params?.internId;
  const internId = Array.isArray(rawInternId) ? rawInternId[0] : rawInternId;

  const [intern, setIntern] = useState<Intern | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [isValidUsername, setIsValidUsername] = useState<boolean | null>(null);
  const [form] = Form.useForm();

  // --- Data Fetching ---
  const fetchIntern = useCallback(async () => {
    if (!internId) {
      notification.error({ message: 'Intern ID missing' });
      router.push('/mentor');
      return;
    }

    setLoading(true);
    try {
      const res = await api.get<Intern>(`/users/interns/${internId}`);
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
  }, [internId, form, router]);

  // --- GitHub Username Verification ---
  const verifyGitHubUsername = useCallback(async (username: string) => {
    if (!username) {
      setIsValidUsername(null);
      return;
    }

    setVerifying(true);
    try {
      const res = await api.post<{ valid: boolean }>('/github/verify-username', { username });
      setIsValidUsername(res.data.valid);

      if (!res.data.valid) {
        notification.warning({
          message: 'Invalid GitHub Username',
          description: 'This GitHub username does not exist or is invalid.',
        });
      } else {
        notification.success({
          message: 'GitHub Username Verified',
          description: 'This GitHub username is valid.',
        });
      }
    } catch (err: any) {
      setIsValidUsername(false);
      notification.error({
        message: 'Verification Failed',
        description: err.response?.data?.message || 'Could not verify GitHub username',
      });
    } finally {
      setVerifying(false);
    }
  }, []);

  // --- Form Submission ---
  const handleSubmit = useCallback(async (values: { github_username: string }) => {
    try {
      await api.patch(`/users/interns/${internId}`, values);
      notification.success({
        message: 'GitHub username updated successfully!',
        description: `Username ${values.github_username} has been set.`,
      });
      router.push(`/mentor/interns/${internId}/github`);
    } catch (err: any) {
      notification.error({
        message: 'Failed to update GitHub username',
        description: err.response?.data?.message || 'Please try again',
      });
    }
  }, [internId, router]);

  // --- Effects ---
  useEffect(() => {
    fetchIntern();
  }, [fetchIntern]);

  // --- Render ---
  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin size="large" tip="Loading intern data..." />
      </div>
    );
  }

  if (!intern) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          message="Intern not found"
          description="The requested intern does not exist."
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Edit Intern: {intern.firstName} {intern.lastName}</Title>

      <Card style={{ maxWidth: 600 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="github_username"
            label="GitHub Username"
            rules={[
              { required: true, message: 'Please input the GitHub username!' },
              {
                validator: async (_, value) => {
                  if (value && isValidUsername === false) {
                    throw new Error('This GitHub username is invalid');
                  }
                },
              },
            ]}
            help={isValidUsername === false ? "This GitHub username doesn't exist" : ""}
            validateStatus={isValidUsername === false ? "error" : ""}
          >
            <Input
              placeholder="e.g., octocat"
              onBlur={(e) => verifyGitHubUsername(e.target.value)}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={verifying}
              disabled={isValidUsername === false}
            >
              Save Changes
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
