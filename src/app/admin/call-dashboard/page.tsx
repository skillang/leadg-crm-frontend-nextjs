// src/app/admin/call-dashboard/page.tsx
// Updated Main Tata Tele Admin Call Dashboard Page with new components

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { PerformanceFilters } from "@/components/admin/dashboard/PerformanceFilters";
import { UserPerformanceTable } from "@/components/admin/dashboard/UserPerformanceTable";

// Import the new components
import { SummaryStatsGrid } from "@/components/admin/dashboard/SummaryStatsGrid";
import { TrendsCard } from "@/components/admin/dashboard/TrendsCard";
import { PeakHoursCard } from "@/components/admin/dashboard/PeakHoursCard";
import { InsightsCard } from "@/components/admin/dashboard/InsightsBadges";

import {
  useGetCallDashboardQuery,
  useGetFilterOptionsQuery,
  useGetSummaryStatsQuery,
  buildDashboardQuery,
} from "@/redux/slices/callDashboardApi";
import {
  FilterState,
  SortState,
  PaginationState,
} from "@/models/types/callDashboard";

// Default filter state
const defaultFilters: FilterState = {
  dateRange: {
    from: new Date(), // Today
    to: new Date(), // Today (same day)
  },
  period: "daily",
  selectedUsers: [],
  callStatus: "all",
  callDirection: "all",
};

export default function AdminCallDashboardPage() {
  // State management
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [isManualLoading, setIsManualLoading] = useState(false);
  const router = useRouter();
  const [tableSort, setTableSort] = useState<SortState>({
    field: "success_rate",
    direction: "desc",
  });
  // const [tablePagination, setTablePagination] = useState<PaginationState>({
  //   page: 1,
  //   limit: 50,
  //   total: 0,
  //   totalPages: 1,
  // });

  // Build query parameters
  const dashboardQuery = buildDashboardQuery({
    dateFrom: filters.dateRange.from
      ? format(filters.dateRange.from, "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd"),
    dateTo: filters.dateRange.to
      ? format(filters.dateRange.to, "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd"),
    period: filters.period,
    userIds: filters.selectedUsers,
    callStatus: filters.callStatus,
    callDirection: filters.callDirection,
  });

  // API queries
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useGetCallDashboardQuery(dashboardQuery);

  const { data: filterOptions, isLoading: isFilterOptionsLoading } =
    useGetFilterOptionsQuery();

  const { data: summaryStats } = useGetSummaryStatsQuery({
    date_from: format(filters.dateRange.from || new Date(), "yyyy-MM-dd"),
    date_to: format(filters.dateRange.to || new Date(), "yyyy-MM-dd"),
  });

  useEffect(() => {
    if (dashboardData) {
      setIsManualLoading(false);
    }
  }, [dashboardData]);

  // Handlers
  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setTimeout(() => {
      refetchDashboard();
    }, 100);
  };

  const handleApplyFilters = () => {
    setIsManualLoading(true);
    refetchDashboard();
  };

  const handleResetFilters = () => {
    setIsManualLoading(true);
    setFilters(defaultFilters);
  };

  const handleRefresh = () => {
    setIsManualLoading(true);
    refetchDashboard();
  };

  const isLoadingData = isDashboardLoading || isManualLoading;

  const handleExport = () => {
    console.log("Export functionality to be implemented");
  };

  const handleUserClick = (userId: string) => {
    router.push(`/admin/call-dashboard/${userId}`);
  };

  const handleTableSort = (sort: SortState) => {
    setTableSort(sort);
  };

  // Error state
  if (dashboardError) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load dashboard data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Tata Tele Call Dashboard
          </h1>
          <p className="text-muted-foreground">
            Monitor and analyze call performance across your team
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <CheckCircle className="h-3 w-3 text-green-500" />
            <span>Live Data</span>
          </Badge>
          {summaryStats?.calculated_at && (
            <p className="text-xs text-muted-foreground">
              Last updated:{" "}
              {format(new Date(summaryStats.calculated_at), "HH:mm:ss")}
            </p>
          )}
        </div>
      </div>

      {/* Filters */}
      <PerformanceFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        availableUsers={filterOptions?.available_users || []}
        loading={isDashboardLoading || isFilterOptionsLoading}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
        onRefresh={handleRefresh}
        onExport={handleExport}
      />

      {/* Global Loading Indicator */}
      {isLoadingData && (
        <div className="flex items-center justify-center p-8 bg-muted/30 rounded-lg border-2 border-dashed">
          <div className="flex items-center space-x-3">
            <div className="h-6 w-6 animate-spin border-2 border-primary border-t-transparent rounded-full" />
            <span className="text-muted-foreground">Loading call data...</span>
          </div>
        </div>
      )}

      {/* NEW: Summary Stats Grid - Replaces old summary cards */}
      {!isLoadingData && summaryStats && (
        <SummaryStatsGrid
          data={summaryStats.summary}
          trends={summaryStats.trends}
          filterInfo={summaryStats.filter_info}
          loading={isLoadingData}
        />
      )}

      {/* NEW: Analytics Section - Trends and Insights */}
      {!isLoadingData && summaryStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trends Card */}
          <TrendsCard
            data={summaryStats.trends}
            dateRange={summaryStats.date_range}
            loading={isLoadingData}
          />

          {/* Insights Card */}
          <InsightsCard
            data={summaryStats.peak_hours?.insights}
            analysisMetadata={summaryStats.peak_hours?.analysis_metadata}
            loading={isLoadingData}
          />
        </div>
      )}

      {/* NEW: Peak Hours Analysis - Full Width */}
      {!isLoadingData && summaryStats?.peak_hours && (
        <PeakHoursCard data={summaryStats.peak_hours} loading={isLoadingData} />
      )}

      {/* Existing: Top Performers Section (Keep this for additional insights) */}
      {!isLoadingData && dashboardData?.top_performers && (
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Top Performers</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData.top_performers.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.top_performers
                    .slice(0, 5)
                    .map((performer, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors cursor-pointer"
                        onClick={() => handleUserClick(performer.user_id || "")}
                      >
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline">#{performer.rank}</Badge>
                          <div>
                            <p className="font-medium">{performer.user_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {performer.total_calls} calls
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg">
                            {performer.score}%
                          </p>
                          <p className="text-xs text-muted-foreground">
                            success rate
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No performance data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* User Performance Table */}
      <UserPerformanceTable
        data={dashboardData?.user_stats || []}
        loading={isLoadingData}
        onUserClick={handleUserClick}
        onSortChange={handleTableSort}
        sortState={tableSort}
      />

      {/* Debug Info (development only) */}
      {/* {process.env.NODE_ENV === "development" && summaryStats && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-sm">Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
              {JSON.stringify(
                {
                  summary: summaryStats.summary,
                  trends: summaryStats.trends,
                  peak_hours_sample: {
                    total_calls: summaryStats.peak_hours?.total_calls,
                    insights: summaryStats.peak_hours?.insights,
                    peak_count: summaryStats.peak_hours?.peak_hours?.length,
                  },
                  filter_info: summaryStats.filter_info,
                },
                null,
                2
              )}
            </pre>
          </CardContent>
        </Card>
      )} */}
    </div>
  );
}
