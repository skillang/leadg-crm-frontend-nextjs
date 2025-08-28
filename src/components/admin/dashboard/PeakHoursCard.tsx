// src/components/admin/dashboard/PeakHoursCard.tsx
// Peak Hours visualization component with multiple layout options

"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  PhoneCall,
  PhoneMissed,
  BarChart3,
  Grid3X3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  SummaryStatsResponse,
  // PeakHourData,
} from "@/models/types/callDashboard";

interface PeakHoursCardProps {
  data: SummaryStatsResponse["peak_hours"];
  loading?: boolean;
  className?: string;
}

// Colors for different hour categories
const HOUR_COLORS = {
  peak: "#10b981", // Green for peak hours
  high: "#f59e0b", // Orange for high activity
  medium: "#6b7280", // Gray for medium activity
  low: "#d1d5db", // Light gray for low activity
};

export function PeakHoursCard({
  data,
  loading = false,
  className,
}: PeakHoursCardProps) {
  const [viewMode, setViewMode] = useState<"cards" | "chart">("cards");

  // Format hourly distribution data for chart
  const chartData = React.useMemo(() => {
    if (!data?.hourly_distribution) return [];

    return Object.entries(data.hourly_distribution)
      .map(([hour, calls]) => ({
        hour: parseInt(hour),
        calls,
        hourDisplay: `${hour.padStart(2, "0")}:00`,
        percentage: data.total_calls > 0 ? (calls / data.total_calls) * 100 : 0,
      }))
      .sort((a, b) => a.hour - b.hour);
  }, [data]);

  // Get color for hour based on activity level
  const getHourColor = (calls: number, maxCalls: number) => {
    const ratio = calls / maxCalls;
    if (ratio >= 0.8) return HOUR_COLORS.peak;
    if (ratio >= 0.6) return HOUR_COLORS.high;
    if (ratio >= 0.3) return HOUR_COLORS.medium;
    return HOUR_COLORS.low;
  };

  const maxCalls = Math.max(...chartData.map((d) => d.calls));

  // Format hour display
  const formatHour = (hour: number) => {
    return `${hour.toString().padStart(2, "0")}:00`;
  };

  if (loading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardHeader className="space-y-2">
          <div className="h-6 w-32 bg-muted rounded"></div>
          <div className="h-4 w-48 bg-muted rounded"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.peak_hours?.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Peak Hours Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No peak hours data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Peak Hours Analysis</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === "cards" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("cards")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "chart" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("chart")}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Total calls analyzed: {data.total_calls.toLocaleString()}
        </p>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="answered">Answered</TabsTrigger>
            <TabsTrigger value="missed">Missed</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {viewMode === "cards" ? (
              <div className="space-y-3">
                {data.peak_hours.slice(0, 5).map((peak, index) => (
                  <div
                    key={`peak-${peak.hour}`}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-muted/50 to-muted/20 rounded-lg border"
                  >
                    <div className="flex items-center space-x-4">
                      <Badge
                        variant="outline"
                        className={cn(
                          "px-3 py-1",
                          index === 0 &&
                            "border-green-500 text-green-700 bg-green-50"
                        )}
                      >
                        #{index + 1}
                      </Badge>
                      <div>
                        <p className="font-semibold text-lg">
                          {formatHour(peak.hour)} - {formatHour(peak.hour + 1)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Peak activity period
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{peak.calls}</p>
                      <p className="text-sm text-muted-foreground">
                        {peak.percentage.toFixed(1)}% of calls
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hourDisplay" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip
                      formatter={(value) => [
                        `${value} calls (${(
                          ((value as number) / data.total_calls) *
                          100
                        ).toFixed(1)}%)`,
                        "Calls",
                      ]}
                      labelFormatter={(hour) => `Hour: ${hour}`}
                    />
                    <Bar dataKey="calls" radius={[2, 2, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={getHourColor(entry.calls, maxCalls)}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </TabsContent>

          {/* Answered Tab */}
          <TabsContent value="answered" className="space-y-4">
            <div className="space-y-3">
              {data.peak_answered_hours?.slice(0, 5).map((peak) => (
                <div
                  key={`answered-${peak.hour}`}
                  className="flex items-center justify-between p-4 bg-green-50/50 rounded-lg border border-green-200"
                >
                  <div className="flex items-center space-x-4">
                    <PhoneCall className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">{peak.hour_display}</p>
                      <p className="text-sm text-green-700">
                        Best answer period
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-700">
                      {peak.calls}
                    </p>
                    <p className="text-sm text-green-600">
                      {peak.percentage.toFixed(1)}% answered
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Missed Tab */}
          <TabsContent value="missed" className="space-y-4">
            <div className="space-y-3">
              {data.peak_missed_hours?.slice(0, 5).map((peak) => (
                <div
                  key={`missed-${peak.hour}`}
                  className="flex items-center justify-between p-4 bg-red-50/50 rounded-lg border border-red-200"
                >
                  <div className="flex items-center space-x-4">
                    <PhoneMissed className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-medium">{peak.hour_display}</p>
                      <p className="text-sm text-red-700">High miss period</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-red-700">
                      {peak.calls}
                    </p>
                    <p className="text-sm text-red-600">
                      {peak.percentage.toFixed(1)}% missed
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-4">
            {data.insights ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <p className="font-medium text-green-800">
                      Best Calling Time
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-green-700">
                    {formatHour(data.insights.best_calling_time)}
                  </p>
                  <p className="text-sm text-green-600">Highest activity</p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <PhoneCall className="h-4 w-4 text-blue-600" />
                    <p className="font-medium text-blue-800">
                      Best Answer Time
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">
                    {formatHour(data.insights.best_answer_time)}
                  </p>
                  <p className="text-sm text-blue-600">Highest answer rate</p>
                </div>

                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <p className="font-medium text-red-800">Worst Miss Time</p>
                  </div>
                  <p className="text-2xl font-bold text-red-700">
                    {formatHour(data.insights.worst_miss_time)}
                  </p>
                  <p className="text-sm text-red-600">Highest miss rate</p>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Activity className="h-4 w-4 text-purple-600" />
                    <p className="font-medium text-purple-800">
                      Overall Answer Rate
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-purple-700">
                    {data.insights.overall_answer_rate.toFixed(1)}%
                  </p>
                  <p className="text-sm text-purple-600">Average performance</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No insights data available</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
