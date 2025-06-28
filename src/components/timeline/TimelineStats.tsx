// src/components/timeline/TimelineStats.tsx

"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, TrendingUp, Calendar, BarChart3 } from "lucide-react";
import { TimelineStats as TimelineStatsType } from "@/models/types/timeline";

interface TimelineStatsProps {
  stats: TimelineStatsType;
  isLoading?: boolean;
  className?: string;
}

const TimelineStats: React.FC<TimelineStatsProps> = ({
  stats,
  isLoading = false,
  className = "",
}) => {
  // Get the most active activity type
  const getMostActiveType = () => {
    const entries = Object.entries(stats.activities_by_type || {});
    if (entries.length === 0) return "None";

    const sorted = entries.sort(([, a], [, b]) => b - a);
    return sorted[0][0].charAt(0).toUpperCase() + sorted[0][0].slice(1);
  };

  // Calculate activity trend (increase/decrease)
  const getActivityTrend = () => {
    const trend = stats.activity_trend || [];
    if (trend.length < 2) return { direction: "stable", percentage: 0 };

    const recent = trend.slice(-7); // Last 7 days
    const earlier = trend.slice(-14, -7); // Previous 7 days

    const recentTotal = recent.reduce((sum, day) => sum + day.count, 0);
    const earlierTotal = earlier.reduce((sum, day) => sum + day.count, 0);

    if (earlierTotal === 0) return { direction: "stable", percentage: 0 };

    const percentage = Math.round(
      ((recentTotal - earlierTotal) / earlierTotal) * 100
    );
    const direction =
      percentage > 0 ? "up" : percentage < 0 ? "down" : "stable";

    return { direction, percentage: Math.abs(percentage) };
  };

  const trend = getActivityTrend();
  const mostActiveType = getMostActiveType();

  const statsItems = [
    {
      label: "Total Activities",
      value: stats.total_activities || 0,
      icon: <Activity className="h-5 w-5" />,
      className: "bg-blue-50 border-blue-200 text-blue-700",
      description: "All time activities",
    },
    {
      label: "Recent Activity",
      value: stats.recent_activity_count || 0,
      icon: <TrendingUp className="h-5 w-5" />,
      className: "bg-green-50 border-green-200 text-green-700",
      description: "Last 7 days",
    },
    {
      label: "Most Active Type",
      value: mostActiveType,
      icon: <BarChart3 className="h-5 w-5" />,
      className: "bg-purple-50 border-purple-200 text-purple-700",
      description: "Primary activity",
    },
    {
      label: "Activity Trend",
      value:
        trend.direction === "stable"
          ? "Stable"
          : `${trend.percentage}% ${trend.direction}`,
      icon: <Calendar className="h-5 w-5" />,
      className:
        trend.direction === "up"
          ? "bg-green-50 border-green-200 text-green-700"
          : trend.direction === "down"
          ? "bg-red-50 border-red-200 text-red-700"
          : "bg-gray-50 border-gray-200 text-gray-700",
      description: "Last 7 vs previous 7 days",
    },
  ];

  if (isLoading) {
    return (
      <div
        className={`grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 ${className}`}
      >
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 ${className}`}>
      {statsItems.map((item, index) => (
        <Card
          key={index}
          className={`transition-colors border ${item.className}`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium opacity-80">{item.label}</p>
                <p className="text-2xl font-bold mt-1">{item.value}</p>
                {item.description && (
                  <p className="text-xs opacity-70 mt-1">{item.description}</p>
                )}
              </div>
              <div className="opacity-60">{item.icon}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TimelineStats;
