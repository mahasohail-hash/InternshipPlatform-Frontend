'use client';
import { useState, useEffect } from 'react';
import MainLayout from '../../components/MainLayout';
import { Typography, Card, List, Checkbox, notification, Tag, Spin, Space, Alert, Result } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, SettingOutlined } from '@ant-design/icons';
import api from '../../../lib/api';
import { useSession } from 'next-auth/react';
import { AxiosError } from 'axios';

const { Title, Text } = Typography;

interface Task {
    id: string;
    title: string;
    status: 'To Do' | 'In Progress' | 'Done' | 'Blocked';
    dueDate?: string; // Made optional
    milestone: {
        id: string; // Add milestone ID
        project: {
            id: string; // Add project ID
            title: string;
        };
    };
}

export default function InternTasksPage() {
    const { data: session, status: sessionStatus } = useSession();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const internId = session?.user?.id;

    const fetchTasks = async () => {
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

        setLoading(true);
        setError(null);
        try {
            // CRITICAL: Frontend calls GET endpoint with intern's ID
            const res = await api.get(`/projects/intern/${internId}/tasks`);
            setTasks(res.data);
        } catch (err) {
            console.error("Error loading tasks:", err);
            let message = "Failed to load tasks.";
            if (err instanceof AxiosError) {
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

    useEffect(() => {
        if (sessionStatus === 'authenticated' && internId) {
            fetchTasks();
        } else if (sessionStatus === 'unauthenticated') {
            setLoading(false); // Stop loading if unauthenticated
        }
    }, [internId, sessionStatus]); // Depend on internId and sessionStatus

    const handleStatusToggle = async (taskId: string, isDone: boolean) => {
        const newStatus = isDone ? 'Done' : 'In Progress';

        try {
            // CRITICAL: Frontend calls PATCH endpoint to update status
            await api.patch(`/projects/tasks/${taskId}/status`, { status: newStatus });

            // Optimistic Update
            setTasks(tasks.map(task =>
                task.id === taskId ? { ...task, status: newStatus } : task
            ));
            notification.success({ message: `Task marked as ${newStatus}!` });
        } catch (err: any) {
            console.error("Update task status failed:", err);
            notification.error({ message: 'Update failed', description: err.response?.data?.message || 'Could not change task status.' });
        }
    };

    if (loading || sessionStatus === 'loading') {
        return (
            <MainLayout>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <Spin size="large" tip="Loading your tasks..." />
                </div>
            </MainLayout>
        );
    }

    if (error) {
        return (
            <MainLayout>
                <Result status="error" title="Failed to Load Tasks" subTitle={error} />
            </MainLayout>
        );
    }

    if (tasks.length === 0) {
        return (
            <MainLayout>
                <Alert message="No Tasks Assigned" description="You currently have no tasks assigned to you." type="info" showIcon />
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <Title level={2}>My Assigned Tasks</Title>
            <Text type="secondary">View and update the status of your assigned project tasks.</Text>

            <List
                style={{ marginTop: 20 }}
                itemLayout="horizontal"
                dataSource={tasks}
                renderItem={(item) => (
                    <Card style={{ marginBottom: 15 }} bodyStyle={{ padding: 15 }}>
                        <List.Item>
                            <List.Item.Meta
                                avatar={
                                    <Checkbox
                                        checked={item.status === 'Done'}
                                        onChange={(e) => handleStatusToggle(item.id, e.target.checked)}
                                    />
                                }
                                title={<Title level={5} style={{ margin: 0 }}>{item.title}</Title>}
                                description={<Text type="secondary">Project: {item.milestone?.project?.title || 'N/A Project'}</Text>}
                            />
                            <div>
                                <Tag color={item.status === 'Done' ? 'green' : item.status === 'In Progress' ? 'blue' : 'default'}>{item.status}</Tag>
                                <Text style={{ marginLeft: 10 }}>Due: {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'N/A'}</Text>
                            </div>
                        </List.Item>
                    </Card>
                )}
            />
        </MainLayout>
    );
}