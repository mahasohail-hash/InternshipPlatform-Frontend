"use client";
import MainLayout from '../../components/MainLayout';
import {
  Typography,
  Tabs,
  Space,
  Table,
  Form,
  Input,
  Button,
  notification,
  Progress,
  Popconfirm,
  Tag,
  Select,
  Spin,
  Alert
} from 'antd';
import {
  UserAddOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { useState, useEffect, useCallback } from 'react';
import api from '../../../lib/api';
import { useSession } from 'next-auth/react';
import { isAxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import { UserRole } from '../../../common/enums/user-role.enum';

const { Title, Text } = Typography;
const { Option } = Select;

interface InternSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  tasksTotal: number;
  tasksDone: number;
  checklistStatus: 'Complete' | 'In Progress' | 'Not Started';
}

// --- Add Intern Form ---
const AddInternForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        role: UserRole.INTERN
      };
      await api.post('/users/intern', payload);
      notification.success({
        message: 'Intern Onboarded',
        description: `${values.firstName} ${values.lastName} added and checklist automatically assigned.`
      });
      form.resetFields();
      onSuccess();
    } catch (error: any) {
      let errorMessage = 'An unexpected error occurred.';
      if (isAxiosError(error) && error.response) {
        errorMessage = Array.isArray(error.response.data.message)
          ? error.response.data.message.join('; ')
          : error.response.data.message || error.response.data.error || error.message;
      }
      notification.error({
        message: 'Onboarding Failed',
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: 600 }}>
      <Form.Item
        name="email"
        label="Email (Login)"
        rules={[
          { required: true, message: 'Please input email!' },
          { type: 'email', message: 'Please enter a valid email!' }
        ]}
      >
        <Input placeholder="intern@company.com" />
      </Form.Item>

      <Form.Item
        name="password"
        label="Temp Password"
        rules={[
          { required: true, message: 'Please input password!' },
          { min: 8, message: 'Password must be at least 8 characters long!' }
        ]}
      >
        <Input.Password placeholder="password123" />
      </Form.Item>

      <Form.Item
        name="firstName"
        label="First Name"
        rules={[{ required: true, message: 'Please input first name!' }]}
      >
        <Input placeholder="John" />
      </Form.Item>

      <Form.Item
        name="lastName"
        label="Last Name"
        rules={[{ required: true, message: 'Please input last name!' }]}
      >
        <Input placeholder="Doe" />
      </Form.Item>

      <Form.Item name="role" label="Role" initialValue={UserRole.INTERN}>
        <Input disabled value={UserRole.INTERN} />
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          icon={<UserAddOutlined />}
          loading={loading}
        >
          Create Intern & Assign Checklist
        </Button>
      </Form.Item>
    </Form>
  );
};

