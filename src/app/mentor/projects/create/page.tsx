// app/mentor/project/create/page.tsx
'use client';
import MainLayout from '../../../components/MainLayout';
import { Typography, Form,Col, Row, Input,Alert, Button, DatePicker, Select, Space, Card, notification, Spin } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import api from '../../../../lib/api';
import { useSession } from 'next-auth/react'; 
import { useState, useEffect ,useCallback} from 'react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { UserRole } from '../../../../common/enums/user-role.enum'; 
const { Title, Text } = Typography;
const { Option } = Select;

// Type for the Interns fetched from the backend (for the dropdown)
interface Intern { 
    id: string;
     firstName: string;
      lastName: string;
       email: string;
    role?: UserRole;
    }

export default function CreateProjectPage() {
    const router = useRouter();
    const { data: session, status: sessionStatus } = useSession();
    const mentorId = (session?.user as any)?.id;
    const [form] = Form.useForm();
    const [interns, setInterns] = useState<Intern[]>([]);
    const [loadingInterns, setLoadingInterns] = useState(true);

    // 1. Fetch the list of Interns for the assignment dropdown
   // --- Data Fetching ---
    const fetchInterns = useCallback(async () => {
        setLoadingInterns(true);
        try {
            // FIX: Use the standardized and correct backend route
const res = await api.get('/api/users/interns');            // Assuming the backend returns only INTERNs, but filtering defensively for safety
            const validInterns = res.data.filter((u: Intern) => u.role === UserRole.INTERN || !u.role);

            setInterns(validInterns);
        } catch (error) {
            console.error('Failed to fetch interns:', error);
            // This notification is what the user sees upon API failure
            notification.error({ 
                message: 'Failed to load interns', 
                description: 'The API endpoint /api/users/interns could not be reached or returned an error.' 
            });
            setInterns([]);
        } finally {
            setLoadingInterns(false);
        }
    }, []);

// 1. Fetch the list of Interns only after authentication is confirmed
    useEffect(() => {
        if (sessionStatus === 'authenticated' && mentorId) {
            fetchInterns();
        } else if (sessionStatus !== 'loading') {
            setLoadingInterns(false);
        }
    }, [sessionStatus, mentorId, fetchInterns]);
    // ---

    if (sessionStatus === 'loading') {
        return <MainLayout><Spin tip="Authenticating..." /></MainLayout>;
    }
    
    if (sessionStatus === 'unauthenticated' || (session?.user as any)?.role !== UserRole.MENTOR) {
        return (
            <MainLayout>
                <Alert type="error" message="Access Denied" description="You must be logged in as a Mentor to define projects." showIcon />
            </MainLayout>
        );
    }

    const onFinish = async (values: any) => {
        // Validation: Ensure all tasks assigned to an intern have an internId
        if (!values.milestones || values.milestones.some((m: any) => m.tasks?.some((t: any) => !t.assignedToInternId))) {
             notification.error({ message: 'Validation Error', description: 'One or more tasks are missing an assigned intern ID.' });
             return;
        }

        // 2. Transform form values to match CreateProjectDto for NestJS
        const payload = {
            ...values,
            milestones: values.milestones.map((m: any) => ({
                ...m,
                tasks: m.tasks.map((t: any) => ({
                    ...t,
                    // Convert Ant Design's Dayjs object to ISO string
                    dueDate: dayjs(t.dueDate).toISOString(), 
                })),
            })),
            // Ensure the mentor ID is implicitly attached on the backend, but internId is explicit
            internId: values.internId,
        };

        try {
            await api.post('/api/projects', payload);
            notification.success({ message: 'Project Created', description: 'Project and all associated tasks are now live.' });
            router.push('/mentor/projects'); // Redirect to project overview
        } catch (error: any) {
             notification.error({ message: 'Creation Failed', description: error.response?.data?.message || 'Check console for errors.' });
        }
    };
    
    // Function to ensure inner tasks default to the project's main intern
    const handleInternChange = (internId: string) => {
        // This is a complex Ant Design trick: if the main intern changes, update the hidden intern ID in all existing tasks
        const milestones = form.getFieldValue('milestones');
        if (milestones) {
            const newMilestones = milestones.map((m: any) => ({
                ...m,
                tasks: m.tasks ? m.tasks.map((t: any) => ({ ...t, assignedToInternId: internId })) : []
            }));
            form.setFieldsValue({ milestones: newMilestones });
        }
    };

    return (
        <MainLayout>
            <Title level={2}>Define New Project & Tasks</Title>
            <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 20 }}>

                {/* PROJECT DETAILS CARD */}
                <Card title="Project Details" style={{ marginBottom: 20 }} loading={loadingInterns}>
                    <Form.Item name="title" label="Project Title" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="description" label="Project Description">
                        <Input.TextArea rows={3} />
                    </Form.Item>
                    
                    <Form.Item name="internId" label="Assign Intern" rules={[{ required: true }]} help="All tasks will default to this intern">
                        <Select 
                            placeholder="Select Intern" 
                            onChange={handleInternChange} // Update all existing tasks when main intern changes
                            disabled={loadingInterns}
                        >
                            {interns.map(intern => (
                                <Option key={intern.id} value={intern.id}>
                                    {intern.firstName} {intern.lastName} ({intern.email})
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Card>

                {/* MILESTONE LIST (Nested Form.List) */}
                <Title level={4}>Milestones & Tasks</Title>
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
                                    <Form.Item {...milestoneRestField} name={[milestoneName, 'title']} rules={[{ required: true }]} label="Milestone Title">
                                        <Input />
                                    </Form.Item>

                                    {/* TASK LIST (Inner Form.List) */}
                                    <Title level={5} style={{ marginTop: 15, marginBottom: 10 }}>Tasks for this Milestone</Title>
                                    <Form.List name={[milestoneName, 'tasks']}>
                                        {(taskFields, { add: addTask, remove: removeTask }) => (
                                            <Space direction="vertical" style={{ width: '100%' }}>
                                                {taskFields.map(({ key: taskKey, name: taskName, ...taskRestField }) => (
                                                    <Row key={taskKey} gutter={8} align="middle">
                                                        <Col span={9}>
                                                            <Form.Item {...taskRestField} name={[taskName, 'title']} rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                                                                <Input placeholder="Task Title" />
                                                            </Form.Item>
                                                        </Col>
                                                        <Col span={7}>
                                                            <Form.Item {...taskRestField} name={[taskName, 'dueDate']} rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                                                                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="Due Date" />
                                                            </Form.Item>
                                                        </Col>
                                                        <Col span={6}>
                                                            <Form.Item 
                                                                {...taskRestField} 
                                                                name={[taskName, 'assignedToInternId']} 
                                                                initialValue={form.getFieldValue('internId')} 
                                                                hidden // Assign to the main project intern ID
                                                            >
                                                                <Input />
                                                            </Form.Item>
                                                            <Text type="secondary" style={{ lineHeight: '32px' }}>Assigned to: {interns.find(i => i.id === form.getFieldValue('internId'))?.firstName || 'Project Intern'}</Text>
                                                        </Col>
                                                        <Col span={2}>
                                                            <MinusCircleOutlined onClick={() => removeTask(taskName)} style={{ fontSize: '18px', color: '#ff4d4f' }} />
                                                        </Col>
                                                    </Row>
                                                ))}
                                                <Button 
                                                    type="dashed" 
                                                    onClick={() => {
                                                        const mainInternId = form.getFieldValue('internId');
                                                        addTask({ assignedToInternId: mainInternId });
                                                    }} 
                                                    block 
                                                    icon={<PlusOutlined />}
                                                >
                                                    Add Task
                                                </Button>
                                            </Space>
                                        )}
                                    </Form.List>
                                </Card>
                            ))}
                            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} style={{ marginTop: 10 }}>
                                Add Milestone
                            </Button>
                        </Space>
                    )}
                </Form.List>

                <Form.Item style={{ marginTop: 20 }}>
                    <Button type="primary" htmlType="submit" size="large">
                        Create Project & Tasks
                    </Button>
                </Form.Item>
            </Form>
        </MainLayout>
    );
}