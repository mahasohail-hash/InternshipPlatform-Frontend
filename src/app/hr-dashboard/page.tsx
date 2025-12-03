'use client';
import React, { useState, useEffect, useCallback } from 'react';
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
  Popconfirm,
  List,
  Empty,
  Progress,
} from 'antd';
import {
  PlusOutlined,
  UserOutlined,
  ContainerOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  DeleteOutlined,
  EyeOutlined,
  FilePdfOutlined,
  ClockCircleOutlined,
  CheckCircleFilled,
  SyncOutlined,
} from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import { isAxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import { UserRole } from '../../common/enums/user-role.enum';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

/* ---------- Types ---------- */
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
  intern: { id: string; firstName?: string; lastName?: string; email: string };
  mentor?: { id: string; firstName?: string; lastName?: string; email: string };
}

interface InternAtRisk {
  key: string;
  name: string;
  project: string;
  tasksOverdue: number;
  reason: string;
  evaluationScore: number;
  status: 'At Risk' | 'Warning' | 'None';
}

interface ChecklistItem {
  id: string;
  title: string;
  isCompleted: boolean;
}

interface Checklist {
  id: string;
  template: { title: string; description?: string };
  items: ChecklistItem[];
  isCompleted: boolean;
  progress?: number;
}

/* ---------- Columns ---------- */
const evaluationColumns = [
  {
    title: 'Intern',
    key: 'internName',
    render: (_: any, record: Evaluation) =>
      `${record.intern?.firstName || ''} ${record.intern?.lastName || ''}`,
  },
  {
    title: 'Mentor',
    key: 'mentorName',
    render: (_: any, record: Evaluation) =>
      `${record.mentor?.firstName || 'N/A'} ${record.mentor?.lastName || ''}`,
  },
  { title: 'Type', dataIndex: 'type', key: 'type', render: (t: string) => <Tag>{t}</Tag> },
  {
    title: 'Score (1-5)',
    dataIndex: 'score',
    key: 'score',
    sorter: (a: Evaluation, b: Evaluation) => (a.score || 0) - (b.score || 0),
  },
  {
    title: 'Date',
    dataIndex: 'createdAt',
    key: 'date',
    render: (date: string) => (date ? new Date(date).toLocaleDateString() : 'N/A'),
  },
];

const riskColumns = [
  {
    title: 'Intern Name',
    dataIndex: 'name',
    key: 'name',
    render: (text: string, record: InternAtRisk) => (
      <a href={`/hr-dashboard/interns/${record.key}`}>{text}</a>
    ),
  },
  { title: 'Project', dataIndex: 'project', key: 'project' },
  {
    title: 'Overdue Tasks',
    dataIndex: 'tasksOverdue',
    key: 'tasksOverdue',
    sorter: (a: InternAtRisk, b: InternAtRisk) => a.tasksOverdue - b.tasksOverdue,
  },
  {
    title: 'Latest Score',
    dataIndex: 'evaluationScore',
    key: 'evaluationScore',
    render: (score: number) => (
      <Tag color={score < 3.0 ? 'red' : 'orange'}>{score ? score.toFixed(1) : 'N/A'}/5.0</Tag>
    ),
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (status: string) => <Tag color={status === 'At Risk' ? 'red' : 'gold'}>{status}</Tag>,
  },
];

