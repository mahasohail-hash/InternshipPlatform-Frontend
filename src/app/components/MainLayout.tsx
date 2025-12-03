'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Layout, Menu, Button, Spin, Typography, Space, Avatar } from 'antd';
import type { MenuProps } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  FileTextOutlined,
  DashboardOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  LogoutOutlined,
  PlusOutlined,
  BellOutlined,
  SettingOutlined,
  CheckSquareOutlined,
  ProjectOutlined,
  ContainerOutlined,
  SolutionOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { UserRole } from '../../common/enums/user-role.enum';

const { Header, Sider, Content, Footer } = Layout;
const { Text } = Typography;

interface CustomSessionUser {
  id: string;
  name?: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  accessToken?: string;
}

type MenuItem = Required<MenuProps>['items'][number];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  // Map session data safely
 const user: CustomSessionUser | undefined = useMemo(() => {
  if (!session?.user) return undefined;
  return {
    id: session.user.id,
    name: session.user.name ?? undefined, // <-- coerce null to undefined
    email: session.user.email,
    role: session.user.role as UserRole,
    firstName: session.user.firstName,
    lastName: session.user.lastName,
    accessToken: session.accessToken,
  };
}, [session]);


  // Redirect unauthenticated users
  useEffect(() => {
    const isLoginPage = pathname?.startsWith('/auth/login') || pathname?.startsWith('/auth/signin');
    if (status === 'unauthenticated' && !isLoginPage) {
      router.replace('/auth/login');
    }
  }, [status, pathname, router]);

  // Show loading spinner while session is loading
  if (status === 'loading') {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" tip="Checking authentication..." />
      </div>
    );
  }

  // Prevent rendering if unauthenticated
  if (status === 'unauthenticated') return <>{children}</>;

  // Critical session missing
  if (!user) {
    router.replace('/auth/login?error=Session+data+missing');
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" tip="Session data missing, redirecting..." />
      </div>
    );
  }

  // --- Role-based menu mapping ---
  const roleBasedMenu: Record<UserRole, MenuItem[]> = {
    HR: [
      {
        key: '/hr-dashboard',
        icon: <DashboardOutlined />,
        label: <Link href="/hr-dashboard">Dashboard</Link>,
      },
      {
        key: 'hr-management-group',
        icon: <TeamOutlined />,
        label: 'Intern Management',
        children: [
          { key: '/hr-dashboard/manage-interns', icon: <UserOutlined />, label: <Link href="/hr-dashboard/manage-interns">Manage Interns</Link> },
          { key: '/hr-dashboard/checklist-templates', icon: <CheckSquareOutlined />, label: <Link href="/hr-dashboard/checklist-templates">Checklist Templates</Link> },
          { key: '/hr-dashboard/projects-overview', icon: <ProjectOutlined />, label: <Link href="/hr-dashboard/projects-overview">Projects Overview</Link> },
        ],
      },
      {
        key: 'hr-evals-group',
        icon: <FileTextOutlined />,
        label: 'Reports & Evals',
        children: [
          { key: '/hr-dashboard/evaluations-report', icon: <SolutionOutlined />, label: <Link href="/hr-dashboard/evaluations-report">Evaluation Report</Link> },
        ],
      },
    ],
    MENTOR: [
      { key: '/mentor/dashboard', icon: <DashboardOutlined />, label: <Link href="/mentor/dashboard">Dashboard</Link> },
      {
        key: 'mentor-projects-group',
        icon: <ProjectOutlined />,
        label: 'Project Management',
        children: [
          { key: '/mentor/projects', icon: <ContainerOutlined />, label: <Link href="/mentor/projects">My Projects</Link> },
          { key: '/mentor/project/create', icon: <PlusOutlined />, label: <Link href="/mentor/project/create">Define New Project</Link> },
        ],
      },
      { key: '/mentor/evaluate', icon: <SolutionOutlined />, label: <Link href="/mentor/evaluate">Submit Evaluation</Link> },
      { key: '/mentor/reports', icon: <FileTextOutlined />, label: <Link href="/mentor/reports">Reports & Exports</Link> },
    ],
    INTERN: [
      { key: '/intern/dashboard', icon: <DashboardOutlined />, label: <Link href="/intern/dashboard">Dashboard</Link> },
      { key: '/intern/tasks', icon: <ProjectOutlined />, label: <Link href="/intern/tasks">My Tasks</Link> },
      { key: '/intern/checklists', icon: <CheckSquareOutlined />, label: <Link href="/intern/checklists">My Onboarding Checklist</Link> },
      { key: '/intern/evaluations', icon: <FileTextOutlined />, label: <Link href="/intern/evaluations">My Evaluations</Link> },
    ],
    OBSERVER: [
      { key: '/observer-dashboard', icon: <DashboardOutlined />, label: <Link href="/observer-dashboard">Overview</Link> },
    ],
    [UserRole.ADMIN]: []
  };

  // Common items for all users
  const commonMenu: MenuItem[] = [
    { key: '/settings', icon: <SettingOutlined />, label: <Link href="/settings">Settings</Link> },
  ];

  const menuItems = useMemo(() => [...(roleBasedMenu[user.role] ?? []), ...commonMenu], [user.role]);

  // --- Selected menu key logic ---
  const getSelectedKeys = (): string[] => {
    const keys: string[] = [];
    const collectKeys = (items: MenuItem[]) => {
      items.forEach((item) => {
        if (!item) return;
        if ('key' in item && typeof item.key === 'string') keys.push(item.key);
        if ('children' in item && Array.isArray(item.children)) collectKeys(item.children);
      });
    };
    collectKeys(menuItems);
    const matched = keys.filter((k) => pathname?.startsWith(k));
    if (matched.length === 0) return [`/${user.role.toLowerCase()}/dashboard`];
    return [matched.sort((a, b) => b.length - a.length)[0]];
  };

  const selectedKeys = useMemo(() => getSelectedKeys(), [menuItems, pathname]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="dark" width={220}>
        <div
          style={{
            height: 32,
            margin: 16,
            background: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: collapsed ? '12px' : '18px',
            fontWeight: 'bold',
            borderRadius: 6,
            transition: 'all 0.2s',
          }}
        >
          {collapsed ? 'IMP' : 'Internship Platform'}
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={selectedKeys} items={menuItems} />
      </Sider>

      <Layout>
        <Header style={{ padding: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: 24, background: '#fff' }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          <Space size="large">
            <Button type="text" icon={<BellOutlined />} style={{ fontSize: 16 }} disabled title="Notifications" />
            <Button type="text" icon={<SettingOutlined />} style={{ fontSize: 16 }} onClick={() => router.push('/settings')} title="Settings" />
            <Avatar icon={<UserOutlined />} />
            <Text strong>{user.firstName || user.name || user.email}</Text>
            <Text type="secondary">({user.role})</Text>
            <Button type="primary" icon={<LogoutOutlined />} onClick={() => signOut({ callbackUrl: '/auth/login' })}>
              Logout
            </Button>
          </Space>
        </Header>

        <Content style={{ margin: '0 16px' }}>
          <div style={{ padding: 24, minHeight: 360, marginTop: 16, background: '#fff', borderRadius: 6 }}>
            {children}
          </div>
        </Content>

        <Footer style={{ textAlign: 'center' }}>
          Internship Management Platform ©{new Date().getFullYear()} Created by Maha Sohail
        </Footer>
      </Layout>
    </Layout>
  );
}
