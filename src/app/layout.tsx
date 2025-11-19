
import '@/globals.css'; 
import { AntdRegistry } from '@ant-design/nextjs-registry';
import AuthProvider from './components/auth-provider';
import ClientRootLayout from './ClientRootLayout'; 
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Internship Platform',
  description: 'Internship Management System',
};

// 2. Main Server Layout component
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* --- 2. Wrap your app --- */}
        <AuthProvider>
          <AntdRegistry>{children}</AntdRegistry>
        </AuthProvider>
        {/* --- End of Fix --- */}
      </body>
    </html>
  );
}