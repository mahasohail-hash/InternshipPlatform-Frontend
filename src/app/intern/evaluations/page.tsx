// app/intern/evaluations/page.tsx
'use client';
import MainLayout from '../../components/MainLayout';
import { Typography, List, Card, Tag, Spin, Result, Space } from 'antd';import api from '../../../lib/api';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

const { Title, Text } = Typography;

interface Evaluation {
    id: string;
    score: number;
    feedbackText: string;
    type: string; // EvaluationType
    date: string;
    mentor: { firstName: string, lastName: string };
}

export default function InternEvaluationsPage() {
    const { data: session } = useSession();
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [loading, setLoading] = useState(true);
    const internId = (session?.user as any)?.id;

    useEffect(() => {
        if (!internId) return;
        const fetchEvaluations = async () => {
            try {
                // 1. Frontend calls secured API to read intern's own evaluations
                const res = await api.get(`/evaluations/intern/${internId}`); 
                setEvaluations(res.data);
            } catch (error) {
                // Error handling
            } finally {
                setLoading(false);
            }
        };
        fetchEvaluations();
    }, [internId]);

    if (loading) return <MainLayout><Spin size="large" /></MainLayout>;
    if (evaluations.length === 0) {
        return <MainLayout><Result status="info" title="No Evaluations Yet" subTitle="Your mentor has not submitted any reviews for you." /></MainLayout>;
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
                                    <Text type="secondary">({new Date(item.date).toLocaleDateString()})</Text>
                                </Space>
                            }
                            extra={<Tag color={item.score > 3.5 ? 'green' : item.score > 2.5 ? 'gold' : 'red'}>Score: {item.score}/5</Tag>}
                        >
                            <Title level={5}>Mentor: {item.mentor.firstName} {item.mentor.lastName}</Title>
                            <p>{item.feedbackText.substring(0, 150)}...</p>
                        </Card>
                    </List.Item>
                )}
            />
        </MainLayout>
    );
}