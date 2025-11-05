'use client'; // This MUST be the very first line of the file, with absolutely no preceding characters or whitespace.

import MainLayout from '../../components/MainLayout';
import { Typography, Card, Col, Row, List, Button, Spin, Alert, Tag, Space, Modal, Form, Input, DatePicker, Select, notification, Result } from 'antd';
import { ProjectOutlined, UserOutlined, PlusOutlined, EditOutlined, FilePdfOutlined, LineChartOutlined, MinusCircleOutlined, GithubOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import api from '../../../lib/api';
import { useSession, signOut } from 'next-auth/react';
import dayjs from 'dayjs';
import { UserRole } from '../../../common/enums/user-role.enum';
import { AxiosError } from 'axios';


const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

// --- DTO INTERFACES (Must match your Backend DTOs and Entity Structures) ---
interface Intern { id: string; firstName: string; lastName: string; email: string; role: UserRole; }
interface ProjectSummary { id: string; title: string; status: string; intern?: Intern; milestones: any[]; }
interface GithubMetricsSummary { totalCommits: number; totalAdditions: number; totalDeletions: number; }
interface NlpSummary { sentimentScore: string; keyThemes: string[]; }
interface InternInsights {
    github?: GithubMetricsSummary;
    nlp?: NlpSummary;
    tasks?: { total: number; completed: number; completionRate: number; };
    evaluationsDue: number;
}
// --- COMPONENT FOR PROJECT CREATION MODAL CONTENT ---
interface ProjectCreationFormContentProps {
  form: any;
  interns: Intern[];
  onInternChange: (id: string) => void;
  loadingInterns: boolean;
}

const ProjectCreationFormContent: React.FC<ProjectCreationFormContentProps> = ({ form, interns, onInternChange, loadingInterns }) => (
    <>
        <Card title="Project Details" size="small" style={{ marginBottom: 15 }}>
            <Form.Item name="title" label="Project Title" rules={[{ required: true, message: 'Please input project title!' }]}><Input /></Form.Item>
            <Form.Item name="description" label="Project Description"><Input.TextArea rows={2} /></Form.Item>
            <Form.Item name="internId" label="Assign Intern" rules={[{ required: true, message: 'Please select an intern!' }]} help="All tasks will default to this intern">
                <Select placeholder="Select Intern" onChange={onInternChange} loading={loadingInterns} disabled={loadingInterns}>
                    {interns.map(intern => (<Option key={intern.id} value={intern.id}>{intern.firstName} {intern.lastName} ({intern.email})</Option>))}
                </Select>
            </Form.Item>
        </Card>

        <Title level={5}>Milestones & Tasks</Title>
        <Form.List name="milestones">
            {(fields, { add, remove }) => (
                <Space direction="vertical" style={{ width: '100%' }}>
                    {fields.map(({ key: milestoneKey, name: milestoneName, ...milestoneRestField }) => (
                        <Card
                            key={milestoneKey}
                            size="small"
                            title={`Milestone: ${form.getFieldValue(['milestones', milestoneName, 'title']) || `Milestone #${milestoneKey + 1}`}`}
                            extra={<MinusCircleOutlined onClick={() => remove(milestoneName)} />}
                            style={{ width: '100%' }}
                        >
                            <Form.Item {...milestoneRestField} name={[milestoneName, 'title']} rules={[{ required: true, message: 'Please input milestone title!' }]} label="Milestone Title"><Input size="small" /></Form.Item>
                            <Form.List name={[milestoneName, 'tasks']}>
                                {(taskFields, { add: addTask, remove: removeTask }) => (
                                    <Space direction="vertical" style={{ width: '100%' }}>
                                        {taskFields.map(({ key: taskKey, name: taskName, ...taskRestField }) => (
                                            <Row key={taskKey} gutter={8} align="middle">
                                                <Col span={9}>
                                                    <Form.Item {...taskRestField} name={[taskName, 'title']} rules={[{ required: true, message: 'Please input task title!' }]} style={{ marginBottom: 0 }}><Input placeholder="Task Title" size="small" /></Form.Item>
                                                </Col>
                                                <Col span={7}>
                                                    <Form.Item {...taskRestField} name={[taskName, 'dueDate']} rules={[{ required: true, message: 'Please select a due date!' }]} style={{ marginBottom: 0 }}><DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" size="small" placeholder="Due Date" /></Form.Item>
                                                </Col>
                                                <Col span={6}>
                                                    <Form.Item {...taskRestField} name={[taskName, 'assignedToInternId']} initialValue={form.getFieldValue('internId')} hidden><Input /></Form.Item>
                                                    <Text type="secondary" style={{ lineHeight: '24px', fontSize: '12px' }}>Assigned to: {interns.find(i => i.id === form.getFieldValue('internId'))?.firstName || 'Project Intern'}</Text>
                                                </Col>
                                                <Col span={2}><MinusCircleOutlined onClick={() => removeTask(taskName)} style={{ fontSize: '16px', color: '#ff4d4f' }} /></Col>
                                            </Row>
                                        ))}
                                        <Button type="dashed" onClick={() => addTask({ assignedToInternId: form.getFieldValue('internId') })} block icon={<PlusOutlined />} size="small">Add Task</Button>
                                    </Space>
                                )}
                            </Form.List>
                        </Card>
                    ))}
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} style={{ marginTop: 10 }}>Add Milestone</Button>
                </Space>
            )}
        </Form.List>
    </>
);


// --- MAIN MENTOR DASHBOARD COMPONENT ---
export default function MentorDashboardPage() {
    const router = useRouter();
    const { data: session, status: sessionStatus } = useSession();
    const [projects, setProjects] = useState<ProjectSummary[]>([]);
    const [interns, setInterns] = useState<Intern[]>([]);
    const [mentorName, setMentorName] = useState('Mentor');
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [loadingInterns, setLoadingInterns] = useState(true);
    const [selectedInternForReport, setSelectedInternForReport] = useState<string | null>(null);
    const [loadingInsights, setLoadingInsights] = useState(false);
    const [firstInternInsights, setFirstInternInsights] = useState<InternInsights | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const mentorId = session?.user?.id;
    const mentorRole = session?.user?.role;

    // --- Memoized function to fetch insights for a specific intern ---
    const fetchInsightsForIntern = useCallback(async (internId: string) => {
        if (!internId) {
            setFirstInternInsights(null);
            setLoadingInsights(false);
            return;
        }
        setLoadingInsights(true);
        try {
            const insightsRes = await api.get<InternInsights>(`/analytics/intern/${internId}/insights`);
            setFirstInternInsights(insightsRes.data);
        } catch (error) {
            console.error("Failed to fetch insights:", error);
            notification.error({ message: 'Failed to load insights for intern.' });
            setFirstInternInsights(null);
        } finally {
            setLoadingInsights(false);
        }
    }, []); // No external dependencies here, so this function is truly stable

    // --- Memoized function to fetch projects ---
    const fetchProjects = useCallback(async () => {
        if (!mentorId) return;
        setLoadingProjects(true);
        try {
            const res = await api.get<ProjectSummary[]>(`/projects/mentor`);
            setProjects(res.data);
            // After projects are loaded, trigger insights fetch for the first intern
            if (res.data.length > 0 && res.data[0].intern?.id) {
                fetchInsightsForIntern(res.data[0].intern.id);
            } else {
                 setFirstInternInsights(null);
            }
        } catch (error) {
            console.error("Failed to load projects:", error);
            notification.error({ message: 'Failed to load projects.' });
        } finally {
            setLoadingProjects(false);
        }
    }, [mentorId, fetchInsightsForIntern]); // fetchInsightsForIntern is a stable dependency

    // --- NEW: Handle PDF Generation Download ---
    const handleGeneratePdfReport = async () => {
        if (!selectedInternForReport) {
            notification.error({ message: 'Please select an intern for the report.' });
            return;
        }
        notification.info({ message: 'Generating PDF report...', duration: 0 });

        try {
            const response = await api.get(`/reports/final-packet/${selectedInternForReport}`, {
                responseType: 'blob', // IMPORTANT: Expect binary data (a Blob)
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `intern_report_${selectedInternForReport}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            notification.success({ message: 'PDF Report Generated and Downloaded!' });

        } catch (error: any) {
            console.error("PDF generation failed:", error.response?.data || error.message);
            notification.error({ message: 'PDF Generation Failed', description: error.response?.data?.message || 'Could not generate PDF.' });
        } finally {
            notification.destroy();
        }
    };


    useEffect(() => {
        if (sessionStatus === 'authenticated' && mentorRole === UserRole.MENTOR) {
            fetchProjects();
        } else if (sessionStatus === 'authenticated' && mentorRole && mentorRole !== UserRole.MENTOR) {
            notification.error({message: 'Access Denied', description: 'Redirecting to appropriate dashboard.'});
            router.push('/');
        } else if (sessionStatus === 'unauthenticated' || sessionStatus === 'loading') {
            // Handled by MainLayout redirect or loading state
        }
    }, [sessionStatus, mentorRole, fetchProjects, router]);

    const fetchInternsList = useCallback(async () => {
        try {
            setLoadingInterns(true);
            const res = await api.get<Intern[]>(`/users`);
            setInterns(res.data.filter((u: Intern) => u.role === UserRole.INTERN));
        } catch (error) {
            console.error("Failed to load intern list for assignment:", error);
            notification.error({ message: 'Failed to load intern list for assignment.' });
        } finally {
            setLoadingInterns(false);
        }
    }, []);

    useEffect(() => {
        if (sessionStatus === 'authenticated' && mentorRole === UserRole.MENTOR) {
            fetchInternsList();
            if (session?.user?.name) {
                setMentorName(session.user.name.split(' ')[0]);
            }
        }
    }, [sessionStatus, mentorRole, fetchInternsList, session?.user?.name]);

    // This useEffect is no longer needed since fetchInsightsForIntern is called directly from fetchProjects
    // useEffect(() => {
    //     if (selectedInternForReport) { // Use selectedInternForReport here if it was for that
    //         fetchInsightsForIntern(selectedInternForReport);
    //     } else {
    //         setFirstInternInsights(null);
    //     }
    // }, [selectedInternForReport, fetchInsightsForIntern]);


    // --- Project Creation Form Submission ---
    const handleProjectCreation = async (values: any) => {
        const payload = {
            ...values,
            milestones: values.milestones.map((m: any) => ({
                ...m,
                tasks: m.tasks.map((t: any) => ({
                    ...t,
                    dueDate: dayjs(t.dueDate).toISOString()
                })),
            })),
            internId: values.internId,
        };

        try {
            await api.post('/projects', payload);
            notification.success({ message: 'Project Created', description: 'Project and all associated tasks are now live.' });
            setIsModalVisible(false);
            form.resetFields();
            fetchProjects();
        } catch (error: any) {
            console.error("Project Creation Failed:", error.response?.data || error.message);
            notification.error({ message: 'Creation Failed', description: error.response?.data?.message || 'Check console for errors.' });
        }
    };

    const handleInternChangeInModal = useCallback((internId: string) => {
        const milestones = form.getFieldValue('milestones');
        if (milestones) {
            const newMilestones = milestones.map((m: any) => ({
                ...m,
                tasks: m.tasks ? m.tasks.map((t: any) => ({ ...t, assignedToInternId: internId })) : []
            }));
            form.setFieldsValue({ milestones: newMilestones });
        }
    }, [form]);


    if (sessionStatus === 'loading' || loadingProjects || loadingInterns) return <MainLayout><Spin size="large" tip="Loading Mentor Dashboard..." /></MainLayout>;

    if (sessionStatus === 'unauthenticated' || mentorRole !== UserRole.MENTOR) {
        return (
            <MainLayout>
                <Result
                    status="403"
                    title="Access Denied"
                    subTitle="You do not have permission to view the Mentor Dashboard."
                />
            </MainLayout>
        );
    }

    // --- Render Content ---
    return (
        <MainLayout>
            <Title level={2}>👋 Welcome, {mentorName}!</Title>
            <Paragraph type="secondary" style={{ marginBottom: '24px' }}>
                Manage your assigned projects, leverage AI insights, and provide feedback to your interns.
            </Paragraph>

 <Row gutter={[24, 24]}> 
                <Col xs={24} md={12}>
                    <Card
                        title="Project Management"
                        extra={
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => { setIsModalVisible(true); form.resetFields(); form.setFieldsValue({ milestones: [{ tasks: [{}] }] }); }}
                            >
                                Define New Project
                            </Button>
                        }
                    >
                        <Paragraph>
                            Create new projects, define milestones and tasks, and assign them to your interns.
                        </Paragraph>
                        <Text strong>
                            <ProjectOutlined style={{ marginRight: 8 }} />
                            {projects.length} Current Project(s)
                        </Text>
                        <Button
                            type="link"
                            onClick={() => router.push('/mentor/projects')}
                            style={{ marginLeft: '10px' }}
                        >
                            View All Projects
                        </Button>
                    </Card>
                </Col>

                <Col xs={24} md={12}>
                    <Card
                        title="Evaluation & Feedback"
                        extra={
                            <Button type="link" icon={<EditOutlined />} onClick={() => router.push('/mentor/evaluate')}>
                                Start Review
                            </Button>
                        }
                    >
                        <Paragraph>
                            Submit weekly notes, midpoint reviews, and final evaluations for your interns' performance.
                        </Paragraph>
                        <Text type="warning" strong>
                            You have **{firstInternInsights?.evaluationsDue || 0} Final Review(s)** due this week.
                        </Text>
                    </Card>
                </Col>

                <Col xs={24} md={12}>
                    <Card
                        title="Objective & AI Insights"
                        loading={loadingInsights}
                        extra={
                            <Button type="link" onClick={() => notification.info({message: 'View all Interns for specific GitHub/NLP reports'})} icon={<LineChartOutlined />}>
                                View Details
                            </Button>
                        }
                    >
                        <Paragraph style={{ marginBottom: 8 }}>
                            <GithubOutlined style={{ marginRight: 8 }} />
                            **GitHub Metrics (4.5):** {firstInternInsights?.github ? (
                                <Text strong style={{marginLeft: 8, color: '#389e0d'}}>
                                    {firstInternInsights.github.totalCommits} Commits (Avg)
                                </Text>
                            ) : (<Text type="secondary" style={{marginLeft: 8}}>Metrics not yet available.</Text>)}
                        </Paragraph>
                        <Paragraph style={{ marginBottom: 0 }}>
                            <UserOutlined style={{ marginRight: 8 }} />
                            **NLP Feedback (4.6):** {firstInternInsights?.nlp ? (
                                <Text strong style={{marginLeft: 8, color: firstInternInsights.nlp.sentimentScore === 'Positive' ? '#389e0d' : '#faad14'}}>
                                    {firstInternInsights.nlp.sentimentScore} Sentiment
                                </Text>
                            ) : (<Text type="secondary" style={{marginLeft: 8}}>No feedback summarized.</Text>)}
                        </Paragraph>
                    </Card>
                </Col>

            <Col xs={24} md={12}>
                <Card
                    title="Reports & Exports"
                    extra={
                        <Select
                            placeholder="Select Intern"
                            style={{ width: 150 }}
                            onChange={value => setSelectedInternForReport(value as string)}
                            value={selectedInternForReport}
                            loading={loadingInterns}
                            disabled={loadingInterns || interns.length === 0}
                        >
                            {interns.map(intern => (
                                <Option key={intern.id} value={intern.id}>{intern.firstName} {intern.lastName}</Option>
                            ))}
                        </Select>
                    }
                >
                    <Paragraph>
                        Generate a comprehensive **PDF packet (4.8)** summarizing evaluations and objective metrics.
                    </Paragraph>
                    <Button
                        type="default"
                        icon={<FilePdfOutlined />}
                        onClick={handleGeneratePdfReport}
                        disabled={!selectedInternForReport}
                    >
                        Generate Final PDF Report
                    </Button>
                </Card>
            </Col>

            <Modal
                title="Create New Intern Project"
                open={isModalVisible}
                onCancel={() => { setIsModalVisible(false); form.resetFields(); }}
                footer={null}
                width={700}
                destroyOnClose
            >
                <Form form={form} layout="vertical" onFinish={handleProjectCreation} initialValues={{ milestones: [{ tasks: [{}] }] }}>
                    <ProjectCreationFormContent form={form} interns={interns} onInternChange={handleInternChangeInModal} loadingInterns={loadingInterns} />

                    <Form.Item style={{ marginTop: 20 }}>
                        <Button type="primary" htmlType="submit" size="large" block>
                            Create Project & Tasks
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
               </Row>
        </MainLayout>
          
    );
}