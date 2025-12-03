"use client";
import { useState, useEffect, useCallback } from 'react';
import MainLayout from '@/app/components/MainLayout';
import {
  Typography,
  Card,
  Col,
  Row,
  List,
  Button,
  Spin,
  Alert,
  Tag,
  Space,
  notification,
  Result,
  Form,
  Select,
  Input,
  Modal,
  DatePicker,
} from 'antd';
import {
  ProjectOutlined,
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  ClockCircleOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';
import api from '@/lib/api';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';
import { UserRole } from '../../../common/enums/user-role.enum';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

// ---------- Types ----------
interface InternBasic {
  role: UserRole;
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

interface TaskBasic {
  title: string;
  dueDate: string;
  assignedToInternId: string;
}

interface MilestoneBasic {
  id?: string;
  title: string;
  tasks?: TaskBasic[];
}

interface Project {
  id: string;
  title: string;
  description?: string;
  status: string;
  intern?: InternBasic;
  mentorId: string;
  milestones: MilestoneBasic[];
}

interface ProjectCreationFormContentProps {
  form: any;
  interns: InternBasic[];
  onInternChange: (id: string) => void;
  loadingInterns: boolean;
}

// ---------- Reusable Form Component ----------
const ProjectCreationFormContent: React.FC<ProjectCreationFormContentProps> = ({
  form,
  interns,
  onInternChange,
  loadingInterns,
}) => (
  <>
    <Card title="Project Details" size="small" style={{ marginBottom: 15 }}>
      <Form.Item
        name="title"
        label="Project Title"
        rules={[{ required: true, message: 'Please input project title!' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item name="description" label="Project Description">
        <Input.TextArea rows={2} />
      </Form.Item>
      <Form.Item
        name="internId"
        label="Assign Intern"
        rules={[{ required: true, message: 'Please select an intern!' }]}
        help="All tasks will default to this intern"
      >
        <Select
          placeholder="Select Intern"
          onChange={onInternChange}
          loading={loadingInterns}
          disabled={loadingInterns}
        >
          {interns.map((intern) => (
            <Option key={intern.id} value={intern.id}>
              {intern.firstName} {intern.lastName} ({intern.email})
            </Option>
          ))}
        </Select>
      </Form.Item>
    </Card>
    <Title level={5}>Milestones & Tasks</Title>
    <Form.List name="milestones">
      {(fields, { add, remove }) => (
        <Space direction="vertical" style={{ width: '100%' }}>
          {fields.map(({ key: milestoneKey, name: milestoneName, ...milestoneRestField }) => (
            <Card
              key={milestoneKey}
              size="small"
              title={
                form.getFieldValue(['milestones', milestoneName, 'title']) ||
                `Milestone #${milestoneKey + 1}`
              }
              extra={<MinusCircleOutlined onClick={() => remove(milestoneName)} />}
              style={{ width: '100%', marginBottom: 16 }}
            >
              <Form.Item
                {...milestoneRestField}
                name={[milestoneName, 'title']}
                rules={[{ required: true, message: 'Please input milestone title!' }]}
                label="Milestone Title"
              >
                <Input size="small" />
              </Form.Item>
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
                            <Input placeholder="Task Title" size="small" />
                          </Form.Item>
                        </Col>
                        <Col span={7}>
                          <Form.Item
                            {...taskRestField}
                            name={[taskName, 'dueDate']}
                            rules={[{ required: true, message: 'Please select a due date!' }]}
                            style={{ marginBottom: 0 }}
                          >
                            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" size="small" />
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
                          <Text type="secondary" style={{ lineHeight: '24px', fontSize: '12px' }}>
                            Assigned to:{' '}
                            {interns.find((i) => i.id === form.getFieldValue('internId'))?.firstName ||
                              'Project Intern'}
                          </Text>
                        </Col>
                        <Col span={2}>
                          <MinusCircleOutlined
                            onClick={() => removeTask(taskName)}
                            style={{ fontSize: '16px', color: '#ff4d4f', cursor: 'pointer' }}
                          />
                        </Col>
                      </Row>
                    ))}
                    <Button
                      type="dashed"
                      onClick={() =>
                        addTask({ assignedToInternId: form.getFieldValue('internId') })
                      }
                      block
                      icon={<PlusOutlined />}
                      size="small"
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
  </>
);

// ---------- Main Page ----------
export default function MentorProjectsPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [interns, setInterns] = useState<InternBasic[]>([]);
  const [loadingInterns, setLoadingInterns] = useState(false);

  const mentorId = session?.user?.id;
  const mentorRole = session?.user?.role;

  // ---- Fetch Interns ----
  const fetchInternsList = useCallback(async () => {
    setLoadingInterns(true);
    try {
      const res = await api.get<InternBasic[]>('/users/interns');
      setInterns(res.data.filter(intern => intern.role === UserRole.INTERN));
    } catch (err) {
      notification.error({
        message: 'Failed to load interns',
        description: err instanceof AxiosError
          ? err.response?.data?.message || err.message
          : 'An error occurred while loading interns'
      });
    } finally {
      setLoadingInterns(false);
    }
  }, []);

  // ---- Fetch Projects ----
  const fetchProjects = useCallback(async () => {
    if (!mentorId) {
      setLoading(false);
      setError('Mentor ID not available. Please log in as a mentor.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.get<Project[]>('/projects/mentor');
      setProjects(res.data || []);
    } catch (err: any) {
      console.error('Project fetch failed:', err);
      let message = 'Failed to load projects.';
      if (err instanceof AxiosError && err.response) {
        message = err.response.data?.message || err.message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
      notification.error({
        message: 'Failed to load projects.',
        description: message,
      });
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [mentorId]);

  // ---- Create Project ----
  const handleProjectCreation = useCallback(async (values: any) => {
    try {
      const payload = {
        ...values,
        milestones: values.milestones.map((m: any) => ({
          ...m,
          tasks: m.tasks.map((t: any) => ({
            ...t,
            dueDate: t.dueDate ? dayjs(t.dueDate).format('YYYY-MM-DD') : null,
          })),
        })),
      };

      await api.post('/projects', payload);
      notification.success({ message: 'Project created successfully!' });
      setIsModalVisible(false);
      form.resetFields();
      fetchProjects();
    } catch (error: any) {
      notification.error({
        message: 'Failed to create project',
        description: error?.response?.data?.message || error.message,
      });
    }
  }, [fetchProjects, form]);

  // ---- Utility ----
  const getTotalTasks = useCallback((project: Project) =>
    project.milestones.flatMap((m) => m.tasks || []).length,
  []);

  // ---- Effects ----
  useEffect(() => {
    if (sessionStatus === 'authenticated' && mentorRole === UserRole.MENTOR) {
      fetchInternsList();
      fetchProjects();
    } else if (
      sessionStatus === 'unauthenticated' ||
      (sessionStatus === 'authenticated' && mentorRole !== UserRole.MENTOR)
    ) {
      setLoading(false);
      setError('Access Denied: You must be logged in as a Mentor to view projects.');
    }
  }, [sessionStatus, mentorRole, fetchInternsList, fetchProjects]);

  // ---- Loading State ----
  if (loading || sessionStatus === 'loading') {
    return (
      <MainLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <Space direction="vertical" align="center">
            <Spin size="large" tip="Loading your projects..." />
            <Typography.Text>Loading your projects...</Typography.Text>
          </Space>
        </div>
      </MainLayout>
    );
  }

  // ---- Error ----
  if (error) {
    return (
      <MainLayout>
        <Result status="error" title="Failed to Load Projects" subTitle={error} />
      </MainLayout>
    );
  }

  // ---- Unauthorized ----
  if (sessionStatus === 'unauthenticated' || mentorRole !== UserRole.MENTOR) {
    return (
      <MainLayout>
        <Result
          status="403"
          title="Access Denied"
          subTitle="You do not have permission to view this page."
        />
      </MainLayout>
    );
  }

  // ---- Render ----
  return (
    <MainLayout>
      <Title level={2}>My Assigned Projects</Title>
      <Text type="secondary">
        Overview of all projects defined for your assigned interns. Click "View Tasks" to manage the
        Kanban board (placeholder).
      </Text>

      <Button
        type="primary"
        icon={<PlusOutlined />}
        style={{ margin: '30px 0' }}
        onClick={() => {
          setIsModalVisible(true);
          form.resetFields();
          form.setFieldsValue({ milestones: [{ tasks: [{}] }] });
        }}
      >
        Define New Project
      </Button>

      {projects.length === 0 ? (
        <Alert
          message="No Projects Found"
          description="You haven't defined any projects yet. Use the 'Define New Project' button to get started."
          type="info"
          showIcon
        />
      ) : (
        <Row gutter={[16, 16]}>
          {projects.map((project) => (
            <Col key={project.id} xs={24} sm={12} lg={8}>
              <Card
                title={
                  <Text strong>
                    <ProjectOutlined /> {project.title}
                  </Text>
                }
                extra={
                  <Button
                    type="link"
                    icon={<EditOutlined />}
                    onClick={() => router.push(`/mentor/projects/${project.id}/edit`)}
                  >
                    Edit
                  </Button>
                }
                actions={[
                  <Button
                    type="primary"
                    key="tasks"
                    onClick={() =>
                      project.intern?.id
                        ? router.push(`/intern/tasks?internId=${project.intern.id}`)
                        : notification.error({
                            message: 'No Intern Assigned',
                            description:
                              'This project does not have a primary intern assigned to view tasks.',
                          })
                    }
                    icon={<ClockCircleOutlined />}
                  >
                    View Tasks
                  </Button>,
                ]}
              >
                <Space direction="vertical" size={4}>
                  <Text>
                    <UserOutlined /> Intern:{' '}
                    {project.intern
                      ? `${project.intern.firstName} ${project.intern.lastName}`
                      : 'Not Assigned'}
                  </Text>
                  <Text>Milestones: {project.milestones.length}</Text>
                  <Text>Total Tasks: {getTotalTasks(project)}</Text>
                  <Tag color={project.status === 'Active' ? 'blue' : 'green'}>{project.status}</Tag>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Create Project Modal */}
      <Modal
        title="Create New Intern Project"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={700}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleProjectCreation}
          initialValues={{ milestones: [{ tasks: [{}] }] }}
        >
          <ProjectCreationFormContent
            form={form}
            interns={interns}
            onInternChange={(id) => {
              const milestones = form.getFieldValue('milestones');
              if (milestones) {
                const updatedMilestones = milestones.map((m: any) => ({
                  ...m,
                  tasks: m.tasks.map((t: any) => ({ ...t, assignedToInternId: id }))
                }));
                form.setFieldsValue({ milestones: updatedMilestones });
              }
            }}
            loadingInterns={loadingInterns}
          />
          <Form.Item style={{ marginTop: 20 }}>
            <Button type="primary" htmlType="submit" size="large" block>
              Create Project & Tasks
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </MainLayout>
  );
}
