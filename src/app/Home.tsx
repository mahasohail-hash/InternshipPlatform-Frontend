'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spin, Button } from 'antd';
import { Poppins } from 'next/font/google';
import { LoginButton } from './components/auth/login-button';

// Font at module scope
const poppins = Poppins({ subsets: ['latin'], weight: ['600'] });

export default function HomePage() {
  const router = useRouter();

  // Redirect after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/auth/login'); // Change to your target page
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div
      className={`flex items-center justify-center min-h-screen w-full ${poppins.className}`}
      style={{
        background: 'linear-gradient(to bottom, #38bdf8, #1e3a8a)',
      }}
    >
      <div className="flex flex-col items-center justify-center text-center gap-6">
        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-bold text-white drop-shadow-lg">
          Internship Management Platform
        </h1>

        {/* Sign In Button */}
        <div>
       <LoginButton >
        <Button
          type="primary"
          size="large"
          className="bg-white text-black font-semibold hover:bg-gray-100"
        >
          Sign In
        </Button>
        </LoginButton>
         </div>
        
      </div>
    </div>
  );
}
