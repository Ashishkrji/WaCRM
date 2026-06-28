"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { AdminSidebar } from "./AdminSidebar";
import { Header } from "@/components/layout/header";

function AdminShellInner({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, profileLoading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!profileLoading && profile) {
      // Check if user has admin access
      const role = profile.role?.toLowerCase() || "";
      if (role !== "super_admin" && role !== "admin" && role !== "administrator") {
        router.push("/dashboard");
      }
    }
  }, [profile, profileLoading, router]);

  if (loading || profileLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <p className="text-sm text-slate-400 font-medium">Verifying Administrator Access...</p>
        </div>
      </div>
    );
  }

  // If unauthorized, prevent rendering of children
  const role = profile?.role?.toLowerCase() || "";
  if (!user || (role !== "super_admin" && role !== "admin" && role !== "administrator")) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <AdminSidebar open={sidebarOpen} onClose={closeSidebar} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminShellInner>{children}</AdminShellInner>
    </AuthProvider>
  );
}
