// src/components/admin/dashboard/TrendsCard.tsx
// Enhanced Trends visualization component using temporal trends data

"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Activity,
  Calendar,
  BarChart3,
  LineChart,
  Target,
  Clock,
} from "lucide-react";
import {
  LineChart as RechartsLineChart,
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
  ComposedChart,
} from "recharts";
import { EnhancedTrendsData } from "@/models/types/callDashboard";

interface TrendsCardProps {
  data: EnhancedTrendsData;
  dateRange?: string;
  loading?: boolean;
  className?: string;
  variant?: "line" | "area" | "bar" | "composed";
}

export function TrendsCard({
  data,
  dateRange,
  loading = false,
  className,
  variant = "area",
}: TrendsCardProps) {
  const [chartType, setChartType] = useState<"daily" | "hourly">("daily");

  // Create daily chart data from temporal trends
  const dailyChartData = React.useMemo(() => {
    if (!data?.temporal_trends?.daily_series) return [];

    return data.temporal_trends.daily_series.map((day) => ({
      date: new Date(day.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      successRate: day.success_rate,
      totalCalls: day.total_calls,
      answeredCalls: day.answered_calls,
      avgDuration: day.avg_duration,
      activeAgents: day.active_agents,
      fullDate: day.date,
    }));
  }, [data]);

  // Create hourly chart data from temporal trends
  const hourlyChartData = React.useMemo(() => {
    if (!data?.temporal_trends?.hourly_series) return [];

    return data.temporal_trends.hourly_series.map((hour) => ({
      hour: hour.hour,
      hourDisplay: hour.display,
      successRate: hour.success_rate,
      totalCalls: hour.calls,
      answeredCalls: hour.answered,
      avgDuration: hour.avg_duration,
    }));
  }, [data]);

  // Performance gauge data
  const performanceGauge = data?.performance_gauge;

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
      case "error":
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

  // Get gauge status color
  const getGaugeStatusColor = (status: string) => {
    switch (status) {
      case "above_target":
        return "text-green-600";
      case "at_target":
        return "text-blue-600";
      case "below_target":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
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
              {data.temporal_trends?.total_days || 0} days analyzed
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="temporal">Temporal View</TabsTrigger>
            <TabsTrigger value="performance">Performance Gauge</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
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
              <p className="text-sm text-muted-foreground">
                {trendConfig.description} • Strength: {data.trend_strength}
              </p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <Calendar className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Total Days</p>
                <p className="text-lg font-bold">
                  {data.temporal_trends?.total_days || 0}
                </p>
              </div>

              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Active Hours</p>
                <p className="text-lg font-bold">
                  {data.temporal_trends?.active_hours || 0}
                </p>
              </div>

              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <Activity className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Trend Strength</p>
                <p
                  className={cn(
                    "text-lg font-bold capitalize",
                    trendConfig.color
                  )}
                >
                  {data.trend_strength}
                </p>
              </div>

              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <BarChart3 className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">View Type</p>
                <p className="text-lg font-bold capitalize">{data.view_type}</p>
              </div>
            </div>
          </TabsContent>

          {/* Temporal View Tab */}
          <TabsContent value="temporal" className="space-y-4">
            {/* Chart Type Toggle */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Temporal Analysis</p>
              <div className="flex items-center space-x-2">
                <Button
                  variant={chartType === "daily" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartType("daily")}
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Daily
                </Button>
                <Button
                  variant={chartType === "hourly" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartType("hourly")}
                >
                  <Clock className="h-4 w-4 mr-1" />
                  Hourly
                </Button>
              </div>
            </div>

            {/* Chart Visualization */}
            {data.trend === "insufficient_data" || data.trend === "error" ? (
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
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === "daily" ? (
                    variant === "composed" ? (
                      <ComposedChart
                        data={dailyChartData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="date"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          yAxisId="left"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          formatter={(value: number, name: string) => {
                            if (name === "successRate")
                              return [`${value.toFixed(1)}%`, "Success Rate"];
                            if (name === "totalCalls")
                              return [value, "Total Calls"];
                            return [value, name];
                          }}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Bar
                          yAxisId="left"
                          dataKey="totalCalls"
                          fill="#e2e8f0"
                          name="totalCalls"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="successRate"
                          stroke={trendConfig.chartColor}
                          strokeWidth={3}
                          dot={{ r: 4, fill: trendConfig.chartColor }}
                          name="successRate"
                        />
                      </ComposedChart>
                    ) : variant === "bar" ? (
                      <BarChart
                        data={dailyChartData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="date"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          formatter={(value: number) => [
                            `${value.toFixed(1)}%`,
                            "Success Rate",
                          ]}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Bar
                          dataKey="successRate"
                          radius={[4, 4, 0, 0]}
                          fill={trendConfig.chartColor}
                        />
                      </BarChart>
                    ) : variant === "area" ? (
                      <AreaChart
                        data={dailyChartData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="date"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          formatter={(value: number) => [
                            `${value.toFixed(1)}%`,
                            "Success Rate",
                          ]}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Area
                          type="monotone"
                          dataKey="successRate"
                          stroke={trendConfig.chartColor}
                          fill={trendConfig.chartColor}
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    ) : (
                      <RechartsLineChart
                        data={dailyChartData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="date"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          formatter={(value: number) => [
                            `${value.toFixed(1)}%`,
                            "Success Rate",
                          ]}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="successRate"
                          stroke={trendConfig.chartColor}
                          strokeWidth={3}
                          dot={{ r: 4, fill: trendConfig.chartColor }}
                          activeDot={{ r: 6, fill: trendConfig.chartColor }}
                        />
                      </RechartsLineChart>
                    )
                  ) : (
                    // Hourly chart
                    <BarChart
                      data={hourlyChartData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="hourDisplay"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        interval={1}
                      />
                      <YAxis fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip
                        formatter={(value: number, name: string) => {
                          if (name === "successRate")
                            return [`${value.toFixed(1)}%`, "Success Rate"];
                          if (name === "totalCalls")
                            return [value, "Total Calls"];
                          return [value, name];
                        }}
                        labelFormatter={(label) => `Hour: ${label}`}
                      />
                      <Bar
                        dataKey="totalCalls"
                        fill="#3b82f6"
                        radius={[2, 2, 0, 0]}
                        name="totalCalls"
                      />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            )}
          </TabsContent>

          {/* Performance Gauge Tab */}
          <TabsContent value="performance" className="space-y-4">
            {performanceGauge ? (
              <div className="space-y-4">
                {/* Performance Gauge Summary */}
                <div className="p-4 bg-muted/20 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium flex items-center space-x-2">
                      <Target className="h-4 w-4" />
                      <span>Performance vs Target</span>
                    </h4>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        getGaugeStatusColor(performanceGauge.status)
                      )}
                    >
                      {performanceGauge.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        Current Rate
                      </p>
                      <p
                        className={cn(
                          "text-xl font-bold",
                          getGaugeStatusColor(performanceGauge.status)
                        )}
                      >
                        {performanceGauge.current_rate.toFixed(1)}%
                      </p>
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        Target Rate
                      </p>
                      <p className="text-xl font-bold text-blue-600">
                        {performanceGauge.target_rate.toFixed(1)}%
                      </p>
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        Progress to Target
                      </p>
                      <p className="text-xl font-bold text-purple-600">
                        {performanceGauge.progress_to_target.toFixed(1)}%
                      </p>
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        {performanceGauge.improvement !== null
                          ? "Improvement"
                          : "Status"}
                      </p>
                      <p
                        className={cn(
                          "text-xl font-bold",
                          performanceGauge.improvement !== null
                            ? performanceGauge.improvement > 0
                              ? "text-green-600"
                              : "text-red-600"
                            : "text-gray-600"
                        )}
                      >
                        {performanceGauge.improvement !== null
                          ? `${
                              performanceGauge.improvement > 0 ? "+" : ""
                            }${performanceGauge.improvement.toFixed(1)}%`
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Color Zone Indicator */}
                <div className="p-3 rounded-lg bg-muted/10">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Performance Zone:
                    </span>
                    <Badge
                      className={cn(
                        "font-medium",
                        performanceGauge.color_zone === "green" &&
                          "bg-green-100 text-green-700 border-green-300",
                        performanceGauge.color_zone === "yellow" &&
                          "bg-yellow-100 text-yellow-700 border-yellow-300",
                        performanceGauge.color_zone === "red" &&
                          "bg-red-100 text-red-700 border-red-300"
                      )}
                    >
                      {performanceGauge.color_zone.toUpperCase()} ZONE
                    </Badge>
                  </div>
                </div>
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Performance gauge data not available.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Temporal View Tab */}
          <TabsContent value="temporal" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                Temporal Performance Pattern
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant={variant === "line" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartType("daily")}
                >
                  <LineChart className="h-4 w-4" />
                </Button>
                <Button
                  variant={variant === "area" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartType("daily")}
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={variant === "composed" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartType("daily")}
                >
                  <Activity className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Chart based on current chartType */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "daily" ? (
                  <AreaChart
                    data={dailyChartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(value: number) => [
                        `${value.toFixed(1)}%`,
                        "Success Rate",
                      ]}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="successRate"
                      stroke={trendConfig.chartColor}
                      fill={trendConfig.chartColor}
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                ) : (
                  <BarChart
                    data={hourlyChartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="hourDisplay"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      interval={1}
                    />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(value: number) => [value, "Total Calls"]}
                      labelFormatter={(label) => `Hour: ${label}`}
                    />
                    <Bar
                      dataKey="totalCalls"
                      fill={trendConfig.chartColor}
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Data Summary */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t text-sm">
              <div>
                <p className="text-muted-foreground mb-2">Daily Data Points:</p>
                <p className="font-medium">
                  {dailyChartData.length} days analyzed
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-2">
                  Hourly Data Points:
                </p>
                <p className="font-medium">
                  {hourlyChartData.length} hours tracked
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Available Charts Footer */}
        <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <BarChart3 className="h-3 w-3" />
            <span>
              Available charts: {data.charts_available?.join(", ") || "None"}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Activity className="h-3 w-3" />
            <span>View: {data.view_type}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default TrendsCard;
