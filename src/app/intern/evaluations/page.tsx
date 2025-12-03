"use client";
import { useState, useEffect, useCallback } from 'react';
import MainLayout from '../../components/MainLayout';
import { Typography, List, Card, Tag, Spin, Result, Space, Rate, Divider, Empty, Button } from 'antd';
import api from '../../../lib/api';
import { useSession } from 'next-auth/react';
import { AxiosError } from 'axios';
import { StarFilled, StarOutlined, UserOutlined, CalendarOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface Mentor {
  firstName: string;
  lastName: string;
}

interface Evaluation {
  id: string;
  score?: number;
  feedbackText: string;
  type: string;
  createdAt: string;
  mentor?: Mentor;
}

export default function InternEvaluationsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const internId = session?.user?.id;

  // --- Data Fetching ---
  const fetchEvaluations = useCallback(async () => {
    if (sessionStatus === 'loading') return;
    if (!internId) {
      setLoading(false);
      setError("Intern ID not available. Please check NextAuth configuration.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.get<Evaluation[]>(`/evaluations/intern/${internId}`);
      setEvaluations(res.data);
    } catch (err: any) {
      console.error("Failed to fetch intern evaluations:", err);
      let msg = "Could not load your evaluations.";
      if (err instanceof AxiosError) {
        msg = err.response?.data?.message || err.message;
      }
      setError(msg);
      setEvaluations([]);
    } finally {
      setLoading(false);
    }
  }, [internId, sessionStatus]);

  // --- Effects ---
  useEffect(() => {
    fetchEvaluations();
  }, [fetchEvaluations]);

  // --- Loading State ---
  if (loading) {
    return (
      <MainLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <Spin size="large" tip="Loading evaluations..." />
        </div>
      </MainLayout>
    );
  }

  // --- Error State ---
  if (error) {
    return (
      <MainLayout>
        <Result
          status="error"
          title="Failed to Load Evaluations"
          subTitle={error}
          extra={
            <Button type="primary" onClick={fetchEvaluations}>
              Retry
            </Button>
          }
        />
      </MainLayout>
    );
  }

  // --- Empty State ---
  if (evaluations.length === 0) {
    return (
      <MainLayout>
        <Empty
          description={
            <Space direction="vertical" align="center">
              <Title level={3}>No Evaluations Yet</Title>
              <Text type="secondary">
                Your mentor has not submitted any reviews for you, or you haven't submitted any self-reviews.
              </Text>
              <Text type="secondary">
                Check back later or contact your mentor for feedback.
              </Text>
            </Space>
          }
        />
      </MainLayout>
    );
  }

  // --- Main Render ---
  return (
    <MainLayout>
      <div style={{ padding: 24 }}>
        <Title level={2}>My Performance Feedback</Title>
        <Paragraph type="secondary" style={{ marginBottom: 24 }}>
          Here you can review all the evaluations and feedback provided by your mentors.
        </Paragraph>

        <List
          grid={{ gutter: 24, xs: 1, sm: 1, md: 2, lg: 2 }}
          dataSource={evaluations}
          renderItem={(item) => {
            const created = item.createdAt
              ? new Date(item.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })
              : "Unknown";

            return (
              <List.Item key={item.id}>
                <Card
                  title={
                    <Space size="middle">
                      <Tag color="blue">{item.type}</Tag>
                      <Text type="secondary">
                        <CalendarOutlined /> {created}
                      </Text>
                    </Space>
                  }
                  extra={
                    item.score !== undefined && item.score !== null ? (
                      <Space align="center">
                        <Rate
                          disabled
                          defaultValue={item.score}
                          count={5}
                          style={{ fontSize: 16 }}
                        />
                        <Text strong>{item.score.toFixed(1)}/5</Text>
                      </Space>
                    ) : (
                      <Tag color="default">No Score</Tag>
                    )
                  }
                >
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Space align="center">
                      <UserOutlined />
                      <Text strong>
                        {item.mentor
                          ? `${item.mentor.firstName} ${item.mentor.lastName}`
                          : 'Self-Review'}
                      </Text>
                    </Space>

                    <Divider style={{ margin: '12px 0' }} />

                    <Paragraph>
                      {item.feedbackText}
                    </Paragraph>
                  </Space>
                </Card>
              </List.Item>
            );
          }}
        />
      </div>
    </MainLayout>
  );
}
