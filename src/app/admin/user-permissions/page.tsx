// src/app/admin/user-permissions/page.tsx

"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  Search,
  RefreshCw,
  X,
  Shield,
  AlertCircle,
  CheckCircle,
  User,
  Settings,
  BarChart3,
} from "lucide-react";

// Import our custom hook
import { usePermissions } from "@/hooks/usePermissions";
import { SingleUserPermissionModal } from "@/components/admin/UserPermissionsModal";

// Default export as required by Next.js App Router
export default function UserPermissionsPage() {
  const {
    users,
    summary,
    loading,
    // updateLoading,
    error,
    updateError,
    isAdmin,
    fetchUsersPermissions,
    updateSearchTerm,
    updateDepartmentFilter,
    updatePermissionLevelFilter,
    resetFilters,
    filters,
    // clearErrors,
  } = usePermissions();

  // Get unique departments for filter
  const departments = Array.from(
    new Set(users.flatMap((user) => user.departments))
  );

  // Initialize data on component mount
  React.useEffect(() => {
    if (isAdmin) {
      fetchUsersPermissions();
    }
  }, [isAdmin, fetchUsersPermissions]);

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Access Denied: You need admin privileges to access this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            User Permissions
          </h1>
          <p className="text-gray-600 mt-1">
            Manage lead creation permissions for all users in your organization
          </p>
        </div>
        <Button onClick={() => fetchUsersPermissions()} disabled={loading}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Error Display */}
      {(error || updateError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || updateError}</AlertDescription>
        </Alert>
      )}

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Users
                  </p>
                  <p className="text-3xl font-bold text-blue-600">
                    {summary.total_users}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-xs text-gray-500 mt-2">All registered users</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    With Permissions
                  </p>
                  <p className="text-3xl font-bold text-green-600">
                    {summary.users_with_any_permission}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {summary.percentages.with_any_permission.toFixed(1)}% of total
                users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Single Lead
                  </p>
                  <p className="text-3xl font-bold text-orange-600">
                    {summary.users_with_single_permission}
                  </p>
                </div>
                <User className="h-8 w-8 text-orange-600" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Can create individual leads
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Bulk Lead</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {summary.users_with_bulk_permission}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Can create bulk imports
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search">Search Users</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name or email..."
                  value={filters.search_term}
                  onChange={(e) => updateSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="min-w-[150px]">
              <Label htmlFor="department">Department</Label>
              <Select
                value={filters.department || "all"}
                onValueChange={(value) =>
                  updateDepartmentFilter(value === "all" ? "" : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[150px]">
              <Label htmlFor="permission-level">Permission Level</Label>
              <Select
                value={filters.permission_level}
                onValueChange={updatePermissionLevelFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="none">No Permissions</SelectItem>
                  <SelectItem value="single">Single Lead Only</SelectItem>
                  <SelectItem value="bulk">Bulk Lead Access</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={resetFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Permission Management ({users.length} users)
          </CardTitle>
          <CardDescription>
            Click the settings icon to manage individual user permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div className="flex items-center justify-center p-8 text-gray-500">
              <User className="h-6 w-6 mr-2" />
              No users found matching your criteria
            </div>
          ) : (
            <ScrollArea className="max-h-[600px]">
              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900">
                          {user.full_name}
                        </h4>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={
                              user.role === "admin" ? "default" : "secondary"
                            }
                          >
                            {user.role}
                          </Badge>
                          {user.departments.map((dept) => (
                            <Badge
                              key={dept}
                              variant="outline"
                              className="text-xs"
                            >
                              {dept}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Permission Status */}
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          {user.permissions.can_create_single_lead && (
                            <Badge
                              variant="outline"
                              className="text-green-600 border-green-300"
                            >
                              Single Lead
                            </Badge>
                          )}
                          {user.permissions.can_create_bulk_leads && (
                            <Badge
                              variant="outline"
                              className="text-purple-600 border-purple-300"
                            >
                              Bulk Lead
                            </Badge>
                          )}
                          {!user.permission_summary.has_any_permission && (
                            <Badge variant="outline" className="text-gray-500">
                              No Permissions
                            </Badge>
                          )}
                        </div>
                        {user.permissions.granted_by && (
                          <p className="text-xs text-gray-500 mt-1">
                            Granted by {user.permissions.granted_by}
                          </p>
                        )}
                      </div>

                      {/* Settings Button */}
                      <SingleUserPermissionModal user={user}>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </SingleUserPermissionModal>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
