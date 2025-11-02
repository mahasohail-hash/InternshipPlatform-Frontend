// File: app/hr-dashboard/projects/[id]/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import api from '../../../../lib/api'; // Adjust path
import MainLayout from '../../../components/MainLayout'; // Adjust path
import {
  Typography, Spin, Result, Card, Descriptions,notification, List, Tag, Space, Divider, Button, Avatar, Tooltip
} from 'antd';
import {
  ProjectOutlined, UserOutlined, MailOutlined, CalendarOutlined, CheckCircleOutlined, SyncOutlined, ExclamationCircleOutlined, PlusOutlined, ArrowLeftOutlined
} from '@ant-design/icons';
import { AxiosError } from 'axios';
import Link from 'next/link'; // Import Link for navigation

const { Title, Text, Paragraph } = Typography;

// --- Interfaces (Adjust based on your actual backend entities) ---
interface UserBasic {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
}

interface TaskBasic {
  id: string;
  title: string;
  status: string; // Assuming TaskStatus enum values like 'To Do', 'In Progress', 'Done'
  assignee?: UserBasic | null;
  dueDate?: Date | string | null;
}

interface MilestoneBasic {
  id: string;
  title: string;
  tasks: TaskBasic[];
  createdAt: Date | string;
  // Add other relevant milestone fields if needed
}

interface ProjectDetails {
  id: string;
  title: string;
  description?: string;
  status: string;
  mentor?: UserBasic | null;
  intern?: UserBasic | null; // If using ManyToOne for single intern
  interns?: UserBasic[];   // If using ManyToMany for multiple interns
  milestones: MilestoneBasic[];
}
// ------------------------------------------------------------------
export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter(); // For back button
  const { data: session } = useSession();
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const id = params?.id as string | undefined;

  useEffect(() => {
    if (!id || !session) {
      setLoading(false);
      return;
    }

    const fetchProjectDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log(`Fetching project details for ID: ${id}`);
        // Assumes backend route is GET /api/projects/:id
        const res = await api.get(`/api/projects/${id}`);
        console.log("API Response:", res.data);
        setProject(res.data);
      } catch (err: any) {
        console.error('Failed to fetch project details:', err);
        let message = "Could not load project details.";
        if (err instanceof AxiosError) {
          if (err.response?.status === 404) {
            message = "Project with this ID was not found.";
          } else if (err.response?.status === 500) {
 // Use the server's specific message if available
       message = err.response?.data?.message || "Internal Server Error (500). Please check backend logs.";
          }
          else if (err.response?.status === 401 || err.response?.status === 403) {
            message = "You do not have permission to view this project.";
          } else {
            message = err.response?.data?.message || err.message;
          }
        } else if (err instanceof Error) {
          message = err.message;
        }
        setError(message);
        notification.error({ message: 'Load Error', description: message });
      } finally {
        setLoading(false);
      }
    };

    fetchProjectDetails();
  }, [id, session?.user?.email]);

  // --- Render States ---
  if (loading) {
    return (
      <MainLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)' }}>
          <Spin size="large" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <Result
          status={error.includes("not found") ? "404" : error.includes("permission") ? "403" : "error"}
          title="Could Not Load Project"
          subTitle={error}
          extra={<Button type="primary" onClick={() => router.back()}>Go Back</Button>}
        />
      </MainLayout>
    );
  }

  if (!project) {
    return (
      <MainLayout>
        <Result status="warning" title="Project Data Missing" subTitle="No project data was loaded." />
      </MainLayout>
    );
  }

  // Helper to get status color
  const getStatusColor = (status: string | null | undefined) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'in progress':
        return 'processing'; // Blue with animation
      case 'completed':
      case 'done':
        return 'success'; // Green
      case 'blocked':
        return 'error'; // Red
      case 'to do':
          return 'default'; // Grey
      default:
        return 'default';
    }
  };
