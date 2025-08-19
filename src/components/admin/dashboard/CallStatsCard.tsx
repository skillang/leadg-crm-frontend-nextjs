// src/components/admin/CallStatsCard.tsx
// Reusable stats card component for Tata Tele Admin Dashboard

"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Phone,
  PhoneCall,
  Users,
  Mic,
  Clock,
  Target,
  Activity,
  CheckCircle,
  XCircle,
} from "lucide-react";

type TrendDirection = "up" | "down" | "stable";

interface CallStatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    direction: TrendDirection;
    label?: string;
  };
  variant?: "default" | "success" | "warning" | "destructive";
  className?: string;
  loading?: boolean;
}

// Icon mapping for common stats
const iconMap = {
  totalCalls: <Phone className="h-4 w-4" />,
  answeredCalls: <PhoneCall className="h-4 w-4" />,
  missedCalls: <XCircle className="h-4 w-4" />,
  successRate: <Target className="h-4 w-4" />,
  users: <Users className="h-4 w-4" />,
  recordings: <Mic className="h-4 w-4" />,
  duration: <Clock className="h-4 w-4" />,
  activity: <Activity className="h-4 w-4" />,
  check: <CheckCircle className="h-4 w-4" />,
};

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

// Helper function to format duration (seconds to readable format)
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

export function CallStatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = "default",
  className,
  loading = false,
}: CallStatsCardProps) {
  // Determine variant styles
  const variantStyles = {
    default: "border-border",
    success:
      "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/50",
    warning:
      "border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-950/50",
    destructive:
      "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/50",
  };

  // Format the display value
  const formatValue = (val: string | number): string => {
    if (typeof val === "number") {
      // Special formatting for different types of values
      if (
        title.toLowerCase().includes("rate") ||
        title.toLowerCase().includes("success")
      ) {
        return `${val.toFixed(1)}%`;
      }
      if (
        title.toLowerCase().includes("duration") ||
        title.toLowerCase().includes("time")
      ) {
        return formatDuration(val);
      }
      return formatNumber(val);
    }
    return val;
  };

  // Get trend icon and color
  const getTrendIcon = () => {
    if (!trend) return null;

    switch (trend.direction) {
      case "up":
        return <TrendingUp className="h-3 w-3 text-green-600" />;
      case "down":
        return <TrendingDown className="h-3 w-3 text-red-600" />;
      case "stable":
        return <Minus className="h-3 w-3 text-gray-600" />;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    if (!trend) return "";

    switch (trend.direction) {
      case "up":
        return "text-green-600";
      case "down":
        return "text-red-600";
      case "stable":
        return "text-gray-600";
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="h-4 w-24 bg-muted rounded"></div>
          <div className="h-4 w-4 bg-muted rounded"></div>
        </CardHeader>
        <CardContent>
          <div className="h-8 w-16 bg-muted rounded mb-2"></div>
          <div className="h-3 w-20 bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md",
        variantStyles[variant],
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">
          {formatValue(value)}
        </div>

        {(subtitle || trend) && (
          <div className="flex items-center justify-between mt-2">
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}

            {trend && (
              <div className="flex items-center space-x-1">
                {getTrendIcon()}
                <span className={cn("text-xs font-medium", getTrendColor())}>
                  {trend.value > 0 ? "+" : ""}
                  {trend.value}%
                </span>
                {trend.label && (
                  <span className="text-xs text-muted-foreground">
                    {trend.label}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Pre-built stat card components for common Tata Tele metrics
export function TotalCallsCard({
  value,
  trend,
  className,
}: {
  value: number;
  trend?: CallStatsCardProps["trend"];
  className?: string;
}) {
  return (
    <CallStatsCard
      title="Total Calls"
      value={value}
      icon={iconMap.totalCalls}
      trend={trend}
      className={className}
    />
  );
}

export function SuccessRateCard({
  value,
  trend,
  className,
}: {
  value: number;
  trend?: CallStatsCardProps["trend"];
  className?: string;
}) {
  const variant =
    value >= 70 ? "success" : value >= 50 ? "warning" : "destructive";

  return (
    <CallStatsCard
      title="Success Rate"
      value={value}
      icon={iconMap.successRate}
      trend={trend}
      variant={variant}
      className={className}
    />
  );
}

export function ActiveUsersCard({
  value,
  trend,
  className,
}: {
  value: number;
  trend?: CallStatsCardProps["trend"];
  className?: string;
}) {
  return (
    <CallStatsCard
      title="Active Users"
      value={value}
      icon={iconMap.users}
      trend={trend}
      className={className}
    />
  );
}

export function RecordingsCard({
  value,
  total,
  trend,
  className,
}: {
  value: number;
  total: number;
  trend?: CallStatsCardProps["trend"];
  className?: string;
}) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <CallStatsCard
      title="Call Recordings"
      value={value}
      subtitle={`${percentage}% of calls recorded`}
      icon={iconMap.recordings}
      trend={trend}
      className={className}
    />
  );
}

export function CallDurationCard({
  value,
  trend,
  className,
}: {
  value: number;
  trend?: CallStatsCardProps["trend"];
  className?: string;
}) {
  return (
    <CallStatsCard
      title="Avg Call Duration"
      value={value}
      icon={iconMap.duration}
      trend={trend}
      className={className}
    />
  );
}

export function AnsweredCallsCard({
  value,
  total,
  trend,
  className,
}: {
  value: number;
  total: number;
  trend?: CallStatsCardProps["trend"];
  className?: string;
}) {
  const rate = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <CallStatsCard
      title="Answered Calls"
      value={value}
      subtitle={`${rate}% answer rate`}
      icon={iconMap.answeredCalls}
      trend={trend}
      variant={rate >= 70 ? "success" : rate >= 50 ? "warning" : "destructive"}
      className={className}
    />
  );
}

export function MissedCallsCard({
  value,
  total,
  trend,
  className,
}: {
  value: number;
  total: number;
  trend?: CallStatsCardProps["trend"];
  className?: string;
}) {
  const rate = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <CallStatsCard
      title="Missed Calls"
      value={value}
      subtitle={`${rate}% miss rate`}
      icon={iconMap.missedCalls}
      trend={trend}
      variant={rate <= 30 ? "success" : rate <= 50 ? "warning" : "destructive"}
      className={className}
    />
  );
}

// Export the icon map for use in other components
export { iconMap };
