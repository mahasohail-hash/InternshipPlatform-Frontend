// src/app/hr-dashboard/add-intern/page.tsx
"use client";
import { CreateInternChecklistPayload } from '../../../types/internship'; 
import React from 'react';
import { Form, Input, Button, Select, notification } from 'antd';
import api from '../../../lib/api'; // Corrected path based on previous discussions
import { UserRole } from '../../../common/enums/user-role.enum'; // Corrected path based on previous discussions
import { AxiosError } from 'axios'; // Import AxiosError for type checking
import { UpdateInternChecklistItemPayload } from '../../../types/internship'; 
const { Option } = Select;


// --- Interfaces and Type Guards for Robust Error Handling ---

// Define the expected structure of your API error response data
interface ApiErrorResponse {
  statusCode: number;
  message: string;
  error?: string; // Optional field, adjust if always present
}



// Type guard to check if an object matches the ApiErrorResponse structure
function isApiErrorResponse(data: unknown): data is ApiErrorResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as ApiErrorResponse).message === 'string'
  );
}

// Type guard to check if an error is an AxiosError
// AND specifically has a DEFINED response with data that contains a message
function isAxiosErrorWithApiData(error: unknown): error is AxiosError<ApiErrorResponse> {
  // 1. Check if it's an instance of AxiosError
  if (!(error instanceof AxiosError)) {
    return false;
  }

  // 2. Explicitly check if error.response exists
  //    This is crucial for TypeScript to understand `error.response` is defined.
  if (!error.response) {
    return false;
  }

  // 3. Check if error.response.data exists AND matches our ApiErrorResponse interface
  //    At this point, TypeScript knows `error.response` is defined.
  if (!isApiErrorResponse(error.response.data)) {
    return false;
  }

  // If all checks pass, it's an AxiosError with API data
  return true;
}

// --- Component Specific Interfaces ---

interface AddInternFormValues {
  email: string;
  password: string;
  // You might add defaultTemplateId here if HR selects it, but currently handled internally
}

// --- Main Component ---

export default function AddInternPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (values: AddInternFormValues) => {
    setLoading(true);
    try {
      // In a real app, you'd likely fetch available templates
      // For now, use a placeholder or assume a default is chosen by backend
      const defaultTemplateId = 'YOUR_DEFAULT_INTERN_ONBOARDING_TEMPLATE_ID'; // Ensure this matches a real ID

      if (!defaultTemplateId || defaultTemplateId === 'YOUR_DEFAULT_INTERN_ONBOARDING_TEMPLATE_ID') {
          notification.error({
              message: 'Configuration Error',
              description: 'Default intern onboarding template ID is not configured.',
          });
          setLoading(false);
          return;
      }

      const payload = {
        email: values.email,
        password: values.password,
        role: UserRole.INTERN, // Explicitly set role
        // templateId: defaultTemplateId, // Backend handles this automatically based on HR endpoint
      };

      await api.post('/users/intern', payload); // Call the new HR-specific endpoint
      notification.success({
        message: 'Intern Added',
        description: `${values.email} has been added as an intern and their checklist created.`,
      });
      form.resetFields();
    } catch (error: unknown) {
      console.error('Failed to add intern:', error); // Log the full error for debugging

      let errorMessage = 'An unexpected error occurred.';

      // Use the robust type guard to safely extract the API error message
         if (error instanceof AxiosError && error.response && isApiErrorResponse(error.response.data)) {
        // At this point, TypeScript knows `error.response` is defined
        // and `error.response.data` is of type `ApiErrorResponse`
        errorMessage = error.response.data.message;
      } else if (error instanceof Error) {
        // Handle standard JavaScript Errors (e.g., programming errors, DOM errors)
        errorMessage = error.message;
      } else if (error instanceof AxiosError) {
        // Handle Axios errors that DO NOT have a `response` (e.g., network errors, timeouts)
        // or whose `response.data` does not conform to `ApiErrorResponse`
        errorMessage = error.message;
      }
      // For any other unexpected types of errors, the default 'An unexpected error occurred.' will be used

      notification.error({
        message: 'Failed to Add Intern',
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
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
          rules={[{ required: true, message: 'Please enter intern email!' }]}
        >
          <Input type="email" />
        </Form.Item>
        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: 'Please enter a password!' }]}
        >
          <Input.Password />
        </Form.Item>
        {/* The role is hardcoded as INTERN for this HR endpoint, no need for selection */}
        {/* If you wanted to include it for visual clarity without allowing change: */}
        {/* <Form.Item label="Role" name="role">
            <Input value="Intern" disabled />
        </Form.Item> */}
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Add Intern
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}