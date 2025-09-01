// src/app/page.tsx - LeadG CRM Landing Page
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/redux/hooks/useAuth";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  // If user is authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  // Show loading during auth initialization
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated, don't show anything (will redirect)
  if (isAuthenticated) {
    return null;
  }

  // If not authenticated, show LeadG CRM landing page
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-lg w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome to LeadG CRM
          </h1>
          <p className="text-gray-600 mb-8">
            Your lightweight customer relationship management solution.
          </p>

          <div className="space-y-4">
            <Link
              href="/login"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Log In to Dashboard
            </Link>
          </div>

          {/* Optional: Add some features or benefits */}
          <div className="mt-8 text-xs text-gray-500">
            <p>LeadG CRM • Track • Manage • Convert</p>
          </div>
        </div>
      </div>
    </div>
  );
}
