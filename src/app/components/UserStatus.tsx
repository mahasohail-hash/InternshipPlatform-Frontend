'use client';

import { useSession, signOut } from 'next-auth/react';
import { Button } from 'antd'; // Assuming Ant Design is installed
import {  LogoutOutlined} from '@ant-design/icons';

export function UserStatus() {
  const { data: session, status } = useSession(); // The useSession hook gives you session data and loading status

  if (status === 'loading') {
    return <p>Loading session...</p>;
  }

  if (session) {
    // User is logged in
    return (
      <div>
        <p>Welcome back, {session.user?.name}!</p>
        <p>You are logged in as: {session.user?.email} (Role: {session.user?.role})</p>
                  <Button 
              type="primary" 
              icon={<LogoutOutlined />} 
              onClick={() => signOut({ redirect: false })}>
              Logout </Button>  
              
                  </div>
    );
  };

  // User is not logged in
  return (
    <div>
      <p>You are not logged in.</p>
      {/* You might provide a link to the sign-in page here */}
    </div>
  );
}