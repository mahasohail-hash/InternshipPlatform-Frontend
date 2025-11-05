'use client';

import { useSession, signOut } from 'next-auth/react';
import { Button, Menu, Layout, Space, Avatar, Typography } from 'antd'; // Add Typography
import Link from 'next/link';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons'; // Add UserOutlined
import { UserRole } from '../../common/enums/user-role.enum'; // CRITICAL FIX: Correct import path

const { Header } = Layout;
const { Text } = Typography; // Destructure Text

function AppHeader() {
  const { data: session, status } = useSession();

  const renderMenuItems = () => {
    const items = [];

    if (session?.user?.role === UserRole.HR) {
      items.push({ key: 'hr', label: <Link href="/hr-dashboard">HR Dashboard</Link> });
      items.push({ key: 'manage-interns', label: <Link href="/hr-dashboard/manage-interns">Manage Interns</Link> });
      items.push({ key: 'checklist-templates', label: <Link href="/hr-dashboard/checklist-templates">Checklist Templates</Link> });
      items.push({ key: 'projects-overview', label: <Link href="/hr-dashboard/projects-overview">Projects Overview</Link> });
      items.push({ key: 'evaluations-report', label: <Link href="/hr-dashboard/evaluations-report">Evaluation Report</Link> });
    }
    if (session?.user?.role === UserRole.MENTOR) {
      items.push({ key: 'mentor', label: <Link href="/mentor/dashboard">Mentor Dashboard</Link> });
      items.push({ key: 'projects', label: <Link href="/mentor/projects">My Projects</Link> });
      items.push({ key: 'evaluate', label: <Link href="/mentor/evaluate">Submit Evaluation</Link> });
      items.push({ key: 'reports', label: <Link href="/mentor/reports">Reports</Link> });
    }
    if (session?.user?.role === UserRole.INTERN) {
      items.push({ key: 'intern', label: <Link href="/intern/dashboard">My Dashboard</Link> });
      items.push({ key: 'tasks', label: <Link href="/intern/tasks">My Tasks</Link> });
      items.push({ key: 'checklists', label: <Link href="/intern/checklists">My Onboarding Checklist</Link> });
      items.push({ key: 'evaluations', label: <Link href="/intern/evaluations">My Evaluations</Link> });
    }
    if (session?.user?.role === UserRole.OBSERVER) {
      items.push({ key: 'observer', label: <Link href="/observer-dashboard">Observer Dashboard</Link> });
    }

    // Always show settings and logout for logged-in users
    if (session) {
      items.push({ key: 'settings', label: <Link href="/settings">Settings</Link> });
    }
    return items;
  };

  return (
    <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
      <div className="logo" style={{ color: 'white', fontSize: '1.5em', fontWeight: 'bold' }}>Internship Platform</div>
      <Menu
        theme="dark"
        mode="horizontal"
        items={renderMenuItems()}
        style={{ flex: 1, minWidth: 0, justifyContent: 'flex-end' }}
      />
      {status === 'authenticated' && (
        <Space size="large" style={{ marginLeft: 24 }}>
          <Avatar icon={<UserOutlined />} />
          <Text strong style={{ color: 'white' }}>{session.user?.name || session.user?.email}</Text>
          <Text type="secondary" style={{ color: 'rgba(255, 255, 255, 0.65)' }}>({session.user?.role})</Text>
          <Button
            type="primary"
            icon={<LogoutOutlined />}
            onClick={() => signOut({ redirect: false })}
          >
            Logout
          </Button>
        </Space>
      )}
    </Header>
  );
}

export default AppHeader;