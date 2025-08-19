// src/app/admin/call-dashboard/page.tsx
// Main Tata Tele Admin Call Dashboard Page

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  BarChart3,
  Users,
  RefreshCw,
  Download,
  TrendingUp,
  Phone,
  Clock,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";

// Import our custom components
import { PerformanceFilters } from "@/components/admin/dashboard/PerformanceFilters";
import { UserPerformanceTable } from "@/components/admin/dashboard/UserPerformanceTable";
import { CallRecordingsTable } from "@/components/admin/dashboard/CallRecordingsTable";
import {
  CallStatsCard,
  TotalCallsCard,
  SuccessRateCard,
  ActiveUsersCard,
  RecordingsCard,
  AnsweredCallsCard,
  MissedCallsCard,
} from "@/components/admin/dashboard/CallStatsCard";

// Redux hooks
import {
  useGetCallDashboardQuery,
  useGetFilterOptionsQuery,
  useGetSummaryStatsQuery,
  buildDashboardQuery,
} from "@/redux/slices/callDashboardApi";

// Types
import {
  FilterState,
  SortState,
  PaginationState,
  PerformancePeriod,
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
  const [activeTab, setActiveTab] = useState("overview");
  const [isManualLoading, setIsManualLoading] = useState(false); // Manual loading state
  const [tableSort, setTableSort] = useState<SortState>({
    field: "success_rate",
    direction: "desc",
  });
  const [tablePagination, setTablePagination] = useState<PaginationState>({
    page: 1,
    limit: 50, // Match backend default
    total: 0,
    totalPages: 1,
  });

  // Build query parameters - make sure dates are properly formatted
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
    page: tablePagination.page,
    limit: tablePagination.limit,
  });

  // Debug: Log the query to see what dates are being sent
  console.log("Dashboard Query:", {
    dateFrom: filters.dateRange.from
      ? format(filters.dateRange.from, "yyyy-MM-dd")
      : "undefined",
    dateTo: filters.dateRange.to
      ? format(filters.dateRange.to, "yyyy-MM-dd")
      : "undefined",
    period: filters.period,
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

  const { data: summaryStats, isLoading: isSummaryLoading } =
    useGetSummaryStatsQuery({
      date_from: format(filters.dateRange.from || new Date(), "yyyy-MM-dd"),
      date_to: format(filters.dateRange.to || new Date(), "yyyy-MM-dd"),
    });

  // Update pagination when dashboard data changes
  useEffect(() => {
    if (dashboardData) {
      setTablePagination((prev) => ({
        ...prev,
        total: dashboardData.total_calls,
        totalPages: dashboardData.total_pages,
      }));
      // Clear manual loading when data arrives
      setIsManualLoading(false);
    }
  }, [dashboardData]);

  // Clear manual loading when there's an error
  useEffect(() => {
    if (dashboardError) {
      setIsManualLoading(false);
    }
  }, [dashboardError]);

  // Handlers
  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    // Reset pagination when filters change
    setTablePagination((prev) => ({ ...prev, page: 1 }));
    // Immediately trigger refetch when filters change
    // This ensures the API gets called with new date ranges
    setTimeout(() => {
      refetchDashboard();
    }, 100); // Small delay to ensure state is updated
  };

  const handleApplyFilters = () => {
    // Set manual loading immediately when button is clicked
    setIsManualLoading(true);
    // Trigger refetch which will set loading state automatically
    refetchDashboard();
  };

  const handleResetFilters = () => {
    setIsManualLoading(true);
    setFilters(defaultFilters);
    setTablePagination((prev) => ({ ...prev, page: 1 }));
    // Refetch will automatically happen due to dependency changes
  };

  const handleRefresh = () => {
    setIsManualLoading(true);
    refetchDashboard();
  };

  // Combine manual loading with API loading for UI
  const isLoadingData = isDashboardLoading || isManualLoading;

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log("Export functionality to be implemented");
  };

  const handleUserClick = (userId: string) => {
    // TODO: Navigate to user details page or open modal
    console.log("Navigate to user details:", userId);
  };

  const handleTableSort = (sort: SortState) => {
    setTableSort(sort);
  };

  const handlePageChange = (page: number) => {
    setTablePagination((prev) => ({ ...prev, page }));
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
    <div className="container mx-auto p-6 space-y-6">
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
          {dashboardData?.data_fetched_at && (
            <p className="text-xs text-muted-foreground">
              Last updated:{" "}
              {format(new Date(dashboardData.data_fetched_at), "HH:mm:ss")}
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
      {isDashboardLoading && (
        <div className="flex items-center justify-center p-8 bg-muted/30 rounded-lg border-2 border-dashed">
          <div className="flex items-center space-x-3">
            <div className="h-6 w-6 animate-spin border-2 border-primary border-t-transparent rounded-full" />
            <span className="text-muted-foreground">Loading call data...</span>
          </div>
        </div>
      )}

      {/* Summary Stats Cards */}
      {!isLoadingData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <TotalCallsCard
            value={dashboardData?.total_calls || 0}
            trend={
              summaryStats?.trends
                ? {
                    value: summaryStats.trends.change_percent,
                    direction:
                      summaryStats.trends.trend === "increasing"
                        ? "up"
                        : summaryStats.trends.trend === "decreasing"
                        ? "down"
                        : "stable",
                    label: "vs previous period",
                  }
                : undefined
            }
          />

          <SuccessRateCard value={dashboardData?.overall_success_rate || 0} />

          <ActiveUsersCard value={dashboardData?.total_users || 0} />

          <RecordingsCard
            value={dashboardData?.total_recordings || 0}
            total={dashboardData?.total_calls || 0}
          />
        </div>
      )}

      {/* Additional Stats Row */}
      {summaryStats && !isLoadingData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AnsweredCallsCard
            value={summaryStats.summary.total_answered}
            total={summaryStats.summary.total_calls}
          />

          <MissedCallsCard
            value={summaryStats.summary.total_missed}
            total={summaryStats.summary.total_calls}
          />

          <CallStatsCard
            title="Avg Call Duration"
            value={`${Math.round(
              summaryStats.summary.avg_call_duration_seconds
            )}s`}
            icon={<Clock className="h-4 w-4" />}
            subtitle={`${Math.round(
              summaryStats.summary.total_duration_minutes
            )} min total`}
          />
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>User Performance</span>
          </TabsTrigger>
          <TabsTrigger
            value="recordings"
            className="flex items-center space-x-2"
          >
            <Phone className="h-4 w-4" />
            <span>Call Recordings</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performers Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Top Performers</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardData?.top_performers &&
                dashboardData.top_performers.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardData.top_performers
                      .slice(0, 5)
                      .map((performer, index) => (
                        <div
                          key={performer.user_id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <Badge variant="outline">#{performer.rank}</Badge>
                            <div>
                              <p className="font-medium">
                                {performer.user_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {performer.total_calls} calls
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-lg">
                              {performer.score.toFixed(1)}%
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

            {/* Peak Hours Card */}
            {summaryStats?.peak_hours && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Peak Calling Hours</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {summaryStats.peak_hours.peak_hours
                      .slice(0, 5)
                      .map((peak, index) => (
                        <div
                          key={peak.hour}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">
                              {peak.hour}:00 - {peak.hour + 1}:00
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {peak.percentage.toFixed(1)}% of daily calls
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-lg">
                              {peak.calls}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              calls
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* User Performance Tab */}
        <TabsContent value="users">
          <UserPerformanceTable
            data={dashboardData?.user_stats || []}
            loading={isLoadingData}
            onUserClick={handleUserClick}
            onSortChange={handleTableSort}
            sortState={tableSort}
            pagination={tablePagination}
            onPageChange={handlePageChange}
          />
        </TabsContent>

        {/* Call Recordings Tab */}
        <TabsContent value="recordings">
          <CallRecordingsTable
            data={dashboardData?.recent_calls || []}
            loading={isLoadingData}
            onSortChange={handleTableSort}
            sortState={tableSort}
            pagination={tablePagination}
            onPageChange={handlePageChange}
          />
        </TabsContent>
      </Tabs>

      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV === "development" && dashboardData?.debug_info && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-sm">Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
              {JSON.stringify(dashboardData.debug_info, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
