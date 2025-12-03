"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Spin, notification, Row, Col, Typography, Empty, Space, Tag } from 'antd';
import { GithubOutlined, EditOutlined, UserOutlined, MailOutlined } from '@ant-design/icons';
import api from '../../lib/api';
import { useSession } from 'next-auth/react';
import { UserRole } from '../../common/enums/user-role.enum';

const { Title, Text } = Typography;

interface Intern {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  github_username?: string;
  role: UserRole;
}

export default function MentorDashboard() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [interns, setInterns] = useState<Intern[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // --- Data Fetching ---
  const fetchInterns = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.get<Intern[]>('/users/interns');
      // Filter for interns only
      const validInterns = res.data.filter(intern => intern.role === UserRole.INTERN);
      setInterns(validInterns);
    } catch (err: any) {
      console.error('Failed to load interns:', err);
      setError(err.response?.data?.message || 'An error occurred while fetching interns.');
      notification.error({
        message: 'Failed to load interns',
        description: err.response?.data?.message || 'An error occurred while fetching interns.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Effects ---
  useEffect(() => {
    fetchInterns();
  }, [fetchInterns]);

  // --- Loading State ---
  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin size="large" tip="Loading interns..." />
      </div>
    );
  }

  // --- Error State ---
  if (error) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Empty
          description={
            <Space direction="vertical">
              <Text type="danger">{error}</Text>
              <Button type="primary" onClick={fetchInterns}>
                Retry
              </Button>
            </Space>
          }
        />
      </div>
    );
  }

  // --- Empty State ---
  if (interns.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Empty
          description={
            <Space direction="vertical">
              <Title level={3}>No Interns Found</Title>
              <Text type="secondary">There are no interns available at the moment.</Text>
            </Space>
          }
        />
      </div>
    );
  }

  // --- Main Render ---
  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Mentor Dashboard</Title>
      <Text type="secondary" style={{ marginBottom: 24, display: 'block' }}>
        Manage your interns and their projects
      </Text>

      <Row gutter={[16, 16]}>
        {interns.map((intern) => (
          <Col xs={24} sm={12} md={8} lg={6} key={intern.id}>
            <Card
              title={
                <Space>
                  <UserOutlined />
                  <Text strong>{intern.firstName} {intern.lastName}</Text>
                </Space>
              }
              style={{ width: '100%' }}
              actions={[
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => router.push(`/mentor/interns/${intern.id}/edit`)}
                >
                  Edit Profile
                </Button>,
              ]}
            >
              <Space direction="vertical" size="middle">
                <Space>
                  <MailOutlined />
                  <Text>{intern.email}</Text>
                </Space>

                {intern.github_username ? (
                  <Space>
                    <GithubOutlined />
                    <Tag color="geekblue">{intern.github_username}</Tag>
                  </Space>
                ) : (
                  <Space>
                    <GithubOutlined />
                    <Tag color="warning">No GitHub linked</Tag>
                  </Space>
                )}

                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Button
                    type="link"
                    size="small"
                    onClick={() => router.push(`/mentor/interns/${intern.id}/github`)}
                  >
                    GitHub Activity
                  </Button>

                  <Button
                    type="link"
                    size="small"
                    onClick={() => router.push(`/mentor/interns/${intern.id}/nlp`)}
                  >
                    NLP Analysis
                  </Button>
                </Space>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
