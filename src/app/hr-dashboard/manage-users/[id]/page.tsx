// File: app/hr-dashboard/manage-users/[id]/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import api from '../../../../lib/api'; // Adjust path if needed
import MainLayout from '../../../components/MainLayout'; // Adjust path if needed
import {
  Typography, Spin, Result, Card, Descriptions, Tag, Space, Divider, Button, Avatar, List, Empty
} from 'antd';
import {
  UserOutlined, MailOutlined, HddOutlined, ArrowLeftOutlined, ProjectOutlined, CalendarOutlined // Added CalendarOutlined
} from '@ant-design/icons';
import { AxiosError } from 'axios';
import Link from 'next/link';

const { Title, Text, Paragraph } = Typography;

// --- Interfaces ---
interface ProjectBasic {
    id: string;
    title: string;
    status: string;
}
interface UserProfile {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string;
  createdAt: Date | string;
  // Add relations fetched from backend
  mentoredProjects?: ProjectBasic[];
  // Add other potential relations if needed (assignedProjects, etc.)
assignedProjects?: ProjectBasic[]; // For interns (ManyToOne relationship)
  projectsAsIntern?: ProjectBasic[];

}


// ------------------

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const id = params?.id as string | undefined; // Get User ID from URL

  useEffect(() => {
    if (!id || !session) {
      setLoading(false);
      return;
    }
    // Basic permission check (assuming only HR can view these profiles)
    if ((session?.user as any)?.role !== 'HR') {
        setError("You do not have permission to view this page.");
        setLoading(false);
        return;
    }

    const fetchUserProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log(`[UserProfilePage] Fetching profile for user ID: ${id}`);
        // --- API Call ---
        // Assumes backend has GET /api/users/:id endpoint accessible by HR
        const res = await api.get(`/users/${id}`);
        console.log("[UserProfilePage] API Response:", res.data);
        setUserProfile(res.data);
      } catch (err: any) {
        console.error('[UserProfilePage] Failed to fetch user profile:', err);
        let message = "Could not load user profile.";
        if (err instanceof AxiosError) {
          if (err.response?.status === 404) {
            message = "User with this ID was not found on the backend.";
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
  }, [id, session]);

  // --- Render States ---
  if (loading) {
    return (
      <MainLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)' }}>
          <Spin size="large" tip="Loading User Profile..." />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <Result
          status={error.includes("not found") ? "404" : error.includes("permission") ? "403" : "error"}
          title="Could Not Load Profile"
          subTitle={error}
          extra={<Button type="primary" icon={<ArrowLeftOutlined />} onClick={() => router.back()}>Go Back</Button>}
        />
      </MainLayout>
    );
  }

  if (!userProfile) {
    return (
      <MainLayout>
        <Result status="warning" title="User Data Missing" subTitle="No user data was loaded." />
      </MainLayout>
    );
  }

  // --- Success State ---
   const formatDate = (dateInput?: Date | string | null): string => {
     if (!dateInput) return 'N/A';
     try {
       return new Date(dateInput).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
     } catch {
       return 'Invalid Date';
     }
   };


  return (
    <MainLayout>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()} type="text">
            Back
        </Button>

        {/* --- User Header --- */}
        <Card bordered={false}>
            <Space align="center">
                 <Avatar size="large" icon={<UserOutlined />} />
                 <Title level={2} style={{ margin: 0 }}>
                    {userProfile.firstName || ''} {userProfile.lastName || `User`}
                 </Title>
                 <Tag color={userProfile.role === 'MENTOR' ? 'purple' : userProfile.role === 'INTERN' ? 'blue' : 'gold'}>
                    {userProfile.role}
                 </Tag>
            </Space>
        </Card>

        {/* --- User Details --- */}
        <Card bordered={false} size="small" style={{ background: '#fafafa' }}>
          <Descriptions title="User Details" size="small" column={{ xs: 1, sm: 2 }}>
            <Descriptions.Item label={<Space><UserOutlined />Name</Space>}>
                {userProfile.firstName || '-'} {userProfile.lastName || '-'}
            </Descriptions.Item>
            <Descriptions.Item label={<Space><MailOutlined />Email</Space>}>
              {userProfile.email}
            </Descriptions.Item>
            <Descriptions.Item label={<Space><CalendarOutlined/>Joined</Space>}>
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
                        dataSource={userProfile.mentoredProjects}
                        renderItem={project => (
                            <List.Item>
                                <Link href={`/hr-dashboard/projects/${project.id}`}> {/* Link to project details */}
                                  <Space>
                                    <ProjectOutlined />
                                    <Text>{project.title}</Text>
                                  </Space>
                                </Link>
                                <Tag style={{ marginLeft: 'auto' }}>{project.status}</Tag>
                            </List.Item>
                        )}
                    />
                ) : (
                    <Empty description="Not currently mentoring any projects." />
                )}
            </>
        )}

         {/* Add sections for Interns if needed, like assigned projects or checklists */}
         {userProfile.role === 'INTERN' && (
            <>
               {/* Example: You might need to fetch assigned projects separately or ensure they are returned by /api/users/:id */}
               <Divider/>
               <Title level={4}>Assigned Project(s)</Title>
                {userProfile.assignedProjects && userProfile.assignedProjects.length > 0 ? (
                   <List
                       // ... render assigned projects ...
                    />
               ) : userProfile.projectsAsIntern && userProfile.projectsAsIntern.length > 0 ? (
                    <List
                        // ... render projectsAsIntern ...
                     />
                ) : (
                   <Empty description="Not currently assigned to any projects." />
               )}

               {/* Example: Checklist section would require fetching checklist data */}
               <Divider/>
               <Title level={4}>Onboarding Checklist(s)</Title>
               <Empty description="Checklist details view not implemented on this page." />
            </>
         )}

      </Space>
    </MainLayout>
  );
}