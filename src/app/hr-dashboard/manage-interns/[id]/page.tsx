// File: app/hr-dashboard/interns/[id]/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import api from '../../../../lib/api'; // Adjust path
import MainLayout from '../../../components/MainLayout'; // Adjust path
import {
  Typography, Spin, Result, Card, Descriptions, List, Tag, Progress, Space, Divider,
} from 'antd';
import { UserOutlined, MailOutlined, CheckCircleOutlined, HddOutlined } from '@ant-design/icons';
import { AxiosError } from 'axios';

// --- Interfaces ---
interface ChecklistItem {
  id: string;
  title: string;
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
// ------------------

const { Title, Text, Paragraph } = Typography;

export default function InternProfilePage() {
  const params = useParams();
  const { data: session } = useSession();
  const [intern, setIntern] = useState<InternProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
   const rawId = params.id;
  const internid = params.id as string | undefined;
const internId = Array.isArray(rawId) 
        ? (rawId[0] || '').trim() 
        : (rawId || '').trim();

  useEffect(() => {
    if (!internId || internId.length < 36) { 
            setLoading(false);
            if (internId) setError("Error: ID format is invalid.");
            return;
        }

    const fetchInternProfile = async () => {
      setLoading(true);
      setError(null);
      const internId = params.id as string | undefined;
      try {
console.log(`[PROFILE ERROR DEBUG] Final ID Sent: "${internId}"`)
      const res = await api.get(`/api/users/${internId}`);
        console.log("API Response:", res.data);
        setIntern(res.data);
      } catch (err: any) {
        console.error('Failed to fetch intern profile:', err);
        let message = "Could not load intern profile.";
        
        if (err instanceof AxiosError) {
             if (err.response?.status === 404) {
                 message = "Intern with this ID was not found.";
             } else if (err.response?.status === 401) {
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
   
}, [ internid, session]);

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
          status={error.includes("not found") ? "404" : "error"}
          title="Could Not Load Profile"
          subTitle={error}
        />
      </MainLayout>
    );
  }

  // --- Not Found State ---
  if (!intern) {
    return (
      <MainLayout>
        <Result status="warning" title="Intern Data Missing" subTitle="No intern data was loaded." />
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
            grid={{ gutter: 24, xs: 1, sm: 1, md: 2, lg: 2, xl: 3 }} // Adjust grid spacing
            dataSource={intern.internChecklists}
            renderItem={checklist => {
              const progress = getChecklistProgress(checklist);
              const checklistName = checklist.template?.name || `Checklist ${checklist.id.substring(0, 8)}`;
              return (
                <List.Item>
                  <Card
                    title={checklistName}
                    size="small"
                    hoverable // Add hover effect
                    style={{ boxShadow: '0 1px 4px rgba(0, 0, 0, 0.06)' }} // Lighter shadow
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
                       style={{ marginBottom: '12px' }} // Add space below progress bar
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
                          </Text>
                        </List.Item>
                      )}
                      style={{ border: 'none' }} // Remove inner list border
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
      </Space> {/* End Overall Space */}
    </MainLayout>
  );
}