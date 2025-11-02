// internship-platform-frontend/components/Navbar.tsx
'use client'; // This directive indicates that this component is a Client Component

import { useSession, signOut } from 'next-auth/react'; // 1. Import necessary hooks/functions
import { Button, Menu, Layout } from 'antd'; // 2. Import Ant Design UI components (assuming you're using Ant Design)
import Link from 'next/link'; // 3. Import Next.js's Link component for client-side navigation
import {  LogoutOutlined} from '@ant-design/icons';
const { Header } = Layout; // Destructure Header component from Ant Design Layout

function AppHeader() {
  const { data: session } = useSession(); // 4. Get the current user's session data

  const renderMenuItems = () => { // 5. Function to dynamically create menu items
    const items = []; // Array to hold the menu items to be rendered

    // 6. Conditional rendering based on role
    if (session?.user?.role === 'HR') {
      items.push({ key: 'hr', label: <Link href="/hr-dashboard">HR Dashboard</Link> });
      items.push({ key: 'add-intern', label: <Link href="/hr/add-intern">Add Intern</Link> });
    }
    if (session?.user?.role === 'MENTOR') {
      items.push({ key: 'mentor', label: <Link href="/mentor-dashboard">Mentor Dashboard</Link> });
      items.push({ key: 'projects', label: <Link href="/mentor/projects">My Projects</Link> });
    }
    if (session?.user?.role === 'INTERN') {
      items.push({ key: 'intern', label: <Link href="/intern-dashboard">My Dashboard</Link> });
      items.push({ key: 'tasks', label: <Link href="/intern/tasks">My Tasks</Link> });
    }
    // This allows both OBSERVER and HR to see "Overall Progress"
    if (session?.user?.role === 'OBSERVER' || session?.user?.role === 'HR') {
      items.push({ key: 'overall', label: <Link href="/observer-dashboard">Overall Progress</Link> });
    }

    // 7. Always show logout for logged-in users
    if (session) { // If a session exists (user is logged in)
      items.push({ key: 'logout', label: 
      
      <Button type="primary" 
              icon={<LogoutOutlined />} 
              onClick={() => signOut({ redirect: false })}>Logout</Button> });
    }
    return items; // Return the array of menu items
  };

  return (
    <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div className="logo" style={{ color: 'white', fontSize: '1.5em' }}>Internship Platform</div>
      <Menu
        theme="dark"
        mode="horizontal"
        items={renderMenuItems()} // 8. Render the dynamically created menu items
        style={{ flex: 1, minWidth: 0, justifyContent: 'flex-end' }}
      />
    </Header>
  );
}

export default AppHeader; // Export the component