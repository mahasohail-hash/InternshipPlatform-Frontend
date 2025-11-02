'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, message, Typography, Card } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { TextArea } = Input;

export default function DefineNewProjectPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onFinish = async (values: { title: string; description: string }) => {
    setLoading(true);
    try {
      // Assumes you have a way to handle auth (e.g., a custom fetch wrapper)
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': 'Bearer YOUR_JWT_TOKEN'
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('Failed to create project');
      }

      message.success('Project created successfully!');
      router.push('/mentor/dashboard'); // Redirect to mentor dashboard
    } catch (error) {
      console.error(error);
      message.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
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
          rules={[{ required: true, message: 'Please enter a project title' }]}
        >
          <Input placeholder="e.g., AI-Powered Feedback Analyzer" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Project Description"
          rules={[{ required: true, message: 'Please enter a description' }]}
        >
          <TextArea
            rows={6}
            placeholder="Describe the project goals, tech stack, and expected deliverables."
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            icon={<PlusOutlined />}
          >
            Create Project
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}