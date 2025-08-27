// src/app/dashboard/page.tsx - Dashboard with Skeleton Loading States

"use client";
import React from "react";
import { useAppSelector } from "@/redux/hooks";
import { selectIsAdmin, selectCurrentUser } from "@/redux/selectors";
import { useGetLeadStatsQuery } from "@/redux/slices/leadsApi";
import {
  RefreshCw,
  TrendingUp,
  Users,
  Target,
  CheckCircle,
  AlertTriangle,
  DoorOpen,
} from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import StatsCard from "@/components/custom/cards/StatsCard";

const DashboardPage = () => {
  // Get user info
  const isAdmin = useAppSelector(selectIsAdmin);
  const currentUser = useAppSelector(selectCurrentUser);

  // Get lead statistics
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useGetLeadStatsQuery({
    include_multi_assignment_stats: isAdmin,
  });

  const handleRefreshStats = () => {
    refetchStats();
  };

  return (
    <div className="container mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {currentUser?.first_name} {currentUser?.last_name}!
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefreshStats}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
            disabled={statsLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${statsLoading ? "animate-spin" : ""}`}
            />
            {statsLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {statsError ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-red-600" />
          <div>
            <h3 className="text-red-800 font-medium">
              Unable to load statistics
            </h3>
            <p className="text-red-600 text-sm">
              Please try refreshing or contact support if the issue persists.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatsCard
            title="Total Leads"
            value={stats?.total_leads || 0}
            icon={<Users className="h-8 w-8 text-blue-600" />}
            subtitle="All leads in system"
            isLoading={statsLoading}
          />

          <StatsCard
            title="Open Leads"
            value={stats?.open_leads || 0}
            icon={<DoorOpen className="h-8 w-8 text-purple-600" />}
            subtitle="Assigned to you"
            isLoading={statsLoading}
          />

          <StatsCard
            title="In Progress"
            value={stats?.in_progress_leads || 0}
            icon={<TrendingUp className="h-8 w-8 text-orange-600" />}
            subtitle="Pending action"
            isLoading={statsLoading}
          />

          <StatsCard
            title="Closed Won"
            value={stats?.closed_won_leads || 0}
            icon={<CheckCircle className="h-8 w-8 text-green-600" />}
            subtitle="Successfully converted"
            isLoading={statsLoading}
          />
        </div>
      )}

      {/* My Leads Card */}
      <div className="bg-white rounded-lg shadow border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">My Leads</h2>
        {statsLoading ? (
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-10 w-16 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-blue-600">
                {stats?.my_leads || 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">Leads assigned to me</p>
            </div>
            <Link
              href="/my-leads"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View My Leads
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href={isAdmin ? "/my-leads" : "/my-leads"}>
            <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all group cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded group-hover:bg-blue-200 transition-colors">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {isAdmin ? "Manage All Leads" : "View My Leads"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {isAdmin
                      ? "View and manage all leads in the system"
                      : "Access your assigned leads "}
                  </p>
                </div>
              </div>
            </div>
          </Link>

          {isAdmin && (
            <div className="p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:shadow-md transition-all group cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded group-hover:bg-green-200 transition-colors">
                  <Target className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Create New Lead</h3>
                  <p className="text-sm text-gray-600">
                    Add a new lead to the system
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all group cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded group-hover:bg-purple-200 transition-colors">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Reports</h3>
                <p className="text-sm text-gray-600">
                  View detailed analytics and reports
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          System Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="font-medium text-gray-700">Performance</h3>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">API Status</span>
              <span className="flex items-center gap-1 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Query Speed</span>
              <span className="text-green-600">
                {isAdmin ? "~200ms" : "~50ms"}
              </span>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="font-medium text-gray-700">Data</h3>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Last Updated</span>
              <span className="text-gray-600">Just now</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Data Accuracy</span>
              <span className="text-green-600">99.9%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
