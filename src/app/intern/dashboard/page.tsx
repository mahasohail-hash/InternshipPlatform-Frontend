// app/intern/dashboard/page.tsx
'use client';
import MainLayout from '../../components/MainLayout';
import { Typography, Card, List, Progress, Space, Spin, Result,Tag } from 'antd'; // Added Spin, Result
import api from '../../../lib/api'; 
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { AxiosError } from 'axios'; // Import AxiosError

const { Title } = Typography;

// Define Task interface (adjust based on actual Task entity)
interface Task {
  id: string;
  title: string;
  status: string; // e.g., 'To Do', 'In Progress', 'Done'
  dueDate?: string; // Optional due date string
}

export default function InternDashboardPage() {
    const { data: session } = useSession(); // Get session data
    const [tasks, setTasks] = useState<Task[]>([]); // Use Task interface
    const [loading, setLoading] = useState(true); // Add loading state
    const [error, setError] = useState<string | null>(null); // Add error state

    // Get internId safely from session
    const internId = (session?.user as any)?.id; 

    useEffect(() => {
        // Only fetch if internId is available
        if (!internId) {
            setLoading(false); // Stop loading if no ID
            
            return; 
        }

        const fetchInternData = async () => {
            setLoading(true);
            setError(null); // Reset error on new fetch
            try {
                // --- FIX: Correct the API endpoint ---
                const response = await api.get(`/projects/intern/${internId}/tasks`); 
                // ------------------------------------
                setTasks(response.data); 
            } catch (err) {
                console.error("Failed to fetch intern tasks:", err);
                let message = "Could not load tasks.";
                if (err instanceof AxiosError && err.response?.status === 404) {
                    message = "No tasks found for this intern or endpoint is incorrect.";
                } else if (err instanceof Error) {
                    message = err.message;
                }
                setError(message); // Set error message
                setTasks([]); // Clear tasks on error
            } finally {
                setLoading(false); // Stop loading regardless of outcome
            }
        };

        fetchInternData();
    // Depend on internId - refetch if it changes (e.g., on login/logout)
    }, [internId]); 

    // Calculate completion rate (check for division by zero)
    const completionRate = tasks.length > 0 
        ? (tasks.filter((t) => t.status === 'Done').length / tasks.length) * 100 
        : 0;

    // --- Render loading state ---
    if (loading) {
        return (
            <MainLayout>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                    <Spin size="large" />
                </div>
            </MainLayout>
        );
    }

    // --- Render error state ---
    if (error) {
        return (
            <MainLayout>
                <Result status="error" title="Failed to Load Data" subTitle={error} />
            </MainLayout>
        );
    }

    // --- Render content ---
    return (
        <MainLayout>
            <Title level={2}>Welcome, Intern! - Your Dashboard</Title>
            
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
                dataSource={tasks.filter((t) => t.status !== 'Done').slice(0, 5)} // Show non-done tasks
                renderItem={(item) => (
                    <List.Item>
                        <Space direction="vertical" style={{ flexGrow: 1 }}>
                            <Typography.Text strong>{item.title}</Typography.Text>
                            {item.dueDate && ( // Only show due date if it exists
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
                locale={{ emptyText: 'No pending tasks found.' }} // Message when list is empty
            />
        </MainLayout>
    );
}