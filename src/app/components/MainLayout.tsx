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

const { Header, Sider, Content, Footer } = Layout;
const { Title, Text } = Typography;

// Define a safe, extended session type for role access
interface CustomSessionUser {
  id: string;
  name?: string;
  email: string;
  role: 'HR' | 'MENTOR' | 'INTERN' | 'OBSERVER' | string;
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
    // FIX: Make path check more strict
    if (status === 'unauthenticated' && pathname !== '/auth/login') {
      router.push('/auth/login');
    }
  }, [status, pathname, router]);

  if (status === 'loading') {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" tip="Checking authentication..." />
      </div>
    );
  }

  // Handle unauthenticated state or missing user
  if (status === 'unauthenticated' || !user) {
    // FIX: Make path check more strict
    if (pathname === '/auth/login') {
      // Allow login page to render without the layout
      return <>{children}</>;
    }
    // For any other page, show an error or redirect
return (
        <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Spin size="large" tip="Redirecting to login..." />
        </div>
    );  }


  // 2. Role-Based Navigation Logic
  const getMenuItems = (): MenuItem[] => {
    const role = user.role;
    const items: MenuItem[] = [
      // Base Dashboard link
      getItem(<Link href={`/${role.toLowerCase()}/dashboard`}>Dashboard</Link>, `/${role.toLowerCase()}/dashboard`, <DashboardOutlined />),
    ];

    // HR Menu Items
    if (role === 'HR') {
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
    if (role === 'MENTOR') {
      items.push(
        getItem('Project Management', 'mentor-projects-group', <ProjectOutlined />, [
          getItem(<Link href="/mentor/projects">My Projects</Link>, '/mentor/projects', <ContainerOutlined />),
          getItem(<Link href="/mentor/project/create">Define New Project</Link>, '/mentor/project/create', <PlusOutlined />),
        ]),
        getItem(<Link href="/mentor/evaluate">Submit Evaluation</Link>, '/mentor/evaluate', <SolutionOutlined />),
      );
    }

    // INTERN Menu Items
    if (role === 'INTERN') {
      items.push(
        getItem(<Link href="/intern/tasks">My Tasks</Link>, '/intern/tasks', <ProjectOutlined />),
        getItem(<Link href="/intern/checklists">My Onboarding Checklist</Link>, '/intern/checklists', <CheckSquareOutlined />),
        getItem(<Link href="/intern/evaluations">My Evaluations</Link>, '/intern/evaluations', <FileTextOutlined />),
      );
    }

    // Settings
    items.push(
      getItem(<Link href="/settings">Settings</Link>, '/settings', <SettingOutlined />)
    );
    
    return items;
  };

  // 3. Route Matching Logic
  const getSelectedKeys = (): string[] => {
    const items = getMenuItems();
    const allKeys: string[] = [];
    
    const extractKeys = (menuItems: MenuItem[]) => {
      menuItems.forEach(item => {
        if (item && 'key' in item && typeof item.key === 'string' && item.key.startsWith('/')) {
            allKeys.push(item.key);
        }
        if (item && 'children' in item && Array.isArray(item.children)) {
            extractKeys(item.children);
        }
      });
    };
    
    extractKeys(items);

    const matchingKeys = allKeys.filter(key => key !== '/' && pathname.startsWith(key));
    const mostSpecificKey = matchingKeys.sort((a, b) => b.length - a.length)[0];

    if (!mostSpecificKey) {
      return [`/${user.role.toLowerCase()}/dashboard`];
    }

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
            <Button type="text" icon={<BellOutlined />} style={{ fontSize: '16px' }} />
            <Button type="text" icon={<SettingOutlined />} style={{ fontSize: '16px' }} />
            <Avatar icon={<UserOutlined />} style={{ backgroundColor: colorPrimary }} />
            <Text strong>{user.name || user.email || 'User'}</Text>
            <Text type="secondary">({user.role})</Text>
            
            {/* --- THIS IS THE FIX ---
              Adding `{ redirect: false }` stops NextAuth from reloading the page,
              letting the `useEffect` guard above handle the redirect to `/auth/login`
              cleanly and without a race condition.
            {/* --- --- --- --- --- --- */}
            <Button 
              type="primary" 
              icon={<LogoutOutlined />} 
              onClick={() => signOut({ redirect: false })}
            >
              Logout
            </Button>
            {/* --- --- --- --- --- --- */}

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