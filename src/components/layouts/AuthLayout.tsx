// src/components/layouts/AuthLayout.tsx (Stable - No Hook Mismatches)

"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import SideNavBarComp from "@/components/navs/SideNavBar/SideNavBar";
import TopBarComp from "@/components/navs/TopBar/TopBar";
import LoginPage from "@/all-pages/LoginPage";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import useRealtime from "@/hooks/useRealtime";
import {
  setAuthFromStorage,
  clearAuthState,
  setLoading,
  updateUserWithPermissions,
} from "@/redux/slices/authSlice";
import { useGetCurrentUserQuery } from "@/redux/slices/authApi";

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);
  const { connectionStatus, isConnected } = useRealtime();

  // Get authentication state from Redux store
  const { isAuthenticated, loading, token } = useAppSelector(
    (state) => state.auth
  );

  const {
    // data: currentUserData,
    // error: userFetchError,
    refetch: refetchUser,
  } = useGetCurrentUserQuery(undefined, {
    skip: !token || !isAuthenticated, // Only fetch when we have a token
  });

  useEffect(() => {
    console.log("🔄 Real-time connection status:", connectionStatus);
  }, [connectionStatus]);

  // Initialize authentication from localStorage only once
  useEffect(() => {
    const initializeAuth = async () => {
      dispatch(setLoading(true));

      try {
        const token = localStorage.getItem("access_token");
        const userData = localStorage.getItem("user_data");

        if (token && userData) {
          // First, set auth from storage
          dispatch(setAuthFromStorage());
          try {
            const result = await refetchUser();
            if (result.data) {
              // Update cache with full user data including permissions
              dispatch(updateUserWithPermissions(result.data));
              console.log("✅ User data updated with permissions");
            }
          } catch (fetchError) {
            console.error("⚠️ Failed to fetch user permissions:", fetchError);
            // Continue with cached data - don't break the app
          }
        } else {
          // No valid auth data found
          dispatch(clearAuthState());
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        // Clear invalid data
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_data");
        dispatch(clearAuthState());
      } finally {
        dispatch(setLoading(false));
        setIsInitialized(true);
      }
    };

    // Only initialize once when component mounts
    if (!isInitialized) {
      initializeAuth();
    }
  }, [dispatch, isInitialized, refetchUser]);

  // Handle navigation after authentication changes
  useEffect(() => {
    if (!isInitialized || loading) return;

    const publicRoutes = ["/login", "/register", "/forgot-password", "/"];
    const isPublicRoute = publicRoutes.includes(pathname || "");

    if (isAuthenticated && isPublicRoute) {
      // Authenticated user on public route -> redirect to dashboard
      router.replace("/dashboard");
    } else if (!isAuthenticated && !isPublicRoute) {
      // Unauthenticated user on protected route -> redirect to login
      router.replace("/login");
    }
  }, [isAuthenticated, pathname, router, isInitialized, loading]);

  // 🔥 ADD THIS NEW useEffect: Fetch permissions after login
  useEffect(() => {
    const fetchPermissionsAfterLogin = async () => {
      // Only run if:
      // 1. User is authenticated
      // 2. App is initialized
      // 3. We have a token
      // 4. User object exists but might not have permissions
      if (isAuthenticated && isInitialized && token && !loading) {
        console.log("🔄 Fetching user permissions after login...");

        try {
          const result = await refetchUser();
          if (result.data) {
            dispatch(updateUserWithPermissions(result.data));
            console.log("✅ Permissions updated after login");
          }
        } catch (error) {
          console.error("⚠️ Failed to fetch permissions after login:", error);
        }
      }
    };

    fetchPermissionsAfterLogin();
  }, [isAuthenticated, isInitialized, token, loading, refetchUser, dispatch]);

  // Show loading during initialization
  if (!isInitialized || loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing LeadG CRM...</p>
        </div>
      </div>
    );
  }

  // Always render the same structure to avoid hook mismatches
  const publicRoutes = ["/login", "/register", "/forgot-password"];
  const shouldShowLogin =
    !isAuthenticated &&
    (publicRoutes.includes(pathname || "") || pathname === "/");

  if (shouldShowLogin) {
    // Render login page with consistent structure
    return (
      <div className="min-h-screen">
        <LoginPage />
      </div>
    );
  }

  // Render authenticated layout with consistent structure
  return (
    <SidebarProvider>
      {/* Main Container - Prevent horizontal scroll with proper width constraints */}
      <div className="flex min-h-screen w-full max-w-full overflow-x-hidden bg-gray-50">
        {/* Sidebar - Fixed positioning allows independent scrolling */}
        <SideNavBarComp />

        {/* Main Content Area - Flexible container with width constraints */}
        <div className="flex-1 flex flex-col min-h-screen min-w-0">
          {/* Top Bar - Fixed header with proper width handling */}
          <header className="flex-shrink-0 border-b bg-white px-4 py-2 flex items-center gap-4 sticky top-0 z-40 w-full">
            <SidebarTrigger className="lg:hidden flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <TopBarComp />
            </div>
          </header>

          {/* Main Content - Scrollable area with proper width constraints */}
          <main className="flex-1 p-6 w-full min-w-0">
            {/* Content wrapper that prevents horizontal overflow */}
            <div className="w-full max-w-full overflow-x-auto">
              <div className="min-w-0">{children}</div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AuthLayout;
