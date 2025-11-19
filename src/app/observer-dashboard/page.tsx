'use client'; 

import React from 'react';
import MainLayout from '../components/MainLayout'; // Import MainLayout
import { Typography, Card, Space, Result } from 'antd'; // Add components as needed
import { useSession } from 'next-auth/react';
import { UserRole } from '../../common/enums/user-role.enum';

const { Title, Paragraph } = Typography;

export default function ObserverDashboardPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <MainLayout><p>Loading observer dashboard...</p></MainLayout>;
  }

  // Basic authorization check
  if (status === 'unauthenticated' || session?.user?.role !== UserRole.OBSERVER) {
    return (
      <MainLayout>
        <Result
          status="403"
          title="Access Denied"
          subTitle="You do not have permission to view the Observer Dashboard."
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Title level={2}>Observer Dashboard</Title>
        <Paragraph type="secondary">
          Welcome, {session?.user?.name || session?.user?.email}! This dashboard provides an overview of internship progress.
        </Paragraph>

        <Card title="Overall Program Health" style={{ marginBottom: 20 }}>
          <p>Key metrics and high-level trends will be displayed here.</p>
          <p>
            *(Future Feature: Interactive charts showing intern progress, program effectiveness,
            and aggregated feedback. Currently under development.)*
          </p>
        </Card>

        <Card title="Intern Progress Summary" style={{ marginBottom: 20 }}>
          <p>A list of all interns with their current project status and completion rates.</p>
          <p>
            *(Future Feature: Table displaying intern names, assigned projects, overall task completion,
            and average evaluation scores.)*
          </p>
        </Card>

        {/* You can add more cards/sections here as per your project document's 'Observer role' */}
      </Space>
    </MainLayout>
  );
};