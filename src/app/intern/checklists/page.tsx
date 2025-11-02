// src/app/intern/checklists/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, Checkbox, List, Typography, Space, Spin, Alert, notification } from 'antd';
import { CheckCircleOutlined, SyncOutlined } from '@ant-design/icons';
import api from '../../../lib/api';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

const { Title, Text } = Typography;

interface InternChecklistItem {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  completedAt: string | null;
  createdAt: string;
}

interface InternChecklist {
  id: string;
  intern: {
    id: string;
    email: string;
  };
  template: {
    id: string;
    name: string;
  };
  items: InternChecklistItem[];
  createdAt: string;
}

export default function InternChecklistsPage() {
  const { data: session, status } = useSession();
  const [checklist, setChecklist] = useState<InternChecklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const currentInternId = session?.user?.id;

  // You are missing the handleItemToggle function which is called in the JSX
  const handleItemToggle = async (itemId: string, isCompleted: boolean) => {
    // Implement your logic to update the checklist item on the backend
    try {
      // You'll need to define a payload for your backend API
      const payload = { isCompleted };
      await api.patch(`/checklists/items/${itemId}`, payload);

      // Optimistically update the UI
      setChecklist(prevChecklist => {
        if (!prevChecklist) return null;
        return {
          ...prevChecklist,
          items: prevChecklist.items.map(item =>
            item.id === itemId
              ? { ...item, isCompleted, completedAt: isCompleted ? new Date().toISOString() : null }
              : item
          ),
        };
      });
      notification.success({ message: 'Success', description: 'Checklist item updated!' });
    } catch (err) {
      console.error('Failed to update checklist item:', err);
      notification.error({ message: 'Error', description: 'Failed to update checklist item.' });
      // If optimistic update was done, you might need to revert here
    }
  };


  useEffect(() => { // <--- useEffect starts here
    if (status === 'loading') {
      setLoading(true);
      setError(null);
      return;
    }

    if (!currentInternId) {
      if (status === 'unauthenticated') {
        router.push('/auth/signin');
      } else {
        setError('Intern ID not found in session. Please check NextAuth.js configuration.');
        setLoading(false);
      }
      return;
    }

    // THIS IS WHERE `fetchInternChecklist` NEEDS TO BE DECLARED
    const fetchInternChecklist = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get<InternChecklist>(`/checklists/intern/${currentInternId}`);
        setChecklist(response.data);
      } catch (err) {
        console.error('Failed to fetch intern checklist:', err);
        setError('Failed to load your onboarding checklist. Please try again.');
        notification.error({ message: 'Error', description: 'Could not load checklist.' });
      } finally {
        setLoading(false);
      }
    };

    fetchInternChecklist(); // <--- Call the function after it's defined
  }, [currentInternId, status, router]); // Dependency array remains correct

  // ... rest of your component (loading states, error states, JSX) ...
  if (status === 'loading') {
    return (
      <Space direction="vertical" style={{ width: '100%', textAlign: 'center', padding: '50px' }}>
        <Spin size="large" indicator={<SyncOutlined spin />} />
        <Text>Authenticating user...</Text>
      </Space>
    );
  }

  if (loading) {
    return (
      <Space direction="vertical" style={{ width: '100%', textAlign: 'center', padding: '50px' }}>
        <Spin size="large" indicator={<SyncOutlined spin />} />
        <Text>Loading your onboarding checklist...</Text>
      </Space>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
        />
      </div>
    );
  }

  if (!checklist) {
    return (
      <div style={{ padding: '20px' }}>
        <Alert
          message="No Checklist Found"
          description="It looks like an onboarding checklist hasn't been assigned to you yet."
          type="info"
          showIcon
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px' }}>
      <Title level={2}>
        Your Onboarding Checklist
        <Text type="secondary" style={{ marginLeft: '10px', fontSize: '18px' }}>
          ({checklist.template.name})
        </Text>
      </Title>

      <List
        itemLayout="vertical"
        dataSource={checklist.items}
        renderItem={(item) => (
          <List.Item
            key={item.id}
            actions={[
              <Space key="status-action">
                {item.isCompleted ? (
                  <Text type="success">
                    <CheckCircleOutlined /> Completed on{' '}
                    {item.completedAt ? new Date(item.completedAt).toLocaleDateString() : 'N/A'}
                  </Text>
                ) : (
                  <Text type="warning">Pending</Text>
                )}
              </Space>,
            ]}
          >
            <List.Item.Meta
              avatar={
                <Checkbox
                  checked={item.isCompleted}
                  onChange={(e) => handleItemToggle(item.id, e.target.checked)}
                />
              }
              title={<Title level={4} style={{ marginBottom: 0 }}>{item.title}</Title>}
              description={<Text>{item.description}</Text>}
            />
          </List.Item>
        )}
      />
    </div>
  );
}