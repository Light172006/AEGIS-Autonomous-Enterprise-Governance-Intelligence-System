"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, user, router]);

  // While loading or if non-admin, don't render admin content
  if (isLoading || !isAuthenticated || user?.role !== "admin") {
    return null;
  }

  return <>{children}</>;
}
