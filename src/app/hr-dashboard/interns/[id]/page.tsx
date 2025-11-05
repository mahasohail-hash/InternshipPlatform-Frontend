'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import api from '../../../../lib/api'; // Adjust path
import MainLayout from '../../../components/MainLayout'; // Adjust path
import {
  Typography, Spin, Result, Card, Descriptions, List, Tag, Progress, Space, Divider,
  Button,
} from 'antd';
import { UserOutlined, MailOutlined, CheckCircleOutlined, HddOutlined, ArrowLeftOutlined } from '@ant-design/icons'; // Added ArrowLeftOutlined
import { AxiosError } from 'axios';
import { useRouter } from 'next/navigation'; // Import useRouter

// --- Interfaces ---
interface ChecklistItem {
  id: string;
  title: string;
  description: string; // Include description from entity
  isCompleted: boolean;
  completedAt: Date | string | null;
  createdAt?: Date | string;
}

interface InternChecklist {
  id: string;
  template?: { name: string };
  items: ChecklistItem[];
  createdAt: Date | string;
}

interface InternProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  internChecklists: InternChecklist[]; // Ensure this matches backend relation name
}
// ------------------

const { Title, Text, Paragraph } = Typography;

export default function InternProfilePage() {
  const params = useParams();
  const router = useRouter(); // Initialize useRouter
  const { data: session, status: sessionStatus } = useSession();
  const [intern, setIntern] = useState<InternProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const rawId = params.id;
  // Ensure internId is a single string UUID
  const internId = Array.isArray(rawId) ? rawId[0] : rawId;

  useEffect(() => {
    // Wait for session to load and internId to be valid
    if (sessionStatus === 'loading' || !internId) {
      if (!internId) setLoading(false); // If no ID, stop loading and show nothing or error
      return;
    }

    // Basic ID validation
    if (typeof internId !== 'string' || internId.length < 36) {
      setLoading(false);
      setError("Error: Invalid intern ID format.");
      return;
    }

    const fetchInternProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log(`[InternProfilePage] Fetching profile for intern ID: "${internId}"`);
        // CRITICAL FIX: Ensure backend /users/:id endpoint returns required relations
        const res = await api.get(`/users/${internId}`);
        console.log("API Response for intern profile:", res.data);
        setIntern(res.data);
      } catch (err: any) {
        console.error('Failed to fetch intern profile:', err);
        let message = "Could not load intern profile.";

        if (err instanceof AxiosError) {
             if (err.response?.status === 404) {
                 message = "Intern with this ID was not found.";
             } else if (err.response?.status === 401 || err.response?.status === 403) {
                 message = "Authorization failed. You might not have permission or your session expired. Please log out and log back in.";
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

    fetchInternProfile();
  }, [internId, sessionStatus]); // Depend on internId and sessionStatus

  if (loading) {
    return (
      <MainLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)' }}>
          <Spin size="large" tip="Loading Intern Profile..." />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <Result
          status={error.includes("not found") ? "404" : (error.includes("Authorization failed") || error.includes("permission") ? "403" : "error")}
          title="Could Not Load Profile"
          subTitle={error}
          extra={<Button type="primary" icon={<ArrowLeftOutlined />} onClick={() => router.back()}>Go Back</Button>}
        />
      </MainLayout>
    );
  }

  if (!intern) {
    return (
      <MainLayout>
        <Result status="warning" title="No Intern Data" subTitle="No intern data was loaded, possibly due to invalid ID." />
      </MainLayout>
    );
  }

  // --- Success State ---
  const getChecklistProgress = (checklist: InternChecklist) => {
    if (!checklist.items || checklist.items.length === 0) { return { percent: 0, done: 0, total: 0 }; }
    const done = checklist.items.filter(item => item.isCompleted).length;
    const total = checklist.items.length;
    const percent = Math.round((done / total) * 100);
    return { percent, done, total };
  };

  return (
    <MainLayout>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()} type="text" style={{ marginBottom: 16 }}>
            Back
        </Button>

        <Title level={2} style={{ marginTop: '16px' }}>Intern Profile: {intern.firstName} {intern.lastName}</Title>
        <Paragraph type="secondary">View details and onboarding progress for this intern.</Paragraph>

        <Divider />

        {/* --- Intern Details Section --- */}
        <Card bordered={false} style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)' }}>
          <Descriptions title="Intern Details" bordered size="small" column={{ xs: 1, sm: 2, md: 3 }}>
            <Descriptions.Item label={<Space><UserOutlined />Name</Space>}>
              {intern.firstName} {intern.lastName}
            </Descriptions.Item>
            <Descriptions.Item label={<Space><MailOutlined />Email</Space>}>
              {intern.email}
            </Descriptions.Item>
            <Descriptions.Item label={<Space><HddOutlined />Role</Space>}>
              <Tag color="geekblue">{intern.role}</Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Divider />

        {/* --- Checklists Section --- */}
        <Title level={3}>Onboarding Checklists</Title>

        {intern.internChecklists && intern.internChecklists.length > 0 ? (
          <List
            grid={{ gutter: 24, xs: 1, sm: 1, md: 2, lg: 2, xl: 3 }}
            dataSource={intern.internChecklists}
            renderItem={checklist => {
              const progress = getChecklistProgress(checklist);
              const checklistName = checklist.template?.name || `Checklist ${checklist.id.substring(0, 8)}`;
              return (
                <List.Item>
                  <Card
                    title={checklistName}
                    size="small"
                    hoverable
                    style={{ boxShadow: '0 1px 4px rgba(0, 0, 0, 0.06)' }}
                    extra={
                      <Tag color={progress.percent === 100 ? 'green' : 'blue'}>
                        {progress.done} / {progress.total} Tasks
                      </Tag>
                    }
                  >
                    <Progress
                       percent={progress.percent}
                       status={progress.percent === 100 ? 'success' : 'active'}
                       size="small"
                       style={{ marginBottom: '12px' }}
                    />
                    <List
                      size="small"
                      dataSource={checklist.items.sort((a, b) => {
                          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                          return (isNaN(timeA) ? 0 : timeA) - (isNaN(timeB) ? 0 : timeB);
                      })}
                      renderItem={item => (
                        <List.Item style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                          <Text delete={item.isCompleted} type={item.isCompleted ? 'secondary' : undefined}>
                            <CheckCircleOutlined style={{ marginRight: 8, color: item.isCompleted ? '#52c41a' : '#bfbfbf' }} />
                            {item.title}
                            {item.description && <Text type="secondary" style={{ marginLeft: 8, fontSize: '0.8em' }}>({item.description.substring(0, 30)}{item.description.length > 30 ? '...' : ''})</Text>}
                          </Text>
                        </List.Item>
                      )}
                      style={{ border: 'none' }}
                    />
                  </Card>
                </List.Item>
              );
            }}
          />
        ) : (
          <Result
            status="info"
            title="No Checklists Found"
            subTitle="This intern has not been assigned any onboarding checklists yet."
          />
        )}
      </Space>
    </MainLayout>
  );
}