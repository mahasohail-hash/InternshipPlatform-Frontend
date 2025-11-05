'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthLoginRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get the error parameter if it exists
    const error = searchParams.get('error');
    const redirectUrl = error 
      ? `/auth/signin/login?error=${encodeURIComponent(error)}`
      : '/auth/signin/login';
    
    router.replace(redirectUrl);
  }, [router, searchParams]);

  return null;
}

