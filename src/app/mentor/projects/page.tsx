'use client';
// This file is at: app/mentor/projects/page.tsx
import MainLayout from '@/app/components/MainLayout'; // <-- 1. FIXED ALIAS
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
} from 'antd';
import {
  ProjectOutlined,
  UserOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  EditOutlined, // Import Edit icon
} from '@ant-design/icons';
import { useState, useEffect } from 'react';
import api from '@/lib/api'; // <-- 2. FIXED ALIAS
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;

interface Project {
  id: string;
  title: string;
  firstName: string;
   lastName: string;
  description: string;
  status: 'Active' | 'Completed' | 'On Hold';
  intern: { id: string; firstName: string; lastName: string };
  milestones: any[];
}

export default function MentorProjectsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const mentorId = (session?.user as any)?.id;

  const fetchProjects = async () => {
    if (!mentorId) return;
    setLoading(true);
    try {
      const res = await api.get('/api/projects/mentor');
     setProjects(res.data || []);
    } catch (error) {
      console.error('Project fetch failed:', error);
      notification.error({
        message: 'Failed to load projects.',
        description: 'Check backend connection or API status.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mentorId) {
      fetchProjects();
    }
  }, [mentorId]);

  const getTotalTasks = (project: Project) =>
    project.milestones.flatMap(m => m.tasks).length;

  if (loading) {
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
            <Spin size="large" />
            <Typography.Text>Loading your projects...</Typography.Text>
          </Space>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Title level={2}>My Assigned Projects</Title>
      <Text type="secondary">
        Overview of all projects defined for your assigned interns. Click "View
        Tasks" to manage the Kanban board.
      </Text>

      <Button
        type="primary"
        icon={<PlusOutlined />}
        style={{ margin: '30px 10px' }}
        onClick={() => router.push('/mentor/projects/create')} // This link is correct
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
                  // --- 3. FIXED LINK ---
                  // This link now matches your folder structure, fixing the 404
                  <Button
                    type="link"
                    icon={<EditOutlined />}
                    onClick={() =>
                      router.push(`/mentor/projects/edit/${project.id}`)
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
                      router.push(`/intern/tasks?internId=${project.intern.id}`)
                    }
                    icon={<ClockCircleOutlined />}
                  >
                    View Tasks
                  </Button>,
                ]}
              >
                <Space direction="vertical" size={4}>
                  <Text>
                    <UserOutlined /> Intern: {project.intern.firstName}{' '}
                    {project.intern.lastName}
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

