'use client';
import React, { useEffect, useState, useCallback } from 'react';
// Use relative paths, as aliases were failing
import MainLayout from '../components/MainLayout';
import api from '../../lib/api';
import {
  Typography,
  Spin,
  Alert,
  Card,
  Button,
  Modal,
  Form,
  Input,
  Select,
  notification,
  Table,
  Tag,
  Space,
  Row,
  Col,
  Statistic,
  Result,
} from 'antd';
import {
  PlusOutlined,
  UserOutlined,
  ContainerOutlined,
  CheckCircleOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useSession } from 'next-auth/react';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

// --- Interface for the intern data in the table ---
interface Intern {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  tasksTotal: number;
  tasksDone: number;
  status: string;
}

// --- Column Definitions ---
const evaluationColumns = [
  {
    title: 'Intern',
    dataIndex: ['intern', 'firstName'],
    key: 'internName',
    render: (text: string, record: any) =>
      `${text || ''} ${record?.intern?.lastName || ''}`,
  },
  {
    title: 'Mentor',
    dataIndex: ['mentor', 'lastName'],
    key: 'mentorName',
    render: (text: string, record: any) =>
      `${record?.mentor?.firstName || ''} ${text || ''}`,
  },
  {
    title: 'Type',
    dataIndex: 'type',
    key: 'type',
    render: (text: string) => <Tag>{text}</Tag>,
  },
  {
    title: 'Score (1-5)',
    dataIndex: 'score',
    key: 'score',
    sorter: (a: any, b: any) => a.score - b.score,
  },
  {
    title: 'Date',
    dataIndex: 'date',
    key: 'date',
    render: (date: string) =>
      date ? new Date(date).toLocaleDateString() : 'N/A',
  },
];
const internsAtRisk = [
  {
    key: '1',
    name: 'John Doe',
    project: 'Website Redesign',
    tasksOverdue: 5,
    evaluationScore: 2.5,
    status: 'At Risk',
  },
  {
    key: '2',
    name: 'Jane Smith',
    project: 'API Development',
    tasksOverdue: 2,
    evaluationScore: 3.1,
    status: 'Warning',
  },
];
const riskColumns = [
  {
    title: 'Intern Name',
    dataIndex: 'name',
    key: 'name',
    render: (text: string, record: any) => (
      <a href={`/hr-dashboard/manage-interns/${record.key}`}>{text}</a>
    ),
  },
  { title: 'Project', dataIndex: 'project', key: 'project' },
  {
    title: 'Overdue Tasks',
    dataIndex: 'tasksOverdue',
    key: 'tasksOverdue',
    sorter: (a: any, b: any) => a.tasksOverdue - b.tasksOverdue,
  },
  {
    title: 'Latest Score',
    dataIndex: 'evaluationScore',
    key: 'evaluationScore',
    render: (score: number) => (
      <Tag color={score < 3.0 ? 'red' : 'orange'}>
        {score ? score.toFixed(1) : 'N/A'}/5.0
      </Tag>
    ),
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (status: string) => (
      <Tag color={status === 'At Risk' ? 'red' : 'gold'}>{status}</Tag>
    ),
  },
];
// --- Manage Interns Table Columns ---
const internManagementColumns = [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
    render: (_: any, record: Intern) =>
      `${record.firstName} ${record.lastName}`,
  },
  {
    title: 'Email',
    dataIndex: 'email',
    key: 'email',
  },
  {
    title: 'Role',
    dataIndex: 'role',
    key: 'role',
    render: (role: string) => <Tag color="blue">{role}</Tag>,
  },
  {
    title: 'Onboarding Status',
    dataIndex: 'status',
    key: 'status',
    render: (status: string, record: Intern) => {
      const percent =
        record.tasksTotal > 0
          ? (record.tasksDone / record.tasksTotal) * 100
          : 0;
      return (
        <Tag color={percent === 100 ? 'green' : 'gold'}>
          {status} ({percent.toFixed(0)}%)
        </Tag>
      );
    },
  },
  {
    title: 'Actions',
    key: 'actions',
    render: (_: any, record: Intern) => (
      <Space size="middle">
        <Button type="link">Manage Checklist</Button>
        <Button type="link" danger>
          Delete
        </Button>
      </Space>
    ),
  },
];

