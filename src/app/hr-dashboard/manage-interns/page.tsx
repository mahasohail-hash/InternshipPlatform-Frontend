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
import { UserRole } from '../../../common/enums/user-role.enum'; // Import UserRole

const { Title, Text } = Typography;

interface InternSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  tasksTotal: number;
  tasksDone: number;
  checklistStatus: string; // e.g., 'Complete', 'In Progress', 'Not Started'
}

// --- Component 1: Add Intern Form ---
const AddInternForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    const payload = { ...values, role: UserRole.INTERN };

    try {
      await api.post('/users/intern', payload); // CRITICAL FIX: Correct endpoint
      notification.success({ message: 'Intern Onboarded', description: `${values.firstName} ${values.lastName} added and checklist automatically assigned.` });
      form.resetFields();
      onSuccess();
    } catch (error: any) {
      let errorMessage = 'An unexpected error occurred.';
      if (isAxiosError(error) && error.response) {
        errorMessage = Array.isArray(error.response.data.message)
            ? error.response.data.message.join('; ')
            : error.response.data.message || error.response.data.error || error.message;
      }
      console.error("Onboarding API Error:", error);
      notification.error({ message: 'Onboarding Failed', description: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: 600 }}>
      <Form.Item name="email" label="Email (Login)" rules={[{ required: true, message: 'Please input email!' }, { type: 'email', message: 'Please enter a valid email!' }]}>
        <Input placeholder="intern@company.com" />
      </Form.Item>
      <Form.Item name="password" label="Temp Password" rules={[{ required: true, message: 'Please input password!' }, { min: 8, message: 'Password must be at least 8 characters long!' }]}>
        <Input.Password placeholder="password123" />
      </Form.Item>
      <Form.Item name="firstName" label="First Name" rules={[{ required: true, message: 'Please input first name!' }]}>
        <Input placeholder="John" />
      </Form.Item>
      <Form.Item name="lastName" label="Last Name" rules={[{ required: true, message: 'Please input last name!' }]}>
        <Input placeholder="Doe" />
      </Form.Item>
      <Form.Item name="role" label="Role" initialValue={UserRole.INTERN}>
          <Input disabled value="Intern"/>
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" icon={<UserAddOutlined />} loading={loading}>
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
  interns: InternSummary[]; // Use the defined interface
  loading: boolean;
  handleDelete: (id: string) => Promise<void>;
  router: AppRouterInstance;
}) => {

  const columns = [
    { title: 'Name', dataIndex: 'firstName', key: 'name', render: (text: string, record: InternSummary) => <a onClick={() => router.push(`/hr-dashboard/interns/${record.id}`)}>{text} {record.lastName}</a> },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Checklist Status',
      dataIndex: 'checklistStatus',
      key: 'checklistStatus',
      render: (status: string) => (
        <Tag color={status === 'Complete' ? 'green' : (status === 'Not Started' ? 'default' : 'blue')}>{status || 'N/A'}</Tag>
      )
    },
    {
      title: 'Onboarding Progress',
      dataIndex: 'tasksDone',
      key: 'progress',
      render: (tasksDone: number, record: InternSummary) => {
        const total = record.tasksTotal || 0;
        const done = tasksDone || 0;
        const percent = total > 0 ? (done / total) * 100 : 0;
        return <Progress percent={Math.round(percent)} size="small" status={percent < 50 && total > 0 ? 'exception' : (percent === 100 ? 'success' : 'active')} />
      }
    },
    {
      title: 'Actions', key: 'action', render: (_: string, record: InternSummary) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => router.push(`/hr-dashboard/interns/${record.id}`)} // CRITICAL FIX: Link to /hr-dashboard/interns/[id]
          />
          <Popconfirm title="Are you sure you want to delete this intern? This action cannot be undone." onConfirm={() => handleDelete(record.id)}>
            <Button icon={<DeleteOutlined />} danger size="small" />
          </Popconfirm>
        </Space>
      )
    },
  ];

  return <Table columns={columns} dataSource={interns} loading={loading} rowKey="id" pagination={{ pageSize: 10 }} />;
};

// --- Main Page Component ---
export default function ManageInternsPage() {
  const router = useRouter();
  const [interns, setInterns] = useState<InternSummary[]>([]); // Use the defined interface
  const [loading, setLoading] = useState(false);
  const { status } = useSession();

  // Function to fetch the list of interns
  const fetchInterns = async () => {
    setLoading(true);
    try {
        const internsRes = await api.get('/users/interns'); // CRITICAL FIX: Correct endpoint for HR to get intern summaries
        setInterns(internsRes.data);

    } catch (error) {
        console.error("Failed to fetch interns:", error);
        notification.error({
            message: 'Loading Failed',
            description: isAxiosError(error) ? (error.response?.data?.message || error.message) : 'Could not retrieve intern list.',
        });
        setInterns([]);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
       fetchInterns();
    }
  }, [status]); // Only depend on status, fetchInterns is stable via useCallback if it were.

  // Function to handle deleting an intern
  const handleDelete = async (internId: string) => {
    try {
      await api.delete(`/users/${internId}`); // CRITICAL FIX: Correct endpoint
      notification.success({ message: 'Intern deleted successfully.' });
      fetchInterns(); // Refresh the list
    } catch (error) {
      let errorMessage = 'Deletion Failed.';
      if (isAxiosError(error) && error.response) {
        errorMessage = Array.isArray(error.response.data.message)
            ? error.response.data.message.join('; ')
            : error.response.data.message || error.response.data.error || error.message;
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
          <p>This table gives you a real-time status of all interns in the program, including their onboarding checklist progress.</p>
          <InternOverviewTable
            interns={interns}
            loading={loading}
            handleDelete={handleDelete}
            router={router}
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
            onClick={() => router.push('/hr-dashboard/checklist-templates')}
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
      <Tabs defaultActiveKey="1" items={tabItems} style={{ marginTop: 20 }} />
    </MainLayout>
  );
}