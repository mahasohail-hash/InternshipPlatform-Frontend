'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, message, Typography, Spin, Form, Input, Button, DatePicker, Select, Space, Row, Col, notification, Result } from 'antd';
import { PlusOutlined, MinusCircleOutlined, SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import MainLayout from '../../../../components/MainLayout'; // Import MainLayout
import api from '../../../../../lib/api'; // Import your API client
import { useSession } from 'next-auth/react';
import { AxiosError } from 'axios';
import { UserRole } from '../../../../../common/enums/user-role.enum';

const { Title, Text } = Typography;
const { Option } = Select;

// --- Interfaces for data from backend ---
interface Intern { id: string; firstName: string; lastName: string; email: string; }

interface TaskData {
  id?: string;
  title: string;
  description?: string;
  dueDate?: string;
  assignedToInternId?: string;
}

interface MilestoneData {
  id?: string;
  title: string;
  description?: string;
  tasks: TaskData[];
}

interface ProjectData {
  id: string;
  title: string;
  description?: string;
  internId: string;
  mentorId: string; // Add mentorId
  milestones: MilestoneData[];
}
// --- END Interfaces ---

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status: sessionStatus } = useSession();
  const [form] = Form.useForm();

  const projectId = Array.isArray(params.id) ? params.id[0] : params.id; // Ensure single string ID

  const [project, setProject] = useState<ProjectData | null>(null);
  const [interns, setInterns] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingInterns, setLoadingInterns] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mentorId = session?.user?.id;
  const userRole = session?.user?.role;

  // 1. Fetch interns for the dropdown
  useEffect(() => {
    if (sessionStatus !== 'authenticated') return;

    const fetchInterns = async () => {
      setLoadingInterns(true);
      try {
        const res = await api.get<Intern[]>('/users/interns'); // Get all users, then filter for interns
        setInterns(res.data.filter(u => (u as any).role === UserRole.INTERN));
      } catch (err: any) {
        console.error("Failed to load interns for project edit:", err);
        notification.error({ message: 'Error', description: err.response?.data?.message || 'Failed to load intern list.' });
      } finally {
        setLoadingInterns(false);
      }
    };
    fetchInterns();
  }, [sessionStatus]);

  // 2. Fetch project data using the projectId
  useEffect(() => {
    if (sessionStatus !== 'authenticated' || !projectId || !mentorId) {
      if (!projectId) setLoading(false);
      return;
    }
    if (typeof projectId !== 'string' || projectId.length < 36) {
      setLoading(false);
      setError("Error: Invalid project ID format.");
      return;
    }

    const fetchProject = async () => {
      setLoading(true);
      setError(null);
      try {
        // CRITICAL FIX: Use your API client and correct endpoint
        const response = await api.get<ProjectData>(`/projects/${projectId}`);
        const data = response.data;
        setProject(data);

        // Populate form fields, ensuring dates are Dayjs objects
        form.setFieldsValue({
          title: data.title,
          description: data.description,
          internId: data.internId,
          milestones: data.milestones.map(m => ({
            ...m,
            tasks: m.tasks.map(t => ({
              ...t,
              dueDate: t.dueDate ? dayjs(t.dueDate) : null,
            })),
          })),
        });
      } catch (err: any) {
        console.error("Failed to fetch project data:", err);
        let message = "Could not load project data.";
        if (err instanceof AxiosError && err.response) {
            message = err.response.data?.message || err.message;
        } else if (err instanceof Error) {
            message = err.message;
        }
        setError(message);
        notification.error({ message: 'Could not load project data.', description: message });
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [projectId, mentorId, sessionStatus]); // Re-run if ID or mentorId changes

  // Handle intern change to update tasks' assignedInternId
  const handleInternChange = (newInternId: string) => {
    const milestones = form.getFieldValue('milestones');
    if (milestones) {
        const updatedMilestones = milestones.map((m: MilestoneData) => ({
            ...m,
            tasks: m.tasks.map(t => ({ ...t, assignedToInternId: newInternId }))
        }));
        form.setFieldsValue({ milestones: updatedMilestones });
    }
  };

  // 3. Handle the form submission
  const onFinish = async (values: any) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...values,
        milestones: values.milestones.map((m: MilestoneData) => ({
          ...m,
          tasks: m.tasks.map((t: TaskData) => ({
            ...t,
            dueDate: t.dueDate ? dayjs(t.dueDate).toISOString() : null, // Convert Dayjs to ISO string
          })),
        })),
        internId: values.internId,
      };

      // CRITICAL FIX: Use your API client and correct endpoint for PATCH
      await api.patch(`/projects/${projectId}`, payload);

      notification.success({ message: 'Project updated successfully!' });
      router.push('/mentor/projects'); // Redirect to mentor projects overview
    } catch (err: any) {
      console.error("Error updating project:", err);
      let message = "An error occurred. Please try again.";
      if (err instanceof AxiosError && err.response) {
          message = err.response.data?.message || err.message;
      } else if (err instanceof Error) {
          message = err.message;
      }
      notification.error({ message: 'Update Failed', description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sessionStatus === 'loading' || loading || loadingInterns) {
    return <MainLayout><Spin tip="Loading project..." size="large" fullscreen /></MainLayout>;
  }

  if (error) {
    return (
      <MainLayout>
        <Result status="error" title="Error Loading Project" subTitle={error}
            extra={<Button type="primary" icon={<ArrowLeftOutlined />} onClick={() => router.back()}>Go Back</Button>}
        />
      </MainLayout>
    );
  }

  if (!project) {
    return <MainLayout><Result status="warning" title="Project not found." /></MainLayout>;
  }

  // Ensure only Mentor or HR can access
  if (userRole !== UserRole.MENTOR && userRole !== UserRole.HR) {
      return (
          <MainLayout>
              <Result status="403" title="Access Denied" subTitle="You do not have permission to edit projects." />
          </MainLayout>
      );
  }

  return (
    <MainLayout>
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()} type="text" style={{ marginBottom: 16 }}>
            Back to Projects
        </Button>
        <Card>
            <Title level={3}>Edit Project: {project.title}</Title>

            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                requiredMark={false}
                initialValues={{ // This ensures fields are reset if form is used for new project (less likely for edit)
                    milestones: [{ tasks: [{}] }]
                }}
            >
                <Card title="Project Details" style={{ marginBottom: 20 }}>
                    <Form.Item name="title" label="Project Title" rules={[{ required: true, message: 'Please enter a project title!' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="description" label="Project Description">
                        <Input.TextArea rows={3} />
                    </Form.Item>

                    <Form.Item name="internId" label="Assign Intern" rules={[{ required: true, message: 'Please select an intern!' }]}>
                        <Select
                            placeholder="Select Intern"
                            onChange={handleInternChange}
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
                </Card>

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
                                    <Form.Item {...milestoneRestField} name={[milestoneName, 'title']} rules={[{ required: true, message: 'Please input milestone title!' }]} label="Milestone Title">
                                        <Input />
                                    </Form.Item>

                                    <Title level={5} style={{ marginTop: 15, marginBottom: 10 }}>Tasks for this Milestone</Title>
                                    <Form.List name={[milestoneName, 'tasks']}>
                                        {(taskFields, { add: addTask, remove: removeTask }) => (
                                            <Space direction="vertical" style={{ width: '100%' }}>
                                                {taskFields.map(({ key: taskKey, name: taskName, ...taskRestField }) => (
                                                    <Row key={taskKey} gutter={8} align="middle">
                                                        <Col span={9}>
                                                            <Form.Item {...taskRestField} name={[taskName, 'title']} rules={[{ required: true, message: 'Please input task title!' }]} style={{ marginBottom: 0 }}>
                                                                <Input placeholder="Task Title" />
                                                            </Form.Item>
                                                        </Col>
                                                        <Col span={7}>
                                                            <Form.Item {...taskRestField} name={[taskName, 'dueDate']} rules={[{ required: true, message: 'Please select a due date!' }]} style={{ marginBottom: 0 }}>
                                                                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="Due Date" />
                                                            </Form.Item>
                                                        </Col>
                                                        <Col span={6}>
                                                            <Form.Item
                                                                {...taskRestField}
                                                                name={[taskName, 'assignedToInternId']}
                                                                initialValue={form.getFieldValue('internId')}
                                                                hidden
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
                    <Button type="primary" htmlType="submit" size="large" loading={isSubmitting}>
                        <SaveOutlined /> Update Project
                    </Button>
                </Form.Item>
            </Form>
        </Card>
    </MainLayout>
  );
}