// src/components/admin/UserPerformanceTable.tsx

"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  MoreHorizontal,
  Phone,
  PhoneCall,
  Clock,
  Mic,
  TrendingUp,
  TrendingDown,
  Minus,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types
import {
  UserCallStats,
  SortState,
  PaginationState,
} from "@/models/types/callDashboard";

interface UserPerformanceTableProps {
  data: UserCallStats[];
  loading?: boolean;
  onUserClick?: (userId: string) => void;
  onSortChange?: (sort: SortState) => void;
  sortState?: SortState;
  pagination?: PaginationState;
  onPageChange?: (page: number) => void;
  className?: string;
}

// Helper function to format numbers
const formatNumber = (num: number | null): string => {
  if (num === null || num === undefined) return "0";
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

// Helper function to format duration (seconds to readable format)
const formatDuration = (seconds: number | null): string => {
  if (!seconds) return "0m";
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}m`;
};

// Helper function to get success rate color
const getSuccessRateColor = (rate: number): string => {
  if (rate >= 70) return "text-green-600";
  if (rate >= 50) return "text-yellow-600";
  return "text-red-600";
};

// Helper function to get success rate variant
const getSuccessRateVariant = (
  rate: number
): "default" | "secondary" | "destructive-light" => {
  if (rate >= 70) return "default";
  if (rate >= 50) return "secondary";
  return "destructive-light";
};

// Loading skeleton row
const LoadingRow = () => (
  <TableRow>
    {Array.from({ length: 8 }, (_, i) => (
      <TableCell key={i}>
        <div className="h-6 bg-muted animate-pulse rounded"></div>
      </TableCell>
    ))}
  </TableRow>
);

export function UserPerformanceTable({
  data,
  loading = false,
  onUserClick,
  onSortChange,
  sortState,
  pagination,
  onPageChange,
  className,
}: UserPerformanceTableProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  // Handle sort click
  const handleSort = (field: string) => {
    if (!onSortChange) return;

    const newDirection =
      sortState?.field === field && sortState?.direction === "asc"
        ? "desc"
        : "asc";

    onSortChange({ field, direction: newDirection });
  };

  // Get sort icon
  const getSortIcon = (field: string) => {
    if (sortState?.field !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortState.direction === "asc" ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };

  // Get current period data (prioritize by period)
  const getCurrentPeriodData = (user: UserCallStats) => {
    // Determine which period to show based on available data
    if (user.daily_calls !== null) {
      return {
        calls: user.daily_calls,
        answered: user.daily_answered,
        missed: user.daily_missed,
        duration: user.daily_duration,
        recordings: user.daily_recordings,
        period: "Daily",
      };
    }
    if (user.weekly_calls !== null) {
      return {
        calls: user.weekly_calls,
        answered: user.weekly_answered,
        missed: user.weekly_missed,
        duration: user.weekly_duration,
        recordings: user.weekly_recordings,
        period: "Weekly",
      };
    }
    if (user.monthly_calls !== null) {
      return {
        calls: user.monthly_calls,
        answered: user.monthly_answered,
        missed: user.monthly_missed,
        duration: user.monthly_duration,
        recordings: user.monthly_recordings,
        period: "Monthly",
      };
    }

    // Fallback to zeros
    return {
      calls: 0,
      answered: 0,
      missed: 0,
      duration: 0,
      recordings: 0,
      period: "No Data",
    };
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="h-5 w-5" />
          <span>User Performance</span>
          {data.length > 0 && (
            <Badge variant="secondary">{data.length} users</Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold"
                    onClick={() => handleSort("user_name")}
                  >
                    User
                    {getSortIcon("user_name")}
                  </Button>
                </TableHead>
                <TableHead className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold"
                    onClick={() => handleSort("calls")}
                  >
                    <Phone className="h-4 w-4 mr-1" />
                    Calls
                    {getSortIcon("calls")}
                  </Button>
                </TableHead>
                <TableHead className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold"
                    onClick={() => handleSort("answered")}
                  >
                    <PhoneCall className="h-4 w-4 mr-1" />
                    Answered
                    {getSortIcon("answered")}
                  </Button>
                </TableHead>
                <TableHead className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold"
                    onClick={() => handleSort("success_rate")}
                  >
                    Success Rate
                    {getSortIcon("success_rate")}
                  </Button>
                </TableHead>
                <TableHead className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold"
                    onClick={() => handleSort("avg_call_duration")}
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    Avg Duration
                    {getSortIcon("avg_call_duration")}
                  </Button>
                </TableHead>
                <TableHead className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold"
                    onClick={() => handleSort("recordings")}
                  >
                    <Mic className="h-4 w-4 mr-1" />
                    Recordings
                    {getSortIcon("recordings")}
                  </Button>
                </TableHead>
                <TableHead className="text-center">Agent #</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                Array.from({ length: 5 }, (_, i) => <LoadingRow key={i} />)
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No user performance data available
                  </TableCell>
                </TableRow>
              ) : (
                data.map((user) => {
                  const periodData = getCurrentPeriodData(user);
                  const isHovered = hoveredRow === user.user_id;

                  return (
                    <TableRow
                      key={user.user_id}
                      className={cn(
                        "transition-colors hover:bg-muted/50 cursor-pointer",
                        isHovered && "bg-muted/30"
                      )}
                      onMouseEnter={() => setHoveredRow(user.user_id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      onClick={() => onUserClick?.(user.user_id)}
                    >
                      {/* User Info */}
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{user.user_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {periodData.period} View
                          </div>
                        </div>
                      </TableCell>

                      {/* Total Calls */}
                      <TableCell className="text-center">
                        <div className="space-y-1">
                          <div className="font-semibold text-lg">
                            {formatNumber(periodData.calls)}
                          </div>
                          {periodData.missed! > 0 && (
                            <div className="text-xs text-red-600">
                              {formatNumber(periodData.missed)} missed
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Answered Calls */}
                      <TableCell className="text-center">
                        <div className="space-y-1">
                          <div className="font-semibold text-green-600">
                            {formatNumber(periodData.answered)}
                          </div>
                          {periodData.calls > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {Math.round(
                                (periodData.answered! / periodData.calls) * 100
                              )}
                              %
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Success Rate */}
                      <TableCell className="text-center">
                        <div className="space-y-2">
                          <Badge
                            variant={getSuccessRateVariant(user.success_rate)}
                            className={cn(
                              "font-semibold",
                              getSuccessRateColor(user.success_rate)
                            )}
                          >
                            {user.success_rate.toFixed(1)}%
                          </Badge>
                          <Progress value={user.success_rate} className="h-1" />
                        </div>
                      </TableCell>

                      {/* Average Duration */}
                      <TableCell className="text-center">
                        <div className="space-y-1">
                          <div className="font-medium">
                            {formatDuration(user.avg_call_duration)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDuration(periodData.duration)} total
                          </div>
                        </div>
                      </TableCell>

                      {/* Recordings */}
                      <TableCell className="text-center">
                        <div className="space-y-1">
                          <div className="font-semibold text-purple-600">
                            {formatNumber(periodData.recordings)}
                          </div>
                          {periodData.calls > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {Math.round(
                                (periodData.recordings! / periodData.calls) *
                                  100
                              )}
                              % recorded
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Agent Number */}
                      <TableCell className="text-center">
                        <div className="font-mono text-sm">
                          {user.agent_number || "N/A"}
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onUserClick?.(user.user_id);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}(
              {pagination.total} total users)
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Export useful helper functions
export { formatNumber, formatDuration, getSuccessRateColor };
