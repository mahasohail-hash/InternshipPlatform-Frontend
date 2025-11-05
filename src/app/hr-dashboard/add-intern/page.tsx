'use client';
import React from 'react';
import { Form, Input, Button, Select, notification } from 'antd';
import api from '../../../lib/api';
import { UserRole } from '../../../common/enums/user-role.enum'; // Corrected path
import { AxiosError } from 'axios';
import MainLayout from '../../components/MainLayout'; // Import MainLayout

const { Option } = Select;

interface ApiErrorResponse {
  statusCode: number;
  message: string | string[]; // Can be string or array of strings
  error?: string;
}

function isApiErrorResponse(data: unknown): data is ApiErrorResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    (typeof (data as ApiErrorResponse).message === 'string' || Array.isArray((data as ApiErrorResponse).message))
  );
}

interface AddInternFormValues {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export default function AddInternPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (values: AddInternFormValues) => {
    setLoading(true);
    try {
      const payload = {
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        role: UserRole.INTERN, // Explicitly set role
      };

      await api.post('/users/intern', payload); // CRITICAL FIX: Correct endpoint
      notification.success({
        message: 'Intern Added',
        description: `${values.firstName} ${values.lastName} (${values.email}) has been added as an intern and their checklist created.`,
      });
      form.resetFields();
    } catch (error: unknown) {
      console.error('Failed to add intern:', error);

      let errorMessage = 'An unexpected error occurred.';

      if (error instanceof AxiosError && error.response && isApiErrorResponse(error.response.data)) {
        errorMessage = Array.isArray(error.response.data.message)
            ? error.response.data.message.join('; ')
            : error.response.data.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error instanceof AxiosError) {
        errorMessage = error.message;
      }

      notification.error({
        message: 'Failed to Add Intern',
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout> {/* Wrap with MainLayout */}
        <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px' }}>
            <h1>Add New Intern</h1>
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={{ role: UserRole.INTERN }}
            >
                <Form.Item
                    label="Email"
                    name="email"
                    rules={[{ required: true, message: 'Please enter intern email!' }, { type: 'email', message: 'Please enter a valid email!' }]}
                >
                    <Input type="email" />
                </Form.Item>
                <Form.Item
                    label="Password"
                    name="password"
                    rules={[{ required: true, message: 'Please enter a password!' }, { min: 8, message: 'Password must be at least 8 characters long!' }]}
                >
                    <Input.Password />
                </Form.Item>
                <Form.Item
                    label="First Name"
                    name="firstName"
                    rules={[{ required: true, message: 'Please enter intern first name!' }]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    label="Last Name"
                    name="lastName"
                    rules={[{ required: true, message: 'Please enter intern last name!' }]}
                >
                    <Input />
                </Form.Item>
                <Form.Item label="Role" name="role">
                    <Input value="Intern" disabled />
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading}>
                        Add Intern
                    </Button>
                </Form.Item>
            </Form>
        </div>
    </MainLayout>
  );
}