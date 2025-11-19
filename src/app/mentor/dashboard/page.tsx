// src/app/mentor/dashboard.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import MainLayout from "../../components/MainLayout";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import api from "../../../lib/api";
import dayjs from "dayjs";
import {
  Typography,
  Card,
  Row,
  Col,
  Button,
  Spin,
  Select,
  notification,
  Modal,
  Form,
  Input,
  DatePicker,
  Space,
  List,
  Alert,
  Result,
} from "antd";
import {
  PlusOutlined,
  ProjectOutlined,
  UserOutlined,
  EditOutlined,
  FilePdfOutlined,
  LineChartOutlined,
  GithubOutlined,
  CloudDownloadOutlined,
} from "@ant-design/icons";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

type UserRole = "MENTOR" | "INTERN" | "HR";

interface Intern {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  github_username?: string | null;
  role: UserRole;
}

interface InternInsights {
  github?: {
    totalCommits?: number;
    totalAdditions?: number;
    totalDeletions?: number;
    repos?: any[];
  };
  nlp?: {
    overallSentiment?: string;
    sentimentSummary?: string;
    sentimentScore?: string;
    keyThemes?: string[];
  };
  tasks?: { total?: number; completed?: number; completionRate?: number };
  evaluationsDue?: number;
}

function getGithubFallbackMessage(intern?: Intern | null) {
  if (!intern) return "No intern selected.";
  if (!intern.github_username) return "This intern has no GitHub username linked. Please set one.";
  return "No GitHub activity found for this intern. Fetch data or check backend token validity.";
}

const safeNum = (v?: number) => (typeof v === "number" ? v : 0);

function InternSelect({ interns, value, onChange }: { interns: Intern[]; value?: string | null; onChange: (id: string) => void; }) {
  return (
    <Select
      style={{ width: 220 }}
      placeholder="Select Intern"
      value={value || undefined}
      onChange={(v) => onChange(String(v))}
      showSearch
      optionFilterProp="children"
    >
      {interns.map((i) => (
        <Option key={i.id} value={i.id}>
          {i.firstName} {i.lastName}
        </Option>
      ))}
    </Select>
  );
}

function GithubSummary({ intern, insights, onFetchData }: { intern?: Intern | null; insights?: InternInsights | null; onFetchData: (internId: string) => void }) {
  const router = useRouter();
  if (!intern) return null;
  const github = insights?.github;
  const hasGithubData = github && (safeNum(github.totalCommits) > 0 || safeNum(github.totalAdditions) > 0 || safeNum(github.totalDeletions) > 0 || (github.repos && github.repos.length > 0));
  if (!hasGithubData) {
    return (
      <Card>
        <Alert message={getGithubFallbackMessage(intern)} type="info" showIcon />
        {intern.github_username ? (
          <Button
            type="primary"
            icon={<CloudDownloadOutlined />}
            onClick={() => onFetchData(intern.id)}
            style={{ marginTop: 16 }}
          >
            Fetch Latest GitHub Data
          </Button>
        ) : (
          <Button
            type="primary"
            onClick={() => router.push(`/mentor/interns/${intern.id}/edit`)}
            style={{ marginTop: 16 }}
          >
            Set GitHub Username
          </Button>
        )}
      </Card>
    );
  }
  const commits = safeNum(github?.totalCommits);
  const additions = safeNum(github?.totalAdditions);
  const deletions = safeNum(github?.totalDeletions);
  const repoCount = github?.repos?.length ?? 0;
  return (
    <Card title={<span><GithubOutlined style={{ marginRight: 8 }} /> GitHub Summary</span>}>
      <Paragraph>
        <Text strong>Repos:</Text> {repoCount} &nbsp; • &nbsp; <Text strong>Commits:</Text> {commits}
      </Paragraph>
      <Paragraph>
        <Text strong>Additions:</Text> {additions} &nbsp; • &nbsp; <Text strong>Deletions:</Text> {deletions}
      </Paragraph>
      <div style={{ maxWidth: 480 }}>
        <Bar
          data={{
            labels: ["Commits", "Additions", "Deletions"],
            datasets: [
              {
                label: "Contributions",
                data: [commits, additions, deletions],
                backgroundColor: ["rgba(24,144,255,0.6)", "rgba(40,167,69,0.6)", "rgba(255,99,132,0.6)"],
              },
            ],
          }}
          options={{ responsive: true, plugins: { legend: { display: false } } }}
        />
      </div>
      <Space style={{ marginTop: 12 }}>
        <Button onClick={() => { if (intern) router.push(`/mentor/interns/${intern.id}/github`); }}>View Repo List</Button>
        <Button onClick={() => { if (intern && intern.github_username) window.open(`https://github.com/${intern.github_username}`, "_blank"); }}>Open GitHub</Button>
        <Button
          icon={<CloudDownloadOutlined />}
          onClick={() => onFetchData(intern.id)}
        >
          Fetch Latest
        </Button>
      </Space>
    </Card>
  );
}

