// src/components/emails/EmailStats.tsx
"use client";

import React from "react";
import { useGetEmailStatsQuery } from "@/redux/slices/emailApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Mail, Send, Clock, XCircle, TrendingUp, Loader2 } from "lucide-react";

const EmailStats: React.FC = () => {
  const { data: statsData, isLoading } = useGetEmailStatsQuery();
  const stats = statsData?.stats;

  const pieData = stats
    ? [
        { name: "Sent", value: stats.total_sent, color: "#22c55e" },
        { name: "Pending", value: stats.total_pending, color: "#eab308" },
        { name: "Failed", value: stats.total_failed, color: "#ef4444" },
        { name: "Cancelled", value: stats.total_cancelled, color: "#6b7280" },
      ]
    : [];

  const COLORS = ["#22c55e", "#eab308", "#ef4444", "#6b7280"];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Email Statistics
          </h1>
          <p className="text-muted-foreground">
            Overview of your email campaign performance
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <Send className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.total_sent || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully delivered emails
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats?.total_pending || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Scheduled or queued emails
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats?.total_failed || 0}
            </div>
            <p className="text-xs text-muted-foreground">Failed deliveries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats?.success_rate ? `${stats.success_rate.toFixed(1)}%` : "0%"}
            </div>
            <Progress value={stats?.success_rate || 0} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Email Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent! * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Performance */}
        <Card>
          <CardHeader>
            <CardTitle>This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">
                    Emails Sent This Month
                  </span>
                </div>
                <span className="text-lg font-bold">
                  {stats?.monthly_sent || 0}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Monthly Goal</span>
                  <span>1000</span>
                </div>
                <Progress value={((stats?.monthly_sent || 0) / 1000) * 100} />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stats?.total_sent || 0}
                  </div>
                  <div className="text-xs text-gray-500">Total Delivered</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {stats?.total_failed || 0}
                  </div>
                  <div className="text-xs text-gray-500">Total Failed</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Delivery Rate</span>
                <span className="font-medium">
                  {stats?.success_rate
                    ? `${stats.success_rate.toFixed(1)}%`
                    : "0%"}
                </span>
              </div>
              <Progress value={stats?.success_rate || 0} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pending Rate</span>
                <span className="font-medium">
                  {stats
                    ? `${(
                        (stats.total_pending /
                          (stats.total_sent +
                            stats.total_pending +
                            stats.total_failed +
                            stats.total_cancelled)) *
                        100
                      ).toFixed(1)}%`
                    : "0%"}
                </span>
              </div>
              <Progress
                value={
                  stats
                    ? (stats.total_pending /
                        (stats.total_sent +
                          stats.total_pending +
                          stats.total_failed +
                          stats.total_cancelled)) *
                      100
                    : 0
                }
                className="[&>div]:bg-yellow-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Failure Rate</span>
                <span className="font-medium">
                  {stats
                    ? `${(
                        (stats.total_failed /
                          (stats.total_sent +
                            stats.total_pending +
                            stats.total_failed +
                            stats.total_cancelled)) *
                        100
                      ).toFixed(1)}%`
                    : "0%"}
                </span>
              </div>
              <Progress
                value={
                  stats
                    ? (stats.total_failed /
                        (stats.total_sent +
                          stats.total_pending +
                          stats.total_failed +
                          stats.total_cancelled)) *
                      100
                    : 0
                }
                className="[&>div]:bg-red-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailStats;
