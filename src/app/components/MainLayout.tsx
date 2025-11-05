'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Spin, theme, Typography, Space, Avatar, Alert } from 'antd';
import type { ItemType } from 'antd/es/menu/interface';
import {
  UserOutlined, TeamOutlined, FileTextOutlined, DashboardOutlined,
  MenuUnfoldOutlined, MenuFoldOutlined, LogoutOutlined, PlusOutlined,
  BellOutlined, SettingOutlined, CheckSquareOutlined, ProjectOutlined,
  ContainerOutlined, SolutionOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { UserRole } from '../../common/enums/user-role.enum'; // CRITICAL FIX: Correct import path

const { Header, Sider, Content, Footer } = Layout;
const { Title, Text } = Typography;

// Define a safe, extended session type for role access
interface CustomSessionUser {
  id: string;
  name?: string;
  email: string;
  role: UserRole; // Use the UserRole enum
  firstName?: string; // Add if available in session.user
  lastName?: string;  // Add if available in session.user
  accessToken?: string;
}

type MenuItem = ItemType;

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
): MenuItem {
  return { key, icon, children, label } as MenuItem;
}

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { token: { colorBgContainer, borderRadiusLG, colorPrimary } } = theme.useToken();
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const user = session?.user as CustomSessionUser | undefined;

  // 1. Authentication Guard & Redirect
  useEffect(() => {
    // If not authenticated AND not on the login page, redirect to login.
    if (status === 'unauthenticated' && pathname !== '/auth/login') {
      router.replace('/auth/login'); // Use replace to avoid stacking login pages in history
    }
  }, [status, pathname, router]);

  if (status === 'loading') {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" tip="Checking authentication..." />
      </div>
    );
  }

  // If unauthenticated, allow the /auth/login page to render itself without the full layout.
  // For any other unauthenticated page, the useEffect above will redirect.
  if (status === 'unauthenticated') {
    if (pathname === '/auth/login') {
      return <>{children}</>;
    }
    // For other unauthenticated paths, useEffect should have redirected.
    // This return is a fallback and typically won't be reached.
    return (
        <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Spin size="large" tip="Redirecting to login..." />
        </div>
    );
  }

  // If authenticated but user object is missing (should not happen with correct NextAuth setup),
  // this indicates a critical session error. Force re-login.
  if (!user) {
    router.replace('/auth/login?error=Session+data+missing');
    return (
        <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Spin size="large" tip="Session data error, redirecting..." />
        </div>
    );
  }

  // 2. Role-Based Navigation Logic
  const getMenuItems = (): MenuItem[] => {
    const role = user.role;
    const items: MenuItem[] = [
      // Base Dashboard link
      getItem(<Link href={`/${role.toLowerCase()}/dashboard`}>Dashboard</Link>, `/${role.toLowerCase()}/dashboard`, <DashboardOutlined />),
    ];

    // HR Menu Items
    if (role === UserRole.HR) {
      items.push(
        getItem('Intern Management', 'hr-management-group', <TeamOutlined />, [
          getItem(<Link href="/hr-dashboard/manage-interns">Manage Interns</Link>, '/hr-dashboard/manage-interns', <UserOutlined />),
          getItem(<Link href="/hr-dashboard/checklist-templates">Checklist Templates</Link>, '/hr-dashboard/checklist-templates', <CheckSquareOutlined />),
          getItem(<Link href="/hr-dashboard/projects-overview">Projects Overview</Link>, '/hr-dashboard/projects-overview', <ProjectOutlined />),
        ]),
        getItem('Reports & Evals', 'hr-evals-group', <FileTextOutlined />, [
          getItem(<Link href="/hr-dashboard/evaluations-report">Evaluation Report</Link>, '/hr-dashboard/evaluations-report', <SolutionOutlined />),
        ])
      );
    }

    // MENTOR Menu Items
    if (role === UserRole.MENTOR) {
      items.push(
        getItem('Project Management', 'mentor-projects-group', <ProjectOutlined />, [
          getItem(<Link href="/mentor/projects">My Projects</Link>, '/mentor/projects', <ContainerOutlined />),
          getItem(<Link href="/mentor/project/create">Define New Project</Link>, '/mentor/project/create', <PlusOutlined />),
        ]),
        getItem(<Link href="/mentor/evaluate">Submit Evaluation</Link>, '/mentor/evaluate', <SolutionOutlined />),
        getItem(<Link href="/mentor/reports">Reports & Exports</Link>, '/mentor/reports', <FileTextOutlined />),
      );
    }

    // INTERN Menu Items
    if (role === UserRole.INTERN) {
      items.push(
        getItem(<Link href="/intern/tasks">My Tasks</Link>, '/intern/tasks', <ProjectOutlined />),
        getItem(<Link href="/intern/checklists">My Onboarding Checklist</Link>, '/intern/checklists', <CheckSquareOutlined />),
        getItem(<Link href="/intern/evaluations">My Evaluations</Link>, '/intern/evaluations', <FileTextOutlined />),
      );
    }

    // OBSERVER Menu Items
    if (role === UserRole.OBSERVER) {
      items.push(
        getItem(<Link href="/observer-dashboard">Overview</Link>, '/observer-dashboard', <DashboardOutlined />),
      );
    }

    // Settings (Accessible to all authenticated users)
    items.push(
      getItem(<Link href="/settings">Settings</Link>, '/settings', <SettingOutlined />)
    );

    return items;
  };

  // 3. Route Matching Logic for selectedKeys in Antd Menu
  const getSelectedKeys = (): string[] => {
    const items = getMenuItems();
    const allPossibleKeys: string[] = [];

    const extractKeys = (menuItems: MenuItem[]) => {
      menuItems.forEach(item => {
        if (item && 'key' in item && typeof item.key === 'string' && item.key.startsWith('/')) {
            allPossibleKeys.push(item.key);
        }
        if (item && 'children' in item && Array.isArray(item.children)) {
            extractKeys(item.children);
        }
      });
    };

    extractKeys(items);

    // Find the most specific key that matches the current pathname
    const matchingKeys = allPossibleKeys.filter(key => pathname.startsWith(key));
    if (matchingKeys.length === 0) {
        // Fallback to role-based dashboard if no specific match
        return [`/${user.role.toLowerCase()}/dashboard`];
    }
    // Sort by length to pick the most specific match (e.g., /hr-dashboard/manage-interns instead of /hr-dashboard)
    const mostSpecificKey = matchingKeys.sort((a, b) => b.length - a.length)[0];

    return [mostSpecificKey];
  };

 // --- RENDER THE DASHBOARD LAYOUT ---
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="dark" width={220}>
        <div
          className="logo-display"
          style={{
            height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', borderRadius: borderRadiusLG, overflow: 'hidden',
            fontSize: collapsed ? '12px' : '18px', fontWeight: 'bold', transition: 'all 0.2s',
          }}
        >
          {collapsed ? 'IMP' : 'Internship Platform'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKeys()}
          items={getMenuItems()}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            padding: 0, background: colorBgContainer, display: 'flex',
            justifyContent: 'space-between', alignItems: 'center', paddingRight: 24,
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />

          <Space size="large">
            {/* Notification/Settings Buttons (Future Features) */}
            <Button type="text" icon={<BellOutlined />} style={{ fontSize: '16px' }} title="Notifications (Future)" disabled />
            <Button type="text" icon={<SettingOutlined />} style={{ fontSize: '16px' }} onClick={() => router.push('/settings')} title="Settings" />

            {/* User Info and Logout */}
            <Avatar icon={<UserOutlined />} style={{ backgroundColor: colorPrimary }} />
            <Text strong>{user.firstName || user.name || user.email || 'User'}</Text>
            <Text type="secondary">({user.role})</Text>

            <Button
              type="primary"
              icon={<LogoutOutlined />}
              onClick={() => signOut({ redirect: false })} // Correctly handles client-side logout
            >
              Logout
            </Button>
          </Space>
        </Header>

        <Content style={{ margin: '0 16px' }}>
          <div
            style={{
              padding: 24, minHeight: 360, background: colorBgContainer,
              borderRadius: borderRadiusLG, marginTop: 16,
            }}
          >
            {children}
          </div>
        </Content>

        <Footer style={{ textAlign: 'center' }}>
          Internship Management Platform ©{new Date().getFullYear()} Created by Maha Sohail
        </Footer>
      </Layout>
    </Layout>
  );
};