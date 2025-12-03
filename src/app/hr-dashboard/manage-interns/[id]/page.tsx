"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import api from '../../../../lib/api';
import MainLayout from '../../../components/MainLayout';
import {
  Typography, Spin, Result, Card, Descriptions, List, Tag, Progress, Space, Divider, Button, Tooltip
} from 'antd';
import { UserOutlined, MailOutlined, CheckCircleOutlined, HddOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { AxiosError } from 'axios';

// --- Interfaces ---
interface ChecklistItem {
  id: string;
  title: string;
  description?: string; // Optional: Add if backend provides
  isCompleted: boolean;
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
  internChecklists: InternChecklist[];
}

// --- Component ---
const { Title, Text, Paragraph } = Typography;

export default function InternProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [intern, setIntern] = useState<InternProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Clean ID Handling ---
  const rawId = params.id;
  const internId = Array.isArray(rawId) ? rawId[0]?.trim() : rawId?.trim();

  // --- Fetch Intern Profile ---
  useEffect(() => {
    if (!internId || internId.length < 36) {
      setLoading(false);
      setError("Invalid or missing intern ID.");
      return;
    }

    if (sessionStatus !== 'authenticated') {
      setLoading(false);
      setError("You must be logged in to view this profile.");
      return;
    }

    const fetchInternProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/users/${internId}`);
        setIntern(res.data);
      } catch (err: any) {
        console.error('Failed to fetch intern profile:', err);
        let message = "Could not load intern profile.";
        if (err instanceof AxiosError) {
          if (err.response?.status === 404) {
            message = "Intern with this ID was not found.";
          } else if (err.response?.status === 401 || err.response?.status === 403) {
            message = "Authorization failed. Please log out and log back in.";
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
  }, [internId, sessionStatus]);

  // --- Calculate Checklist Progress ---
  const getChecklistProgress = (checklist: InternChecklist) => {
    if (!checklist.items || checklist.items.length === 0) {
      return { percent: 0, done: 0, total: 0 };
    }
    const done = checklist.items.filter(item => item.isCompleted).length;
    const total = checklist.items.length;
    const percent = Math.round((done / total) * 100);
    return { percent, done, total };
  };

  // --- Loading State ---
  if (loading) {
    return (
      <MainLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)' }}>
          <Spin size="large" tip="Loading Intern Profile..." />
        </div>
      </MainLayout>
    );
  }

  // --- Error State ---
  if (error) {
    return (
      <MainLayout>
        <Result
          status={error.includes("not found") ? "404" : error.includes("Authorization") ? "403" : "error"}
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

  // --- No Intern Data ---
  if (!intern) {
    return (
      <MainLayout>
        <Result status="warning" title="No Intern Data" subTitle="No intern data was loaded." />
      </MainLayout>
    );
  }

  // --- Success State ---
  return (
    <MainLayout>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.back()}
          type="text"
          style={{ marginBottom: 16 }}
        >
          Back to Interns
        </Button>

        <Title level={2} style={{ marginTop: '16px' }}>
          Intern Profile: {intern.firstName} {intern.lastName}
        </Title>

        <Paragraph type="secondary">
          View details and onboarding progress for this intern.
        </Paragraph>

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
                <List.Item key={checklist.id}>
                  <Card
                    title={checklistName}
                    size="small"
                    hoverable
                    style={{ boxShadow: '0 1px 4px rgba(0, 0, 0, 0.06)' }}
                    extra={
                      <Tooltip title={`${progress.done} of ${progress.total} tasks completed`}>
                        <Tag color={progress.percent === 100 ? 'green' : 'blue'}>
                          {progress.done} / {progress.total}
                        </Tag>
                      </Tooltip>
                    }
                  >
                    <Progress
                      percent={progress.percent}
                      status={progress.percent === 100 ? 'success' : 'active'}
                      size="small"
                      style={{ marginBottom: '12px' }}
                      format={() => `${progress.done}/${progress.total}`}
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
                          <Space>
                            <CheckCircleOutlined
                              style={{
                                marginRight: 8,
                                color: item.isCompleted ? '#52c41a' : '#bfbfbf'
                              }}
                            />
                            <Text delete={item.isCompleted} type={item.isCompleted ? 'secondary' : undefined}>
                              {item.title}
                              {item.description && (
                                <Text type="secondary" style={{ marginLeft: 8, fontSize: '0.8em' }}>
                                  ({item.description})
                                </Text>
                              )}
                            </Text>
                          </Space>
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
            extra={
              <Button
                type="primary"
                icon={<ArrowLeftOutlined />}
                onClick={() => router.push('/hr-dashboard/checklist-templates')}
              >
                Assign Checklist Template
              </Button>
            }
          />
        )}
      </Space>
    </MainLayout>
  );
}
