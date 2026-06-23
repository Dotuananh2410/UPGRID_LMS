"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { DashboardSkeleton } from "@/components/Skeleton";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="flex-1 bg-neutral-50 dark:bg-neutral-950 flex flex-col">
      {children}
    </div>
  );
}
