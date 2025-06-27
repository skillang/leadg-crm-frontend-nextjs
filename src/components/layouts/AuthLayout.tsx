// src/components/layouts/AuthLayout.tsx (UPDATED with Token Monitoring)

"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import SideNavBarComp from "@/components/navs/SideNavBar/SideNavBar";
import TopBarComp from "@/components/navs/TopBar/TopBar";
import LoginPage from "@/pages/LoginPage.jsx";
import TokenExpirationMonitor from "@/components/auth/TokenExpirationMonitor";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import {
  setAuthState,
  setLoading,
  clearAuthState,
  setUserData,
  initializeTokenTimestamp,
} from "@/redux/slices/authSlice";
import { useGetCurrentUserQuery } from "@/redux/slices/authApi";

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const [isInitialized, setIsInitialized] = useState(false);

  // Get authentication state from Redux store
  const { isAuthenticated, user, loading, accessToken } = useAppSelector(
    (state) => state.auth
  );

  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/register", "/forgot-password"];
  const isPublicRoute = publicRoutes.includes(pathname!);

  // Get access token from localStorage
  const storedToken =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  // Use RTK Query to get current user info if we have a token
  const {
    data: currentUserData,
    error: userError,
    isLoading: userLoading,
    refetch: refetchUser,
  } = useGetCurrentUserQuery(undefined, {
    skip: !storedToken || isAuthenticated, // Skip if no token or already authenticated
  });

  useEffect(() => {
    const initializeAuth = async () => {
      dispatch(setLoading(true));

      try {
        const token = localStorage?.getItem("access_token");
        const refreshToken = localStorage?.getItem("refresh_token");

        if (!token) {
          dispatch(clearAuthState());
          setIsInitialized(true);
          return;
        }

        // Initialize token timestamp from localStorage
        dispatch(initializeTokenTimestamp());

        // If we have user data from the query, use it
        if (currentUserData && !userError) {
          dispatch(setUserData(currentUserData));
          setIsInitialized(true);
          return;
        }

        // If there's an error getting user data, token might be invalid
        if (userError) {
          console.error("Token verification failed:", userError);

          // Handle specific error types
          if ((userError as any)?.status === 401) {
            console.log("🚨 Token expired or invalid, clearing auth state");
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            localStorage.removeItem("token_created_at");
            dispatch(clearAuthState());
          } else {
            console.error("Unexpected error during token verification");
            // For non-401 errors, might be network issues, so don't clear tokens
          }
        }
      } catch (error) {
        console.error("Auth initialization failed:", error);
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("token_created_at");
        }
        dispatch(clearAuthState());
      } finally {
        dispatch(setLoading(false));
        setIsInitialized(true);
      }
    };

    if (!isInitialized && !userLoading) {
      initializeAuth();
    }
  }, [dispatch, isInitialized, currentUserData, userError, userLoading]);

  // Show loading spinner while checking authentication
  if (!isInitialized || loading || userLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading LeadG CRM...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated and not on a public route, show login page
  if (!isAuthenticated && !isPublicRoute) {
    return <LoginPage />;
  }

  // If user is authenticated but trying to access login page, redirect content
  if (isAuthenticated && pathname === "/login") {
    return (
      <TokenExpirationMonitor
        warningThresholdMinutes={5}
        autoLogoutEnabled={true}
      >
        <SidebarProvider>
          <SideNavBarComp />
          <main className="w-full h-screen">
            <SidebarTrigger />
            <TopBarComp />
            <div className="px-8">
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Welcome back, {user?.first_name} {user?.last_name}!
                  </h2>
                  <p className="text-gray-600 mb-2">
                    You are already logged in.
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Role: {user?.role} | Department: {user?.department}
                  </p>
                  <a
                    href="/dashboard"
                    className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Go to Dashboard
                  </a>
                </div>
              </div>
            </div>
          </main>
        </SidebarProvider>
      </TokenExpirationMonitor>
    );
  }

  // If on a public route, render without sidebar/topbar
  if (isPublicRoute) {
    return <div className="min-h-screen">{children}</div>;
  }

  // If authenticated and on a protected route, render with sidebar/topbar and token monitoring
  return (
    <TokenExpirationMonitor
      warningThresholdMinutes={5}
      autoLogoutEnabled={true}
    >
      <SidebarProvider>
        <SideNavBarComp />
        <main className="w-full h-screen">
          <SidebarTrigger />
          <TopBarComp />
          <div className="px-8">{children}</div>
        </main>
      </SidebarProvider>
    </TokenExpirationMonitor>
  );
};

export default AuthLayout;
