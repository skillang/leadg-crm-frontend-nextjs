// src/app/admin/users/page.tsx - Fixed with correct types

"use client";

import React, { useState } from "react";
import { useGetUserLeadStatsQuery } from "@/redux/slices/leadsApi"; // Import from leadsApi
import { useDeleteUserMutation } from "@/redux/slices/authApi"; // Import from authApi
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Users,
  Crown,
  UserCheck,
  Mail,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  Trash2,
  UserX,
} from "lucide-react";

// 🔥 FIXED: Use the correct interface from API (matches leadsApi.ts)
interface UserStats {
  user_id: string;
  name: string;
  email: string;
  role: string; // 🔥 This is string, not union type
  assigned_leads_count: number;
}

// 🔥 FIXED: Updated interface to match API response
interface UserStatsData {
  success: boolean;
  user_stats: UserStats[]; // 🔥 Use UserStats, not UserStat
  summary: {
    total_users: number;
    total_leads: number;
    assigned_leads: number;
    unassigned_leads: number;
  };
  performance?: string;
}

const AdminUsersPage = () => {
  // 🔥 Admin access control (must be called first)
  const {
    hasAccess,
    AccessDeniedComponent,
    user: currentUser,
  } = useAdminAccess({
    title: "Admin Access Required",
    description: "You need admin privileges to view user management.",
  });

  // Notifications
  const { showSuccess, showError, showWarning } = useNotifications();

  // State for delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserStats | null>(null); // 🔥 FIXED: UserStats

  // RTK Query hooks
  const {
    data: userStatsData,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useGetUserLeadStatsQuery();

  // 🔥 NEW: Delete user mutation (using authApi)
  const [deleteUser, { isLoading: isDeletingUser }] = useDeleteUserMutation();

  // Return access denied if not admin
  if (!hasAccess) {
    return AccessDeniedComponent;
  }

  // Handle loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-blue-600">
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span className="font-medium">Loading user statistics...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle error state
  if (error) {
    const errorMessage =
      (error as any)?.data?.detail ||
      (error as any)?.data?.message ||
      (error as any)?.message ||
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

  // 🔥 FIXED: Correct sorting with UserStats type
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

  // 🔥 FIXED: Handle delete user initiation with correct type
  const handleDeleteUser = (user: UserStats) => {
    // Prevent self-deletion
    if (user.email === currentUser?.email) {
      showWarning("You cannot delete your own account.");
      return;
    }

    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  // 🔥 NEW: Confirm delete user
  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      // Call delete user API using user ID or email
      const result = await deleteUser(userToDelete.email).unwrap();

      // Success handling
      showWarning(`User Deleted`, "User Deleted");

      // Close dialog and reset state
      setDeleteDialogOpen(false);
      setUserToDelete(null);

      // Refresh user stats
      refetch();
    } catch (error: any) {
      console.error("Failed to delete user:", error);

      // Extract error message
      const errorMessage =
        error?.data?.detail ||
        error?.data?.message ||
        error?.message ||
        "Failed to delete user. Please try again.";

      showError(errorMessage, "Deletion Failed");

      // Close dialog
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  // 🔥 NEW: Cancel delete
  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  // 🔥 FIXED: Check if user can be deleted with correct type
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
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Users
                </p>
                <p className="text-2xl font-bold">{summary.total_users}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Leads
                </p>
                <p className="text-2xl font-bold">{summary.total_leads}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Assigned Leads
                </p>
                <p className="text-2xl font-bold">{summary.assigned_leads}</p>
              </div>
              <UserCheck className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Unassigned Leads
                </p>
                <p className="text-2xl font-bold">{summary.unassigned_leads}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
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

      {/* 🔥 NEW: Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Delete User Account
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p className="text-muted-foreground text-sm">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold">{userToDelete?.name}</span> (
                  {userToDelete?.email})?
                </p>
                <p className="text-sm text-gray-600">
                  This action cannot be undone. The user will be deactivated and
                  their data will be preserved for audit purposes.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteUser}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeletingUser}
            >
              {isDeletingUser ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete User
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUsersPage;
