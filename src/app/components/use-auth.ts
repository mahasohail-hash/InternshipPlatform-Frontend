'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { UserRole } from '@/common/enums/user-role.enum';
import { useEffect } from 'react';

interface CustomSessionUser {
  id: string;
  name?: string;
  email: string;
  role: UserRole;
  accessToken?: string;
}

interface UseAuthReturn {
  isLoggedIn: boolean;
  isLoading: boolean;
  session: any; // Keep it `any` because next-auth session can have extra fields
  user?: CustomSessionUser;
  role?: UserRole;
  id?: string;
}

/**
 * Custom hook to get authentication info from NextAuth
 */
export const useAuth = (): UseAuthReturn => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const user = session?.user as CustomSessionUser | undefined;
  const isLoggedIn = status === 'authenticated';
  const isLoading = status === 'loading';
  const role = user?.role;
  const id = user?.id;

  // Optional: redirect unauthenticated users from protected pages
  useEffect(() => {
    if (!isLoggedIn && !isLoading && pathname && !pathname.startsWith('/auth')) {
      // Uncomment this line if you want automatic client-side redirect
      // router.push('/auth/login');
    }
  }, [isLoggedIn, isLoading, pathname, router]);

  return {
    isLoggedIn,
    isLoading,
    session,
    user,
    role,
    id,
  };
};
