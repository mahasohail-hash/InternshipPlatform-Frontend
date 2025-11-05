'use client';
import MainLayout from '../../components/MainLayout';
import { Typography, List, Card, Tag, Spin, Result, Space } from 'antd';
import api from '../../../lib/api';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { AxiosError } from 'axios';

const { Title, Text } = Typography;

interface Evaluation {
    id: string;
    score?: number; // Score can be optional
    feedbackText: string;
    type: string; // EvaluationType
    createdAt: string; // CRITICAL FIX: Changed from 'date' to 'createdAt'
    mentor?: { firstName: string, lastName: string }; // Mentor optional for self-reviews
}

export default function InternEvaluationsPage() {
    const { data: session, status: sessionStatus } = useSession();
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const internId = session?.user?.id;

    useEffect(() => {
        if (sessionStatus === 'loading') {
            setLoading(true);
            setError(null);
            return;
        }

        if (!internId) {
            setLoading(false);
            setError("Intern ID not available. Please ensure you are logged in correctly.");
            return;
        }

        const fetchEvaluations = async () => {
            try {
                setLoading(true);
                setError(null);
                // CRITICAL FIX: Frontend calls secured API to read intern's own evaluations
                const res = await api.get(`/evaluations/intern/${internId}`);
                setEvaluations(res.data);
            } catch (err: any) {
                console.error("Failed to fetch intern evaluations:", err);
                let message = "Could not load your evaluations.";
                if (err instanceof AxiosError) {
                    message = err.response?.data?.message || err.message;
                } else if (err instanceof Error) {
                    message = err.message;
                }
                setError(message);
                setEvaluations([]); // Clear evaluations on error
            } finally {
                setLoading(false);
            }
        };
        fetchEvaluations();
    }, [internId, sessionStatus]);

    if (loading || sessionStatus === 'loading') {
        return (
            <MainLayout>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <Spin size="large" tip="Loading evaluations..." />
                </div>
            </MainLayout>
        );
    }

    if (error) {
        return (
            <MainLayout>
                <Result status="error" title="Failed to Load Evaluations" subTitle={error} />
            </MainLayout>
        );
    }

    if (evaluations.length === 0) {
        return (
            <MainLayout>
                <Result status="info" title="No Evaluations Yet" subTitle="Your mentor has not submitted any reviews for you, or you haven't submitted any self-reviews." />
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <Title level={2}>My Performance Feedback</Title>
            <List
                grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 3 }}
                dataSource={evaluations}
                renderItem={(item) => (
                    <List.Item>
                        <Card
                            title={
                                <Space>
                                    <Tag color={item.type.includes('Review') ? 'blue' : 'geekblue'}>{item.type}</Tag>
                                    <Text type="secondary">({new Date(item.createdAt).toLocaleDateString()})</Text> {/* CRITICAL FIX: Use item.createdAt */}
                                </Space>
                            }
                            extra={item.score !== undefined && item.score !== null ?
                                <Tag color={item.score > 3.5 ? 'green' : item.score > 2.5 ? 'gold' : 'red'}>Score: {item.score}/5</Tag>
                                : <Tag>No Score</Tag>
                            }
                        >
                            <Title level={5}>Mentor: {item.mentor ? `${item.mentor.firstName} ${item.mentor.lastName}` : 'N/A (Self-Review)'}</Title>
                            <p>{item.feedbackText.substring(0, 150)}{item.feedbackText.length > 150 ? '...' : ''}</p>
                        </Card>
                    </List.Item>
                )}
            />
        </MainLayout>
    );
}