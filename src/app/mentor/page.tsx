// src/app/mentor/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Spin, notification, Row, Col, Typography } from 'antd';
import api from '../../lib/api';

const { Title } = Typography;

interface Intern {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  github_username?: string;
}

export default function MentorDashboard() {
  const router = useRouter();
  const [interns, setInterns] = useState<Intern[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchInterns = async () => {
      try {
        const res = await api.get('/users/interns');
        setInterns(res.data);
      } catch (err: any) {
        notification.error({
          message: 'Failed to load interns',
          description: err.response?.data?.message || 'An error occurred while fetching interns.',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchInterns();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin size="large" tip="Loading interns..." />
      </div>
    );
  }

  if (interns.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Title level={3}>No Interns Found</Title>
        <p>There are no interns available at the moment.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Mentor Dashboard</Title>
      <Row gutter={[16, 16]}>
        {interns.map((intern) => (
          <Col xs={24} sm={12} md={8} lg={6} key={intern.id}>
            <Card
              title={`${intern.firstName} ${intern.lastName}`}
              style={{ width: '100%' }}
              actions={[
                <Button
                  type="primary"
                  onClick={() => router.push(`/mentor/interns/${intern.id}/edit`)}
                >
                  Edit Intern
                </Button>,
              ]}
            >
              <p><strong>Email:</strong> {intern.email}</p>
              {intern.github_username && <p><strong>GitHub:</strong> {intern.github_username}</p>}
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
