// src/components/admin/dashboard/SummaryStatsGrid.tsx
// Horizontal scrollable row of metric cards with icons and progress bars

"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Phone,
  PhoneCall,
  PhoneMissed,
  Clock,
  Mic,
  Users,
  Target,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  Calendar,
} from "lucide-react";
import {
  SummaryStatsResponse,
  // TrendData
} from "@/models/types/callDashboard";

interface SummaryStatsGridProps {
  data: SummaryStatsResponse["summary"];
  trends?: SummaryStatsResponse["trends"];
  filterInfo?: SummaryStatsResponse["filter_info"];
  loading?: boolean;
  className?: string;
}

interface StatCardData {
  key: string;
  title: string;
  value: string | number;
  unit: string;
  icon: React.ReactNode;
  variant?: "default" | "success" | "warning" | "destructive";
  progress?: {
    value: number;
    max: number;
    label?: string;
  };
  trend?: {
    direction: "up" | "down" | "stable";
    value: number;
    label?: string;
  };
  subtitle?: string;
}

// Skeleton component for individual stat cards
const StatCardSkeleton: React.FC<{
  hasProgress?: boolean;
  hasTrend?: boolean;
  hasSubtitle?: boolean;
}> = ({ hasProgress = false, hasTrend = false, hasSubtitle = false }) => (
  <Card className="min-w-[200px] animate-pulse">
    <CardContent className="p-4">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="h-4 w-20 bg-muted rounded"></div>
          <div className="h-4 w-4 bg-muted rounded"></div>
        </div>

        {/* Main Value */}
        <div className="space-y-1">
          <div className="flex items-baseline space-x-1">
            <div className="h-8 w-16 bg-muted rounded"></div>
            <div className="h-4 w-8 bg-muted rounded"></div>
          </div>

          {hasSubtitle && <div className="h-3 w-24 bg-muted rounded"></div>}
        </div>

        {/* Progress Bar */}
        {hasProgress && (
          <div className="space-y-2">
            <div className="h-2 w-full bg-muted rounded"></div>
            <div className="h-3 w-20 bg-muted rounded"></div>
          </div>
        )}

        {/* Trend Information */}
        {hasTrend && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <div className="h-3 w-3 bg-muted rounded"></div>
              <div className="h-3 w-10 bg-muted rounded"></div>
            </div>
            <div className="h-3 w-16 bg-muted rounded"></div>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

// Helper function to format numbers
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

// Helper function to format duration
const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);

  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};

// Helper function to format seconds
const formatSeconds = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);

  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
};

