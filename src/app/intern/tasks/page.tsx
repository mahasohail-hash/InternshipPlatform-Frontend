// app/intern/tasks/page.tsx
'use client';
import { useState, useEffect } from 'react';
import MainLayout from '../../components/MainLayout';
import { Typography, Card, List, Checkbox, notification, Tag, Spin } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, SettingOutlined } from '@ant-design/icons';
import api from '../../../lib/api';
import { useSession } from 'next-auth/react';

const { Title, Text } = Typography;

// Mock Data Types (must match backend)
interface Task {
    id: string;
    title: string;
    status: 'To Do' | 'In Progress' | 'Done' | 'Blocked';
    dueDate: string;
    milestone: { project: { title: string } };
}

export default function InternTasksPage() {
    const { data: session } = useSession();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    // CRITICAL: Get internId from the logged-in session
    const internId = (session?.user as any)?.id; 

    const fetchTasks = async () => {
        if (!internId) return;
        setLoading(true);
        try {
            // 1. Frontend calls GET endpoint with intern's ID
            const res = await api.get(`/projects/intern/${internId}/tasks`);
            setTasks(res.data);
        } catch (error) {
            notification.error({ message: 'Error loading tasks' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, [internId]);

    const handleStatusToggle = async (taskId: string, isDone: boolean) => {
        const newStatus = isDone ? 'Done' : 'In Progress';
        
        try {
            // 2. Frontend calls PATCH endpoint to update status
            await api.patch(`/projects/tasks/${taskId}/status`, { status: newStatus });
            
            // 3. Update UI state immediately (Optimistic Update)
            setTasks(tasks.map(task => 
                task.id === taskId ? { ...task, status: newStatus as any } : task
            ));
            notification.success({ message: `Task marked as ${newStatus}!` });
        } catch (error) {
            notification.error({ message: 'Update failed', description: 'Could not change task status.' });
        }
    };
    
    if (loading) return <MainLayout><Spin size="large" /></MainLayout>;

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
                                description={<Text type="secondary">Project: {item.milestone.project.title}</Text>}
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