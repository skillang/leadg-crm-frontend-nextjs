// src/components/layouts/AuthLayout.tsx (Stable - No Hook Mismatches)

"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import SideNavBarComp from "@/components/navs/SideNavBar/SideNavBar";
import TopBarComp from "@/components/navs/TopBar/TopBar";
import LoginPage from "@/all-pages/LoginPage";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import {
  setAuthFromStorage,
  clearAuthState,
  setLoading,
} from "@/redux/slices/authSlice";

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);

  // Get authentication state from Redux store
  const { isAuthenticated, loading } = useAppSelector((state) => state.auth);

  // Initialize authentication from localStorage only once
  useEffect(() => {
    const initializeAuth = () => {
      dispatch(setLoading(true));

      try {
        const token = localStorage.getItem("access_token");
        const userData = localStorage.getItem("user_data");

        if (token && userData) {
          // Initialize Redux with stored data using the correct action
          const user = JSON.parse(userData);
          dispatch(
            setAuthFromStorage({
              token: token,
              user: user,
            })
          );
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
  }, [dispatch, isInitialized]);

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
      <div className="flex h-screen w-full bg-gray-50">
        {/* Sidebar */}
        <SideNavBarComp />

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <div className="border-b bg-white px-4 py-2 flex items-center gap-4">
            <SidebarTrigger className="lg:hidden" />
            <TopBarComp />
          </div>

          {/* Page content */}
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AuthLayout;
