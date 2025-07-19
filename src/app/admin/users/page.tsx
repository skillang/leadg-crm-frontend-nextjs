"use client";

import React from "react";
import { useGetUserLeadStatsQuery } from "@/redux/slices/leadsApi";
import { useAdminAccess } from "@/hooks/useAdminAccess";
// import { useNotifications } from "@/components/common/NotificationSystem";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  RefreshCw,
  Mail,
  UserCheck,
  Crown,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

// RTK Query error type interface
interface RTKQueryError {
  data?: {
    detail?: string;
    message?: string;
  };
  message?: string;
  status?: number;
}

const AdminUsersPage = () => {
  // Admin access check - must be called before any conditionals
  const { hasAccess, AccessDeniedComponent } = useAdminAccess({
    title: "Admin Access Required",
    description: "You need admin privileges to view user statistics.",
  });

  // const { showError } = useNotifications();

  // Fetch user lead statistics
  const {
    data: userStatsData,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useGetUserLeadStatsQuery();

  // If no admin access, show access denied component
  if (!hasAccess) {
    return AccessDeniedComponent;
  }

  // Handle loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-lg">Loading user statistics...</span>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    const rtkError = error as RTKQueryError;
    const errorMessage =
      rtkError.data?.detail ||
      rtkError.data?.message ||
      rtkError.message ||
      "Failed to load user statistics";

    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Error loading user statistics</span>
            </div>
            <p className="text-red-600 text-sm mt-1">{errorMessage}</p>
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="mt-3 text-red-600 border-red-300 hover:bg-red-100"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle case where no data is returned
  if (!userStatsData) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No user statistics available</p>
              <Button
                variant="outline"
                onClick={() => refetch()}
                className="mt-3"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { user_stats, summary } = userStatsData;

  // Sort users: admins first, then by assigned leads count (descending), then by name
  const sortedUsers = [...user_stats].sort((a, b) => {
    // Admins first
    if (a.role === "admin" && b.role !== "admin") return -1;
    if (a.role !== "admin" && b.role === "admin") return 1;

    // Then by assigned leads count (descending)
    if (a.assigned_leads_count !== b.assigned_leads_count) {
      return b.assigned_leads_count - a.assigned_leads_count;
    }

    // Finally by name (ascending)
    return a.name.localeCompare(b.name);
  });

  const getRoleBadgeVariant = (role: string) => {
    return role === "admin" ? "default" : "secondary";
  };

  const getRoleIcon = (role: string) => {
    return role === "admin" ? Crown : UserCheck;
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8 text-blue-600" />
            User Management
          </h1>
          <p className="text-muted-foreground mt-1">
            View user statistics and lead assignments
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          disabled={isFetching}
          className="flex items-center gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total_users}</div>
            <p className="text-xs text-muted-foreground">Active team members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total_leads}</div>
            <p className="text-xs text-muted-foreground">All leads in system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Assigned Leads
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summary.assigned_leads}
            </div>
            <p className="text-xs text-muted-foreground">
              {((summary.assigned_leads / summary.total_leads) * 100).toFixed(
                1
              )}
              % of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unassigned</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {summary.unassigned_leads}
            </div>
            <p className="text-xs text-muted-foreground">Need assignment</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Lead Statistics
          </CardTitle>
          <CardDescription>
            Overview of all users and their assigned lead counts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Assigned Leads</TableHead>
                <TableHead className="text-right">Workload %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedUsers.map((user) => {
                const RoleIcon = getRoleIcon(user.role);
                const workloadPercentage =
                  summary.total_leads > 0
                    ? (
                        (user.assigned_leads_count / summary.total_leads) *
                        100
                      ).toFixed(1)
                    : "0.0";

                return (
                  <TableRow key={user.user_id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                          <RoleIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">
                            ID: {user.user_id.slice(-8)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {user.role === "admin" ? "Admin" : "User"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="font-mono">
                        {user.assigned_leads_count}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-medium">
                        {workloadPercentage}%
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {sortedUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No users found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Info */}
      {userStatsData.performance && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-blue-700">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">
                Performance: {userStatsData.performance.replace(/_/g, " ")}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminUsersPage;
