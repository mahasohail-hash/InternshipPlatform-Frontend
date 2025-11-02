// internship-platform-frontend/components/use-auth.ts
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const user = session?.user;
  const isLoggedIn = status === 'authenticated';
  const isLoading = status === 'loading';
  const role = (user as any)?.role;
  const id = (user as any)?.id; // Assuming user ID is in the session

  // Advanced: Auto-redirect logic
  if (!isLoggedIn && !isLoading) {
    // router.push('/auth/login'); // Uncomment this if you want auto-redirect on non-auth pages
  }

  return {
    isLoggedIn,
    isLoading,
    session,
    user,
    role,
    id
  };
};