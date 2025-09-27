// src/app/admin/call-dashboard/page.tsx
// Updated Main Tata Tele Admin Call Dashboard Page with new components

"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";
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
import { FilterState, SortState } from "@/models/types/callDashboard";
import TemporalTrendsCard from "@/components/admin/dashboard/TemporalTrendsCard";
import DurationDistributionCard from "@/components/admin/dashboard/DurationDistributionCard";
import HeatmapCard from "@/components/admin/dashboard/HeatmapCard";

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

  // Build query parameters
  const dashboardQuery = buildDashboardQuery({
    dateFrom: filters.dateRange.from
      ? format(filters.dateRange.from, "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd"),
    dateTo: filters.dateRange.to
      ? format(filters.dateRange.to, "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd"),
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
    user_ids:
      filters.selectedUsers.length > 0
        ? filters.selectedUsers.join(",")
        : undefined,
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

      {/* Row 1: Summary Stats Grid (Full Width) */}
      {summaryStats && (
        <SummaryStatsGrid
          data={summaryStats.summary}
          trends={summaryStats.trends}
          filterInfo={summaryStats.filter_info}
          loading={isLoadingData}
        />
      )}

      {/* Row 2: Heat Map & Duration Distribution */}
      {summaryStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <HeatmapCard
            data={summaryStats!.trends.hourly_heatmap}
            loading={isLoadingData}
          />
          <DurationDistributionCard
            data={summaryStats!.trends.duration_distribution}
            loading={isLoadingData}
          />
        </div>
      )}

      {/* Row 3: Peak Hours & Trends Card */}
      {summaryStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PeakHoursCard
            data={summaryStats!.peak_hours}
            loading={isLoadingData}
          />
          <TemporalTrendsCard
            data={summaryStats!.trends.temporal_trends}
            loading={isLoadingData}
          />
        </div>
      )}

      {/* Row 4: Temporal + Forecast */}
      {summaryStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TrendsCard
            data={summaryStats!.trends}
            dateRange={summaryStats!.date_range}
            loading={isLoadingData}
            variant="area"
          />
          <InsightsCard
            data={summaryStats!.peak_hours?.insights}
            analysisMetadata={summaryStats!.peak_hours?.analysis_metadata}
            loading={isLoadingData}
          />
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