export function SummaryStatsGrid({
  data,
  trends,
  filterInfo,
  loading = false,
  className,
}: SummaryStatsGridProps) {
  // Convert trends data to trend format
  const getTrendData = (trends?: SummaryStatsResponse["trends"]) => {
    if (!trends) return undefined;

    return {
      direction:
        trends.trend === "increasing"
          ? ("up" as const)
          : trends.trend === "decreasing"
          ? ("down" as const)
          : ("stable" as const),
      value: trends.change_percent,
      label: "vs previous period",
    };
  };

  const trendData = getTrendData(trends);

  // Generate stat cards data
  const statCards: StatCardData[] = React.useMemo(() => {
    if (!data) return [];

    return [
      {
        key: "total_calls",
        title: "Total Calls",
        value: formatNumber(data.total_calls),
        unit: "calls",
        icon: <Phone className="h-4 w-4" />,
        trend: trendData,
        subtitle:
          data.total_calls_all_pages !== data.total_calls
            ? `${formatNumber(data.total_calls_all_pages)} total`
            : undefined,
      },
      {
        key: "total_calls_all_pages",
        title: "Total Calls (All Pages)",
        value: formatNumber(data.total_calls_all_pages),
        unit: "calls",
        icon: <FileText className="h-4 w-4" />,
        subtitle: "Complete dataset",
      },
      {
        key: "answered",
        title: "Answered",
        value: formatNumber(data.total_answered),
        unit: "calls",
        icon: <PhoneCall className="h-4 w-4" />,
        variant: "success" as const,
        progress: {
          value: data.total_answered,
          max: data.total_calls,
          label: `${((data.total_answered / data.total_calls) * 100).toFixed(
            1
          )}% answered`,
        },
      },
      {
        key: "missed",
        title: "Missed",
        value: formatNumber(data.total_missed),
        unit: "calls",
        icon: <PhoneMissed className="h-4 w-4" />,
        variant: "destructive" as const,
        progress: {
          value: data.total_missed,
          max: data.total_calls,
          label: `${((data.total_missed / data.total_calls) * 100).toFixed(
            1
          )}% missed`,
        },
      },
      {
        key: "duration",
        title: "Total Duration",
        value: formatDuration(data.total_duration_minutes),
        unit: "time",
        icon: <Clock className="h-4 w-4" />,
        subtitle: `${data.total_duration_minutes.toFixed(1)} minutes`,
      },
      {
        key: "recordings",
        title: "Total Recordings",
        value: formatNumber(data.total_recordings),
        unit: "files",
        icon: <Mic className="h-4 w-4" />,
        progress: {
          value: data.total_recordings,
          max: data.total_calls,
          label: `${((data.total_recordings / data.total_calls) * 100).toFixed(
            1
          )}% recorded`,
        },
      },
      {
        key: "users",
        title: "Unique Users",
        value: formatNumber(data.unique_users),
        unit: "users",
        icon: <Users className="h-4 w-4" />,
      },
      {
        key: "success_rate",
        title: "Success Rate",
        value: data.success_rate.toFixed(1),
        unit: "%",
        icon: <Target className="h-4 w-4" />,
        variant:
          data.success_rate >= 70
            ? ("success" as const)
            : data.success_rate >= 50
            ? ("warning" as const)
            : ("destructive" as const),
        progress: {
          value: data.success_rate,
          max: 100,
        },
      },
      {
        key: "avg_calls_per_day",
        title: "Avg Calls/Day",
        value: formatNumber(data.avg_calls_per_day),
        unit: "calls/day",
        icon: <Calendar className="h-4 w-4" />,
      },
      {
        key: "avg_duration",
        title: "Avg Call Duration",
        value: formatSeconds(data.avg_call_duration_seconds),
        unit: "time",
        icon: <Activity className="h-4 w-4" />,
        subtitle: `${data.avg_call_duration_seconds.toFixed(0)} seconds`,
      },
    ];
  }, [data, trendData]);

  // Get trend icon
  const getTrendIcon = (direction: "up" | "down" | "stable") => {
    switch (direction) {
      case "up":
        return <TrendingUp className="h-3 w-3 text-green-600" />;
      case "down":
        return <TrendingDown className="h-3 w-3 text-red-600" />;
      case "stable":
        return <Minus className="h-3 w-3 text-gray-600" />;
    }
  };

  // Get trend color
  const getTrendColor = (direction: "up" | "down" | "stable") => {
    switch (direction) {
      case "up":
        return "text-green-600";
      case "down":
        return "text-red-600";
      case "stable":
        return "text-gray-600";
    }
  };

  // Get variant styles
  const getVariantStyles = (
    variant?: "default" | "success" | "warning" | "destructive"
  ) => {
    switch (variant) {
      case "success":
        return "border-green-200 bg-green-50/30 hover:bg-green-50/50";
      case "warning":
        return "border-yellow-200 bg-yellow-50/30 hover:bg-yellow-50/50";
      case "destructive":
        return "border-red-200 bg-red-50/30 hover:bg-red-50/50";
      default:
        return "border-border hover:bg-muted/50";
    }
  };

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        {/* Filter info skeleton */}
        <div className="flex items-center space-x-2">
          <div className="h-6 w-32 bg-muted rounded-md animate-pulse"></div>
          <div className="h-6 w-20 bg-muted rounded-md animate-pulse"></div>
        </div>

        {/* Cards skeleton - matches the grid layout */}
        <div className="grid grid-cols-5 gap-4">
          {/* Different skeleton patterns based on typical card content */}
          <StatCardSkeleton hasTrend hasSubtitle />
          <StatCardSkeleton hasSubtitle />
          <StatCardSkeleton hasProgress />
          <StatCardSkeleton hasProgress />
          <StatCardSkeleton hasSubtitle />
          <StatCardSkeleton hasProgress />
          <StatCardSkeleton />
          <StatCardSkeleton hasProgress />
          <StatCardSkeleton />
          <StatCardSkeleton hasSubtitle />
        </div>

        {/* Mobile scroll hint skeleton */}
        <div className="h-4 w-48 bg-muted rounded mx-auto animate-pulse md:hidden"></div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filter Information */}
      {filterInfo && (
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          {filterInfo.applied && (
            <>
              <Badge variant="outline" className="flex items-center space-x-1">
                <Users className="h-3 w-3" />
                <span>{filterInfo.user_count} users selected</span>
              </Badge>
              <Badge variant="outline">{filterInfo.scope}</Badge>
            </>
          )}
        </div>
      )}

      {/* Scrollable Stats Grid */}
      <div className="grid grid-cols-5 gap-4">
        {statCards.map((stat) => (
          <Card
            key={stat.key}
            className={cn(
              "min-w-[200px] transition-all duration-200 hover:shadow-md",
              getVariantStyles(stat.variant)
            )}
          >
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <div className="text-muted-foreground">{stat.icon}</div>
                </div>

                {/* Main Value */}
                <div className="space-y-1">
                  <div className="flex items-baseline space-x-1">
                    <span className="text-2xl font-bold text-foreground">
                      {stat.value}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {stat.unit}
                    </span>
                  </div>

                  {stat.subtitle && (
                    <p className="text-xs text-muted-foreground">
                      {stat.subtitle}
                    </p>
                  )}
                </div>

                {/* Progress Bar */}
                {stat.progress && (
                  <div className="space-y-2">
                    <Progress
                      value={(stat.progress.value / stat.progress.max) * 100}
                      className="h-2"
                    />
                    {stat.progress.label && (
                      <p className="text-xs text-muted-foreground">
                        {stat.progress.label}
                      </p>
                    )}
                  </div>
                )}

                {/* Trend Information */}
                {stat.trend && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      {getTrendIcon(stat.trend.direction)}
                      <span
                        className={cn(
                          "text-xs font-medium",
                          getTrendColor(stat.trend.direction)
                        )}
                      >
                        {stat.trend.value > 0 ? "+" : ""}
                        {stat.trend.value.toFixed(1)}%
                      </span>
                    </div>
                    {stat.trend.label && (
                      <span className="text-xs text-muted-foreground">
                        {stat.trend.label}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Scroll hint for mobile */}
      <p className="text-xs text-muted-foreground text-center md:hidden">
        ← Swipe to see more metrics →
      </p>
    </div>
  );
}
