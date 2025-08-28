// src/components/admin/dashboard/TrendsCard.tsx
// Updated Trends visualization component using real API data

"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Activity,
  Calendar,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import {
  SummaryStatsResponse,
  // TrendData
} from "@/models/types/callDashboard";

interface TrendsCardProps {
  data: SummaryStatsResponse["trends"];
  dateRange?: string;
  loading?: boolean;
  className?: string;
  variant?: "line" | "area" | "bar";
}

export function TrendsCard({
  data,
  dateRange,
  loading = false,
  className,
  variant = "area",
}: TrendsCardProps) {
  // Create visualization data from first_half_avg and second_half_avg
  const chartData = React.useMemo(() => {
    if (!data || data.trend === "insufficient_data") return [];

    return [
      {
        period: "First Half",
        value: data.first_half_avg,
        label: "First Half Average",
        color: "#94a3b8", // Gray for first half
      },
      {
        period: "Second Half",
        value: data.second_half_avg,
        label: "Second Half Average",
        color: data.change_percent > 0 ? "#10b981" : "#ef4444", // Green/Red based on improvement
      },
    ];
  }, [data]);

  // Create trend line data for smoother visualization
  const trendLineData = React.useMemo(() => {
    if (!data || data.trend === "insufficient_data") return [];

    // Create a smooth transition showing the trend
    const points = [];
    const steps = 10;

    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const value =
        data.first_half_avg +
        (data.second_half_avg - data.first_half_avg) * progress;

      points.push({
        point: i,
        value: Math.round(value * 10) / 10,
        label: i === 0 ? "Start" : i === steps ? "End" : `${i}`,
        displayLabel: i === 0 ? "First Half" : i === steps ? "Second Half" : "",
      });
    }

    return points;
  }, [data]);

  // Get trend configuration
  const getTrendConfig = () => {
    if (!data) return null;

    switch (data.trend) {
      case "increasing":
        return {
          icon: <TrendingUp className="h-4 w-4" />,
          color: "text-green-600",
          bgColor: "bg-green-50 border-green-200",
          chartColor: "#10b981",
          label: "Increasing",
          description: "Performance is trending upward",
        };
      case "decreasing":
        return {
          icon: <TrendingDown className="h-4 w-4" />,
          color: "text-red-600",
          bgColor: "bg-red-50 border-red-200",
          chartColor: "#ef4444",
          label: "Decreasing",
          description: "Performance is trending downward",
        };
      case "stable":
        return {
          icon: <Minus className="h-4 w-4" />,
          color: "text-blue-600",
          bgColor: "bg-blue-50 border-blue-200",
          chartColor: "#3b82f6",
          label: "Stable",
          description: "Performance is stable",
        };
      case "insufficient_data":
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          color: "text-gray-600",
          bgColor: "bg-gray-50 border-gray-200",
          chartColor: "#6b7280",
          label: "Insufficient Data",
          description: "Not enough data to determine trend",
        };
      default:
        return null;
    }
  };

  const trendConfig = getTrendConfig();

  // Format change percentage
  const formatChangePercent = (percent: number) => {
    const sign = percent > 0 ? "+" : "";
    return `${sign}${percent.toFixed(1)}%`;
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
            <div className="h-8 w-24 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || !trendConfig) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Performance Trends</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No trend data available</p>
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
            <Activity className="h-5 w-5" />
            <span>Performance Trends</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            {dateRange && (
              <Badge variant="outline" className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span className="text-xs">{dateRange}</span>
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs">
              {data.total_days_analyzed} days analyzed
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Trend Summary */}
        <div className={cn("p-4 rounded-lg border", trendConfig.bgColor)}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className={trendConfig.color}>{trendConfig.icon}</div>
              <span className={cn("font-semibold", trendConfig.color)}>
                {trendConfig.label}
              </span>
            </div>
            <div className="text-right">
              <span className={cn("text-2xl font-bold", trendConfig.color)}>
                {formatChangePercent(data.change_percent)}
              </span>
              <p className="text-xs text-muted-foreground">change</p>
            </div>
          </div>

          {/* Period Comparison */}
          <div className="flex items-center justify-between text-sm">
            <div className="text-center">
              <p className="text-muted-foreground">First Half Avg</p>
              <p className="font-semibold text-lg">{data.first_half_avg}</p>
            </div>
            <ArrowRight className={cn("h-4 w-4", trendConfig.color)} />
            <div className="text-center">
              <p className="text-muted-foreground">Second Half Avg</p>
              <p className={cn("font-semibold text-lg", trendConfig.color)}>
                {data.second_half_avg}
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mt-2">
            {trendConfig.description} over {data.total_days_analyzed} days
          </p>
        </div>

        {/* Chart Visualization */}
        {data.trend === "insufficient_data" ? (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Not enough historical data to show trend analysis. More data
                will be available as you continue using the system.
              </AlertDescription>
            </Alert>

            {/* Grayed out placeholder chart */}
            <div className="h-48 bg-muted/30 rounded-lg border-2 border-dashed flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Trend chart will appear here</p>
                <p className="text-xs">when sufficient data is available</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Performance Over Time</p>
              <div className="flex items-center space-x-2">
                <Badge
                  variant="outline"
                  className={cn("text-xs", trendConfig.color)}
                >
                  {variant.charAt(0).toUpperCase() + variant.slice(1)} Chart
                </Badge>
              </div>
            </div>

            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                {variant === "bar" ? (
                  <BarChart
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="period"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(value) => [`${value}`, "Average Calls"]}
                      labelFormatter={(period) => `Period: ${period}`}
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e2e8f0",
                        borderRadius: "6px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : variant === "area" ? (
                  <AreaChart
                    data={trendLineData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="displayLabel"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(value) => [`${value}`, "Average Calls"]}
                      labelFormatter={(label) => label || "Trend Point"}
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e2e8f0",
                        borderRadius: "6px",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={trendConfig.chartColor}
                      fill={trendConfig.chartColor}
                      fillOpacity={0.1}
                      strokeWidth={2}
                    />
                  </AreaChart>
                ) : (
                  <LineChart
                    data={trendLineData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="displayLabel"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(value) => [`${value}`, "Average Calls"]}
                      labelFormatter={(label) => label || "Trend Point"}
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e2e8f0",
                        borderRadius: "6px",
                        fontSize: "12px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={trendConfig.chartColor}
                      strokeWidth={3}
                      dot={{ r: 4, fill: trendConfig.chartColor }}
                      activeDot={{ r: 6, fill: trendConfig.chartColor }}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Detailed Trend Insights */}
        {data.trend !== "insufficient_data" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">Trend Direction</p>
              <div className="flex items-center justify-center space-x-1 mt-1">
                <div className={trendConfig.color}>{trendConfig.icon}</div>
                <span className={cn("font-medium", trendConfig.color)}>
                  {trendConfig.label}
                </span>
              </div>
            </div>

            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">Change Rate</p>
              <p className={cn("text-lg font-bold mt-1", trendConfig.color)}>
                {formatChangePercent(data.change_percent)}
              </p>
            </div>

            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">First Half</p>
              <p className="text-lg font-bold mt-1 text-gray-600">
                {data.first_half_avg}
              </p>
            </div>

            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">Second Half</p>
              <p className={cn("text-lg font-bold mt-1", trendConfig.color)}>
                {data.second_half_avg}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
