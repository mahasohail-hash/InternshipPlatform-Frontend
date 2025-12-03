"use client";
import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Select, notification, Spin, Alert, Typography } from 'antd';
import api from '../../../lib/api';
import { UserRole } from '../../../common/enums/user-role.enum';
import { AxiosError } from 'axios';
import MainLayout from '../../components/MainLayout';

const { Option } = Select;
const { Paragraph } = Typography;

interface ChecklistTemplate {
id: string;
name: string;
description?: string;
}

interface ApiErrorResponse {
statusCode: number;
message: string | string[];
error?: string;
}

interface AddInternFormValues {
email: string;
password: string;
firstName: string;
lastName: string;
templateId: string;
}

// Type guard for API error responses
function isApiErrorResponse(data: unknown): data is ApiErrorResponse {
return (
typeof data === 'object' &&
data !== null &&
(typeof (data as ApiErrorResponse).message === 'string' ||
Array.isArray((data as ApiErrorResponse).message))
);
}

export default function AddInternPage() {
const [form] = Form.useForm();
const [loading, setLoading] = useState(false);
const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
const [isFetchingTemplates, setIsFetchingTemplates] = useState(true);
const [fetchTemplatesError, setFetchTemplatesError] = useState<string | null>(null);
const [selectedTemplate, setSelectedTemplate] = useState<ChecklistTemplate | null>(null);

// Fetch checklist templates
useEffect(() => {
const fetchTemplates = async () => {
setIsFetchingTemplates(true);
try {
const response = await api.get<ChecklistTemplate[]>('/checklists/templates');
setTemplates(response.data || []);
} catch (error: unknown) {
console.error('Failed to fetch templates:', error);
let errorMessage = 'Failed to load onboarding templates.';
if (error instanceof AxiosError && error.response) {
errorMessage = error.response.data?.message || error.message;
} else if (error instanceof Error) {
errorMessage = error.message;
}
setFetchTemplatesError(errorMessage);
notification.error({
message: 'Failed to Load Templates',
description: errorMessage,
});
} finally {
setIsFetchingTemplates(false);
}
};


fetchTemplates();


}, []);

// Handle form submission
const handleSubmit = async (values: AddInternFormValues) => {
setLoading(true);
try {
const payload = {
email: values.email,
password: values.password,
firstName: values.firstName,
lastName: values.lastName,
role: UserRole.INTERN,
templateId: values.templateId,
};


  await api.post('/users/intern', payload);

 const templateAssigned = templates.find(t => t.id === values.templateId);
notification.success({
  message: 'Intern Added Successfully',
  description: (
    <div>
      <p>{values.firstName} {values.lastName} ({values.email}) has been added as an intern.</p>
      {templateAssigned && <p>Onboarding checklist <strong>"{templateAssigned.name}"</strong> has been assigned.</p>}
    </div>
  ),
  duration: 5,
});


  form.resetFields();
  setSelectedTemplate(null);
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

if (isFetchingTemplates) {
return ( <MainLayout>
<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}> <Spin size="large" tip="Loading templates..." /> </div> </MainLayout>
);
}

return ( <MainLayout>
<div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px' }}> <h1>Add New Intern</h1>

    {fetchTemplatesError && (
      <Alert
        message="Error Loading Templates"
        description={fetchTemplatesError}
        type="error"
        showIcon
        style={{ marginBottom: 20 }}
      />
    )}

    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{ role: UserRole.INTERN }}
    >
      <Form.Item
        label="Email"
        name="email"
        rules={[
          { required: true, message: 'Please enter intern email!' },
          { type: 'email', message: 'Please enter a valid email!' },
        ]}
      >
        <Input placeholder="e.g., jane.doe@company.com" />
      </Form.Item>

      <Form.Item
        label="Password"
        name="password"
        rules={[
          { required: true, message: 'Please enter a password!' },
          { min: 8, message: 'Password must be at least 8 characters long!' },
        ]}
      >
        <Input.Password placeholder="Set a temporary password" />
      </Form.Item>

      <Form.Item
        label="First Name"
        name="firstName"
        rules={[{ required: true, message: 'Please enter intern first name!' }]}
      >
        <Input placeholder="e.g., Jane" />
      </Form.Item>

      <Form.Item
        label="Last Name"
        name="lastName"
        rules={[{ required: true, message: 'Please enter intern last name!' }]}
      >
        <Input placeholder="e.g., Doe" />
      </Form.Item>

      <Form.Item label="Role" name="role">
        <Input value="Intern" disabled />
      </Form.Item>

      <Form.Item
        label="Onboarding Checklist Template"
        name="templateId"
        rules={[{ required: true, message: 'Please select a template!' }]}
      >
        {templates.length === 0 ? (
          <Alert
            message="No Templates Available"
            description="Please create an onboarding template first."
            type="warning"
            showIcon
          />
        ) : (
       <Select
  placeholder="Select onboarding checklist template"
  onChange={(value: string) => {
    const template = templates.find(t => t.id === value) || null;
    setSelectedTemplate(template);
  }}
>
  {templates.map(template => (
    <Option key={template.id} value={template.id}>{template.name}</Option>
  ))}
</Select>


        )}
      </Form.Item>

      {/* Live template description preview */}
     {selectedTemplate?.description && (
  <Paragraph style={{ background: '#f5f5f5', padding: 10, borderRadius: 5 }}>
    <strong>Template Description:</strong> {selectedTemplate.description}
  </Paragraph>
)}


      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          disabled={templates.length === 0}
        >
          Add Intern
        </Button>
      </Form.Item>
    </Form>
  </div>
</MainLayout>


);
}
