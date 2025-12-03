"use client";
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, notification, Typography, Card, Spin } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import api from '@/lib/api'; // Using your API client
import { useSession } from 'next-auth/react';
import { AxiosError } from 'axios';
import MainLayout from '../../../components/MainLayout'; // Import your layout

const { Title } = Typography;
const { TextArea } = Input;

// --- Type Definitions ---
interface ProjectFormValues {
  title: string;
  description: string;
}
// --- End Type Definitions ---

export default function DefineNewProjectPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  // --- Form Submission Handler ---
  const onFinish = useCallback(async (values: ProjectFormValues) => {
    setLoading(true);
    try {
      // Use your API client for consistent error handling and auth
      await api.post('/projects', values);

      notification.success({
        message: 'Project Created',
        description: 'Your project has been successfully created.'
      });

      router.push('/mentor/dashboard');
    } catch (error) {
      console.error('Project creation error:', error);

      let errorMessage = 'An unexpected error occurred.';

      if (error instanceof AxiosError) {
        errorMessage = error.response?.data?.message ||
                      error.message ||
                      'Failed to create project.';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      notification.error({
        message: 'Creation Failed',
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  }, [router]);

  // --- Loading State ---
  if (sessionStatus === 'loading') {
    return (
      <MainLayout>
        <Spin size="large" tip="Loading..." />
      </MainLayout>
    );
  }

  // --- Unauthorized Access ---
  if (sessionStatus !== 'authenticated') {
    return (
      <MainLayout>
        <Card>
          <Title level={3}>Access Denied</Title>
          <p>You must be logged in to create a project.</p>
        </Card>
      </MainLayout>
    );
  }

  // --- Main Render ---
  return (
    <MainLayout>
      <Card style={{ maxWidth: 800, margin: '0 auto' }}>
        <Title level={3}>Define New Project</Title>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
        >
          <Form.Item
            name="title"
            label="Project Title"
            rules={[
              { required: true, message: 'Please enter a project title' },
              { max: 100, message: 'Title must be less than 100 characters' }
            ]}
          >
            <Input
              placeholder="e.g., AI-Powered Feedback Analyzer"
              maxLength={100}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Project Description"
            rules={[
              { required: true, message: 'Please enter a description' },
              { max: 1000, message: 'Description must be less than 1000 characters' }
            ]}
          >
            <TextArea
              rows={6}
              placeholder="Describe the project goals, tech stack, and expected deliverables."
              maxLength={1000}
              showCount
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<PlusOutlined />}
              size="large"
              block
            >
              Create Project
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </MainLayout>
  );
}