/* ---------- Component ---------- */
export default function HRDashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // main states
  const [interns, setInterns] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // forms & templates
  const [form] = Form.useForm();
  const [internForm] = Form.useForm();
  const [templateForm] = Form.useForm();
  const [templates, setTemplates] = useState<{ id: string; name: string }[]>([]);

  // modals & checklist UI
  const [isInternModalVisible, setIsInternModalVisible] = useState(false);
  const [isTemplateModalVisible, setIsTemplateModalVisible] = useState(false);
  const [isChecklistModalVisible, setIsChecklistModalVisible] = useState(false);
  const [selectedInternChecklists, setSelectedInternChecklists] = useState<Checklist[]>([]);
  const [selectedInternId, setSelectedInternId] = useState<string | null>(null);
  const [selectedInternName, setSelectedInternName] = useState<string>('');
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [updatingItems, setUpdatingItems] = useState<string[]>([]);

  // analytics & other
  const [summary, setSummary] = useState<any>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [internsAtRiskData, setInternsAtRiskData] = useState<InternAtRisk[]>([]);
  const [selectedInternForPdfReport, setSelectedInternForPdfReport] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const role = (session?.user as any)?.role;
  const isHR = role === 'HR';

  /* ---------- Table columns (uses fetchInternChecklistsById for Checklist action) ---------- */
  const internManagementColumns = [
    {
      title: 'Name',
      dataIndex: 'firstName',
      key: 'name',
      render: (_: any, record: Intern) => `${record.firstName} ${record.lastName}`,
    },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Role', dataIndex: 'role', key: 'role', render: (r: string) => <Tag color="blue">{r}</Tag> },
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
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Intern) => (
        <Space size="middle">
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => router.push(`/hr-dashboard/interns/${record.id}`)}
          >
            View
          </Button>

          <Button
            type="link"
            size="small"
            onClick={() =>
              fetchInternChecklistsById(record.id, `${record.firstName} ${record.lastName}`)
            }
          >
            Checklist
          </Button>

          <Popconfirm
            title="Are you sure you want to delete this intern?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />} size="small">
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  /* ---------- API fetches ---------- */
  const fetchTemplates = useCallback(async () => {
    try {
      const res = await api.get('/api/checklists/templates');
      // Expect templates list of { id, name }
      setTemplates(res.data || []);
    } catch (err) {
      // non-blocking: templates optional
      console.warn('Failed to load templates', err);
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const results = await Promise.allSettled([
        api.get('/api/analytics/summary'),
        api.get('/api/projects'),
        api.get('/api/evaluations'),
        api.get('/api/users/interns'),
        api.get('/api/analytics/interns-at-risk'),
      ]);

      if (results[0].status === 'fulfilled') setSummary(results[0].value.data);
      if (results[1].status === 'fulfilled') setProjects(results[1].value.data);
      if (results[2].status === 'fulfilled') setEvaluations(results[2].value.data);
      if (results[3].status === 'fulfilled') setInterns(results[3].value.data);
      if (results[4].status === 'fulfilled') setInternsAtRiskData(results[4].value.data);

      // collect errors (non-fatal)
      const errs = results
        .filter(r => r.status === 'rejected')
        .map(r => (isAxiosError((r as any).reason) ? (r as any).reason.message : String((r as any).reason)));
      if (errs.length) setError(errs.join('\n'));
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && isHR) {
      fetchDashboardData();
      fetchTemplates();
    } else if (status === 'authenticated' && role && !isHR) {
      notification.error({ message: 'Access Denied', description: 'Redirecting to appropriate dashboard.' });
      router.push('/');
    }
  }, [status, role, isHR, fetchDashboardData, fetchTemplates, router]);

  /* ---------- Checklist helpers ---------- */
  const fetchInternChecklists = async (internId: string) => {
    try {
  const res = await api.get<Checklist[]>(`/api/checklists/intern/${internId}`);
      return res.data || [];
    } catch (err) {
      console.error('Failed to fetch intern checklists', err);
      return [];
    }
  };

  // open Checklist modal for a specific intern
  const fetchInternChecklistsById = async (internId: string, internFullName: string) => {
    setChecklistLoading(true);
    try {
  const res = await api.get<Checklist[]>(`/api/checklists/intern/${internId}`);
      const checklistsWithProgress = (res.data || []).map(cl => {
        const completedItems = cl.items.filter(i => i.isCompleted).length;
        const progress = cl.items.length > 0 ? Math.round((completedItems / cl.items.length) * 100) : 0;
        return { ...cl, progress };
      });
      setSelectedInternChecklists(checklistsWithProgress);
      setSelectedInternId(internId);
      setSelectedInternName(internFullName);
      setIsChecklistModalVisible(true);
    } catch (err: any) {
      notification.error({ message: 'Failed to fetch checklists', description: err.message || '' });
    } finally {
      setChecklistLoading(false);
    }
  };

  const handleToggleChecklistItem = async (
    internId: string,
    checklistId: string,
    itemId: string,
    currentStatus: boolean
  ) => {
    try {
      setUpdatingItems(prev => [...prev, itemId]);

      // call backend to toggle
await api.patch(`/api/checklists/intern/${internId}/items/${itemId}`, { isCompleted: !currentStatus });

      // optimistic UI update
      setSelectedInternChecklists(prev =>
        prev.map(cl => {
          if (cl.id !== checklistId) return cl;
          const updatedItems = cl.items.map(it => (it.id === itemId ? { ...it, isCompleted: !currentStatus } : it));
          const completed = updatedItems.filter(i => i.isCompleted).length;
          const progress = updatedItems.length > 0 ? Math.round((completed / updatedItems.length) * 100) : 0;
          return { ...cl, items: updatedItems, progress };
        })
      );
    } catch (err: any) {
      notification.error({ message: 'Update Failed', description: err.message || '' });
    } finally {
      setUpdatingItems(prev => prev.filter(id => id !== itemId));
    }
  };

  const handleCompleteAllItems = async (internId: string | null, checklistId: string) => {
    if (!internId) return;
    const checklist = selectedInternChecklists.find(c => c.id === checklistId);
    if (!checklist) return;

    const allItemIds = checklist.items.map(i => i.id);
    try {
      setUpdatingItems(prev => [...prev, ...allItemIds]);

      await api.patch(`/api/checklists/intern/${internId}/items/bulk-complete`, { checklistId });

      // optimistic update
      setSelectedInternChecklists(prev =>
        prev.map(cl => (cl.id === checklistId ? { ...cl, items: cl.items.map(i => ({ ...i, isCompleted: true })), progress: 100 } : cl))
      );

      notification.success({ message: 'All items marked complete!' });
    } catch (err: any) {
      notification.error({ message: 'Failed to complete all items', description: err.message || '' });
    } finally {
      setUpdatingItems(prev => prev.filter(id => !allItemIds.includes(id)));
    }
  };

  /* ---------- Intern creation & PDF generation ---------- */
  const handleCreateInternWithChecklists = async (values: any) => {
    try {
      let newTemplateIds: string[] = [];

      // create new templates if provided
     if (values.newTemplates?.length) {
  const creationResponses = await Promise.all(
    values.newTemplates.map((t: any) =>
      api.post('/api/checklists/templates', {
        name: t.name,
        description: t.description || '',
        items: t.items?.map((i: any) => ({ title: i.title })) || [],
      })
    )
  );
  newTemplateIds = creationResponses.map((r: any) => r.data.id);
}


      const allTemplateIds = [...(values.assignedChecklists || []), ...newTemplateIds];

      // create intern + assign checklists
      const internRes = await api.post('/api/users/intern/onboard', {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        role: 'INTERN',
        checklistIds: allTemplateIds,
      });

      const internId = internRes.data.id;
      // Fetch newly assigned checklists (optional display)
      const assigned = await fetchInternChecklists(internId);
      console.log('Assigned checklists for new intern:', assigned);

      notification.success({
        message: 'Intern Onboarded',
        description: `${values.firstName} ${values.lastName} created and assigned ${allTemplateIds.length} checklist(s).`,
      });

      internForm.resetFields();
      setIsInternModalVisible(false);
      // refresh dashboard
      await fetchDashboardData();
      // refresh templates
      await fetchTemplates();
    } catch (err: any) {
      notification.error({
        message: 'Onboarding Failed',
        description: err.response?.data?.message || err.message || 'Server error',
      });
    }
  };

  const handleGeneratePdfReport = async (values: { internIdForPdfReport: string }) => {
    const internIdToReport = values.internIdForPdfReport;
    if (!internIdToReport) return notification.error({ message: 'Please select an intern for the report.' });

    setIsGeneratingPdf(true);
    notification.info({ message: 'Generating PDF report...', duration: 0 });

    try {
      const response = await api.get(`/api/reports/final-packet/${internIdToReport}`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `intern_report_${internIdToReport}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      notification.success({ message: 'PDF Report Generated and Downloaded!' });
    } catch (err: any) {
      // if server returned JSON error as blob
      if (err.response && err.response.data instanceof Blob && err.response.data.type === 'application/json') {
        const text = await err.response.data.text();
        const json = JSON.parse(text);
        notification.error({ message: `Report Failed (Status ${err.response.status})`, description: json.message || '' });
      } else {
        notification.error({ message: 'PDF Generation Failed', description: err.message || '' });
      }
    } finally {
      setIsGeneratingPdf(false);
      notification.destroy();
    }
  };

  /* ---------- Deletion ---------- */
  const handleDelete = async (internId: string) => {
    try {
      await api.delete(`/api/users/${internId}`);
      notification.success({ message: 'Intern deleted successfully.' });
      fetchDashboardData();
    } catch (err: any) {
      let errorMessage = 'Deletion Failed.';
      if (isAxiosError(err) && err.response) {
        errorMessage =
          err.response.data?.message || err.response.data?.error || `${err.response.status} ${err.response.statusText}`;
      }
      notification.error({ message: 'Deletion Failed', description: errorMessage });
    }
  };

  /* ---------- Render protection ---------- */
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
        <Result status="403" title="Access Denied" subTitle="You do not have permission to view the HR Dashboard." />
      </MainLayout>
    );
  }

  /* ---------- Metrics ---------- */
  const metricsData = summary || {
    totalInterns: interns.length,
    activeProjects: 0,
    pendingEvaluations: 0,
    totalMentors: 0,
  };
  metricsData.totalInterns = interns.length;

  /* ---------- JSX ---------- */
  return (
    <MainLayout>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Title level={2}>HR Manager Dashboard</Title>

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

        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} md={12} lg={6}>
            <Card hoverable>
              <Statistic title="Total Interns" value={metricsData.totalInterns} prefix={<UserOutlined style={{ color: '#1890ff' }} />} />
            </Card>
          </Col>

          <Col xs={24} sm={12} md={12} lg={6}>
            <Card hoverable>
              <Statistic title="Active Projects" value={metricsData.activeProjects} prefix={<ContainerOutlined style={{ color: '#52c41a' }} />} />
            </Card>
          </Col>

          <Col xs={24} sm={12} md={12} lg={6}>
            <Card hoverable>
              <Statistic title="Pending Evals" value={metricsData.pendingEvaluations} prefix={<CheckCircleOutlined style={{ color: '#faad14' }} />} />
            </Card>
          </Col>

          <Col xs={24} sm={12} md={12} lg={6}>
            <Card hoverable>
              <Statistic title="Total Mentors" value={metricsData.totalMentors || 0} prefix={<TeamOutlined style={{ color: '#eb2f96' }} />} />
            </Card>
          </Col>
        </Row>

        <Card>
          <Space wrap>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { internForm.resetFields(); setIsInternModalVisible(true); }}>
              Onboard New Intern
            </Button>

            <Button icon={<EyeOutlined />} onClick={() => router.push('/hr-dashboard/projects-overview')}>
              View All Projects (HR)
            </Button>

            <Button icon={<EyeOutlined />} onClick={() => router.push('/hr-dashboard/evaluations-report')}>
              View Evaluations Report (HR)
            </Button>
          </Space>
        </Card>

        <Card title="Manage Interns" variant="outlined" style={{ marginBottom: 24 }}>
          <Table columns={internManagementColumns} dataSource={interns} rowKey="id" loading={loading} locale={{ emptyText: 'No interns found.' }} />
        </Card>

        <Card title="Interns Requiring Attention" variant="outlined" style={{ marginBottom: 24 }}>
          <Paragraph type="secondary">Interns flagged based on overdue tasks or low evaluation scores.</Paragraph>
          <Table
            columns={riskColumns}
            dataSource={internsAtRiskData}
            rowKey="key"
            pagination={false}
            size="small"
            loading={loading}
            locale={{ emptyText: 'No interns currently requiring special attention.' }}
          />
        </Card>

        <Card title="Generate Intern Packet (PDF)" style={{ marginBottom: 24 }}>
          <Paragraph>Generate a comprehensive PDF packet summarizing evaluations and objective metrics for a specific intern.</Paragraph>
          <Form form={form} layout="vertical" onFinish={handleGeneratePdfReport} style={{ maxWidth: 400 }}>
            <Form.Item
              name="internIdForPdfReport"
              label="Select Intern"
              rules={[{ required: true, message: 'Please select an intern.' }]}
            >
              <Select
                placeholder="Choose intern for report"
                onChange={value => setSelectedInternForPdfReport(value as string)}
                value={selectedInternForPdfReport}
                disabled={interns.length === 0 || isGeneratingPdf || loading}
                loading={loading}
              >
                {interns.map(intern => (
                  <Option key={intern.id} value={intern.id}>
                    {intern.firstName} {intern.lastName}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                icon={<FilePdfOutlined />}
                loading={isGeneratingPdf}
                disabled={!selectedInternForPdfReport || isGeneratingPdf || loading}
              >
                Generate Final PDF Report
              </Button>
            </Form.Item>
          </Form>
        </Card>

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

      {/* ---------- Intern Onboard Modal ---------- */}
      <Modal
        title={<Space><UserOutlined />Onboard New Intern & Assign Checklists</Space>}
        open={isInternModalVisible}
        onCancel={() => { setIsInternModalVisible(false); internForm.resetFields(); }}
        footer={null}
        destroyOnClose
      >
        <Form form={internForm} layout="vertical" onFinish={handleCreateInternWithChecklists} style={{ marginTop: 24 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="firstName" label="First Name" rules={[{ required: true, message: 'First name is required' }]}>
                <Input placeholder="e.g., Jane" autoComplete="off" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="lastName" label="Last Name" rules={[{ required: true, message: 'Last name is required' }]}>
                <Input placeholder="e.g., Doe" autoComplete="off" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, message: 'Email is required' }, { type: 'email', message: 'Must be a valid email' }]}
          >
            <Input placeholder="e.g., jane.doe@company.com" autoComplete="off" />
          </Form.Item>

          <Form.Item name="password" label="Initial Password" rules={[{ required: true, message: 'Password is required' }]}>
            <Input.Password placeholder="Set an initial password" autoComplete="new-password" />
          </Form.Item>

          <Form.Item name="assignedChecklists" label="Assign Existing Checklists" tooltip="Select existing checklists to assign to this intern.">
            <Select
              mode="multiple"
              placeholder="Select existing checklists"
              optionFilterProp="label"
              showSearch
              allowClear
              options={templates.map(t => ({ label: t.name, value: t.id }))}
            />
          </Form.Item>

          {/* Create new templates inline */}
          <Form.List name="newTemplates">
            {(fields, { add, remove }) => (
              <>
              
                <Text strong>Create New Checklist Template(s) (Optional)</Text>
                {fields.map(({ key, name, ...restField }, idx) => (
                  <Card key={key} size="small" style={{ marginBottom: 12 }}>
                    <Space align="baseline" style={{ justifyContent: 'space-between', width: '100%' }}>
                      <Text strong>Template #{idx + 1}</Text>
                      <Button type="text" danger onClick={() => remove(name)}>Remove Template</Button>
                    </Space>

                    <Form.Item {...restField} name={[name, 'name']} label="Template Title" rules={[{ required: true, message: 'Template title is required' }]}>
                      <Input placeholder="e.g., Software Onboarding" />
                    </Form.Item>

                    <Form.Item {...restField} name={[name, 'description']} label="Description (Optional)">
                      <TextArea rows={2} placeholder="Briefly describe the purpose of this template" />
                    </Form.Item>

                    <Form.List name={[name, 'items']} rules={[{ validator: async (_, items) => { if (!items || items.length < 1) return Promise.reject(new Error('Each checklist template must have at least one item.')); } }]}>
                      {(itemFields, { add: addItem, remove: removeItem }) => (
                        <>
                          <Text>Checklist Items:</Text>
                          {itemFields.map(({ key: itemKey, name: itemName, ...itemRestField }) => (
                            <Space key={itemKey} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                              <Form.Item {...itemRestField} name={[itemName, 'title']} rules={[{ required: true, message: 'Item title is required' }]} style={{ flexGrow: 1 }}>
                                <Input placeholder="e.g., Complete HR paperwork" />
                              </Form.Item>
                              <Button type="text" danger onClick={() => removeItem(itemName)}>
                                <PlusOutlined style={{ transform: 'rotate(45deg)' }} />
                              </Button>
                            </Space>
                          ))}
                          <Form.Item>
                            <Button type="dashed" block onClick={() => addItem({ title: '' })} icon={<PlusOutlined />}>
                              Add Item
                            </Button>
                          </Form.Item>
                        </>
                      )}
                    </Form.List>
                  </Card>
                ))}
                <Form.Item>
                  <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add({ name: '', description: '', items: [] })}>
                    Add New Template
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Form.Item style={{ textAlign: 'right', marginTop: 16 }}>
            <Space>
              <Button onClick={() => setIsInternModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">Create Intern & Assign</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* ---------- Checklist Modal ---------- */}
      <Modal
        title={`Checklists for ${selectedInternName}`}
        open={isChecklistModalVisible}
        onCancel={() => { setIsChecklistModalVisible(false); setSelectedInternChecklists([]); setSelectedInternId(null); }}
        footer={null}
        width={800}
        destroyOnClose
      >
        {checklistLoading ? (
          <Spin size="large" style={{ display: 'block', margin: '40px auto' }} />
        ) : selectedInternChecklists.length === 0 ? (
          <Empty description="No checklists assigned" />
        ) : (
          <Space direction="vertical" style={{ width: '100%' }}>
            {selectedInternChecklists.map(cl => (
              <Card
                key={cl.id}
                title={<Text strong>{cl.template.title}</Text>}
                extra={<Tag color={cl.progress === 100 ? 'green' : 'gold'}>{cl.progress ?? 0}% Complete</Tag>}
              >
                {cl.template.description && <Text type="secondary">{cl.template.description}</Text>}

                <Progress percent={cl.progress ?? 0} size="small" style={{ marginTop: 12, marginBottom: 12 }} />

                <div style={{ marginBottom: 12 }}>
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => handleCompleteAllItems(selectedInternId, cl.id)}
                    disabled={cl.progress === 100 || cl.items.length === 0 || updatingItems.some(id => cl.items.map(i => i.id).includes(id))}
                  >
                    Complete All
                  </Button>
                </div>

                <List
                  dataSource={cl.items}
                  renderItem={item => (
                    <List.Item>
                      <Space>
                        {item.isCompleted ? <CheckCircleFilled style={{ color: 'green' }} /> : <ClockCircleOutlined style={{ color: 'gold' }} />}

                        <Text delete={item.isCompleted}>{item.title}</Text>

                        <Button
                          type="link"
                          size="small"
                          disabled={updatingItems.includes(item.id)}
                          onClick={() => handleToggleChecklistItem(selectedInternId || '', cl.id, item.id, item.isCompleted)}
                        >
                          {item.isCompleted ? 'Mark Incomplete' : 'Mark Complete'}
                        </Button>

                        {updatingItems.includes(item.id) && <SyncOutlined spin />}
                      </Space>
                    </List.Item>
                  )}
                />
              </Card>
            ))}
          </Space>
        )}
      </Modal>
    </MainLayout>
  );
}
