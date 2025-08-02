// src/app/profile/page.tsx

"use client";

import React from "react";
import { useAppSelector } from "@/redux/hooks";
import { useGetCurrentUserQuery } from "@/redux/slices/authApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Building2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { UserWithDetails } from "@/models/types/lead";

export default function ProfilePage() {
  // Get current user from Redux state
  const currentUser = useAppSelector((state) => state.auth.user);

  // Fetch fresh user data
  const {
    data: freshUserData,
    isLoading,
    error,
    refetch,
  } = useGetCurrentUserQuery();

  // Get computed permissions
  const {
    canCreateSingleLead,
    canCreateBulkLeads,
    // canCreateAnyLead,
    // hasLeadPermissions,
    permissionLevel,
    isAdmin,
  } = useUserPermissions();

  const displayUser = (freshUserData || currentUser) as UserWithDetails;

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Not available";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPermissionBadge = (hasPermission: boolean, label: string) => {
    return (
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <span className="text-sm font-medium">{label}</span>
        <Badge variant={hasPermission ? "default" : "secondary"}>
          {hasPermission ? (
            <>
              <CheckCircle className="w-3 h-3 mr-1" />
              Enabled
            </>
          ) : (
            <>
              <XCircle className="w-3 h-3 mr-1" />
              Disabled
            </>
          )}
        </Badge>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          Loading profile...
        </div>
      </div>
    );
  }

  if (error || !displayUser) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600 mb-4">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Error loading profile</span>
            </div>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-gray-600 mt-1">
            Manage your account information and permissions
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  First Name
                </label>
                <p className="text-lg">{displayUser.first_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Last Name
                </label>
                <p className="text-lg">{displayUser.last_name}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Email:</span>
                <span>{displayUser.email}</span>
              </div>

              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Username:</span>
                <span>{displayUser.username}</span>
              </div>

              {displayUser.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Phone:</span>
                  <span>{displayUser.phone}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Role:</span>
                <Badge
                  variant={
                    displayUser.role === "admin" ? "default" : "secondary"
                  }
                >
                  {displayUser.role}
                </Badge>
              </div>

              {displayUser.departments && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Departments:</span>
                  <div className="flex gap-1">
                    {/* {displayUser.departments.map((dept: string) => (
                      <Badge key={dept} variant="outline" className="text-xs">
                        {dept}
                      </Badge>
                    ))} */}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Account Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Account Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Account Status</span>
              <Badge
                variant={displayUser.is_active ? "default" : "destructive"}
              >
                {displayUser.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>

            <Separator />

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Account Created
                </label>
                <p className="text-sm">{formatDate(displayUser.created_at)}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">
                  Last Login
                </label>
                <p className="text-sm">{formatDate(displayUser.last_login)}</p>
              </div>

              {displayUser.login_count && (
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Total Logins
                  </label>
                  <p className="text-sm">{displayUser.login_count}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lead Creation Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Lead Creation Permissions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium">Permission Level</span>
              <Badge variant="outline">
                Level {permissionLevel}
                {isAdmin && " (Admin)"}
              </Badge>
            </div>

            <div className="space-y-2">
              {getPermissionBadge(canCreateSingleLead, "Single Lead Creation")}
              {getPermissionBadge(canCreateBulkLeads, "Bulk Lead Creation")}
              {getPermissionBadge(isAdmin, "Admin Access")}
            </div>

            {/* Show permission details if available */}
            {displayUser.permissions && (
              <>
                <Separator />
                <div className="space-y-2 text-xs text-gray-600">
                  {displayUser.permissions.granted_by && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      <span>
                        Granted by {displayUser.permissions.granted_by} on{" "}
                        {formatDate(displayUser.permissions.granted_at)}
                      </span>
                    </div>
                  )}
                  {displayUser.permissions.last_modified_by && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      <span>
                        Last modified by{" "}
                        {displayUser.permissions.last_modified_by} on{" "}
                        {formatDate(displayUser.permissions.last_modified_at)}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Raw Data Debug (Development Only) */}
        {/* {process.env.NODE_ENV === "development" && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm">Debug: Raw User Data</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-64">
                {JSON.stringify(displayUser, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )} */}
      </div>
    </div>
  );
}
