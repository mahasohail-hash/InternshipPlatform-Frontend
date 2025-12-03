'use client';
import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../../components/MainLayout';
import {
    Typography, Form, Input, Button, Select, notification, Spin, Card, Space, Rate, Alert, Row, Col, Divider, Tag,
} from 'antd';
import {
    RobotOutlined, SendOutlined, LoadingOutlined, EditOutlined, SmileOutlined, GlobalOutlined, UserOutlined
} from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import api from '../../../lib/api';
import { isAxiosError } from 'axios';
import { UserRole } from '../../../common/enums/user-role.enum';
import { EvaluationType } from '../../../common/enums/evaluation-type.enum';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// --- INTERFACES ---
interface InternUser {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
}

interface NlpSummaryDisplay {
    sentimentScore: string;
    keyThemes: string[];
}

interface GithubMetricsDashboard {
    totalCommits: number;
    totalAdditions: number;
    totalDeletions: number;
}

interface TasksDashboard {
    total: number;
    completed: number;
    completionRate: number;
}

interface InternInsights {
    github?: GithubMetricsDashboard;
    nlp?: NlpSummaryDisplay;
    tasks?: TasksDashboard;
    evaluationsDue: number;
}
// --- END INTERFACES ---

// --- NlpSummaryCard Component ---
interface NlpSummaryCardProps {
    summary: NlpSummaryDisplay | null;
    loading: boolean;
}

const NlpSummaryCard: React.FC<NlpSummaryCardProps> = ({ summary, loading }) => {
    if (loading) {
        return (
            <Card
                title={<Title level={4} style={{ marginBottom: 0 }}><GlobalOutlined /> NLP Feedback Summary</Title>}
                style={{ marginBottom: 20 }}
            >
                <Spin tip="Analyzing feedback..." />
            </Card>
        );
    }

    if (!summary || (summary.sentimentScore === 'N/A' && summary.keyThemes.length === 0)) {
        return (
            <Card
                title={<Title level={4} style={{ marginBottom: 0 }}><GlobalOutlined /> NLP Feedback Summary</Title>}
                style={{ marginBottom: 20 }}
            >
                <Text type="secondary">
                    No NLP summary available for this intern yet (requires prior evaluation feedback).
                </Text>
            </Card>
        );
    }

    return (
        <Card
            title={<Title level={4} style={{ marginBottom: 0 }}><GlobalOutlined /> NLP Feedback Summary</Title>}
            style={{ marginBottom: 20 }}
            extra={
                <Button
                    type="link"
                    icon={<EditOutlined />}
                    onClick={() => notification.info({ message: "Click to edit raw feedback or trigger re-analysis." })}
                >
                    Edit Source
                </Button>
            }
        >
            <Alert
                message={
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                        <Text>
                            <SmileOutlined /> Sentiment:{" "}
                            <Tag color={
                                summary.sentimentScore === 'Positive' ? 'green' :
                                summary.sentimentScore === 'Negative' ? 'error' : 'blue'
                            }>
                                {summary.sentimentScore}
                            </Tag>
                        </Text>
                        <Text>
                            <RobotOutlined /> Top Themes:{" "}
                            {summary.keyThemes.length > 0 ? (
                                summary.keyThemes.map((theme, index) => <Tag key={index}>{theme}</Tag>)
                            ) : (
                                <Text italic>No specific themes identified.</Text>
                            )}
                        </Text>
                    </Space>
                }
                type={
                    summary.sentimentScore === 'Positive' ? 'success' :
                    summary.sentimentScore === 'Negative' ? 'error' : 'info'
                }
                showIcon
            />
        </Card>
    );
};

