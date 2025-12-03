"use client";
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import api from '../../../../lib/api';
import MainLayout from '../../../components/MainLayout';
import {
Typography, Spin, Result, Card, Descriptions, List, Tag, Progress, Space, Divider,
Button, Checkbox, Tooltip, notification
} from 'antd';
import {
UserOutlined, MailOutlined, HddOutlined,ArrowLeftOutlined,
CheckCircleFilled, CloseCircleFilled
} from '@ant-design/icons';
import { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';

// --- Interfaces ---
interface ChecklistItem {
id: string;
title: string;
description: string;
isCompleted: boolean;
completedAt: Date | string | null;
createdAt?: Date | string;
}

interface InternChecklist {
id: string;
template?: { id: string; name: string };
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

const { Title, Text, Paragraph } = Typography;

export default function InternProfilePage() {
const params = useParams();
const router = useRouter();
const { data: session, status: sessionStatus } = useSession();
const [intern, setIntern] = useState<InternProfile | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [updatingItem, setUpdatingItem] = useState<string | null>(null);
const [assignModalOpen, setAssignModalOpen] = useState(false);

const rawId = params.id;
const internId = Array.isArray(rawId) ? rawId[0] : rawId;

// --- Fetch Intern Profile ---
useEffect(() => {
if (sessionStatus === 'loading' || !internId) {
if (!internId) setLoading(false);
return;
}

if (typeof internId !== 'string' || internId.length < 36) {
  setLoading(false);
  setError("Error: Invalid intern ID format.");
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

}, [internId, sessionStatus]);

// --- Toggle Checklist Item Completion ---
const toggleChecklistItem = async (checklistId: string, itemId: string, currentStatus: boolean) => {
setUpdatingItem(itemId);
try {
const payload = { isCompleted: !currentStatus };
await api.patch(`/checklists/items/${itemId}`, payload);


  // Update local state
  setIntern(prevIntern => {
    if (!prevIntern) return prevIntern;
    const updatedChecklists = prevIntern.internChecklists.map(checklist => {
      if (checklist.id === checklistId) {
        return {
          ...checklist,
          items: checklist.items.map(item =>
            item.id === itemId ? { ...item, isCompleted: !currentStatus } : item
          )
        };
      }
      return checklist;
    });
    return { ...prevIntern, internChecklists: updatedChecklists };
  });

  notification.success({
    message: 'Task Updated',
    description: `Task has been marked as ${!currentStatus ? 'completed' : 'incomplete'}.`
  });
} catch (err: any) {
  console.error('Failed to update checklist item:', err);
  let message = "Failed to update task status.";
  if (err instanceof AxiosError) {
    message = err.response?.data?.message || err.message;
  } else if (err instanceof Error) {
    message = err.message;
  }
  notification.error({ message: 'Update Failed', description: message });
} finally {
  setUpdatingItem(null);
}


};

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

// --- Callback for newly assigned checklists ---
const handleChecklistAssigned = (newChecklists: InternChecklist[]) => {
setIntern(prev => prev ? { ...prev, internChecklists: [...prev.internChecklists, ...newChecklists] } : prev);
};

// --- Loading State ---
if (loading) {
return ( <MainLayout>
<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)' }}> <Spin size="large" tip="Loading Intern Profile..." /> </div> </MainLayout>
);
}

// --- Error State ---
if (error) {
return ( <MainLayout>
<Result
status={error.includes("not found") ? "404" : (error.includes("Authorization failed") || error.includes("permission") ? "403" : "error")}
title="Could Not Load Profile"
subTitle={error}
extra={<Button type="primary" icon={<ArrowLeftOutlined />} onClick={() => router.back()}>Go Back</Button>}
/> </MainLayout>
);
}

// --- No Intern Data ---
if (!intern) {
return ( <MainLayout> <Result status="warning" title="No Intern Data" subTitle="No intern data was loaded, possibly due to invalid ID." /> </MainLayout>
);
}

// --- Success State ---
return ( <MainLayout>
<Space direction="vertical" size="large" style={{ width: '100%' }}>
<Button icon={<ArrowLeftOutlined />} onClick={() => router.back()} type="text" style={{ marginBottom: 16 }}>Back</Button>

```
    <Title level={2} style={{ marginTop: '16px' }}>Intern Profile: {intern.firstName} {intern.lastName}</Title>
    <Paragraph type="secondary">View details and onboarding progress for this intern.</Paragraph>
    <Divider />

    {/* --- Intern Details Section --- */}
    <Card bordered={false} style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)' }}>
      <Descriptions title="Intern Details" bordered size="small" column={{ xs: 1, sm: 2, md: 3 }}>
        <Descriptions.Item label={<Text><UserOutlined /> Name</Text>}>{intern.firstName} {intern.lastName}</Descriptions.Item>
        <Descriptions.Item label={<Text><MailOutlined /> Email</Text>}>{intern.email}</Descriptions.Item>
        <Descriptions.Item label={<Text><HddOutlined /> Role</Text>}><Tag color="geekblue">{intern.role}</Tag></Descriptions.Item>
      </Descriptions>
    </Card>

    <Divider />
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
                extra={<Tag color={progress.percent === 100 ? 'green' : 'blue'}>{progress.done} / {progress.total} Tasks</Tag>}
              >
                <Progress percent={progress.percent} status={progress.percent === 100 ? 'success' : 'active'} size="small" style={{ marginBottom: '12px' }} />

                <List
                  size="small"
                  dataSource={checklist.items.sort((a, b) => {
                    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return (isNaN(timeA) ? 0 : timeA) - (isNaN(timeB) ? 0 : timeB);
                  })}
                  renderItem={item => (
                    <List.Item key={item.id} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}
                      actions={[
                        <Tooltip title={item.isCompleted ? 'Mark as incomplete' : 'Mark as complete'} key="toggle-complete">
                          <Button type="text" icon={item.isCompleted ? <CloseCircleFilled style={{ color: '#ff4d4f' }} /> : <CheckCircleFilled style={{ color: '#52c41a' }} />} loading={updatingItem === item.id} onClick={() => toggleChecklistItem(checklist.id, item.id, item.isCompleted)} />
                        </Tooltip>
                      ]}
                    >
                      <Space>
                        <Checkbox checked={item.isCompleted} onChange={() => toggleChecklistItem(checklist.id, item.id, item.isCompleted)} disabled={updatingItem === item.id} />
                        <Text delete={item.isCompleted} type={item.isCompleted ? 'secondary' : undefined}>
                          {item.title}
                          {item.description && <Text type="secondary" style={{ marginLeft: 8, fontSize: '0.8em' }}>({item.description.substring(0, 30)}{item.description.length > 30 ? '...' : ''})</Text>}
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
        extra={<Button type="primary" onClick={() => setAssignModalOpen(true)}>Assign Checklist Template</Button>}
      />
    )}

    {/* --- Assign Checklist Modal --- */}
    <AssignChecklistModal
      open={assignModalOpen}
      onClose={() => setAssignModalOpen(false)}
      onAssigned={handleChecklistAssigned}
    />
  </Space>
</MainLayout>

);
}