export default function HRDashboardPage() {
  const { data: session } = useSession();
  const [interns, setInterns] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInternModalVisible, setIsInternModalVisible] = useState(false); // Intern Modal State
  const [isTemplateModalVisible, setIsTemplateModalVisible] = useState(false); // Template Modal State
  const [form] = Form.useForm();

  // States for the other data
  const [summary, setSummary] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);

  const role = (session?.user as any)?.role;

  // --- FUNCTION TO FETCH ALL DASHBOARD DATA ---
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    let isMounted = true;
    let errors: string[] = [];

    // All API calls are relative to the baseURL in api.ts
    const results = await Promise.allSettled([
      api.get('/api/analytics/summary'),
      api.get('/api/projects'),
      api.get('/api/evaluations'),
      api.get('/api/users/interns'),
    ]);

    if (!isMounted) return;

    // Handle Summary
    if (results[0].status === 'fulfilled') {
      setSummary(results[0].value.data);
    } else {
      errors.push('Failed to load summary data.');
    }

    // Handle Projects
    if (results[1].status === 'fulfilled') {
      setProjects((results[1].value as any).data);
    } else {
      errors.push('Failed to load project data.');
    }

    // Handle Evaluations
    if (results[2].status === 'fulfilled') {
      setEvaluations((results[2].value as any).data);
    } else {
      errors.push('Failed to load evaluation data.');
    }

    // Handle Interns
    if (results[3].status === 'fulfilled') {
      setInterns((results[3].value as any).data);
    } else {
      errors.push('Failed to load intern list.');
    }

    if (errors.length > 0) {
      setError(errors.join('\n'));
    }

    setLoading(false);

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch all data when the session is available and user is HR
  useEffect(() => {
    if (session && (session.user as any)?.role === 'HR') {
      fetchDashboardData();
    } else if (session) {
      setLoading(false);
    }
  }, [session, fetchDashboardData]);

  // --- FUNCTION TO CREATE A NEW INTERN ---
  const handleCreateIntern = async (values: any) => {
    try {
      // Correctly calls: POST /api/users/intern
      await api.post('/users/intern', {
        ...values,
        role: 'INTERN', // Ensure role is set
      });

      notification.success({
        message: 'Intern Onboarded',
        description: `Successfully created intern ${values.firstName}.`,
      });

      form.resetFields();
      setIsInternModalVisible(false);

      // Refresh the list after creating
      fetchDashboardData();
    } catch (err: any) {
      console.error('Onboarding Failed:', err);
      notification.error({
        message: 'Onboarding Failed',
        description:
          err.response?.data?.message ||
          'The server could not create the intern.',
      });
    }
  };
  
  // --- FUNCTION TO CREATE A NEW CHECKLIST TEMPLATE ---
  const handleCreateTemplate = async (values: any) => {
     try {
      // Correctly calls: POST /api/checklists/templates
      const response = await api.post('/checklists/templates', values);
      
      notification.success({
        message: 'Template Created',
        description: `Successfully created template "${response.data.title}".`,
      });
      
      form.resetFields(); 
      setIsTemplateModalVisible(false);
      
      // Optionally re-fetch data if template list is needed
      // fetchDashboardData(); 
      
    } catch (err: any) {
      console.error('Operation Failed:', err.response?.data || err);
      notification.error({
        message: 'Operation Failed',
        description:
          err.response?.data?.message || 'The server could not create the template.',
      });
    }
  };


  // Handle session loading state
  if (!session && loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  // Handle unauthorized state
  if (session && role !== 'HR') {
    return (
      <MainLayout>
        <Result
          status="403"
          title="Access Denied"
          subTitle="You do not have permission to view the HR Dashboard."
        />
      </MainLayout>
    );
  }

  const metricsData = summary || {
    totalInterns: 0,
    totalProjects: 0,
    totalEvaluations: 0,
    totalMentors: 0,
  };

  // --- RENDER ---
  return (
    <MainLayout>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Title level={2}>HR Manager Dashboard</Title>

        {error && (
          <Alert
            message="Error Loading Data"
            description={
              <pre style={{ whiteSpace: 'pre-wrap' }}>{error}</pre>
            }
            type="error"
            closable
            style={{ marginBottom: 20 }}
          />
        )}

        {/* 1. Quick Metrics Cards */}
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} md={12} lg={6}>
            <Card hoverable>
              <Statistic
                title="Total Interns"
                value={metricsData.totalInterns}
                prefix={<UserOutlined style={{ color: '#1890ff' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={12} lg={6}>
            <Card hoverable>
              <Statistic
                title="Total Projects"
                value={metricsData.totalProjects}
                prefix={<ContainerOutlined style={{ color: '#52c41a' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={12} lg={6}>
            <Card hoverable>
              <Statistic
                title="Total Evals"
                value={metricsData.totalEvaluations}
                prefix={<CheckCircleOutlined style={{ color: '#faad14' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={12} lg={6}>
            <Card hoverable>
              <Statistic
                title="Total Mentors"
                value={metricsData.totalMentors}
                prefix={<TeamOutlined style={{ color: '#eb2f96' }} />}
              />
            </Card>
          </Col>
        </Row>

        {/* 2. Main Action Buttons */}
        <Card>
          <Space wrap>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                form.resetFields();
                setIsInternModalVisible(true);
              }}
            >
              Onboard New Intern
            </Button>
            <Button
              icon={<ContainerOutlined />}
              onClick={() => {
                form.resetFields();
                setIsTemplateModalVisible(true);
              }}
            >
              Create Checklist Template
            </Button>
          </Space>
        </Card>

        {/* 3. Manage Interns Table */}
        <Card title="Manage Interns" variant="outlined" style={{ marginBottom: 24 }}>
          <Table
            columns={internManagementColumns}
            dataSource={interns}
            rowKey="id"
            loading={loading}
            locale={{ emptyText: 'No interns found.' }}
          />
        </Card>

        {/* 4. Interns at Risk Table */}
        <Card title="Interns Requiring Attention" variant="outlined" style={{ marginBottom: 24 }}>
          <Paragraph type="secondary">
            Interns flagged based on overdue tasks or low evaluation scores.
          </Paragraph>
          <Table
            columns={riskColumns}
            dataSource={internsAtRisk} // Still using dummy data
            pagination={false}
            size="small"
          />
        </Card>

        {/* 5. Recent Evaluations Table */}
        <Card title="Recent Evaluations" variant="outlined" style={{ marginBottom: 24 }}>
          <Paragraph type="secondary">
            Latest performance reviews submitted by mentors.
          </Paragraph>
          <Table
            columns={evaluationColumns}
            dataSource={evaluations} // Now using real data
            loading={loading}
            pagination={{ pageSize: 5 }}
            scroll={{ x: 'max-content' }}
            size="small"
            locale={{ emptyText: 'No evaluations found.' }}
          />
        </Card>
      </Space>

      {/* --- MODAL 1: ONBOARD NEW INTERN --- */}
      <Modal
        title={
          <Space>
            <UserOutlined />
            Onboard New Intern
          </Space>
        }
        open={isInternModalVisible}
        onCancel={() => setIsInternModalVisible(false)}
        footer={null}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateIntern}
          style={{ marginTop: 24 }}
        >
          <Form.Item
            name="firstName"
            label="First Name"
            rules={[{ required: true, message: 'First name is required' }]}
          >
            <Input placeholder="e.g., Jane" />
          </Form.Item>
          <Form.Item
            name="lastName"
            label="Last Name"
            rules={[{ required: true, message: 'Last name is required' }]}
          >
            <Input placeholder="e.g., Doe" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Email is required' },
              { type: 'email', message: 'Must be a valid email' },
            ]}
          >
            <Input placeholder="e.g., jane.doe@company.com" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Initial Password"
            rules={[{ required: true, message: 'Password is required' }]}
          >
            <Input.Password placeholder="Set an initial password" />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginTop: 16 }}>
            <Space>
              <Button onClick={() => setIsInternModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Create Intern
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* --- MODAL 2: CREATE CHECKLIST TEMPLATE --- */}
      <Modal
        title={
          <Space>
            <ContainerOutlined />
            Create New Checklist Template
          </Space>
        }
        open={isTemplateModalVisible}
        onCancel={() => setIsTemplateModalVisible(false)}
        footer={null}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateTemplate}
          style={{ marginTop: 24 }}
        >
          <Form.Item
            name="title"
            label="Template Title"
            rules={[{ required: true, message: 'Template title is required' }]}
          >
            <Input placeholder="e.g., General Software Onboarding" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description (Optional)"
          >
            <Input.TextArea rows={2} placeholder="Briefly describe the purpose of this template" />
          </Form.Item>
          
          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                <Text strong>Checklist Items:</Text>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, 'description']}
                      rules={[{ required: true, message: 'Item description is required' }]}
                      style={{ flexGrow: 1 }}
                    >
                      <Input placeholder="e.g., Complete HR paperwork" />
                    </Form.Item>
                    <Button type="text" danger onClick={() => remove(name)}>
                      <PlusOutlined style={{transform: 'rotate(45deg)'}} />
                    </Button>
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Add Item
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Form.Item style={{ textAlign: 'right', marginTop: 16 }}>
            <Space>
              <Button onClick={() => setIsTemplateModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                Save Template
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </MainLayout>
  );
}