const formatUserName = (user: UserBasic) => `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
  const mentorsName = project.mentor ? formatUserName(project.mentor) : 'Not Assigned';
 const internsList = project.interns || (project.intern ? [project.intern] : []);
// --- Success State ---



  return (
    <MainLayout>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.back()}
            style={{ marginBottom: 16 }}
        >
            Back to Projects
        </Button>

        <Title level={2}><ProjectOutlined /> {project.title}</Title>
        {project.description && <Paragraph type="secondary">{project.description}</Paragraph>}

        <Divider />

        {/* --- Project Details Card --- */}
 <Card bordered={false} size="small">
 <Descriptions title="Project Details" size="small" column={{ xs: 1, sm: 2 }}>
 <Descriptions.Item label="Status">
 <Tag color={getStatusColor(project.status)}>{project.status || 'N/A'}</Tag>
 </Descriptions.Item>
 <Descriptions.Item label="Mentor">
 {project.mentor ? (
<Link href={`/hr-dashboard/manage-users/${project.mentor.id}`}>
 <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: 8 }} />
 {mentorsName}
</Link>
 ) : <Text type="secondary">Not Assigned</Text>}
 </Descriptions.Item>
{/* Consolidated Intern Display */}
 {internsList && internsList.length > 0 ? (
<Descriptions.Item label={internsList.length > 1 ? "Interns" : "Intern"}>
<Avatar.Group maxCount={3}>
{internsList.map(intern => (
<Tooltip key={intern.id} title={formatUserName(intern)}>
<Link href={`/hr-dashboard/manage-interns/${intern.id}`}>
<Avatar icon={<UserOutlined />} />
</Link>
</Tooltip>
))}
</Avatar.Group>
</Descriptions.Item>
) : (
 <Descriptions.Item label="Intern(s)">
 <Text type="secondary">Not Assigned</Text>
</Descriptions.Item>
)}
 </Descriptions>
 </Card>

 <Divider />
        {/* --- Milestones and Tasks Section --- */}
        <Title level={3}>Milestones & Tasks</Title>

        {project.milestones && project.milestones.length > 0 ? (
          <List
            itemLayout="vertical" // Changed layout for milestones
            dataSource={project.milestones.sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())} // Sort milestones
            renderItem={milestone => (
              <List.Item key={milestone.id}>
                <Card type="inner" title={<Title level={5}>{milestone.title}</Title>} size="small">
                  {milestone.tasks && milestone.tasks.length > 0 ? (
                    <List
                      size="small"
                      dataSource={milestone.tasks.sort((a,b) => new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime())} // Sort tasks by due date
                      renderItem={task => (
                        <List.Item key={task.id}>
                          <List.Item.Meta
                            avatar={
                              <Tooltip title={task.status}>
                                {task.status === 'Done' ? <CheckCircleOutlined style={{ color: 'green' }} /> :
                                 task.status === 'In Progress' ? <SyncOutlined spin style={{ color: 'blue' }} /> :
                                 task.status === 'Blocked' ? <ExclamationCircleOutlined style={{ color: 'red' }} /> :
                                 <CalendarOutlined />}
                              </Tooltip>
                            }
                            title={task.title}
                            description={
                              <Space size="small">
                                {task.assignee && (
                                   <Tooltip title={`Assigned to ${task.assignee.firstName}`}>
                                        <Tag icon={<UserOutlined />} >
                                            {task.assignee.firstName}
                                        </Tag>
                                   </Tooltip>
                                )}
                                {task.dueDate && <Text type="secondary">Due: {new Date(task.dueDate).toLocaleDateString()}</Text>}
                              </Space>
                            }
                          />
                           <Tag color={getStatusColor(task.status)}>{task.status}</Tag>
                        </List.Item>
                      )}
                    />
                  ) : (
                    <Text type="secondary">No tasks in this milestone.</Text>
                  )}
                </Card>
              </List.Item>
            )}
          />
        ) : (
          <Result status="info" title="No Milestones Found" subTitle="This project does not have any milestones defined yet." />
        )}
      </Space>
    </MainLayout>
  );
}