export default function MentorEvaluationPage() {
    const { data: session, status: sessionStatus } = useSession();
    const mentorId = session?.user?.id;
    const mentorRole = session?.user?.role;
    const [form] = Form.useForm();
    const [interns, setInterns] = useState<InternUser[]>([]);
    const [loadingInterns, setLoadingInterns] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [generatingDraft, setGeneratingDraft] = useState(false);
    const [nlpSummary, setNlpSummary] = useState<NlpSummaryDisplay | null>(null);
    const [loadingNlpSummary, setLoadingNlpSummary] = useState(false);
    const selectedInternId = Form.useWatch('internId', form);

    // --- Data Fetching Callbacks ---
    const fetchInternUsers = useCallback(async () => {
        if (sessionStatus !== 'authenticated') return;
        setLoadingInterns(true);
        try {
            const res = await api.get('/users/interns');
            const rawData = res.data || [];
            const validInterns = rawData.filter((u: any) => u.role === UserRole.INTERN);
            setInterns(validInterns.map((u: any) => ({
                id: u.id,
                firstName: u.firstName,
                lastName: u.lastName,
                email: u.email,
                role: u.role
            })));
        } catch (err: any) {
            console.error('Failed to fetch interns:', err);
            notification.error({
                message: 'Error',
                description: err.response?.data?.message || 'Could not load intern list.'
            });
            setInterns([]);
        } finally {
            setLoadingInterns(false);
        }
    }, [sessionStatus]);

    const fetchNlpSummary = useCallback(async (internId: string) => {
        setNlpSummary(null);
        if (!internId) {
            setLoadingNlpSummary(false);
            return;
        }
        setLoadingNlpSummary(true);
        try {
            const insightsRes = await api.get<InternInsights>(`/analytics/intern/${internId}/insights`);
            setNlpSummary(insightsRes.data.nlp || null);
        } catch (error: any) {
            console.warn('Could not fetch NLP summary for intern:', isAxiosError(error) ? error.response?.data : error);
            setNlpSummary(null);
        } finally {
            setLoadingNlpSummary(false);
        }
    }, []);

    // --- Effect hooks to trigger data fetches ---
    useEffect(() => {
        if (sessionStatus === 'authenticated' && mentorRole === UserRole.MENTOR) {
            fetchInternUsers();
        } else if (sessionStatus === 'unauthenticated') {
            setLoadingInterns(false);
        }
    }, [sessionStatus, mentorRole, fetchInternUsers]);

    useEffect(() => {
        if (selectedInternId) {
            fetchNlpSummary(selectedInternId);
        } else {
            setNlpSummary(null);
        }
    }, [selectedInternId, fetchNlpSummary]);

    // --- Core Feature: AI Drafting ---
    const handleGenerateAiDraft = async () => {
        if (!selectedInternId) {
            notification.error({ message: 'Please select an intern first.' });
            return;
        }
        setGeneratingDraft(true);
        try {
            const response = await api.post(`/evaluations/draft-review/${selectedInternId}`);
            const aiDraft = response.data.draft;
            form.setFieldsValue({
                feedbackText: `${aiDraft}\n\n[AI Generated Draft - Review and Edit]`
            });
            notification.success({
                message: 'AI Draft Generated',
                description: 'Review the text below and edit as needed.'
            });
        } catch (error: any) {
            console.error("AI Draft generation failed:", error.response?.data || error.message);
            notification.error({
                message: 'AI Draft Failed',
                description: error.response?.data?.message || 'Could not generate draft.'
            });
        } finally {
            setGeneratingDraft(false);
        }
    };

    // --- Form Submission ---
    const onFinish = async (values: any) => {
        setIsSubmitting(true);
        try {
            const payload = {
                internId: values.internId,
                type: values.type,
                score: values.score,
                feedbackText: values.feedbackText,
            };
            await api.post('/evaluations', payload);
            notification.success({
                message: 'Evaluation Submitted',
                description: 'The performance review has been successfully recorded.'
            });
            form.resetFields();
            setNlpSummary(null);
        } catch (error: any) {
            let errorDesc = isAxiosError(error) ? error.response?.data?.message || 'Submission failed.' : 'An unexpected error occurred.';
            notification.error({
                message: 'Submission Failed',
                description: errorDesc
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Authorization and Loading Checks ---
    if (sessionStatus === 'loading' || loadingInterns) {
        return <MainLayout><Spin tip="Loading data..." size="large" /></MainLayout>;
    }

    if (sessionStatus === 'unauthenticated' || mentorRole !== UserRole.MENTOR) {
        return (
            <MainLayout>
                <Alert
                    type="error"
                    message="Access Denied"
                    description="Requires Mentor role to access Evaluation Form."
                    showIcon
                />
            </MainLayout>
        );
    }

    // --- Render Content ---
    return (
        <MainLayout>
            <Title level={2}>Submit Intern Evaluation</Title>
            <Paragraph type="secondary">
                Submit weekly notes, midpoint, final, or self-evaluations for your interns. Use AI insights to draft your reviews.
            </Paragraph>
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                style={{ maxWidth: 700, margin: '0 auto' }}
            >
                {/* 1. Intern Selection */}
                <Form.Item
                    name="internId"
                    label="Select Intern"
                    rules={[{ required: true, message: 'Please select an intern' }]}
                >
                    <Select
                        placeholder="Choose intern to evaluate"
                        onChange={value => form.setFieldValue('internId', value)}
                        loading={loadingInterns}
                        disabled={loadingInterns}
                    >
                        {interns.map(intern => (
                            <Option key={intern.id} value={intern.id}>
                                {intern.firstName} {intern.lastName} ({intern.email})
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                {/* 2. NLP Summary Card (Visible when an intern is selected) */}
                {selectedInternId && (
                    <NlpSummaryCard
                        summary={nlpSummary}
                        loading={loadingNlpSummary}
                    />
                )}

                <Row gutter={16}>
                    <Col span={12}>
                        {/* Evaluation Type Selection */}
                        <Form.Item
                            name="type"
                            label="Evaluation Type"
                            rules={[{ required: true }]}
                        >
                            <Select placeholder="Select type of review">
                                {Object.values(EvaluationType).map((typeString: string) => (
                                    <Option key={typeString} value={typeString}>
                                        {typeString}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        {/* 4. Score/Rating */}
                        <Form.Item
                            name="score"
                            label="Overall Performance Score (1-5)"
                            rules={[{ required: true, message: 'Please provide a score' }]}
                        >
                            <Rate allowHalf count={5} />
                        </Form.Item>
                    </Col>
                </Row>

                {/* 5. Detailed Feedback & AI Draft Button */}
                <Form.Item label="Detailed Feedback" required>
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <Form.Item
                            name="feedbackText"
                            noStyle
                            rules={[{ required: true, message: 'Please enter detailed feedback' }]}
                        >
                            <TextArea
                                rows={10}
                                placeholder="Describe the intern's strengths, areas for improvement and overall contributions."
                            />
                        </Form.Item>
                        <Button
                            icon={generatingDraft ? <Spin size="small" /> : <RobotOutlined />}
                            onClick={handleGenerateAiDraft}
                            disabled={!selectedInternId || generatingDraft}
                            block
                            type="dashed"
                        >
                            Generate AI Draft
                        </Button>
                    </Space>
                </Form.Item>

                <Divider />

                <Form.Item style={{ marginTop: 20 }}>
                    <Button
                        type="primary"
                        htmlType="submit"
                        size="large"
                        block
                        loading={isSubmitting}
                    >
                        <SendOutlined /> Submit Evaluation
                    </Button>
                </Form.Item>
            </Form>
        </MainLayout>
    );
}
