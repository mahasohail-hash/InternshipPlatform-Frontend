'use client';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation'; // 🔥 FIX 1: Import usePathname
import { UserRole } from '../../common/enums/user-role.enum';
import { useEffect } from 'react';

interface CustomSessionUser {
  id: string;
  name?: string;
  email: string;
  role: UserRole; // Use UserRole enum
  accessToken?: string;
}

export const useAuth = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname(); // 🔥 FIX 2: Call the hook to get the path

  const user = session?.user as CustomSessionUser | undefined;
  const isLoggedIn = status === 'authenticated';
  const isLoading = status === 'loading';
  const role = user?.role;
  const id = user?.id; // Assuming user ID is in the session

  // Advanced: Auto-redirect logic for non-auth pages IF user is not logged in.
  useEffect(() => {
    // Check if the path starts with '/auth' using the correct variable
    if (!isLoggedIn && !isLoading && pathname && !pathname.startsWith('/auth')) { 
        // router.push('/auth/login'); // Uncomment if you want client-side redirect fallback
    }
  }, [isLoggedIn, isLoading, pathname]); // Depend on pathname

  return {
    isLoggedIn,
    isLoading,
    session,
    user,
    role,
    id
  };
};