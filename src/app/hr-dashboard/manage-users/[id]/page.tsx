"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import api from '../../../../lib/api';
import MainLayout from '../../../components/MainLayout';
import {
  Typography, Spin, Result, Card, Descriptions, Tag, Space, Divider, Button, List, Empty, Tooltip, Avatar,
  Progress
} from 'antd';
import {
  UserOutlined, MailOutlined, HddOutlined, ArrowLeftOutlined, ProjectOutlined, CalendarOutlined,
  CheckCircleOutlined, FileTextOutlined
} from '@ant-design/icons';
import { AxiosError } from 'axios';
import Link from 'next/link';

const { Title, Text, Paragraph } = Typography;

// --- Interfaces ---
interface ProjectBasic {
  id: string;
  title: string;
  status: string;
  description?: string;
}

interface ChecklistBasic {
  id: string;
  name: string;
  progress: number;
  status: 'Complete' | 'In Progress' | 'Not Started';
}

interface UserProfile {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string;
  createdAt: Date | string;
  mentoredProjects?: ProjectBasic[];
  assignedProjects?: ProjectBasic[];
  projectsAsIntern?: ProjectBasic[];
  checklists?: ChecklistBasic[];
}

// --- Helper Functions ---
const formatDate = (dateInput?: Date | string | null): string => {
  if (!dateInput) return 'N/A';
  try {
    return new Date(dateInput).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return 'Invalid Date';
  }
};

const getFullName = (firstName: string | null, lastName: string | null): string => {
  return `${firstName ?? ''} ${lastName ?? ''}`.trim() || 'User';
};

