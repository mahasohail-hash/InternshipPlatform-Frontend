"use client";
import { useEffect, useState, useCallback } from 'react';
import MainLayout from '../../../components/MainLayout';
import { Typography, Form, Col, Row, Input, Alert, Button, DatePicker, Select, Space, Card, notification, Spin } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import api from '../../../../lib/api';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { UserRole } from '../../../../common/enums/user-role.enum';
import { AxiosError, isAxiosError } from 'axios';

const { Title, Text } = Typography;
const { Option } = Select;

// --- Type Definitions ---
interface Intern {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: UserRole;
}

interface Task {
  id?: string;
  title: string;
  description?: string;
  dueDate?: string;
  assignedToInternId?: string;
}

interface Milestone {
  id?: string;
  title: string;
  description?: string;
  tasks: Task[];
}

interface ProjectPayload {
  title: string;
  description?: string;
  internId: string;
  milestones: Milestone[];
}
// --- End Type Definitions ---

export default function CreateProjectPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const mentorId = session?.user?.id;
  const mentorRole = session?.user?.role;
  const [form] = Form.useForm();
  const [interns, setInterns] = useState<Intern[]>([]);
  const [loadingInterns, setLoadingInterns] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Data Fetching ---
  const fetchInterns = useCallback(async () => {
    setLoadingInterns(true);
    try {
      const res = await api.get<Intern[]>('/users/interns');
      const validInterns = res.data.filter((u: Intern) => u.role === UserRole.INTERN);
      setInterns(validInterns);
    } catch (error: any) {
      console.error('Failed to fetch interns:', error);
      notification.error({
        message: 'Failed to load interns',
        description: isAxiosError(error)
          ? (error.response?.data?.message || error.message)
          : 'The API endpoint could not be reached.'
      });
      setInterns([]);
    } finally {
      setLoadingInterns(false);
    }
  }, []);

  // --- Effects ---
  useEffect(() => {
    if (sessionStatus === 'authenticated' && mentorId && mentorRole === UserRole.MENTOR) {
      fetchInterns();
    } else if (sessionStatus !== 'loading' && mentorRole !== UserRole.MENTOR) {
      setLoadingInterns(false);
    }
  }, [sessionStatus, mentorId, mentorRole, fetchInterns]);

  // --- Form Submission ---
  const onFinish = useCallback(async (values: any) => {
    setIsSubmitting(true);

    // Validation: Ensure all tasks have an assigned intern ID
    if (!values.milestones || values.milestones.some((m: any) => m.tasks?.some((t: any) => !t.assignedToInternId))) {
      notification.error({
        message: 'Validation Error',
        description: 'One or more tasks are missing an assigned intern ID.'
      });
      setIsSubmitting(false);
      return;
    }

    // Transform form values to match API payload
    const payload: ProjectPayload = {
      ...values,
      milestones: values.milestones.map((m: any) => ({
        ...m,
        tasks: m.tasks.map((t: any) => ({
          ...t,
          dueDate: t.dueDate ? dayjs(t.dueDate).toISOString() : null,
        })),
      })),
      internId: values.internId,
    };

    try {
      await api.post('/projects', payload);
      notification.success({
        message: 'Project Created',
        description: 'Project and all associated tasks are now live.'
      });
      router.push('/mentor/projects');
    } catch (error: any) {
      console.error("Project Creation Failed:", error.response?.data || error.message);
      notification.error({
        message: 'Creation Failed',
        description: isAxiosError(error)
          ? (error.response?.data?.message || error.message)
          : 'An unexpected error occurred.'
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [router]);

  // --- Intern Change Handler ---
  const handleInternChange = useCallback((internId: string) => {
    const milestones = form.getFieldValue('milestones');
    if (milestones) {
      const newMilestones = milestones.map((m: any) => ({
        ...m,
        tasks: m.tasks ? m.tasks.map((t: any) => ({ ...t, assignedToInternId: internId })) : []
      }));
      form.setFieldsValue({ milestones: newMilestones });
    }
  }, [form]);

  // --- Loading/Error States ---
  if (sessionStatus === 'loading' || loadingInterns) {
    return (
      <MainLayout>
        <Spin tip="Loading data..." size="large" />
      </MainLayout>
    );
  }

  if (sessionStatus === 'unauthenticated' || mentorRole !== UserRole.MENTOR) {
    return (
      <MainLayout>
        <Alert
          type="error"
          message="Access Denied"
          description="You must be logged in as a Mentor to define projects."
          showIcon
        />
      </MainLayout>
    );
  }

  // --- Main Render ---
  return (
    <MainLayout>
      <Title level={2}>Define New Project & Tasks</Title>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        style={{ marginTop: 20 }}
        initialValues={{ milestones: [{ tasks: [{}] }] }}
      >
        {/* PROJECT DETAILS CARD */}
        <Card title="Project Details" style={{ marginBottom: 20 }}>
          <Form.Item
            name="title"
            label="Project Title"
            rules={[{ required: true, message: 'Please input project title!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="description" label="Project Description">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item
            name="internId"
            label="Assign Intern"
            rules={[{ required: true, message: 'Please select an intern!' }]}
            help="All tasks will default to this intern"
          >
            <Select
              placeholder="Select Intern"
              onChange={handleInternChange}
              disabled={loadingInterns || isSubmitting}
              loading={loadingInterns}
            >
              {interns.map(intern => (
                <Option key={intern.id} value={intern.id}>
                  {intern.firstName} {intern.lastName} ({intern.email})
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Card>

        {/* MILESTONE LIST */}
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
                  style={{ width: '100%', marginBottom: 16 }}
                >
                  <Form.Item
                    {...milestoneRestField}
                    name={[milestoneName, 'title']}
                    rules={[{ required: true, message: 'Please input milestone title!' }]}
                    label="Milestone Title"
                  >
                    <Input />
                  </Form.Item>

                  {/* TASK LIST */}
                  <Title level={5} style={{ marginTop: 15, marginBottom: 10 }}>Tasks for this Milestone</Title>

                  <Form.List name={[milestoneName, 'tasks']}>
                    {(taskFields, { add: addTask, remove: removeTask }) => (
                      <Space direction="vertical" style={{ width: '100%' }}>
                        {taskFields.map(({ key: taskKey, name: taskName, ...taskRestField }) => (
                          <Row key={taskKey} gutter={8} align="middle" style={{ marginBottom: 8 }}>
                            <Col span={9}>
                              <Form.Item
                                {...taskRestField}
                                name={[taskName, 'title']}
                                rules={[{ required: true, message: 'Please input task title!' }]}
                                style={{ marginBottom: 0 }}
                              >
                                <Input placeholder="Task Title" />
                              </Form.Item>
                            </Col>

                            <Col span={7}>
                              <Form.Item
                                {...taskRestField}
                                name={[taskName, 'dueDate']}
                                rules={[{ required: true, message: 'Please select a due date!' }]}
                                style={{ marginBottom: 0 }}
                              >
                                <DatePicker
                                  style={{ width: '100%' }}
                                  format="YYYY-MM-DD"
                                  placeholder="Due Date"
                                />
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
                              <Text type="secondary" style={{ lineHeight: '32px' }}>
                                Assigned to: {interns.find(i => i.id === form.getFieldValue('internId'))?.firstName || 'Project Intern'}
                              </Text>
                            </Col>

                            <Col span={2}>
                              <MinusCircleOutlined
                                onClick={() => removeTask(taskName)}
                                style={{ fontSize: '18px', color: '#ff4d4f', cursor: 'pointer' }}
                              />
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
                          style={{ marginTop: 8 }}
                        >
                          Add Task
                        </Button>
                      </Space>
                    )}
                  </Form.List>
                </Card>
              ))}

              <Button
                type="dashed"
                onClick={() => add()}
                block
                icon={<PlusOutlined />}
                style={{ marginTop: 10 }}
              >
                Add Milestone
              </Button>
            </Space>
          )}
        </Form.List>

        {/* SUBMIT BUTTON */}
        <Form.Item style={{ marginTop: 20 }}>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={isSubmitting}
          >
            Create Project & Tasks
          </Button>
        </Form.Item>
      </Form>
    </MainLayout>
  );
}
