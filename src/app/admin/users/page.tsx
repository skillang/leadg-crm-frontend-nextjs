// src/app/admin/users/page.tsx - Fixed with NotificationSystem

"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useGetUserLeadStatsQuery } from "@/redux/slices/leadsApi";
import { useDeleteUserMutation } from "@/redux/slices/authApi";
import { useNotifications } from "@/components/common/NotificationSystem";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Crown,
  UserCheck,
  Mail,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  UserX,
  Settings,
} from "lucide-react";
import StatsCard from "@/components/custom/cards/StatsCard";
import { ApiError } from "@/models/types/apiError";

// Use the correct interface from API (matches leadsApi.ts)
interface UserStats {
  user_id: string;
  name: string;
  email: string;
  role: string;
  assigned_leads_count: number;
}

const AdminUsersPage = () => {
  const router = useRouter();

  // Admin access control (must be called first)
  const {
    hasAccess,
    AccessDeniedComponent,
    user: currentUser,
  } = useAdminAccess({
    title: "Admin Access Required",
    description: "You need admin privileges to view user management.",
  });

  // Notifications - using showConfirm instead of AlertDialog
  const { showError, showWarning, showConfirm } = useNotifications();

  // RTK Query hooks
  const {
    data: userStatsData,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useGetUserLeadStatsQuery();

  // Delete user mutation (using authApi)
  const [deleteUser, { isLoading: isDeletingUser }] = useDeleteUserMutation();

  // Return access denied if not admin
  if (!hasAccess) {
    return AccessDeniedComponent;
  }

  // Handle error state
  if (error) {
    const apiError = error as ApiError;
    const errorMessage =
      apiError?.data?.detail ||
      apiError?.data?.message ||
      apiError?.message ||
      "Failed to load user statistics";

    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200">
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
              <p>No user data available</p>
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

  // Correct sorting with UserStats type
  const sortedUsers = [...user_stats].sort((a: UserStats, b: UserStats) => {
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

  // ✅ FIXED: Using showConfirm instead of AlertDialog
  const handleDeleteUser = (user: UserStats) => {
    // Prevent self-deletion
    if (user.email === currentUser?.email) {
      showWarning("You cannot delete your own account.");
      return;
    }

    // Use showConfirm from notification system
    showConfirm({
      title: "Delete User Account",
      description: `Are you sure you want to delete "${user.name}" (${user.email})? This action cannot be undone. The user will be deactivated and their data will be preserved for audit purposes.`,
      confirmText: "Delete User",
      cancelText: "Cancel",
      variant: "destructive",
      onConfirm: async () => {
        try {
          // Call delete user API using user email
          await deleteUser(user.email).unwrap();

          // Success handling
          showWarning(
            `User "${user.name}" has been successfully deleted`,
            "User Deleted"
          );

          // Refresh user stats
          refetch();
        } catch (error: unknown) {
          console.error("Failed to delete user:", error);

          // Extract error message
          const apiError = error as ApiError;
          const errorMessage =
            apiError?.data?.detail ||
            apiError?.data?.message ||
            apiError?.message ||
            "Failed to delete user. Please try again.";

          showError(errorMessage, "Deletion Failed");
        }
      },
    });
  };

  // Check if user can be deleted with correct type
  const canDeleteUser = (user: UserStats): boolean => {
    // Cannot delete self
    if (user.email === currentUser?.email) return false;

    // Check if this is the last admin
    const adminCount = user_stats.filter(
      (u: UserStats) => u.role === "admin"
    ).length;
    if (user.role === "admin" && adminCount <= 1) return false;

    return true;
  };

  return (
    <div className="container mx-auto  space-y-6">
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
        <StatsCard
          title="Total Users"
          value={summary.total_users}
          icon={<Users className="h-8 w-8 text-blue-500" />}
          isLoading={isLoading}
        />

        <StatsCard
          title="Total Leads"
          value={summary.total_leads}
          icon={<TrendingUp className="h-8 w-8 text-green-500" />}
          isLoading={isLoading}
        />

        <StatsCard
          title="Assigned Leads"
          value={summary.assigned_leads}
          icon={<UserCheck className="h-8 w-8 text-orange-500" />}
          // subtitle={`${Math.round(
          //   (summary.assigned_leads / summary.total_leads) * 100
          // )}% of total`}
          isLoading={isLoading}
        />

        <StatsCard
          title="Unassigned Leads"
          value={summary.unassigned_leads}
          icon={<AlertTriangle className="h-8 w-8 text-red-500" />}
          // subtitle={`${Math.round(
          //   (summary.unassigned_leads / summary.total_leads) * 100
          // )}% of total`}
          isLoading={isLoading}
        />
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Statistics ({sortedUsers.length})
          </CardTitle>
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedUsers.map((user) => {
                const RoleIcon = getRoleIcon(user.role);
                const workloadPercentage =
                  summary.total_leads > 0
                    ? Math.round(
                        (user.assigned_leads_count / summary.total_leads) * 100
                      )
                    : 0;
                const isDeletable = canDeleteUser(user);

                return (
                  <TableRow key={user.user_id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <RoleIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{user.name}</span>
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
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Debug log to check user data structure
                            // console.log("User data:", user);
                            // Navigate using the correct ID field
                            router.push(
                              `/admin/users/${user.user_id}/permissions`
                            );
                          }}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>

                        {isDeletable ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user)}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                            disabled={isDeletingUser}
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            className="text-gray-400 cursor-not-allowed"
                            title={
                              user.email === currentUser?.email
                                ? "Cannot delete your own account"
                                : "Cannot delete the last admin"
                            }
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
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
    </div>
  );
};

export default AdminUsersPage;
