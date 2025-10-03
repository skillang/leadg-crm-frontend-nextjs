// src/app/admin/users/[userId]/permissions/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Shield,
  User,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Mail,
  Building2,
  Users,
} from "lucide-react";
import {
  useForgotPasswordMutation,
  useAdminResetUserPasswordMutation,
} from "@/redux/slices/passwordResetApi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { KeyRound, MailX, Lock, ShieldCheck } from "lucide-react";
import {
  useGetUsersPermissionsQuery,
  useUpdateUserPermissionsMutation,
} from "@/redux/slices/permissionApi";
import {
  // UserWithPermissions,
  PermissionUpdateRequest,
} from "@/models/types/permissions";
import { useAuth } from "@/redux/hooks/useAuth";
import { useNotifications } from "@/components/common/NotificationSystem";
import { ApiError } from "@/models/types/apiError";

export default function UserPermissionsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  // Auth hook
  const { isAuthenticated, token, isAdmin } = useAuth();

  // Notifications
  const { showConfirm, showError, showSuccess } = useNotifications();

  // RTK Query hooks - MOVED TO TOP LEVEL
  const {
    data: usersData,
    isLoading,
    error: fetchError,
    refetch,
  } = useGetUsersPermissionsQuery({});

  const [
    updateUserPermissions,
    { isLoading: updateLoading, error: updateError },
  ] = useUpdateUserPermissionsMutation();

  // Password mutation hooks - MOVED TO TOP LEVEL
  const [forgotPassword] = useForgotPasswordMutation();
  const [adminResetPassword] = useAdminResetUserPasswordMutation();

  // Find the user by _id
  const user = usersData?.users?.find((u) => u._id === userId) || null;

  // Local state for permission changes - SIMPLIFIED TO ONLY TWO PERMISSIONS
  const [canCreateSingle, setCanCreateSingle] = useState(false);
  const [canCreateBulk, setCanCreateBulk] = useState(false);
  const [reason, setReason] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [tempPasswordLoading, setTempPasswordLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState("");
  const [showTempPasswordDialog, setShowTempPasswordDialog] = useState(false);

  // Initialize permissions when user is found
  useEffect(() => {
    if (user) {
      const initialSingle = user.permissions.can_create_single_lead;
      const initialBulk = user.permissions.can_create_bulk_leads;

      setCanCreateSingle(initialSingle);
      setCanCreateBulk(initialBulk);
      setHasChanges(false);
    }
  }, [user]);

  // Helper to extract error message - IMPROVED WITH ApiError TYPE
  const getErrorMessage = (error: unknown): string => {
    if (!error) return "";

    // Check if it's our ApiError type
    const apiError = error as ApiError;

    if (apiError.data) {
      return apiError.data.detail || apiError.data.message || "";
    }

    if (apiError.message) {
      return apiError.message;
    }

    if (apiError.status) {
      return `API Error: ${apiError.status}`;
    }

    if (typeof error === "string") {
      return error;
    }

    return "An unknown error occurred";
  };

  // Password reset handlers
  const handleResetPasswordEmail = async () => {
    try {
      setResetPasswordLoading(true);

      const result = await forgotPassword({
        email: user!.email,
      }).unwrap();

      if (result.success) {
        showSuccess(
          `Password reset email sent to ${user!.email}`,
          "Reset Email Sent"
        );
      }
    } catch (error) {
      console.error("Reset password error:", error);
      const errorMessage = getErrorMessage(error);
      showError(
        errorMessage || "Failed to send reset email. Please try again.",
        "Reset Failed"
      );
    } finally {
      setResetPasswordLoading(false);
    }
  };

  const handleSetTempPassword = async () => {
    if (!tempPassword.trim()) {
      showError("Please enter a temporary password", "Validation Error");
      return;
    }

    try {
      setTempPasswordLoading(true);

      const result = await adminResetPassword({
        user_email: user!.email,
        temporary_password: tempPassword,
        reset_method: "admin_temporary",
        force_change_on_login: true,
      }).unwrap();

      if (result.success) {
        showSuccess(
          `Temporary password set for ${
            user!.email
          }. User must change it on next login.`,
          "Temporary Password Set"
        );
        setTempPassword("");
        setShowTempPasswordDialog(false);
      }
    } catch (error) {
      console.error("Set temp password error:", error);
      const errorMessage = getErrorMessage(error);
      showError(
        errorMessage || "Failed to set temporary password. Please try again.",
        "Reset Failed"
      );
    } finally {
      setTempPasswordLoading(false);
    }
  };

  // Check authentication
  if (!isAuthenticated || !token) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Authentication required. Please log in to continue.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Check admin access
  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Admin access required. You don&apos;t have permission to manage user
            permissions.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Handle permission toggle
  const handleSingleLeadToggle = (checked: boolean) => {
    setCanCreateSingle(checked);
    setHasChanges(true);
  };

  const handleBulkLeadToggle = (checked: boolean) => {
    setCanCreateBulk(checked);
    setHasChanges(true);
  };

  // Handle save
  const handleSave = async () => {
    if (!user) return;

    const updateRequest: PermissionUpdateRequest = {
      user_email: user.email,
      can_create_single_lead: canCreateSingle,
      can_create_bulk_leads: canCreateBulk,
      reason: reason.trim() || undefined,
    };

    try {
      await updateUserPermissions(updateRequest).unwrap();
      setHasChanges(false);
      setReason("");
      refetch();

      // Show success message
      showSuccess(
        `Permissions updated successfully for ${user.full_name}`,
        "Permissions Updated"
      );
    } catch (error) {
      console.error("Failed to update permissions:", error);

      // Extract error message
      const errorMessage = getErrorMessage(error);
      showError(
        errorMessage || "Failed to update permissions. Please try again.",
        "Update Failed"
      );
    }
  };

  // Handle back navigation
  const handleBack = () => {
    if (hasChanges) {
      showConfirm({
        title: "Unsaved Changes",
        description:
          "You have unsaved changes. Are you sure you want to leave? All changes will be lost.",
        confirmText: "Leave",
        cancelText: "Stay",
        variant: "destructive",
        onConfirm: () => {
          router.push("/admin/users");
        },
      });
    } else {
      router.push("/admin/users");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          Loading user permissions...
        </div>
        <div className="text-center text-sm text-gray-500 mt-4">
          <p>Looking for user ID: {userId}</p>
        </div>
      </div>
    );
  }

  if (fetchError || !user) {
    const errorMessage = fetchError ? getErrorMessage(fetchError) : null;

    return (
      <div className="container mx-auto p-6 space-y-4">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </Button>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {errorMessage ||
              `User not found. The user ID "${userId}" does not match any existing user.`}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-4">
      {/* Header */}
      <div className="flex justify-between">
        <div className="flex flex-col items-start gap-4">
          <div>
            <Button
              variant="ghost"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-blue-600" />
              Edit User Permissions
            </h1>
            <p className="text-gray-600 mt-1">
              Manage lead creation permissions for this user
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {hasChanges && (
            <Badge
              variant="outline"
              className="text-orange-600 border-orange-300"
            >
              Unsaved Changes
            </Badge>
          )}
          <Button
            onClick={handleSave}
            disabled={!hasChanges || updateLoading}
            className="flex items-center gap-2"
          >
            {updateLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {updateError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{getErrorMessage(updateError)}</AlertDescription>
        </Alert>
      )}

      {/* User Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{user.full_name}</h2>
              <div className="flex items-center gap-2 text-gray-600 mt-1">
                <Mail className="h-4 w-4" />
                {user.email}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant={user.role === "admin" ? "default" : "secondary"}
                >
                  {user.role}
                </Badge>
                {user.departments &&
                  user.departments.map((dept) => (
                    <Badge key={dept} variant="outline" className="text-xs">
                      <Building2 className="h-3 w-3 mr-1" />
                      {dept}
                    </Badge>
                  ))}
              </div>
            </div>
            <div className="text-right text-sm text-gray-500">
              <p>
                Last login:{" "}
                {user.last_login
                  ? new Date(user.last_login).toLocaleDateString()
                  : "Never"}
              </p>
              <p>Created: {new Date(user.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Permissions Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Current Permission Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              {user.permissions.can_create_single_lead ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
              )}
              <span className="text-sm">Can Create Single Leads</span>
            </div>
            <div className="flex items-center gap-2">
              {user.permissions.can_create_bulk_leads ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
              )}
              <span className="text-sm">Can Create Bulk Leads</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-orange-600" />
            Password Management
          </CardTitle>
          <CardDescription>
            Manage password reset options for this user
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Reset via Email */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <MailX className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-sm">Email Reset Link</span>
              </div>
              <p className="text-xs text-gray-600 mb-3">
                Send a password reset link to the user&apos;s email address
              </p>
              <Button
                onClick={handleResetPasswordEmail}
                disabled={resetPasswordLoading}
                variant="outline"
                size="sm"
                className="w-full"
              >
                {resetPasswordLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                Send Reset Email
              </Button>
            </div>

            {/* Set Temporary Password */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-4 w-4 text-orange-600" />
                <span className="font-medium text-sm">Temporary Password</span>
              </div>
              <p className="text-xs text-gray-600 mb-3">
                Set a temporary password that must be changed on login
              </p>

              <Dialog
                open={showTempPasswordDialog}
                onOpenChange={setShowTempPasswordDialog}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Set Temp Password
                  </Button>
                </DialogTrigger>

                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Set Temporary Password</DialogTitle>
                    <DialogDescription>
                      Set a temporary password for {user.email}. The user will
                      be required to change it on their next login.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="tempPassword">Temporary Password</Label>
                      <Input
                        id="tempPassword"
                        type="text"
                        value={tempPassword}
                        onChange={(e) => setTempPassword(e.target.value)}
                        placeholder="Enter temporary password"
                        disabled={tempPasswordLoading}
                      />
                      <p className="text-xs text-gray-500">
                        Minimum 8 characters. User will change on next login.
                      </p>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowTempPasswordDialog(false);
                        setTempPassword("");
                      }}
                      disabled={tempPasswordLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSetTempPassword}
                      disabled={tempPasswordLoading || !tempPassword.trim()}
                    >
                      {tempPasswordLoading ? (
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Lock className="h-4 w-4 mr-2" />
                      )}
                      Set Password
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lead Management Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Lead Management Permissions
          </CardTitle>
          <CardDescription>
            Control what lead creation actions this user can perform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Single Lead Permission */}
          <div className="flex items-start gap-4 p-4 rounded-lg border">
            <Checkbox
              id="can_create_single_lead"
              checked={canCreateSingle}
              onCheckedChange={handleSingleLeadToggle}
              disabled={updateLoading}
            />
            <div className="flex-1">
              <Label
                htmlFor="can_create_single_lead"
                className="text-base font-medium cursor-pointer"
              >
                Create Single Leads
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                Allow user to create individual leads manually through the lead
                creation form
              </p>
            </div>
          </div>

          {/* Bulk Lead Permission */}
          <div className="flex items-start gap-4 p-4 rounded-lg border">
            <Checkbox
              id="can_create_bulk_leads"
              checked={canCreateBulk}
              onCheckedChange={handleBulkLeadToggle}
              disabled={updateLoading}
            />
            <div className="flex-1">
              <Label
                htmlFor="can_create_bulk_leads"
                className="text-base font-medium cursor-pointer"
              >
                Create Bulk Leads
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                Allow user to import multiple leads via CSV file upload
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reason for Changes */}
      {hasChanges && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Reason for Changes</CardTitle>
            <CardDescription>
              Provide a reason for these permission changes (optional)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter reason for permission changes (e.g., 'Promoted to team lead', 'Training completed', etc.)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              disabled={updateLoading}
            />
          </CardContent>
        </Card>
      )}

      {/* Permission History */}
      {user.permissions.granted_at && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Permission History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <strong>Last Updated:</strong>{" "}
                {new Date(user.permissions.granted_at).toLocaleString()}
              </p>
              {user.permissions.granted_by && (
                <p>
                  <strong>Updated By:</strong> {user.permissions.granted_by}
                </p>
              )}
              {/* {user.permissions.reason && (
                <p>
                  <strong>Reason:</strong> {user.permissions.reason}
                </p>
              )} */}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
