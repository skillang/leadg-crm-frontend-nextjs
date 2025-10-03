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
                  <TableHead className="text-right">Total Leads</TableHead>
                  <TableHead className="text-right">DNP Count</TableHead>
                  <TableHead className="text-right">Counselled</TableHead>
                  <TableHead className="text-right">% of Total</TableHead>
                  <TableHead className="text-center">Load Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...stats.assignment_stats.workload_distribution]
                  .sort((a, b) => b.total_leads - a.total_leads) // Sort by total_leads descending
                  .map((user) => {
                    const percentage = (
                      (user.total_leads / stats.total_leads) *
                      100
                    ).toFixed(1);
                    const avgLeads =
                      stats.assignment_stats?.average_leads_per_user || 0;
                    const isOverloaded = user.total_leads > avgLeads * 1.2;
                    const isUnderloaded = user.total_leads < avgLeads * 0.8;

                    return (
                      <TableRow key={user.email}>
                        <TableCell>
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {user.email}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-lg font-semibold text-gray-900">
                            {user.total_leads}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-lg font-semibold text-gray-900">
                            {user.dnp_count}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-lg font-semibold text-gray-900">
                            {user.counselled_count}
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
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