// --- Main Component ---
export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  // --- Fetch User Profile ---
  useEffect(() => {
    if (!id || sessionStatus === 'loading') {
      setLoading(false);
      return;
    }

    // Permission check
    if (sessionStatus !== 'authenticated' || (session?.user as any)?.role !== 'HR') {
      setError("You do not have permission to view this page.");
      setLoading(false);
      return;
    }

    const fetchUserProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/users/${id}`);
        setUserProfile(res.data);
      } catch (err: any) {
        console.error('Failed to fetch user profile:', err);
        let message = "Could not load user profile.";
        if (err instanceof AxiosError) {
          if (err.response?.status === 404) {
            message = "User with this ID was not found.";
          } else if (err.response?.status === 401 || err.response?.status === 403) {
            message = "You do not have permission to view this profile.";
          } else {
            message = err.response?.data?.message || err.message;
          }
        } else if (err instanceof Error) {
          message = err.message;
        }
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [id, sessionStatus, session]);

  // --- Loading State ---
  if (loading) {
    return (
      <MainLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)' }}>
          <Spin size="large" tip="Loading User Profile..." />
        </div>
      </MainLayout>
    );
  }

  // --- Error State ---
  if (error) {
    return (
      <MainLayout>
        <Result
          status={error.includes("not found") ? "404" : error.includes("permission") ? "403" : "error"}
          title="Could Not Load Profile"
          subTitle={error}
          extra={
            <Button type="primary" icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
              Go Back
            </Button>
          }
        />
      </MainLayout>
    );
  }

  // --- No User Data ---
  if (!userProfile) {
    return (
      <MainLayout>
        <Result status="warning" title="User Data Missing" subTitle="No user data was loaded." />
      </MainLayout>
    );
  }

  // --- Success State ---
  return (
    <MainLayout>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* --- Back Button --- */}
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.back()}
          type="text"
          style={{ marginBottom: 16 }}
        >
          Back to Users
        </Button>

        {/* --- User Header --- */}
        <Card bordered={false}>
          <Space align="center">
            <Avatar size="large" icon={<UserOutlined />} />
            <Title level={2} style={{ margin: 0 }}>
              {getFullName(userProfile.firstName, userProfile.lastName)}
            </Title>
            <Tag color={
              userProfile.role === 'MENTOR' ? 'purple' :
              userProfile.role === 'INTERN' ? 'blue' :
              'gold'
            }>
              {userProfile.role}
            </Tag>
          </Space>
        </Card>

        {/* --- User Details --- */}
        <Card bordered={false} size="small" style={{ background: '#fafafa' }}>
          <Descriptions title="User Details" size="small" column={{ xs: 1, sm: 2 }}>
            <Descriptions.Item label={<Space><UserOutlined />Name</Space>}>
              {getFullName(userProfile.firstName, userProfile.lastName)}
            </Descriptions.Item>
            <Descriptions.Item label={<Space><MailOutlined />Email</Space>}>
              {userProfile.email}
            </Descriptions.Item>
            <Descriptions.Item label={<Space><CalendarOutlined />Joined</Space>}>
              {formatDate(userProfile.createdAt)}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* --- Role-Specific Sections --- */}
        {userProfile.role === 'MENTOR' && (
          <>
            <Divider />
            <Title level={4}>Mentored Projects</Title>
            {userProfile.mentoredProjects && userProfile.mentoredProjects.length > 0 ? (
              <List
                size="small"
                bordered
                dataSource={userProfile.mentoredProjects.sort((a, b) => a.title.localeCompare(b.title))}
                renderItem={project => (
                  <List.Item>
                    <Link href={`/hr-dashboard/projects/${project.id}`}>
                      <Space>
                        <ProjectOutlined />
                        <Text>{project.title}</Text>
                      </Space>
                    </Link>
                    <Tag style={{ marginLeft: 'auto' }} color={
                      project.status === 'COMPLETED' ? 'green' :
                      project.status === 'IN_PROGRESS' ? 'blue' :
                      'default'
                    }>
                      {project.status.replace('_', ' ')}
                    </Tag>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="Not currently mentoring any projects." />
            )}
          </>
        )}

        {userProfile.role === 'INTERN' && (
          <>
            {/* --- Assigned Projects --- */}
            <Divider />
            <Title level={4}>Assigned Projects</Title>
            {userProfile.assignedProjects && userProfile.assignedProjects.length > 0 ? (
              <List
                size="small"
                bordered
                dataSource={userProfile.assignedProjects.sort((a, b) => a.title.localeCompare(b.title))}
                renderItem={project => (
                  <List.Item>
                    <Link href={`/hr-dashboard/projects/${project.id}`}>
                      <Space>
                        <ProjectOutlined />
                        <Text>{project.title}</Text>
                      </Space>
                    </Link>
                    <Tag style={{ marginLeft: 'auto' }} color={
                      project.status === 'COMPLETED' ? 'green' :
                      project.status === 'IN_PROGRESS' ? 'blue' :
                      'default'
                    }>
                      {project.status.replace('_', ' ')}
                    </Tag>
                  </List.Item>
                )}
              />
            ) : (
              <Empty
                description="Not currently assigned to any projects."
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}

            {/* --- Checklists --- */}
            <Divider />
            <Title level={4}>Onboarding Checklists</Title>
            {userProfile.checklists && userProfile.checklists.length > 0 ? (
              <List
                size="small"
                bordered
                dataSource={userProfile.checklists}
                renderItem={checklist => (
                  <List.Item>
                    <Space>
                      <CheckCircleOutlined
                        style={{ color: checklist.status === 'Complete' ? '#52c41a' : '#1890ff' }}
                      />
                      <Text strong>{checklist.name}</Text>
                    </Space>
                    <Space style={{ marginLeft: 'auto' }}>
                      <Tag color={
                        checklist.status === 'Complete' ? 'green' :
                        checklist.status === 'In Progress' ? 'blue' :
                        'default'
                      }>
                        {checklist.status}
                      </Tag>
                      <Progress
                        percent={checklist.progress}
                        size="small"
                        status={
                          checklist.progress === 100 ? 'success' :
                          checklist.progress < 50 ? 'exception' :
                          'active'
                        }
                        showInfo={false}
                        style={{ width: 100 }}
                      />
                    </Space>
                  </List.Item>
                )}
              />
            ) : (
              <Empty
                description="No onboarding checklists assigned."
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </>
        )}
      </Space>
    </MainLayout>
  );
}
