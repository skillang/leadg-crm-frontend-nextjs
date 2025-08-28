// src/components/admin/dashboard/InsightsCard.tsx
// Insights component displaying best/worst times with colored badges

"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Clock,
  PhoneCall,
  Target,
  Activity,
  Award,
  AlertTriangle,
} from "lucide-react";
import { SummaryStatsResponse } from "@/models/types/callDashboard";

interface InsightsCardProps {
  data: SummaryStatsResponse["peak_hours"]["insights"];
  analysisMetadata?: SummaryStatsResponse["peak_hours"]["analysis_metadata"];
  loading?: boolean;
  className?: string;
}

// Format hour to readable time
const formatHour = (hour: number | null | undefined): string => {
  if (hour === null || hour === undefined) return "N/A";
  return `${hour.toString().padStart(2, "0")}:00`;
};

// Format hour range
const formatHourRange = (hour: number | null | undefined): string => {
  if (hour === null || hour === undefined) return "N/A";
  return `${formatHour(hour)} - ${formatHour(hour + 1)}`;
};

export function InsightsCard({
  data,
  analysisMetadata,
  loading = false,
  className,
}: InsightsCardProps) {
  if (loading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardHeader className="space-y-2">
          <div className="h-6 w-32 bg-muted rounded"></div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-muted rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5" />
            <span>Call Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No insights data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate performance rating based on answer rate
  const getPerformanceRating = (rate: number | null | undefined) => {
    const safeRate = rate || 0;
    if (safeRate >= 80)
      return {
        label: "Excellent",
        color: "text-green-600",
        bg: "bg-green-50 border-green-200",
      };
    if (safeRate >= 70)
      return {
        label: "Good",
        color: "text-blue-600",
        bg: "bg-blue-50 border-blue-200",
      };
    if (safeRate >= 60)
      return {
        label: "Average",
        color: "text-yellow-600",
        bg: "bg-yellow-50 border-yellow-200",
      };
    if (safeRate >= 50)
      return {
        label: "Below Average",
        color: "text-orange-600",
        bg: "bg-orange-50 border-orange-200",
      };
    return {
      label: "Poor",
      color: "text-red-600",
      bg: "bg-red-50 border-red-200",
    };
  };

  const performanceRating = getPerformanceRating(data.overall_answer_rate);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Lightbulb className="h-5 w-5" />
          <span>Call Insights</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Key performance indicators and optimal calling times
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Main Insights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Best Calling Time */}
          <div className="p-4 bg-green-50 rounded-lg border border-green-200 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-2 mb-3">
              <div className="p-1.5 bg-green-100 rounded-full">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-green-800">
                  Best Calling Time
                </p>
                <p className="text-xs text-green-600">
                  Highest activity period
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-700">
                  {data.best_calling_time !== null &&
                  data.best_calling_time !== undefined
                    ? formatHourRange(data.best_calling_time)
                    : "No data"}
                </p>
                <Badge className="mt-1 bg-green-100 text-green-700 hover:bg-green-200">
                  <Award className="h-3 w-3 mr-1" />
                  {data.best_calling_time !== null &&
                  data.best_calling_time !== undefined
                    ? "Peak Activity"
                    : "Insufficient Data"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Best Answer Time */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-2 mb-3">
              <div className="p-1.5 bg-blue-100 rounded-full">
                <PhoneCall className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-blue-800">Best Answer Time</p>
                <p className="text-xs text-blue-600">Highest success rate</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-700">
                  {data.best_answer_time !== null &&
                  data.best_answer_time !== undefined
                    ? formatHourRange(data.best_answer_time)
                    : "No data"}
                </p>
                <Badge className="mt-1 bg-blue-100 text-blue-700 hover:bg-blue-200">
                  <Target className="h-3 w-3 mr-1" />
                  {data.best_answer_time !== null &&
                  data.best_answer_time !== undefined
                    ? "High Success"
                    : "Insufficient Data"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Worst Miss Time */}
          <div className="p-4 bg-red-50 rounded-lg border border-red-200 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-2 mb-3">
              <div className="p-1.5 bg-red-100 rounded-full">
                <TrendingDown className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-red-800">Worst Miss Time</p>
                <p className="text-xs text-red-600">Highest miss rate</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-700">
                  {data.worst_miss_time !== null &&
                  data.worst_miss_time !== undefined
                    ? formatHourRange(data.worst_miss_time)
                    : "No data"}
                </p>
                <Badge className="mt-1 bg-red-100 text-red-700 hover:bg-red-200">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {data.worst_miss_time !== null &&
                  data.worst_miss_time !== undefined
                    ? "High Miss Rate"
                    : "Insufficient Data"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Overall Performance */}
          <div
            className={cn(
              "p-4 rounded-lg border hover:shadow-md transition-shadow",
              performanceRating.bg
            )}
          >
            <div className="flex items-center space-x-2 mb-3">
              <div className={cn("p-1.5 rounded-full", performanceRating.bg)}>
                <Activity className={cn("h-4 w-4", performanceRating.color)} />
              </div>
              <div>
                <p className={cn("font-semibold", performanceRating.color)}>
                  Overall Performance
                </p>
                <p className={cn("text-xs", performanceRating.color)}>
                  Average answer rate
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={cn("text-2xl font-bold", performanceRating.color)}
                >
                  {data.overall_answer_rate?.toFixed(1) || "0"}%
                </p>
                <Badge
                  className={cn(
                    "mt-1 hover:opacity-80",
                    performanceRating.color.replace("text-", "text-"),
                    performanceRating.bg.replace("bg-", "bg-")
                  )}
                >
                  {performanceRating.label}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Analysis Metadata */}
        {analysisMetadata && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-3 flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Analysis Summary</span>
            </h4>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">
                  Hours with Calls
                </p>
                <p className="text-lg font-semibold">
                  {analysisMetadata.hours_with_calls || 0}
                </p>
              </div>

              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">
                  Most Active Hour
                </p>
                <p className="text-lg font-semibold">
                  {analysisMetadata.most_active_hour !== null &&
                  analysisMetadata.most_active_hour !== undefined
                    ? formatHour(analysisMetadata.most_active_hour)
                    : "N/A"}
                </p>
              </div>

              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">
                  Best Answer Hour
                </p>
                <p className="text-lg font-semibold">
                  {analysisMetadata.best_answer_hour !== null &&
                  analysisMetadata.best_answer_hour !== undefined
                    ? formatHour(analysisMetadata.best_answer_hour)
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actionable Recommendations */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold mb-3 flex items-center space-x-2">
            <Lightbulb className="h-4 w-4" />
            <span>Recommendations</span>
          </h4>

          <div className="space-y-2">
            <div className="p-3 bg-green-50/50 rounded-lg border border-green-100">
              <p className="text-sm">
                <span className="font-medium text-green-800">
                  ✓ Optimize calling schedule:
                </span>{" "}
                <span className="text-green-700">
                  Focus calls during {formatHourRange(data.best_answer_time)}{" "}
                  for highest success rates
                </span>
              </p>
            </div>

            {data.worst_miss_time !== data.best_answer_time && (
              <div className="p-3 bg-orange-50/50 rounded-lg border border-orange-100">
                <p className="text-sm">
                  <span className="font-medium text-orange-800">
                    ⚠ Avoid peak miss times:
                  </span>{" "}
                  <span className="text-orange-700">
                    Consider reducing calls during{" "}
                    {formatHourRange(data.worst_miss_time)} to improve
                    efficiency
                  </span>
                </p>
              </div>
            )}

            {data.overall_answer_rate < 60 && (
              <div className="p-3 bg-red-50/50 rounded-lg border border-red-100">
                <p className="text-sm">
                  <span className="font-medium text-red-800">
                    ⚡ Improve overall performance:
                  </span>{" "}
                  <span className="text-red-700">
                    Current answer rate ({data.overall_answer_rate.toFixed(1)}%)
                    is below optimal. Consider timing adjustments and follow-up
                    strategies.
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
