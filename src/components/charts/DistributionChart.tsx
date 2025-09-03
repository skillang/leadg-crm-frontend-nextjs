// src/components/dashboard/DistributionChart.tsx
// Simple horizontal bar chart for lead distribution

"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { BarChart3 } from "lucide-react";

interface DistributionChartProps {
  data: Record<string, number>;
  title: string;
  loading?: boolean;
  maxItems?: number;
  height?: number;
  className?: string;
}

const COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#10b981", // green
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#84cc16", // lime
  "#f97316", // orange
];

// Simple tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium capitalize text-gray-900">{label}</p>
        <p className="text-primary">{payload[0].value} leads</p>
      </div>
    );
  }
  return null;
};

export const DistributionChart: React.FC<DistributionChartProps> = ({
  data,
  title,
  loading = false,
  maxItems = 5,
  height = 350,
  className = "",
}) => {
  // Process data - get top 5, exclude follow_up
  const chartData = useMemo(() => {
    if (!data || Object.keys(data).length === 0) return [];

    const filteredData = Object.entries(data)
      .filter(([key, value]) => {
        return (
          key &&
          key.trim() !== "" &&
          value > 0 &&
          !key.toLowerCase().includes("follow")
        );
      })
      .sort(([, a], [, b]) => b - a) // Sort by value descending
      .slice(0, maxItems) // Take top 5
      .map(([key, value], index) => ({
        name: key.replace(/-/g, " ").replace(/_/g, " "),
        value: value,
        fill: COLORS[index % COLORS.length],
      }));

    return filteredData;
  }, [data, maxItems]);

  const totalCount = chartData.reduce((sum, item) => sum + item.value, 0);
  const maxValue = Math.max(...chartData.map((item) => item.value));

  const calculateAxisConfig = (maxValue: number) => {
    let increment: number;

    if (maxValue <= 25) {
      increment = 5;
    } else if (maxValue <= 50) {
      increment = 10;
    } else if (maxValue <= 100) {
      increment = 20;
    } else if (maxValue <= 200) {
      increment = 50;
    } else if (maxValue <= 500) {
      increment = 100;
    } else if (maxValue <= 1000) {
      increment = 200;
    } else {
      increment = 500;
    }

    const yAxisMax = Math.ceil(maxValue / increment) * increment;
    const ticks = [];
    for (let i = 0; i <= yAxisMax; i += increment) {
      ticks.push(i);
    }

    return { yAxisMax, ticks };
  };

  const { yAxisMax, ticks: yAxisTicks } = calculateAxisConfig(maxValue);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-gray-500">
            <p>No data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5" />
            {title}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {totalCount} total
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <YAxis
              type="number"
              domain={[0, yAxisMax]}
              ticks={yAxisTicks}
              tick={{ fontSize: 12, fill: "#64748b" }}
              tickLine={{ stroke: "#cbd5e1" }}
              axisLine={{ stroke: "#cbd5e1" }}
            />
            <XAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 12, fill: "#374151" }}
              tickLine={{ stroke: "#cbd5e1" }}
              axisLine={{ stroke: "#cbd5e1" }}
              width={95}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={40}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
