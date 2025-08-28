// src/app/admin/call-dashboard/[userId]/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  User,
  Calendar,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Download,
  RefreshCw,
  LucideTrendingDown,
  LucideTrendingUp,
} from "lucide-react";
import { format, subDays } from "date-fns";
import { CallRecordingsTable } from "@/components/admin/dashboard/CallRecordingsTable";

// Redux hooks - Only need the user performance query now
import { useGetUserPerformanceQuery } from "@/redux/slices/callDashboardApi";

// Types
import { SortState, PaginationState } from "@/models/types/callDashboard";

// Helper functions from table component
import {
  formatDuration,
  // getSuccessRateColor,
} from "@/components/admin/dashboard/UserPerformanceTable";

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  // State management
  const [dateRange] = useState({
    from: subDays(new Date(), 7), // Last 7 days
    to: new Date(),
  });
  const [sortState, setSortState] = useState<SortState>({
    field: "date",
    direction: "desc",
  });
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  // Single API query that gets everything we need
  const {
    data: userPerformance,
    isLoading,
    error,
    refetch,
  } = useGetUserPerformanceQuery({
    user_id: userId,
    date_from: format(dateRange.from, "yyyy-MM-dd"),
    date_to: format(dateRange.to, "yyyy-MM-dd"),
    period: "daily",
    include_day_comparison: true,
    // Add pagination params if your API supports them
    // limit: pagination.limit,
    // page: pagination.page,
  });

  if (error) console.error("❌ [API] userPerformance error:", error);

  // Update pagination when data changes
  useEffect(() => {
    if (userPerformance?.call_records) {
      const totalRecordings =
        userPerformance.stats.daily_recordings ||
        userPerformance.call_records.length;
      console.log("📌 [Pagination Update] count:", totalRecordings);
      setPagination((prev) => ({
        ...prev,
        total: totalRecordings,
        totalPages: Math.ceil(totalRecordings / prev.limit),
      }));
    }
  }, [userPerformance]);

  // Handlers
  const handleBack = () => {
    router.push("/admin/call-dashboard");
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleSortChange = (sort: SortState) => {
    setSortState(sort);
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handleExport = () => {
    console.log("-> [Action] Export clicked for user:", userId);
  };

  // Error state
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load user data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={handleBack} className="p-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-2">
              <User className="h-8 w-8" />
              <span>{userPerformance?.user_name || "User Details"}</span>
            </h1>
            <p className="text-muted-foreground">
              {userPerformance?.agent_number && (
                <span>Agent #{userPerformance.agent_number} • </span>
              )}
              Call performance and recordings analysis
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Badge variant="outline" className="flex items-center space-x-1">
            <CheckCircle className="h-3 w-3 text-green-500" />
            <span>
              {format(dateRange.from, "MMM dd")} -{" "}
              {format(dateRange.to, "MMM dd")}
            </span>
          </Badge>
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex items-center justify-center p-8 bg-muted/30 rounded-lg border-2 border-dashed">
          <div className="flex items-center space-x-3">
            <div className="h-6 w-6 animate-spin border-2 border-primary border-t-transparent rounded-full" />
            <span className="text-muted-foreground">
              Loading user performance data...
            </span>
          </div>
        </div>
      )}

      {/* User Ranking Card */}
      {userPerformance?.ranking && !isLoading && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Performance Ranking</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Badge variant="outline" className="text-lg px-3 py-1">
                  #{userPerformance.ranking.rank}
                </Badge>
                <div>
                  <p className="font-medium text-lg">
                    {userPerformance.user_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {userPerformance.ranking.total_calls} calls in ranking
                    period
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-2xl text-green-600">
                  {userPerformance.ranking.score}%
                </p>
                <p className="text-sm text-muted-foreground">
                  performance score
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Day-by-Day Comparison */}
      {userPerformance?.day_comparison &&
        userPerformance.day_comparison.length > 0 &&
        !isLoading && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Daily Performance Comparison</span>
              </div>
            </div>
            <Card>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {userPerformance.day_comparison.map((day, index) => (
                    <div
                      key={index}
                      className="p-4 bg-muted/30 rounded-lg border"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-sm">
                          {format(new Date(day.date), "MMM dd")}
                        </p>
                        <Badge
                          variant={
                            day.trend === "up"
                              ? "success-light"
                              : day.trend === "down"
                              ? "destructive-light"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {day.trend === "up" ? (
                            <LucideTrendingUp />
                          ) : day.trend === "down" ? (
                            <LucideTrendingDown />
                          ) : (
                            ""
                          )}
                          {day.calls_change > 0 ? "+" : ""}
                          {day.calls_change}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Calls:</span>
                          <span className="font-medium">{day.total_calls}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Answered:</span>
                          <span className="font-medium text-green-600">
                            {day.answered_calls}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Success:</span>
                          <span className="font-medium">
                            {day.success_rate}%
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Duration:</span>
                          <span className="font-medium">
                            {formatDuration(day.total_duration)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      {/* Call Recordings Table - Now using data from userPerformance */}
      <CallRecordingsTable
        data={userPerformance?.call_records || []}
        loading={isLoading}
        onSortChange={handleSortChange}
        sortState={sortState}
        pagination={pagination}
        onPageChange={handlePageChange}
      />

      {/* Debug Info (development only) */}
      {process.env.NODE_ENV === "development" &&
        userPerformance?.debug_info && (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-sm">Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                {JSON.stringify(userPerformance.debug_info, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
