// app/hr-dashboard/page.tsx
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../components/MainLayout';
import api from '../../lib/api';
import { Typography, Spin, Alert, Card, Button, Modal, Form, Input, Select, notification, Table, Tag, Space, Row, Col, Statistic, Result, Popconfirm } from 'antd';
import { PlusOutlined, UserOutlined, ContainerOutlined, CheckCircleOutlined, TeamOutlined, EditOutlined, DeleteOutlined, EyeOutlined, FilePdfOutlined, DownloadOutlined } from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import { isAxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import { UserRole } from '../../common/enums/user-role.enum'
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// TypeScript Interfaces for fetched data
interface Intern {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  tasksTotal: number;
  tasksDone: number;
  checklistStatus: string;
}
interface Evaluation {
  id: string;
  score: number | null;
  feedbackText: string | null;
  type: string;
  createdAt: string;
  intern: { id: string; firstName?: string; lastName?: string; email: string; };
  mentor?: { id: string; firstName?: string; lastName?: string; email: string; };
}

interface InternAtRisk {
  key: string; 
  name: string;
  project: string;
  tasksOverdue: number;
  evaluationScore: number;
  status: 'At Risk' | 'Warning' | 'None';
}

// Columns (These are defined outside, so they are fine)
const evaluationColumns = [
    { title: 'Intern', dataIndex: ['intern', 'firstName'], key: 'internName', render: (text: string, record: Evaluation) => `${record.intern?.firstName || ''} ${record.intern?.lastName || ''}` },
    { title: 'Mentor', dataIndex: ['mentor', 'firstName'], key: 'mentorName', render: (text: string, record: Evaluation) => `${record.mentor?.firstName || 'N/A'} ${record.mentor?.lastName || ''}` },
    { title: 'Type', dataIndex: 'type', key: 'type', render: (text: string) => <Tag>{text}</Tag> },
    { title: 'Score (1-5)', dataIndex: 'score', key: 'score', sorter: (a: Evaluation, b: Evaluation) => (a.score || 0) - (b.score || 0) },
    { title: 'Date', dataIndex: 'createdAt', key: 'date', render: (date: string) => date ? new Date(date).toLocaleDateString() : 'N/A' },
];

const riskColumns = [
    { title: 'Intern Name', dataIndex: 'name', key: 'name', render: (text: string, record: InternAtRisk) => <a href={`/hr-dashboard/interns/${record.key}`}>{text}</a> },
    { title: 'Project', dataIndex: 'project', key: 'project' },
    { title: 'Overdue Tasks', dataIndex: 'tasksOverdue', key: 'tasksOverdue', sorter: (a: InternAtRisk, b: InternAtRisk) => a.tasksOverdue - b.tasksOverdue },
    { title: 'Latest Score', dataIndex: 'evaluationScore', key: 'evaluationScore', render: (score: number) => <Tag color={score < 3.0 ? 'red' : 'orange'}>{score ? score.toFixed(1) : 'N/A'}/5.0</Tag> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => <Tag color={status === 'At Risk' ? 'red' : 'gold'}>{status}</Tag> },
];


export default function HRDashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [interns, setInterns] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInternModalVisible, setIsInternModalVisible] = useState(false);
  const [isTemplateModalVisible, setIsTemplateModalVisible] = useState(false);
  const [form] = Form.useForm();

  const [summary, setSummary] = useState<any>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  
    const [internsAtRiskData, setInternsAtRiskData] = useState<InternAtRisk[]>([]);
  const [selectedInternForPdfReport, setSelectedInternForPdfReport] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const role = (session?.user as any)?.role;
  const isHR = role === 'HR';
    
  // --- ADDED/MODIFIED FOR HR DASHBOARD ISSUES: Intern Management Columns ---
