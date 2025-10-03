// app/(dashboard)/layout.tsx
"use client";

import React, { useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import SideNavBarComp from "@/components/navs/SideNavBar/SideNavBar";
import TopBarComp from "@/components/navs/TopBar/TopBar";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import useRealtime from "@/hooks/useRealtime";
import { updateUserWithPermissions } from "@/redux/slices/authSlice";
import { useGetCurrentUserQuery } from "@/redux/slices/userApi";

/**
 * Dashboard Layout - For protected application pages
 *
 * Note: Auth protection is handled by middleware.ts
 * This layout only handles:
 * - UI structure (sidebar + topbar)
 * - Real-time connections
 * - User permissions sync
 */

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useAppDispatch();
  const { connectionStatus, isConnected } = useRealtime();
  const { token } = useAppSelector((state) => state.auth);

  // Fetch current user data (permissions, profile, etc.)
  const { data: currentUserData, refetch: refetchUser } =
    useGetCurrentUserQuery(undefined, {
      skip: !token,
    });

  // Log real-time connection status
  useEffect(() => {
    console.log("🔄 Real-time connection status:", connectionStatus);
    console.log("🔄 Real-time isConnected status:", isConnected);
  }, [connectionStatus, isConnected]);

  // Sync user permissions when data is fetched
  useEffect(() => {
    if (currentUserData) {
      dispatch(updateUserWithPermissions(currentUserData));
      console.log("✅ User permissions synced");
    }
  }, [currentUserData, dispatch]);

  // Refetch user data on mount to ensure fresh permissions
  useEffect(() => {
    if (token) {
      refetchUser();
    }
  }, [token, refetchUser]);

  return (
    <SidebarProvider>
      {/* Main Container */}
      <div className="flex min-h-screen w-full max-w-full overflow-x-hidden bg-gray-50">
        {/* Sidebar */}
        <SideNavBarComp />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen min-w-0">
          {/* Top Bar */}
          <header className="flex-shrink-0 border-b bg-white px-4 py-2 flex items-center gap-4 sticky top-0 z-40 w-full">
            <SidebarTrigger className="lg:hidden flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <TopBarComp />
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 md:p-6 p-3 w-full min-w-0">
            <div className="w-full max-w-full overflow-x-auto">
              <div className="min-w-0">{children}</div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
