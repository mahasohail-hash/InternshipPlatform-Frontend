'use client';
import MainLayout from '../../components/MainLayout';
import { Typography, Tabs, Space, Table, Form, Input, Button, notification, Progress, Popconfirm, Tag } from 'antd';
import { UserAddOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { useSession } from 'next-auth/react';
import { isAxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import type { TabsProps } from 'antd';

const { Title, Text } = Typography;

// --- Component 1: Add Intern Form ---
const AddInternForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [form] = Form.useForm();
  const { data: session } = useSession();

  const onFinish = async (values: any) => {
    try {
        // Fetching interns list before submission (if intended, though usually unnecessary here)
       // const internsRes = await api.get('/api/users/interns'); 
        
        const payload = { ...values, role: 'INTERN' };
        
        await api.post('/api/users/intern', payload); 
        
        notification.success({ message: 'Intern Onboarded', description: `Checklist automatically assigned.` });
        form.resetFields();
        onSuccess(); // Refresh the intern list
        
    } catch (error: any) {
        let errorMessage = 'An unexpected error occurred.';
        
        // Assuming isAxiosError is imported or defined elsewhere
        if (isAxiosError(error) && error.response) {
            if (error.response.status === 401) {
                errorMessage = 'Unauthorized: Please log out and back in.';
            } else {
                errorMessage = error.response.data.message || error.response.data.error || error.message;
            }
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }
        
        notification.error({ message: 'Onboarding Failed', description: errorMessage });
    }
};

  return (
    <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: 600 }}>
      <Form.Item name="email" label="Email (Login)" rules={[{ required: true }, { type: 'email' }]}>
        <Input />
      </Form.Item>
      <Form.Item name="password" label="Temp Password" rules={[{ required: true }, { min: 8 }]}>
        <Input.Password />
      </Form.Item>
      <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" icon={<UserAddOutlined />}>
          Create Intern & Assign Checklist
        </Button>
      </Form.Item>
    </Form>
  );
};

// --- Component 2: Intern Overview Table ---
const InternOverviewTable = ({
  interns,
  loading,
  handleDelete,
  router
}: {
  interns: any[];
  loading: boolean;
  handleDelete: (id: string) => Promise<void>;
  router: AppRouterInstance;
}) => {

  const columns = [
    { title: 'Name', dataIndex: 'firstName', key: 'name', render: (text: string, record: any) => <a>{text} {record.lastName}</a> },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Checklist',
      dataIndex: 'status', // Backend sends checklist status as 'status'
      key: 'checklist',
      render: (status: string) => (
        <Tag color={status === 'Complete' ? 'green' : 'blue'}>{status || 'N/A'}</Tag>
      )
    },
    {
      title: 'Onboarding Progress',
      dataIndex: 'tasksDone', // Backend sends done count
      key: 'progress',
      render: (tasksDone: number, record: any) => {
        const total = record.tasksTotal || 0; // Backend sends total count
        const done = tasksDone || 0;
        const percent = total > 0 ? (done / total) * 100 : 0;
        return <Progress percent={Math.round(percent)} size="small" status={percent < 50 ? 'exception' : 'active'} />
      }
    },
    // { title: 'Evals Done', dataIndex: 'evalsTotal', key: 'evalsTotal' }, // Commented out - Backend doesn't send this
    {
      title: 'Actions', key: 'action', render: (_: string, record: any) => (
        <Space>
          {/* Correctly navigates to the profile page */}
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => router.push(`/hr-dashboard/manage-interns/${record.id}`)} // This path MUST match your file structure
          />
          <Popconfirm title="Are you sure?" onConfirm={() => handleDelete(record.id)}>
            <Button icon={<DeleteOutlined />} danger size="small" />
          </Popconfirm>
        </Space>
      )
    },
  ];

  return <Table columns={columns} dataSource={interns} loading={loading} rowKey="id" />;
};

// --- Main Page Component ---
export default function ManageInternsPage() {
  const router = useRouter(); // Get router instance
  const [interns, setInterns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
const { data: session, status } = useSession();
  // Function to fetch the list of interns
  const fetchInterns = async () => {
    setLoading(true);
    try {
        const internsRes = await api.get('/api/users/interns'); 
        setInterns(internsRes.data);
        
        
        
    } catch (error) {
        console.error("Failed to fetch interns:", error); // Log the actual error
        
        notification.error({
            message: 'Loading Failed: Authorization Error',
            description: 'Your session might be invalid. Please log out, clear cache, and log back in.',
        });
        
        
        setInterns([]); 
        
    } finally {
        setLoading(false);
    }
};

useEffect(() => {
    
    // Only run fetchInterns if the status is 'authenticated'.
    if (status === 'authenticated') {
       fetchInterns();
    } else if (status === 'unauthenticated' && !loading) {
       // Optionally redirect user to login
       // signIn();
    }
  }, [status]); 



  // Function to handle deleting an intern
  const handleDelete = async (internId: string) => {
    try {
      await api.delete(`/api/users/${internId}`);
      notification.success({ message: 'Intern deleted successfully.' });
      fetchInterns(); // Refresh the list
    } catch (error) {
      let errorMessage = 'Deletion Failed.';
      if (isAxiosError(error) && error.response) {
        errorMessage = `Error: ${error.response.data.message || 'Server Error'}`;
        // Add specific hint for constraint errors
        if (error.response.status === 500 && (error.response.data.message?.includes('constraint') || error.response.data.error?.includes('constraint'))) {
          errorMessage += ' Cannot delete. Intern might be assigned to projects or have evaluations. Remove assignments first.';
        }
      }
      notification.error({ message: 'Deletion Failed', description: errorMessage });
    }
  };

  // Define tab items using the recommended 'items' prop structure
  const tabItems: TabsProps['items'] = [
    {
      key: '1',
      label: 'Intern Overview & Reports',
      children: (
        <>
          <p>This table gives you a real-time status of all interns in the program.</p>
          <InternOverviewTable
            interns={interns}
            loading={loading}
            handleDelete={handleDelete}
            router={router} // Pass router down
          />
        </>
      ),
    },
    {
      key: '2',
      label: 'Onboard New Intern',
      children: (
        <>
          <Title level={4}>Create Account and Automatically Assign Onboarding Checklist</Title>
          <AddInternForm onSuccess={fetchInterns} />
        </>
      ),
    },
    {
      key: '3',
      label: 'Manage Checklist Templates',
      children: (
        <>
          <p>Define the reusable blueprints for all intern onboarding processes.</p>
          <Button
            type="default"
            onClick={() => router.push('/hr-dashboard/checklist-templates')} // Navigate to template editor
          >
            Go to Template Editor
          </Button>
        </>
      ),
    },
  ];

  return (
    <MainLayout>
      <Title level={2}>Manage Internship Cohort</Title>
      {/* Use the items prop for Tabs */}
      <Tabs defaultActiveKey="1" items={tabItems} style={{ marginTop: 20 }} />
    </MainLayout>
  );
}

