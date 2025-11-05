'use client';
import MainLayout from '@/app/components/MainLayout'; // CRITICAL FIX: Corrected alias usage
import {
  Typography,
  List,
  Card,
  Tag,
  notification,
  Button,
  Spin,
  Alert,
  Row,
  Col,
  Space,
  Result,
} from 'antd';
import {
  ProjectOutlined,
  UserOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useState, useEffect } from 'react';
import api from '@/lib/api'; // CRITICAL FIX: Corrected alias usage
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';
import { UserRole } from '../../../common/enums/user-role.enum'; // Import UserRole

const { Title, Text } = Typography;

interface InternBasic { // Define basic intern interface
  id: string;
  firstName: string;
  lastName: string;
}

interface MilestoneBasic { // Define basic milestone interface
  id: string;
  title: string;
  tasks?: any[]; // Tasks array is optional or could be basic
}

interface Project {
  id: string;
  title: string;
  description?: string;
  status: string; // 'Active' | 'Completed' | 'On Hold' etc.
  intern?: InternBasic; // Project's primary intern (optional)
  mentorId: string; // Add mentorId
  milestones: MilestoneBasic[];
}

export default function MentorProjectsPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mentorId = session?.user?.id;
  const mentorRole = session?.user?.role;

  const fetchProjects = async () => {
    if (!mentorId) {
        setLoading(false);
        setError("Mentor ID not available. Please log in as a mentor.");
        return;
    }
    setLoading(true);
    setError(null);
    try {
      // CRITICAL FIX: Correct endpoint for mentor's projects
      const res = await api.get('/projects/mentor');
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
  };

  useEffect(() => {
    if (sessionStatus === 'authenticated' && mentorRole === UserRole.MENTOR) {
      fetchProjects();
    } else if (sessionStatus === 'unauthenticated' || (sessionStatus === 'authenticated' && mentorRole !== UserRole.MENTOR)) {
        setLoading(false);
        setError("Access Denied: You must be logged in as a Mentor to view projects.");
    }
  }, [mentorId, sessionStatus, mentorRole]);


  const getTotalTasks = (project: Project) =>
    project.milestones.flatMap(m => m.tasks || []).length; // Safely access tasks

  if (loading || sessionStatus === 'loading') {
    return (
      <MainLayout>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '300px',
          }}
        >
          <Space direction="vertical" align="center">
            <Spin size="large" tip="Loading your projects..." />
            <Typography.Text>Loading your projects...</Typography.Text>
          </Space>
        </div>
      </MainLayout>
    );
  }

  if (error) {
      return (
          <MainLayout>
              <Result status="error" title="Failed to Load Projects" subTitle={error} />
          </MainLayout>
      );
  }

  // Final check for unauthorized access if error didn't catch it
  if (sessionStatus === 'unauthenticated' || mentorRole !== UserRole.MENTOR) {
    return (
        <MainLayout>
            <Result status="403" title="Access Denied" subTitle="You do not have permission to view this page." />
        </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Title level={2}>My Assigned Projects</Title>
      <Text type="secondary">
        Overview of all projects defined for your assigned interns. Click "View
        Tasks" to manage the Kanban board (placeholder).
      </Text>

      <Button
        type="primary"
        icon={<PlusOutlined />}
        style={{ margin: '30px 0' }} // Adjust margin
        onClick={() => router.push('/mentor/project/create')}
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
          {projects.map(project => (
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
                    onClick={() =>
                      router.push(`/mentor/projects/${project.id}/edit`) // CRITICAL FIX: Correct path for edit
                    }
                  >
                    Edit
                  </Button>
                }
                actions={[
                  <Button
                    type="primary"
                    key="tasks"
                    onClick={() =>
                      project.intern?.id // Check if intern is assigned
                        ? router.push(`/intern/tasks?internId=${project.intern.id}`)
                        : notification.error({ message: 'No Intern Assigned', description: 'This project does not have a primary intern assigned to view tasks.' })
                    }
                    icon={<ClockCircleOutlined />}
                  >
                    View Tasks
                  </Button>,
                ]}
              >
                <Space direction="vertical" size={4}>
                  <Text>
                    <UserOutlined /> Intern: {project.intern ? `${project.intern.firstName} ${project.intern.lastName}` : 'Not Assigned'}
                  </Text>
                  <Text>Milestones: {project.milestones.length}</Text>
                  <Text>Total Tasks: {getTotalTasks(project)}</Text>
                  <Tag color={project.status === 'Active' ? 'blue' : 'green'}>
                    {project.status}
                  </Tag>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </MainLayout>
  );
}