function NlpSummary({ insights }: { insights?: InternInsights | null }) {
  const nlp = insights?.nlp;
  if (!nlp || !nlp.sentimentScore || nlp.sentimentScore === "N/A") {
    return (
      <Card>
        <Alert message="No NLP summary available for this intern." type="info" showIcon />
      </Card>
    );
  }
  return (
    <Card title={<span><UserOutlined style={{ marginRight: 8 }} /> NLP Summary</span>}>
      <Paragraph>
        <Text strong>Sentiment:</Text> {nlp.overallSentiment}
      </Paragraph>
      <Paragraph>
        <Text strong>Key Themes:</Text> {nlp.keyThemes?.join(", ") || "—"}
      </Paragraph>
    </Card>
  );
}

function CompareInternsModal({ visible, interns, left, right, data, onClose, onChange }: {
  visible: boolean;
  interns: Intern[];
  left?: string | null; right?: string | null;
  data?: { left?: InternInsights; right?: InternInsights } | null;
  onClose: () => void;
  onChange: (l: string, r: string) => void;
}) {
  return (
    <Modal title="Compare Interns" open={visible} onCancel={onClose} footer={null} width={900}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Select style={{ width: 220 }} value={left || undefined} onChange={(v) => onChange(String(v), right || '')}>
            {interns.map((i) => <Option key={i.id} value={i.id}>{i.firstName} {i.lastName}</Option>)}
          </Select>
          <Text style={{ alignSelf: 'center' }}>vs</Text>
          <Select style={{ width: 220 }} value={right || undefined} onChange={(v) => onChange(left || '', String(v))}>
            {interns.map((i) => <Option key={i.id} value={i.id}>{i.firstName} {i.lastName}</Option>)}
          </Select>
          <Button type="primary" onClick={() => onChange(left || '', right || '')}>Refresh Comparison</Button>
        </Space>
        {(!data && left && right) && <Spin tip="Loading comparison..." />}
        {data && (
          <Row gutter={12}>
            <Col span={12}>
              <Card title={`Summary: ${interns.find(i => i.id === left)?.firstName || 'Left'}`}>
                <Paragraph>{data.left ? `Commits: ${safeNum(data.left.github?.totalCommits)}` : 'No data'}</Paragraph>
                <Paragraph>{data.left ? `Additions: ${safeNum(data.left.github?.totalAdditions)}` : ''}</Paragraph>
                <Paragraph>{data.left ? `Deletions: ${safeNum(data.left.github?.totalDeletions)}` : ''}</Paragraph>
                <Paragraph>{data.left?.nlp?.overallSentiment ? `Sentiment: ${data.left.nlp.overallSentiment}` : 'No NLP'}</Paragraph>
              </Card>
            </Col>
            <Col span={12}>
              <Card title={`Summary: ${interns.find(i => i.id === right)?.firstName || 'Right'}`}>
                <Paragraph>{data.right ? `Commits: ${safeNum(data.right.github?.totalCommits)}` : 'No data'}</Paragraph>
                <Paragraph>{data.right ? `Additions: ${safeNum(data.right.github?.totalAdditions)}` : ''}</Paragraph>
                <Paragraph>{data.right ? `Deletions: ${safeNum(data.right.github?.totalDeletions)}` : ''}</Paragraph>
                <Paragraph>{data.right?.nlp?.overallSentiment ? `Sentiment: ${data.right.nlp.overallSentiment}` : 'No NLP'}</Paragraph>
              </Card>
            </Col>
          </Row>
        )}
      </Space>
    </Modal>
  );
}

