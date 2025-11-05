"use client"; // CRITICAL FIX: Mark this component as a Client Component

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spin } from "antd"; // Import Spin for loading indicator

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      // Redirect based on role if logged in
      if (session?.user?.role === "HR") {
        router.replace("/hr-dashboard");
      } else if (session?.user?.role === "MENTOR") {
        router.replace("/mentor/dashboard");
      } else if (session?.user?.role === "INTERN") {
        router.replace("/intern/dashboard");
      } else if (session?.user?.role === "OBSERVER") {
        router.replace("/observer-dashboard");
      } else {
        router.replace("/dashboard"); // Generic dashboard if role not recognized
      }
    } else if (status === "unauthenticated") {
      // Redirect unauthenticated users to login page
      router.replace("/auth/signin/login");
    }
  }, [status, session, router]);

  // Show loading spinner while checking session status
  return (
    <div className="font-sans flex items-center justify-center min-h-screen">
      <Spin size="large" tip="Loading..." />
    </div>
  );
}