// --- Intern Overview Table ---
const InternOverviewTable = ({
  interns,
  loading,
  handleDelete,
  router,
  onSearch,
  onStatusFilterChange
}: {
  interns: InternSummary[];
  loading: boolean;
  handleDelete: (id: string) => Promise<void>;
  router: any;
  onSearch: (value: string) => void;
  onStatusFilterChange: (value: string[]) => void;
}) => {
  const [searchText, setSearchText] = useState('');
  const [statusFilters, setStatusFilters] = useState<string[]>([]);

  const handleSearch = (value: string) => {
    setSearchText(value);
    onSearch(value);
  };

  const handleStatusFilterChange = (values: string[]) => {
    setStatusFilters(values);
    onStatusFilterChange(values);
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'firstName',
      key: 'name',
      render: (text: string, record: InternSummary) => (
        <a onClick={() => router.push(`/hr-dashboard/interns/${record.id}`)}>
          {text} {record.lastName}
        </a>
      ),
      sorter: (a: InternSummary, b: InternSummary) =>
        `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      sorter: (a: InternSummary, b: InternSummary) => a.email.localeCompare(b.email),
    },
    {
      title: 'Checklist Status',
      dataIndex: 'checklistStatus',
      key: 'checklistStatus',
      filters: [
        { text: 'Complete', value: 'Complete' },
        { text: 'In Progress', value: 'In Progress' },
        { text: 'Not Started', value: 'Not Started' },
      ],
      filteredValue: statusFilters,
      onFilter: (value: any, record: InternSummary) => record.checklistStatus === value,
      render: (status: string) => (
        <Tag color={status === 'Complete' ? 'green' : status === 'Not Started' ? 'default' : 'blue'}>
          {status || 'N/A'}
        </Tag>
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
        return (
          <Progress
            percent={Math.round(percent)}
            size="small"
            status={percent < 50 ? 'exception' : percent === 100 ? 'success' : 'active'}
            format={() => `${done}/${total}`}
          />
        );
      },
      sorter: (a: InternSummary, b: InternSummary) => {
        const aPercent = (a.tasksDone / (a.tasksTotal || 1)) * 100;
        const bPercent = (b.tasksDone / (b.tasksTotal || 1)) * 100;
        return aPercent - bPercent;
      }
    },
    {
      title: 'Actions',
      key: 'action',
      render: (_: string, record: InternSummary) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => router.push(`/hr-dashboard/interns/${record.id}`)}
          />
          <Popconfirm
            title={`Are you sure you want to delete ${record.firstName} ${record.lastName}?`}
            onConfirm={() => handleDelete(record.id)}
          >
            <Button icon={<DeleteOutlined />} danger size="small" />
          </Popconfirm>
        </Space>
      )
    },
  ];

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search by name or email"
          prefix={<SearchOutlined />}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
        <Select
          mode="multiple"
          placeholder="Filter by status"
          style={{ width: 200 }}
          allowClear
          onChange={handleStatusFilterChange}
          maxTagCount="responsive"
          optionFilterProp="children"
          filterOption={(input, option) =>
            (option?.children as unknown as string).toLowerCase().includes(input.toLowerCase())
          }
        >
          <Option value="Complete">Complete</Option>
          <Option value="In Progress">In Progress</Option>
          <Option value="Not Started">Not Started</Option>
        </Select>
      </Space>

      <Table
        columns={columns}
        dataSource={interns}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        onChange={(pagination, filters, sorter) => {
          console.log('Table change:', { pagination, filters, sorter });
        }}
      />
    </>
  );
};

// --- Main Page Component ---
export default function ManageInternsPage() {
  const router = useRouter();
  const [interns, setInterns] = useState<InternSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const { status } = useSession();

  // Fetch interns with optional search and filter parameters
  const fetchInterns = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchText) params.append('search', searchText);
      if (statusFilters.length > 0) params.append('status', statusFilters.join(','));

      const internsRes = await api.get(`/users/interns?${params.toString()}`);
      setInterns(internsRes.data);
    } catch (error) {
      console.error("Failed to fetch interns:", error);
      notification.error({
        message: 'Loading Failed',
        description: isAxiosError(error)
          ? (error.response?.data?.message || error.message)
          : 'Could not retrieve intern list.',
      });
      setInterns([]);
    } finally {
      setLoading(false);
    }
  }, [searchText, statusFilters]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchInterns();
    }
  }, [status, fetchInterns]);

  // Handle intern deletion
  const handleDelete = async (internId: string) => {
    try {
      await api.delete(`/users/${internId}`);
      notification.success({ message: 'Intern deleted successfully.' });
      fetchInterns();
    } catch (error) {
      let errorMessage = 'Deletion Failed.';
      if (isAxiosError(error) && error.response) {
        errorMessage = Array.isArray(error.response.data.message)
          ? error.response.data.message.join('; ')
          : error.response.data.message || error.response.data.error || error.message;
        if (error.response.status === 500 &&
            (error.response.data.message?.includes('constraint') ||
             error.response.data.error?.includes('constraint'))) {
          errorMessage += ' Cannot delete. Intern might be assigned to projects or have evaluations. Remove assignments first.';
        }
      }
      notification.error({ message: 'Deletion Failed', description: errorMessage });
    }
  };

  // Define tab items
  const tabItems = [
    {
      key: '1',
      label: 'Intern Overview & Reports',
      children: (
        <>
          <Text type="secondary">
            This table gives you a real-time status of all interns in the program,
            including their onboarding checklist progress.
          </Text>
          <InternOverviewTable
            interns={interns}
            loading={loading}
            handleDelete={handleDelete}
            router={router}
            onSearch={setSearchText}
            onStatusFilterChange={setStatusFilters}
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
          <Text type="secondary">
            Define the reusable blueprints for all intern onboarding processes.
          </Text>
          <Button
            type="default"
            onClick={() => router.push('/hr-dashboard/checklist-templates')}
            style={{ marginTop: 16 }}
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