function CreateProjectModal({ visible, interns, onClose, onCreate }: { visible: boolean; interns: Intern[]; onClose: () => void; onCreate: (payload: any) => Promise<void> }) {
  const [form] = Form.useForm();
  return (
    <Modal title="Create New Intern Project" open={visible} onCancel={() => { form.resetFields(); onClose(); }} footer={null} width={700} destroyOnClose>
      <Form form={form} layout="vertical" onFinish={onCreate} initialValues={{ milestones: [{ tasks: [{}] }] }}>
        <Card title="Project Details" size="small" style={{ marginBottom: 15 }}>
          <Form.Item name="title" label="Project Title" rules={[{ required: true, message: 'Please input project title!' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Project Description">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="internId" label="Assign Intern" rules={[{ required: true, message: 'Please select an intern!' }]}>
            <Select placeholder="Select Intern">
              {interns.map((intern) => (
                <Option key={intern.id} value={intern.id}>{intern.firstName} {intern.lastName}</Option>
              ))}
            </Select>
          </Form.Item>
        </Card>
        <Form.List name="milestones">
          {(fields, { add, remove }) => (
            <Space direction="vertical" style={{ width: '100%' }}>
              {fields.map(({ key, name, ...restField }, idx) => (
                <Card key={key} size="small" title={`Milestone ${idx + 1}`} extra={<Button type="text" danger onClick={() => remove(name)}>Remove</Button>}>
                  <Form.Item {...restField} name={[name, 'title']} label="Milestone Title" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                  <Form.List name={[name, 'tasks']}>
                    {(taskFields, { add: addTask, remove: removeTask }) => (
                      <Space direction="vertical" style={{ width: '100%' }}>
                        {taskFields.map(({ key: tKey, name: tName, ...taskRest }) => (
                          <Row key={tKey} gutter={8} align="middle">
                            <Col span={10}><Form.Item {...taskRest} name={[tName, 'title']} rules={[{ required: true }]}><Input placeholder="Task Title" /></Form.Item></Col>
                            <Col span={10}><Form.Item {...taskRest} name={[tName, 'dueDate']} rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
                            <Col span={4}><Button danger onClick={() => removeTask(tName)}>Remove</Button></Col>
                          </Row>
                        ))}
                        <Button onClick={() => addTask()}>Add Task</Button>
                      </Space>
                    )}
                  </Form.List>
                </Card>
              ))}
              <Button onClick={() => add()}>Add Milestone</Button>
            </Space>
          )}
        </Form.List>
        <Form.Item style={{ marginTop: 20 }}>
          <Button type="primary" htmlType="submit" block>Create Project & Tasks</Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default function MentorDashboardPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [projects, setProjects] = useState<any[]>([]);
  const [interns, setInterns] = useState<Intern[]>([]);
  const [mentorName, setMentorName] = useState('Mentor');
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingInterns, setLoadingInterns] = useState(true);
  const [selectedInternForReport, setSelectedInternForReport] = useState<string | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [firstInternInsights, setFirstInternInsights] = useState<InternInsights | null>(null);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [compareLeft, setCompareLeft] = useState<string | null>(null);
  const [compareRight, setCompareRight] = useState<string | null>(null);
  const [compareData, setCompareData] = useState<{ left?: InternInsights; right?: InternInsights } | null>(null);
  const mentorRole = session?.user?.role as UserRole | undefined;
  const mentorId = session?.user?.id as string | undefined;

  const fetchInsightsForIntern = useCallback(async (internId: string) => {
    if (!internId) {
      setFirstInternInsights(null);
      return;
    }
    setLoadingInsights(true);
    try {
      const res = await api.get<InternInsights>(`/analytics/summary/${internId}`);
      setFirstInternInsights(res.data);
    } catch (err: any) {
      console.error('Failed to fetch insights', err);
      setFirstInternInsights(null);
      notification.error({ message: 'Failed to load insights', description: err?.response?.data?.message || err.message });
    } finally {
      setLoadingInsights(false);
    }
  }, []);

const handleFetchGithubData = useCallback(async (internId: string) => {
  if (!internId) {
    notification.error({ message: 'No intern selected to fetch GitHub data.' });
    return;
  }
  notification.info({ message: 'Fetching latest GitHub data...', duration: 0 });
  try {
    await api.post(`/github/intern/fetch/${internId}`);
    notification.success({ message: 'GitHub data fetched successfully!' });
    fetchInsightsForIntern(internId);
  } catch (err: any) {
    console.error('Error fetching GitHub data:', err);
    notification.error({
      message: 'Failed to fetch GitHub data',
      description: err?.response?.data?.message || 'Check intern\'s GitHub username and backend token validity.'
    });
  } finally {
    notification.destroy();
  }
}, [fetchInsightsForIntern]);


  const fetchProjects = useCallback(async () => {
    if (!mentorId) return;
    setLoadingProjects(true);
    try {
      const res = await api.get(`/projects/mentor`);
      setProjects(res.data || []);
      if (res.data?.length > 0 && res.data[0].intern?.id && !selectedInternForReport) {
        setSelectedInternForReport(res.data[0].intern.id);
      } else if (selectedInternForReport) {
        fetchInsightsForIntern(selectedInternForReport);
      } else {
        setFirstInternInsights(null);
      }
    } catch (err: any) {
      console.error('Failed to load projects', err);
      notification.error({ message: 'Failed to load projects', description: err?.response?.data?.message || err.message });
    } finally {
      setLoadingProjects(false);
    }
  }, [mentorId, selectedInternForReport, fetchInsightsForIntern]);

  const fetchInterns = useCallback(async () => {
    setLoadingInterns(true);
    try {
      const res = await api.get<Intern[]>(`/users/interns`);
      const list = (res.data || []).filter((u) => u.role === 'INTERN');
      console.log("Available interns:", list.map(i => ({ id: i.id, name: `${i.firstName} ${i.lastName}` })));
      setInterns(list);
      if (list.length > 0 && !selectedInternForReport) {
        setSelectedInternForReport(list[0].id);
      }
      if (list.length >= 2 && (!compareLeft || !compareRight)) {
        setCompareLeft((p) => p || list[0].id);
        setCompareRight((p) => p || list[1].id);
      }
    } catch (err: any) {
      console.error('Failed to load interns', err);
      notification.error({ message: 'Failed to load interns', description: err?.response?.data?.message || err.message });
    } finally {
      setLoadingInterns(false);
    }
  }, [compareLeft, compareRight, selectedInternForReport]);

  useEffect(() => {
    if (sessionStatus === 'authenticated' && mentorRole === 'MENTOR') {
      fetchProjects();
      fetchInterns();
      if (session?.user?.name) setMentorName(String(session.user.name).split(' ')[0]);
    } else if (sessionStatus === 'authenticated' && mentorRole && mentorRole !== 'MENTOR') {
      notification.error({ message: 'Access Denied' });
      router.push('/');
    }
  }, [sessionStatus, mentorRole, fetchProjects, fetchInterns, router, session?.user?.name]);

  useEffect(() => {
    console.log("Selected intern ID:", selectedInternForReport);
    if (selectedInternForReport) {
      fetchInsightsForIntern(selectedInternForReport);
    } else {
      setFirstInternInsights(null);
    }
  }, [selectedInternForReport, fetchInsightsForIntern]);

  const handleGeneratePdf = async () => {
    if (!selectedInternForReport) return notification.error({ message: 'Select intern' });
    notification.info({ message: 'Generating PDF...', duration: 0 });
    try {
      const res = await api.get(`/reports/final-packet/${selectedInternForReport}`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `intern_report_${selectedInternForReport}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      notification.success({ message: 'PDF downloaded' });
    } catch (err: any) {
      console.error('PDF failed', err);
      notification.error({ message: err?.response?.data?.message || 'PDF failed' });
    } finally {
      notification.destroy();
    }
  };

  const handleCreateProject = async (payload: any) => {
    payload.milestones = payload.milestones?.map((m: any) => ({ ...m, tasks: m.tasks?.map((t: any) => ({ ...t, dueDate: t.dueDate ? dayjs(t.dueDate).toISOString() : null })) })) || [];
    try {
      await api.post('/projects', payload);
      notification.success({ message: 'Project created' });
      setIsCreateProjectOpen(false);
      fetchProjects();
    } catch (err: any) {
      console.error('create project failed', err);
      notification.error({ message: 'Project creation failed', description: err?.response?.data?.message || err.message });
    }
  };

  const handleCompare = async (leftId: string, rightId: string) => {
    if (!leftId || !rightId) {
      setCompareData(null);
      return;
    }
    try {
      setCompareData(null);
      const [l, r] = await Promise.all([
        api.get<InternInsights>(`/analytics/summary/${leftId}`),
        api.get<InternInsights>(`/analytics/summary/${rightId}`),
      ]);
      setCompareData({ left: l.data, right: r.data });
    } catch (err: any) {
      console.error('compare fetch failed', err);
      notification.error({ message: 'Compare failed', description: err?.response?.data?.message || err.message });
    }
  };

  if (sessionStatus === 'loading' || loadingProjects || loadingInterns) return <MainLayout><Spin size="large" tip="Loading Mentor Dashboard..." /></MainLayout>;
  if (sessionStatus === 'unauthenticated' || mentorRole !== 'MENTOR') return (<MainLayout><Result status="403" title="Access Denied" subTitle="You do not have permission to view the Mentor Dashboard." /></MainLayout>);

  const currentSelectedIntern = interns.find(i => i.id === selectedInternForReport);

  return (
    <MainLayout>
      <Title level={2}>👋 Welcome, {mentorName}!</Title>
      <Paragraph type="secondary">Manage projects, leverage AI insights, and provide feedback to interns.</Paragraph>
      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Card title="Project Management" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateProjectOpen(true)}>Define New Project</Button>}>
            <Paragraph>Create new projects, define milestones and assign interns.</Paragraph>
            <Text strong><ProjectOutlined style={{ marginRight: 8 }} />{projects.length} Current Project(s)</Text>
            <Button type="link" onClick={() => router.push('/mentor/projects')}>View All Projects</Button>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Evaluation & Feedback" extra={<Button type="link" icon={<EditOutlined />} onClick={() => router.push('/mentor/evaluate')}>Start Review</Button>}>
            <Paragraph>Submit weekly notes, midpoint reviews, and final evaluations for your interns.</Paragraph>
            <Text type="warning" strong>You have <strong>{firstInternInsights?.evaluationsDue || 0}</strong> Final Review(s) due this week.</Text>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Objective & AI Insights" loading={loadingInsights} extra={<Space>
            <InternSelect interns={interns} value={selectedInternForReport} onChange={(v) => { setSelectedInternForReport(v); }} />
            <Button type="link" icon={<LineChartOutlined />} disabled={!selectedInternForReport} onClick={() => selectedInternForReport && router.push(`/mentor/interns/${selectedInternForReport}/insights`)}>View Details</Button>
          </Space>}>
            <GithubSummary intern={currentSelectedIntern} insights={firstInternInsights} onFetchData={handleFetchGithubData} />
            <div style={{ height: 12 }} />
            <NlpSummary insights={firstInternInsights} />
            <div style={{ marginTop: 16 }}>
              <Text strong>AI Summary (repos):</Text>
              <Paragraph style={{ marginTop: 8 }}>{(() => {
                const g = firstInternInsights?.github;
                if (!g || (Object.keys(g).length === 0 && !(g.repos && g.repos.length))) return getGithubFallbackMessage(currentSelectedIntern);
                const repoCount = g.repos?.length || 0;
                return `Across ${repoCount} repo(s): ${safeNum(g.totalCommits)} commits, +${safeNum(g.totalAdditions)} / -${safeNum(g.totalDeletions)} lines.`;
              })()}</Paragraph>
              <Space style={{ marginTop: 12 }}>
                <Button onClick={() => selectedInternForReport && router.push(`/mentor/interns/${selectedInternForReport}/github`)}>GitHub Report</Button>
                <Button onClick={() => selectedInternForReport && router.push(`/mentor/interns/${selectedInternForReport}/nlp`)}>NLP Analysis</Button>
                <Button onClick={() => setIsCompareOpen(true)}>Compare Interns</Button>
              </Space>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Reports & Exports" extra={<InternSelect interns={interns} value={selectedInternForReport} onChange={(v) => { setSelectedInternForReport(v); }} />}>
            <Paragraph>Generate a comprehensive PDF packet summarizing evaluations and objective metrics.</Paragraph>
            <Button type="default" icon={<FilePdfOutlined />} onClick={handleGeneratePdf} disabled={!selectedInternForReport}>Generate Final PDF Report</Button>
          </Card>
        </Col>
      </Row>
      <CreateProjectModal visible={isCreateProjectOpen} interns={interns} onClose={() => setIsCreateProjectOpen(false)} onCreate={handleCreateProject} />
      <CompareInternsModal
        visible={isCompareOpen}
        interns={interns}
        left={compareLeft}
        right={compareRight}
        data={compareData}
        onClose={() => setIsCompareOpen(false)}
        onChange={(l, r) => { setCompareLeft(l); setCompareRight(r); handleCompare(l, r); }}
      />
    </MainLayout>
  );
}
