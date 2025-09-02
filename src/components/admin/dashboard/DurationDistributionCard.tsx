// src/components/admin/dashboard/DurationDistributionCard.tsx
// Call duration distribution analysis with quality categorization

"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Clock,
  BarChart3,
  PieChart,
  CheckCircle,
  XCircle,
  Info,
  Timer,
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
  PieChart as RechartsPieChart,
  Pie,
} from "recharts";
import { DurationDistributionData } from "@/models/types/callDashboard";

interface DurationDistributionCardProps {
  data: DurationDistributionData;
  loading?: boolean;
  className?: string;
  title?: string;
}

// Colors for quality vs non-quality calls
const QUALITY_COLORS = {
  quality: "#10b981", // Green for quality calls
  nonQuality: "#ef4444", // Red for non-quality calls
  neutral: "#6b7280", // Gray for neutral
};

export function DurationDistributionCard({
  data,
  loading = false,
  className,
  title = "Call Duration Distribution",
}: DurationDistributionCardProps) {
  const [viewMode, setViewMode] = useState<"bar" | "pie">("bar");

  // Prepare chart data
  const chartData = React.useMemo(() => {
    if (!data?.buckets) return [];

    return data.buckets.map((bucket, index) => ({
      ...bucket,
      fill: bucket.is_quality
        ? QUALITY_COLORS.quality
        : QUALITY_COLORS.nonQuality,
      index,
    }));
  }, [data]);

  // Prepare pie chart data
  const pieData = React.useMemo(() => {
    if (!data?.buckets) return [];

    const qualityTotal = data.buckets
      .filter((b) => b.is_quality)
      .reduce((sum, b) => sum + b.count, 0);

    const nonQualityTotal = data.buckets
      .filter((b) => !b.is_quality)
      .reduce((sum, b) => sum + b.count, 0);

    return [
      {
        name: "Quality Calls",
        value: qualityTotal,
        percentage: data.quality_percentage,
        fill: QUALITY_COLORS.quality,
      },
      {
        name: "Non-Quality Calls",
        value: nonQualityTotal,
        percentage: 100 - data.quality_percentage,
        fill: QUALITY_COLORS.nonQuality,
      },
    ].filter((item) => item.value > 0);
  }, [data]);

  // Format duration for display
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

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
            <div className="h-48 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.buckets?.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>{title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No duration data available</p>
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
            <span>{title}</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === "bar" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("bar")}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "pie" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("pie")}
            >
              <PieChart className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <span>{data.total_analyzed} calls analyzed</span>
          <span>•</span>
          <span>Quality threshold: {data.quality_threshold}s</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs defaultValue="distribution" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
            <TabsTrigger value="quality">Quality Analysis</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>

          {/* Distribution Tab */}
          <TabsContent value="distribution" className="space-y-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                {viewMode === "bar" ? (
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="range"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(value: number) => [
                        `${value} calls (${(
                          (value / data.total_analyzed) *
                          100
                        ).toFixed(1)}%)`,
                        "Count",
                      ]}
                      labelFormatter={(label) => `Duration: ${label}`}
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e2e8f0",
                        borderRadius: "6px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <RechartsPieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percentage }) =>
                        `${name}: ${percentage.toFixed(1)}%`
                      }
                      labelLine={false}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`pie-cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name) => [
                        `${value} calls`,
                        name,
                      ]}
                    />
                  </RechartsPieChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Duration Range Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {chartData.map((bucket) => (
                <div
                  key={bucket.range}
                  className={cn(
                    "p-3 rounded-lg border text-center",
                    bucket.is_quality
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  )}
                >
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    {bucket.is_quality ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-600" />
                    )}
                    <span className="text-xs font-medium">{bucket.range}</span>
                  </div>
                  <p className="text-lg font-bold">{bucket.count}</p>
                  <p className="text-xs text-muted-foreground">
                    {bucket.percentage.toFixed(1)}%
                  </p>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Quality Analysis Tab */}
          <TabsContent value="quality" className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-green-700 flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Quality Calls ({data.quality_threshold}s+)</span>
                </h4>
                <div className="space-y-2">
                  {chartData
                    .filter((b) => b.is_quality)
                    .map((bucket) => (
                      <div
                        key={bucket.range}
                        className="flex items-center justify-between p-2 bg-green-50 rounded"
                      >
                        <span className="text-sm">{bucket.range}</span>
                        <div className="text-right">
                          <span className="font-medium">{bucket.count}</span>
                          <span className="text-xs text-muted-foreground ml-1">
                            ({bucket.percentage.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-red-700 flex items-center space-x-2">
                  <XCircle className="h-4 w-4" />
                  <span>Non-Quality Calls (&lt;{data.quality_threshold}s)</span>
                </h4>
                <div className="space-y-2">
                  {chartData
                    .filter((b) => !b.is_quality)
                    .map((bucket) => (
                      <div
                        key={bucket.range}
                        className="flex items-center justify-between p-2 bg-red-50 rounded"
                      >
                        <span className="text-sm">{bucket.range}</span>
                        <div className="text-right">
                          <span className="font-medium">{bucket.count}</span>
                          <span className="text-xs text-muted-foreground ml-1">
                            ({bucket.percentage.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <Timer className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Average Duration
                </p>
                <p className="text-xl font-bold">
                  {formatDuration(data.avg_duration)}
                </p>
              </div>

              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <Clock className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Median Duration</p>
                <p className="text-xl font-bold">
                  {formatDuration(data.median_duration)}
                </p>
              </div>

              <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <p className="text-sm text-muted-foreground">Quality Calls</p>
                <p className="text-xl font-bold text-green-600">
                  {data.quality_calls}
                </p>
                <p className="text-xs text-green-600">
                  {data.quality_percentage.toFixed(1)}%
                </p>
              </div>

              <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Info className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <p className="text-sm text-muted-foreground">Total Analyzed</p>
                <p className="text-xl font-bold text-blue-600">
                  {data.total_analyzed}
                </p>
              </div>
            </div>

            {/* Quality Insights */}
            <div className="p-4 bg-muted/20 rounded-lg">
              <h4 className="font-medium mb-2">Quality Insights</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  • Quality calls ({data.quality_threshold}s+) represent{" "}
                  {data.quality_percentage.toFixed(1)}% of total calls
                </p>
                <p>
                  • Average duration is {formatDuration(data.avg_duration)},
                  median is {formatDuration(data.median_duration)}
                </p>
                <p>
                  • {data.quality_calls} out of {data.total_analyzed} calls met
                  quality standards
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default DurationDistributionCard;
