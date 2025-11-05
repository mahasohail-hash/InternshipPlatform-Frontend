'use client';
import MainLayout from '../../components/MainLayout';
import { Typography, Card, List, Progress, Space, Spin, Result,Tag } from 'antd';
import api from '../../../lib/api';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { AxiosError } from 'axios';

const { Title } = Typography;

// Define Task interface (adjust based on actual Task entity)
interface Task {
  id: string;
  title: string;
  status: 'To Do' | 'In Progress' | 'Done' | 'Blocked'; // Specific enum values
  dueDate?: string; // Optional due date string
}

export default function InternDashboardPage() {
    const { data: session, status: sessionStatus } = useSession();
    const [tasks, setTasks] = useState<Task[]>([]);
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
            if (sessionStatus === 'unauthenticated') {
                // Optionally redirect to login if unauthenticated and no ID
                // router.push('/auth/login');
            } else {
                setError("Intern ID not available. Please ensure you are logged in correctly.");
            }
            return;
        }

        const fetchInternData = async () => {
            setLoading(true);
            setError(null);
            try {
                // CRITICAL FIX: Correct the API endpoint
                const response = await api.get(`/projects/intern/${internId}/tasks`);
                setTasks(response.data);
            } catch (err) {
                console.error("Failed to fetch intern tasks:", err);
                let message = "Could not load tasks.";
                if (err instanceof AxiosError && err.response?.status === 404) {
                    message = "No tasks found for this intern or endpoint is incorrect.";
                } else if (err instanceof AxiosError) {
                    message = err.response?.data?.message || err.message;
                } else if (err instanceof Error) {
                    message = err.message;
                }
                setError(message);
                setTasks([]);
            } finally {
                setLoading(false);
            }
        };

        fetchInternData();
    }, [internId, sessionStatus]);

    const completionRate = tasks.length > 0
        ? (tasks.filter((t) => t.status === 'Done').length / tasks.length) * 100
        : 0;

    if (loading || sessionStatus === 'loading') {
        return (
            <MainLayout>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                    <Spin size="large" tip="Loading your dashboard..." />
                </div>
            </MainLayout>
        );
    }

    if (error) {
        return (
            <MainLayout>
                <Result status="error" title="Failed to Load Data" subTitle={error} />
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <Title level={2}>Welcome to Your Dashboard, {session?.user?.name || session?.user?.email}!</Title>

            <Card title="Overall Task Progress" style={{ marginBottom: 20 }}>
                {tasks.length > 0 ? (
                    <>
                        <Progress
                            percent={Math.round(completionRate)}
                            status={completionRate === 100 ? "success" : completionRate < 50 ? "exception" : "active"}
                        />
                        <p>{tasks.filter(t => t.status === 'Done').length} / {tasks.length} tasks completed.</p>
                    </>
                ) : (
                    <p>No tasks assigned yet.</p>
                )}
            </Card>

            <Title level={3}>Tasks Due Soon / In Progress</Title>
            <List
                bordered
                dataSource={tasks.filter((t) => t.status !== 'Done' && t.status !== 'Blocked').sort((a, b) => {
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                }).slice(0, 5)}
                renderItem={(item) => (
                    <List.Item>
                        <Space direction="vertical" style={{ flexGrow: 1 }}>
                            <Typography.Text strong>{item.title}</Typography.Text>
                            {item.dueDate && (
                                <Typography.Text type="secondary">
                                    Due: {new Date(item.dueDate).toLocaleDateString()}
                                </Typography.Text>
                            )}
                        </Space>
                        <Tag color={item.status === 'In Progress' ? 'blue' : item.status === 'Blocked' ? 'red' : 'default'}>
                            {item.status}
                        </Tag>
                    </List.Item>
                )}
                locale={{ emptyText: 'No pending tasks found.' }}
            />
        </MainLayout>
    );
}