const internManagementColumns = [
    { title: 'Name', dataIndex: 'firstName', key: 'name', render: (_: any, record: Intern) => `${record.firstName} ${record.lastName}` },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Role', dataIndex: 'role', key: 'role', render: (role: string) => <Tag color="blue">{role}</Tag> },
    {
      title: 'Onboarding Status',
      dataIndex: 'checklistStatus',
      key: 'checklistStatus',
      render: (status: string, record: Intern) => {
        const percent = record.tasksTotal > 0 ? (record.tasksDone / record.tasksTotal) * 100 : 0;
        return (
          <Tag color={percent === 100 ? 'green' : 'gold'}>
            {status} ({percent.toFixed(0)}%)
          </Tag>
        );
      },
    },
    {
      title: 'Actions', key: 'actions', render: (_: any, record: Intern) => (
        <Space size="middle">
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => router.push(`/hr-dashboard/interns/${record.id}`)} // Corrected: Link to intern profile
          >
            View
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => router.push(`/hr-dashboard/interns/${record.id}`)} // "Manage Checklist" links to intern profile
          >
            Checklist
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this intern?"
            description="This action cannot be undone and will delete all associated data (projects, evaluations, checklists). You might need to remove existing assignments first."
            onConfirm={() => handleDelete(record.id)} // Calls the handleDelete function
            okText="Yes, Delete"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />} size="small">Delete</Button>
          </Popconfirm>
        </Space>
      )
    },
  ];
  // --- 1.1 Handle Intern Deletion (Use the correct function definition) ---
  const handleDelete = async (internId: string) => {
    try {
      await api.delete(`/api/users/${internId}`);
      notification.success({ message: 'Intern deleted successfully.' });
      fetchDashboardData(); 
    }catch (error) {
      let errorMessage = 'Deletion Failed.';
      if (isAxiosError(error) && error.response) {
        errorMessage = `Error: ${error.response.status} - ${error.response.data?.message || error.response.data?.error || error.response.statusText}`;
        if (error.response.status === 500 && (errorMessage.includes('constraint') || errorMessage.includes('foreign key'))) {
          errorMessage += ' Cannot delete. Intern might be assigned to projects or have evaluations. Remove assignments first.';
        }
      }
      notification.error({ message: 'Deletion Failed', description: errorMessage });
    }
  };
    
  // 1.2 Handle PDF Report Generation
 const handleGeneratePdfReport = async (values: { internIdForPdfReport: string }) => {
    const internIdToReport = values.internIdForPdfReport; // Get intern ID from the form
    if (!internIdToReport) {
      notification.error({ message: 'Please select an intern for the report.' });
      return;
    }
    setIsGeneratingPdf(true);
    notification.info({ message: 'Generating PDF report...', duration: 0 }); // Show indefinite loading

    try {
      // The backend endpoint streams the PDF
      const response = await api.get(`/api/reports/final-packet/${internIdToReport}`, { // CRITICAL: Ensure `/api/` prefix
        responseType: 'blob', // IMPORTANT: Expect binary data (a Blob)
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob); // Create a temporary URL for the Blob
      const a = document.createElement('a'); // Create a temporary anchor tag
      a.href = url;
      a.download = `intern_report_${internIdToReport}.pdf`; // Suggested filename
      document.body.appendChild(a);
      a.click(); // Programmatically click the link to trigger download
      window.URL.revokeObjectURL(url); // Clean up the temporary URL
      document.body.removeChild(a); // Clean up the anchor tag

      notification.success({ message: 'PDF Report Generated and Downloaded!' });

    } catch (error: any) {
      console.error("PDF generation failed:", error.response?.data || error.message);
      notification.error({ message: 'PDF Generation Failed', description: error.response?.data?.message || error.response?.data?.error || 'Could not generate PDF.' });
    } finally {
      setIsGeneratingPdf(false);
      notification.destroy(); // Close indefinite loading notification
    }
  };

  // 1.3 --- FUNCTION TO FETCH ALL DASHBOARD DATA ---
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    let isMounted = true;
    let errors: string[] = [];

     const requests = [
      api.get('/api/analytics/summary'), // CRITICAL: Ensure `/api/` prefix
      api.get('/api/projects'),        // CRITICAL: Ensure `/api/` prefix
      api.get('/api/evaluations'),     // CRITICAL: Ensure `/api/` prefix
      api.get('/api/users/interns'),   // CRITICAL: Ensure `/api/` prefix
      api.get('/api/analytics/interns-at-risk'), // CRITICAL: Ensure `/api/` prefix
    ];

    const results = await Promise.allSettled(requests);

    if (!isMounted) return;

    // Handle results (CRITICAL: Ensure errors are collected and data is set)
     if (results[0].status === 'fulfilled') { setSummary(results[0].value.data); } else { errors.push(`Failed to load summary data. Error: ${isAxiosError(results[0].reason) ? results[0].reason.response?.status + " - " + (results[0].reason.response?.data?.message || results[0].reason.response?.data?.error || results[0].reason.message) : results[0].reason}`); console.error('Summary API Error:', results[0].reason); }
    if (results[1].status === 'fulfilled') { setProjects((results[1].value as any).data); } else { errors.push(`Failed to load project data. Error: ${isAxiosError(results[1].reason) ? results[1].reason.response?.status + " - " + (results[1].reason.response?.data?.message || results[1].reason.response?.data?.error || results[1].reason.message) : results[1].reason}`); console.error('Projects API Error:', results[1].reason); }
    if (results[2].status === 'fulfilled') { setEvaluations((results[2].value as any).data); } else { errors.push(`Failed to load evaluation data. Error: ${isAxiosError(results[2].reason) ? results[2].reason.response?.status + " - " + (results[2].reason.response?.data?.message || results[2].reason.response?.data?.error || results[2].reason.message) : results[2].reason}`); console.error('Evaluations API Error:', results[2].reason); }
    if (results[3].status === 'fulfilled') { setInterns((results[3].value as any).data); } else { errors.push(`Failed to load intern list. Error: ${isAxiosError(results[3].reason) ? results[3].reason.response?.status + " - " + (results[3].reason.response?.data?.message || results[3].reason.response?.data?.error || results[3].reason.message) : results[3].reason}`); console.error('Interns API Error:', results[3].reason); }
    if (results[4].status === 'fulfilled') { setInternsAtRiskData((results[4].value as any).data); } else { errors.push(`Failed to load at-risk interns. Error: ${isAxiosError(results[4].reason) ? results[4].reason.response?.status + " - " + (results[4].reason.response?.data?.message || results[4].reason.response?.data?.error || results[4].reason.message) : results[4].reason}`); console.error('At-Risk Interns API Error:', results[4].reason); }


    if (errors.length > 0) { setError(errors.join('\n')); }
    setLoading(false);

    return () => { isMounted = false; };
  }, []);

  // Fetch all data when the session is available and user is HR
  useEffect(() => {
    if (status === 'authenticated' && isHR) {
      fetchDashboardData();
    } else if (status === 'authenticated' && role && !isHR) {
      notification.error({ message: 'Access Denied', description: 'Redirecting to appropriate dashboard.' });
      router.push('/');
    }
  }, [session, role, status, isHR, fetchDashboardData, router]);


  // --- FUNCTION TO CREATE A NEW INTERN (Called from Modal) ---
  const handleCreateIntern = async (values: any) => {
    try {
      await api.post('/api/users/intern', {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        role: 'INTERN' 
      });

      notification.success({ message: 'Intern Onboarded', description: `Successfully created intern ${values.firstName}.` });
      form.resetFields(); // Clear form
      setIsInternModalVisible(false); // Close modal
      fetchDashboardData(); // Refresh all dashboard data
    } catch (err: any) {
      console.error('Onboarding Failed:', err.response?.data || err);
      notification.error({
        message: 'Onboarding Failed',
        description: err.response?.data?.message || err.response?.data?.error || err.message || 'The server could not create the intern.',
      });
    }
  };

  // --- FUNCTION TO CREATE A NEW CHECKLIST TEMPLATE (Called from Modal) ---
  const handleCreateTemplate = async (values: any) => {
    try {
      const response = await api.post('/api/checklists/templates', {
        name: values.name,
        description: values.description,
        items: values.items || [] 
      });

       notification.success({ message: 'Template Created', description: `Successfully created template "${response.data.name}".` });
      form.resetFields();
      setIsTemplateModalVisible(false);
      fetchDashboardData(); // Refresh dashboard (implicitly updates linked templates)

    } catch (err: any) {
      console.error('Operation Failed:', err.response?.data || err);
      notification.error({
        message: 'Operation Failed',
        description: err.response?.data?.message || err.response?.data?.error || err.message || 'The server could not create the template.',
      });
    }
  };


  // --- RENDER PROTECTION ---
  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (status === 'unauthenticated' || (session && role !== 'HR')) {
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

  // Use default values for metrics if summary is null
  const metricsData = summary || {
    totalInterns: interns.length, // Ensure metric reflects actual fetched data
    activeProjects: 0,
    pendingEvaluations: 0,
    totalMentors: 0,
  };
    // CRITICAL: Ensure totalInterns reflects the fetched array length if summary is missing
    metricsData.totalInterns = interns.length;


  // --- RENDER ---
  return (
    <MainLayout>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Title level={2}>HR Manager Dashboard</Title>

        {/* Display aggregated errors for dashboard data loading */}
        {error && (
          <Alert
            message="Error Loading Dashboard Data"
            description={<pre style={{ whiteSpace: 'pre-wrap' }}>{error}</pre>}
            type="error"
            showIcon
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
                title="Active Projects"
                value={metricsData.activeProjects}
                prefix={<ContainerOutlined style={{ color: '#52c41a' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={12} lg={6}>
            <Card hoverable>
              <Statistic
                title="Pending Evals"
                value={metricsData.pendingEvaluations}
                prefix={<CheckCircleOutlined style={{ color: '#faad14' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={12} lg={6}>
            <Card hoverable>
              <Statistic
                title="Total Mentors"
                value={metricsData.totalMentors || 0}
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
              onClick={() => { form.resetFields(); setIsInternModalVisible(true); }}
            >
              Onboard New Intern
            </Button>
            <Button
              icon={<ContainerOutlined />}
              onClick={() => { form.resetFields(); setIsTemplateModalVisible(true); }}
            >
              Create Checklist Template
            </Button>
            <Button
              icon={<EyeOutlined />}
              onClick={() => router.push('/hr-dashboard/projects-overview')}
            >
              View All Projects (HR)
            </Button>
            <Button
              icon={<EyeOutlined />}
              onClick={() => router.push('/hr-dashboard/evaluations-report')}
            >
              View Evaluations Report (HR)
            </Button>
          </Space>
        </Card>

        {/* 3. Manage Interns Table */}
        <Card title="Manage Interns" variant="outlined" style={{ marginBottom: 24 }}>
          <Table
            columns={internManagementColumns} // Uses the corrected columns
            dataSource={interns}
            rowKey="id"
            loading={loading}
            locale={{ emptyText: 'No interns found.' }}
          />
        </Card>

        {/* --- ADDED FOR HR DASHBOARD ISSUES: Interns Requiring Attention Table (Now uses real data) --- */}
        <Card title="Interns Requiring Attention" variant="outlined" style={{ marginBottom: 24 }}>
          <Paragraph type="secondary">Interns flagged based on overdue tasks or low evaluation scores.</Paragraph>
          <Table
            columns={riskColumns}
            dataSource={internsAtRiskData} // Now uses fetched data
            rowKey="key" // Ensure rowKey matches the InternAtRisk interface
            pagination={false}
            size="small"
            loading={loading}
            locale={{ emptyText: 'No interns currently requiring special attention.' }}
          />
        </Card>

        {/* --- ADDED FOR HR DASHBOARD ISSUES: Generate Intern Packet (PDF) - for HR --- */}
        <Card title="Generate Intern Packet (PDF)" style={{ marginBottom: 24 }}>
            <Paragraph>
                Generate a comprehensive PDF packet summarizing evaluations and objective metrics for a specific intern.
            </Paragraph>
            <Form
                form={form} // Use the same form instance as other modals/forms
                layout="vertical"
                onFinish={handleGeneratePdfReport}
                style={{ maxWidth: 400 }}
            >
                <Form.Item
                    name="internIdForPdfReport" // Unique name for this form item
                    label="Select Intern"
                    rules={[{ required: true, message: 'Please select an intern.' }]}
                >
                    <Select
                        placeholder="Choose intern for report"
                        onChange={value => setSelectedInternForPdfReport(value as string)}
                        value={selectedInternForPdfReport}
                        disabled={interns.length === 0 || isGeneratingPdf || loading}
                        loading={loading} // Indicate loading for dropdown options
                    >
                        {interns.map(intern => ( // Use the 'interns' state fetched by fetchDashboardData
                            <Option key={intern.id} value={intern.id}>{intern.firstName} ${intern.lastName}</Option>
                        ))}
                    </Select>
                </Form.Item>
                <Form.Item>
                    <Button
                        type="primary"
                        htmlType="submit"
                        icon={<FilePdfOutlined />}
                        loading={isGeneratingPdf} // Use specific loading state for PDF generation
                        disabled={!selectedInternForPdfReport || isGeneratingPdf || loading}
                    >
                        Generate Final PDF Report
                    </Button>
                </Form.Item>
            </Form>
        </Card>
        {/* --- END ADDED FOR HR DASHBOARD ISSUES --- */}


        {/* 6. Recent Evaluations Table */}
        <Card title="Recent Evaluations" variant="outlined" style={{ marginBottom: 24 }}>
          <Paragraph type="secondary">Latest performance reviews submitted by mentors.</Paragraph>
          <Table
            columns={evaluationColumns}
            dataSource={evaluations}
            rowKey="id"
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
        title={<Space><UserOutlined />Onboard New Intern</Space>}
        open={isInternModalVisible}
        onCancel={() => setIsInternModalVisible(false)}
        footer={null} destroyOnHidden // CRITICAL FIX: `destroyOnHidden` instead of `destroyOnClose`
      >
        <Form form={form} layout="vertical" onFinish={handleCreateIntern} style={{ marginTop: 24 }}>
          {/* CRITICAL FIX: Ensure 'name' properties match backend DTO field names */}
          <Form.Item name="firstName" label="First Name" rules={[{ required: true, message: 'First name is required' }]}> <Input placeholder="e.g., Jane" /> </Form.Item>
          <Form.Item name="lastName" label="Last Name" rules={[{ required: true, message: 'Last name is required' }]}> <Input placeholder="e.g., Doe" /> </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Email is required' }, { type: 'email', message: 'Must be a valid email' }]}> <Input placeholder="e.g., jane.doe@company.com" /> </Form.Item>
          <Form.Item name="password" label="Initial Password" rules={[{ required: true, message: 'Password is required' }]}> <Input.Password placeholder="Set an initial password" /> </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginTop: 16 }}>
            <Space>
              <Button onClick={() => setIsInternModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">Create Intern</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* --- MODAL 2: CREATE CHECKLIST TEMPLATE --- */}
      <Modal
        title={<Space><ContainerOutlined />Create New Checklist Template</Space>}
        open={isTemplateModalVisible}
        onCancel={() => setIsTemplateModalVisible(false)}
        footer={null} destroyOnHidden // CRITICAL FIX: `destroyOnHidden` instead of `destroyOnClose`
      >
        <Form form={form} layout="vertical" onFinish={handleCreateTemplate} style={{ marginTop: 24 }}>
          <Form.Item name="name" label="Template Title" rules={[{ required: true, message: 'Template title is required' }]}><Input placeholder="e.g., General Software Onboarding" /></Form.Item>
          <Form.Item name="description" label="Description (Optional)"> <Input.TextArea rows={2} placeholder="Briefly describe the purpose of this template" /> </Form.Item>

          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                <Text strong>Checklist Items:</Text>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item {...restField} name={[name, 'title']} rules={[{ required: true, message: 'Item title is required' }]} style={{ flexGrow: 1 }}> <Input placeholder="e.g., Complete HR paperwork" /> </Form.Item>
                    {/* Assuming the backend DTO for checklist items uses 'title' and 'text' or 'description' */}
                    {/* If your DTO expects 'text' for the main description, you might add another input here: */}
                    {/* <Form.Item {...restField} name={[name, 'text']} rules={[{ required: true, message: 'Item text/description is required' }]} style={{ flexGrow: 1 }}> <Input.TextArea rows={1} placeholder="Item text/description" /> </Form.Item> */}
                    <Button type="text" danger onClick={() => remove(name)}> <PlusOutlined style={{transform: 'rotate(45deg)'}} /> </Button>
                  </Space>
                ))}
                <Form.Item> <Button type="dashed" onClick={() => add({ title: '' })} block icon={<PlusOutlined />}>Add Item</Button> </Form.Item> {/* ADDED: Default title for new item */}
              </>
            )}
          </Form.List>

          <Form.Item style={{ textAlign: 'right', marginTop: 16 }}>
            <Space>
              <Button onClick={() => setIsTemplateModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">Save Template</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </MainLayout>
  );
}