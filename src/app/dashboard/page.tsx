// src/app/dashboard/page.tsx - Dashboard with Skeleton Loading States

"use client";
import React from "react";
import { useAppSelector } from "@/redux/hooks";
import { selectIsAdmin, selectCurrentUser } from "@/redux/selectors";
import { useGetLeadStatsQuery } from "@/redux/slices/leadsApi";
import {
  RefreshCw,
  Users,
  CheckCircle,
  AlertTriangle,
  FileText,
} from "lucide-react";
import StatsCard from "@/components/custom/cards/StatsCard";
import { DistributionChart } from "@/components/charts/DistributionChart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
    <div className="container mx-auto space-y-3">
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
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatsCard
              title="Total Leads"
              value={stats?.total_leads || 0}
              icon={<Users className="h-8 w-8 text-blue-600" />}
              color="bg-blue-100"
              subtitle="All leads in system"
              isLoading={statsLoading}
            />

            <StatsCard
              title="DNP Leads"
              value={stats?.stage_breakdown?.dnp || 0}
              icon={<AlertTriangle className="h-8 w-8 text-red-600" />}
              subtitle="DNP in Lead Stage"
              color="bg-red-100"
              isLoading={statsLoading}
            />

            <StatsCard
              title="Counseled Leads"
              value={stats?.stage_breakdown?.counselled || 0}
              icon={<CheckCircle className="h-8 w-8 text-green-600" />}
              color="bg-green-100"
              subtitle="Counselled in Lead Stage"
              isLoading={statsLoading}
            />

            <StatsCard
              title="Document Stage"
              value={
                (stats?.stage_breakdown?.["document-collected"] || 0) +
                (stats?.stage_breakdown?.["pending-document"] || 0)
              }
              icon={<FileText className="h-8 w-8 text-teal-600" />}
              color="bg-teal-100"
              subtitle={`Doc Collected + Pending Doc`}
              isLoading={statsLoading}
            />
            {/* <StatsCard
              title="Multi Assigned Leads"
              value={stats?.assignment_stats?.multi_assigned_leads || 0}
              icon={<Share2Icon className="h-8 w-8 text-purple-600" />}
              color="bg-purple-100"
              subtitle={`Leads with multi counsellors`}
              isLoading={statsLoading}
            /> */}
          </div>

          {/* Distribution Charts */}
          {stats?.status_breakdown && stats?.stage_breakdown && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DistributionChart
                data={stats.status_breakdown}
                title="Lead Status Distribution"
                loading={statsLoading}
                maxItems={6}
                height={350}
              />

              <DistributionChart
                data={stats.stage_breakdown}
                title="Lead Stage Distribution"
                loading={statsLoading}
                maxItems={6}
                height={350}
              />
            </div>
          )}
        </>
      )}

      {/* Workload Distribution Table - Admin Only */}
      {isAdmin && stats?.assignment_stats?.workload_distribution && (
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Workload Distribution
            </h2>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>
                Average: {stats.assignment_stats.average_leads_per_user}{" "}
                leads/user
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-left">User</TableHead>
                  <TableHead className="text-right">Assigned Leads</TableHead>
                  <TableHead className="text-right">% of Total</TableHead>
                  <TableHead className="text-center">Load Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(stats.assignment_stats.workload_distribution)
                  .sort(([, a], [, b]) => b - a) // Sort by lead count descending
                  .map(([email, leadCount]) => {
                    const percentage = (
                      (leadCount / stats.total_leads) *
                      100
                    ).toFixed(1);
                    const avgLeads =
                      stats.assignment_stats?.average_leads_per_user || 0;
                    const isOverloaded = leadCount > avgLeads * 1.2;
                    const isUnderloaded = leadCount < avgLeads * 0.8;

                    return (
                      <TableRow key={email}>
                        <TableCell>
                          <div className="text-sm font-medium text-gray-900">
                            {email.split("@")[0]}
                          </div>
                          <div className="text-xs text-gray-500">{email}</div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-lg font-semibold text-gray-900">
                            {leadCount}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm text-gray-600">
                            {percentage}%
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {isOverloaded ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Overloaded
                            </span>
                          ) : isUnderloaded ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Underloaded
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Balanced
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>

          {/* {stats.assignment_stats.multi_assigned_leads > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>{stats.assignment_stats.multi_assigned_leads}</strong>{" "}
                leads are assigned to multiple users
              </p>
            </div>
          )} */}
        </div>
      )}

      {/* System Status */}
      {/* <div className="bg-white rounded-lg shadow border p-6">
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
      </div> */}
    </div>
  );
};

export default DashboardPage;
