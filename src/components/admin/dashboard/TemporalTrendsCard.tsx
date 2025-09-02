// src/components/admin/dashboard/TemporalTrendsCard.tsx
// Daily and hourly temporal trends visualization component

"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  Calendar,
  Clock,
  Activity,
  BarChart3,
  LineChart,
  Users,
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
import { TemporalTrendsData } from "@/models/types/callDashboard";

interface TemporalTrendsCardProps {
  data: TemporalTrendsData;
  loading?: boolean;
  className?: string;
  title?: string;
}

export function TemporalTrendsCard({
  data,
  loading = false,
  className,
  title = "Temporal Trends Analysis",
}: TemporalTrendsCardProps) {
  const [viewMode, setViewMode] = useState<"line" | "area" | "composed">(
    "area"
  );

  // Format daily data for charts
  const dailyChartData = React.useMemo(() => {
    if (!data?.daily_series) return [];

    return data.daily_series.map((day) => ({
      ...day,
      dateDisplay: new Date(day.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      successRateDisplay: day.success_rate.toFixed(1),
    }));
  }, [data]);

  // Format hourly data for charts
  const hourlyChartData = React.useMemo(() => {
    if (!data?.hourly_series) return [];

    return data.hourly_series.map((hour) => ({
      ...hour,
      hourDisplay: `${hour.hour.toString().padStart(2, "0")}:00`,
      successRateDisplay: hour.success_rate.toFixed(1),
    }));
  }, [data]);

  // Calculate daily insights
  const dailyInsights = React.useMemo(() => {
    if (!dailyChartData.length) return null;

    const bestDay = dailyChartData.reduce((best, day) =>
      day.success_rate > best.success_rate ? day : best
    );

    const worstDay = dailyChartData.reduce((worst, day) =>
      day.success_rate < worst.success_rate ? day : worst
    );

    const totalCalls = dailyChartData.reduce(
      (sum, day) => sum + day.total_calls,
      0
    );
    const avgCallsPerDay = totalCalls / dailyChartData.length;

    return { bestDay, worstDay, avgCallsPerDay };
  }, [dailyChartData]);

  // Calculate hourly insights
  const hourlyInsights = React.useMemo(() => {
    if (!hourlyChartData.length) return null;

    const peakHour = hourlyChartData.reduce((peak, hour) =>
      hour.calls > peak.calls ? hour : peak
    );

    const bestPerformanceHour = hourlyChartData.reduce((best, hour) =>
      hour.success_rate > best.success_rate ? hour : best
    );

    return { peakHour, bestPerformanceHour };
  }, [hourlyChartData]);

  if (loading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardHeader className="space-y-2">
          <div className="h-6 w-48 bg-muted rounded"></div>
          <div className="h-4 w-32 bg-muted rounded"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || (!data.daily_series?.length && !data.hourly_series?.length)) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>{title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No temporal trends data available</p>
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
            <TrendingUp className="h-5 w-5" />
            <span>{title}</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {data.total_days} days
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {data.active_hours} active hours
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{data.date_range}</p>
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs defaultValue="hourly" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="daily">Daily Trends</TabsTrigger>
            <TabsTrigger value="hourly">Hourly Patterns</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          {/* Daily Trends Tab */}
          <TabsContent value="daily" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Performance Over Time</p>
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === "line" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("line")}
                >
                  <LineChart className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "area" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("area")}
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "composed" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("composed")}
                >
                  <Activity className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                {viewMode === "line" ? (
                  <RechartsLineChart
                    data={dailyChartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="dateDisplay"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(value: number, name: string) => {
                        if (name === "success_rate")
                          return [`${value.toFixed(1)}%`, "Success Rate"];
                        if (name === "total_calls")
                          return [value, "Total Calls"];
                        if (name === "answered_calls")
                          return [value, "Answered Calls"];
                        return [value, name];
                      }}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="success_rate"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#10b981" }}
                      name="success_rate"
                    />
                  </RechartsLineChart>
                ) : viewMode === "area" ? (
                  <AreaChart
                    data={dailyChartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="dateDisplay"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(value: number, name: string) => {
                        if (name === "success_rate")
                          return [`${value.toFixed(1)}%`, "Success Rate"];
                        if (name === "total_calls")
                          return [value, "Total Calls"];
                        return [value, name];
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="success_rate"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.3}
                      name="success_rate"
                    />
                  </AreaChart>
                ) : (
                  <ComposedChart
                    data={dailyChartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="dateDisplay"
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
                        if (name === "success_rate")
                          return [`${value.toFixed(1)}%`, "Success Rate"];
                        if (name === "total_calls")
                          return [value, "Total Calls"];
                        if (name === "answered_calls")
                          return [value, "Answered Calls"];
                        return [value, name];
                      }}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="total_calls"
                      fill="#e2e8f0"
                      name="total_calls"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="success_rate"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#10b981" }}
                      name="success_rate"
                    />
                  </ComposedChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Daily Summary Cards */}
            {dailyInsights && (
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
                  <Calendar className="h-4 w-4 mx-auto mb-1 text-green-600" />
                  <p className="text-xs text-muted-foreground">Best Day</p>
                  <p className="font-medium text-green-600">
                    {dailyInsights.bestDay.dateDisplay}
                  </p>
                  <p className="text-xs text-green-600">
                    {dailyInsights.bestDay.success_rate.toFixed(1)}%
                  </p>
                </div>

                <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Activity className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                  <p className="text-xs text-muted-foreground">Avg Calls/Day</p>
                  <p className="font-medium text-blue-600">
                    {Math.round(dailyInsights.avgCallsPerDay)}
                  </p>
                </div>

                <div className="text-center p-3 bg-red-50 border border-red-200 rounded-lg">
                  <Calendar className="h-4 w-4 mx-auto mb-1 text-red-600" />
                  <p className="text-xs text-muted-foreground">Lowest Day</p>
                  <p className="font-medium text-red-600">
                    {dailyInsights.worstDay.dateDisplay}
                  </p>
                  <p className="text-xs text-red-600">
                    {dailyInsights.worstDay.success_rate.toFixed(1)}%
                  </p>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Hourly Patterns Tab */}
          <TabsContent value="hourly" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Hourly Performance Pattern</p>
              <Badge variant="outline" className="text-xs">
                {data.active_hours} active hours
              </Badge>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={hourlyChartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
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
                      if (name === "success_rate")
                        return [`${value.toFixed(1)}%`, "Success Rate"];
                      if (name === "calls") return [value, "Total Calls"];
                      if (name === "answered") return [value, "Answered Calls"];
                      return [value, name];
                    }}
                    labelFormatter={(label) => `Hour: ${label}`}
                  />
                  <Bar
                    dataKey="calls"
                    fill="#3b82f6"
                    radius={[2, 2, 0, 0]}
                    name="calls"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Hourly Summary */}
            {hourlyInsights && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="text-center p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <Clock className="h-4 w-4 mx-auto mb-1 text-purple-600" />
                  <p className="text-xs text-muted-foreground">
                    Peak Volume Hour
                  </p>
                  <p className="font-medium text-purple-600">
                    {hourlyInsights.peakHour.hourDisplay}
                  </p>
                  <p className="text-xs text-purple-600">
                    {hourlyInsights.peakHour.calls} calls
                  </p>
                </div>

                <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
                  <TrendingUp className="h-4 w-4 mx-auto mb-1 text-green-600" />
                  <p className="text-xs text-muted-foreground">
                    Best Performance Hour
                  </p>
                  <p className="font-medium text-green-600">
                    {hourlyInsights.bestPerformanceHour.hourDisplay}
                  </p>
                  <p className="text-xs text-green-600">
                    {hourlyInsights.bestPerformanceHour.success_rate.toFixed(1)}
                    %
                  </p>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-4">
            <div className="space-y-4">
              {/* Time Period Summary */}
              <div className="p-4 bg-muted/20 rounded-lg">
                <h4 className="font-medium mb-3 flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Period Summary</span>
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Date Range</p>
                    <p className="font-medium">{data.date_range}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Days</p>
                    <p className="font-medium">{data.total_days}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Active Hours/Day</p>
                    <p className="font-medium">{data.active_hours}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Data Points</p>
                    <p className="font-medium">
                      {data.daily_series?.length || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Performance Insights */}
              {dailyInsights && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium mb-3 flex items-center space-x-2 text-blue-700">
                    <Activity className="h-4 w-4" />
                    <span>Performance Insights</span>
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Highest performing day:
                      </span>
                      <span className="font-medium text-green-600">
                        {dailyInsights.bestDay.dateDisplay} (
                        {dailyInsights.bestDay.success_rate.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Average calls per day:
                      </span>
                      <span className="font-medium">
                        {Math.round(dailyInsights.avgCallsPerDay)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Consistency:
                      </span>
                      <span className="font-medium">
                        {Math.abs(
                          dailyInsights.bestDay.success_rate -
                            dailyInsights.worstDay.success_rate
                        ) < 10
                          ? "High"
                          : "Variable"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Agent Activity Pattern */}
              {data.daily_series && data.daily_series.length > 0 && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h4 className="font-medium mb-3 flex items-center space-x-2 text-gray-700">
                    <Users className="h-4 w-4" />
                    <span>Agent Activity Pattern</span>
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Average active agents:
                      </span>
                      <span className="font-medium">
                        {(
                          data.daily_series.reduce(
                            (sum, day) => sum + day.active_agents,
                            0
                          ) / data.daily_series.length
                        ).toFixed(1)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Max agents in one day:
                      </span>
                      <span className="font-medium">
                        {Math.max(
                          ...data.daily_series.map((day) => day.active_agents)
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Min agents in one day:
                      </span>
                      <span className="font-medium">
                        {Math.min(
                          ...data.daily_series.map((day) => day.active_agents)
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default TemporalTrendsCard;
