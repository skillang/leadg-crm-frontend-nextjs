// src/components/SingleUserPermissionModal.tsx

"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  User,
  Shield,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Clock,
  // Calendar,
  Mail,
  Building2,
} from "lucide-react";

// Import our custom hook and types
import { usePermissions } from "@/hooks/usePermissions";
import {
  UserWithPermissions,
  PermissionUpdateRequest,
} from "@/models/types/permissions";

interface SingleUserPermissionModalProps {
  user: UserWithPermissions;
  children: React.ReactNode;
}

export const SingleUserPermissionModal: React.FC<
  SingleUserPermissionModalProps
> = ({ user, children }) => {
  const { updateLoading, updateError, updateUserPermissions, clearErrors } =
    usePermissions();

  const [isOpen, setIsOpen] = useState(false);
  const [pendingChanges, setPendingChanges] = useState({
    can_create_single_lead: user.permissions.can_create_single_lead,
    can_create_bulk_leads: user.permissions.can_create_bulk_leads,
  });
  const [reason, setReason] = useState("");

  // Check if there are unsaved changes
  const hasChanges =
    pendingChanges.can_create_single_lead !==
      user.permissions.can_create_single_lead ||
    pendingChanges.can_create_bulk_leads !==
      user.permissions.can_create_bulk_leads;

  // Handle permission change
  const handlePermissionChange = (
    permissionType: "single" | "bulk",
    enabled: boolean
  ) => {
    if (permissionType === "single") {
      setPendingChanges((prev) => ({
        ...prev,
        can_create_single_lead: enabled,
      }));
    } else {
      setPendingChanges((prev) => ({
        ...prev,
        can_create_bulk_leads: enabled,
        // If enabling bulk, also enable single
        can_create_single_lead: enabled ? true : prev.can_create_single_lead,
      }));
    }
  };

  // Apply changes
  const handleApplyChanges = async () => {
    const updateRequest: PermissionUpdateRequest = {
      user_email: user.email,
      can_create_single_lead: pendingChanges.can_create_single_lead,
      can_create_bulk_leads: pendingChanges.can_create_bulk_leads,
      reason: reason.trim() || undefined,
    };

    const success = await updateUserPermissions(updateRequest);
    if (success) {
      setIsOpen(false);
      setReason("");
      // Reset pending changes to match new permissions
      setPendingChanges({
        can_create_single_lead: pendingChanges.can_create_single_lead,
        can_create_bulk_leads: pendingChanges.can_create_bulk_leads,
      });
    }
  };

  // Reset changes
  const handleResetChanges = () => {
    setPendingChanges({
      can_create_single_lead: user.permissions.can_create_single_lead,
      can_create_bulk_leads: user.permissions.can_create_bulk_leads,
    });
    setReason("");
  };

  // Handle modal close
  const handleClose = () => {
    setIsOpen(false);
    clearErrors();
    handleResetChanges();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => (open ? setIsOpen(true) : handleClose())}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Manage Permissions: {user.full_name}
          </DialogTitle>
          <DialogDescription>
            Configure lead creation permissions for this user
          </DialogDescription>
        </DialogHeader>

        {/* Error Display */}
        {updateError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{updateError}</AlertDescription>
          </Alert>
        )}

        {/* User Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{user.full_name}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4" />
                {user.email}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant={user.role === "admin" ? "default" : "secondary"}
                >
                  {user.role}
                </Badge>
                {user.departments.map((dept) => (
                  <Badge key={dept} variant="outline" className="text-xs">
                    <Building2 className="h-3 w-3 mr-1" />
                    {dept}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          {/* Current Permissions Status */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Current Permissions
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Single Lead Creation
                  </span>
                  <Badge
                    variant={
                      user.permissions.can_create_single_lead
                        ? "default"
                        : "secondary"
                    }
                  >
                    {user.permissions.can_create_single_lead
                      ? "Enabled"
                      : "Disabled"}
                  </Badge>
                </div>
              </div>

              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Bulk Lead Creation
                  </span>
                  <Badge
                    variant={
                      user.permissions.can_create_bulk_leads
                        ? "default"
                        : "secondary"
                    }
                  >
                    {user.permissions.can_create_bulk_leads
                      ? "Enabled"
                      : "Disabled"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Permission History */}
            {user.permissions.granted_by && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Permission History</span>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  <p>
                    Granted by:{" "}
                    <span className="font-medium">
                      {user.permissions.granted_by}
                    </span>
                  </p>
                  <p>
                    Date:{" "}
                    <span className="font-medium">
                      {formatDate(user.permissions.granted_at)}
                    </span>
                  </p>
                  {user.permissions.last_modified_by &&
                    user.permissions.last_modified_by !==
                      user.permissions.granted_by && (
                      <p>
                        Last modified by:{" "}
                        <span className="font-medium">
                          {user.permissions.last_modified_by}
                        </span>
                      </p>
                    )}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Permission Controls */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Update Permissions
            </h4>

            {/* Single Lead Permission */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label className="text-base font-medium">
                  Single Lead Creation
                </Label>
                <p className="text-sm text-gray-600">
                  Allow user to create individual leads one at a time
                </p>
              </div>
              <Switch
                checked={pendingChanges.can_create_single_lead}
                onCheckedChange={(checked) =>
                  handlePermissionChange("single", checked)
                }
                disabled={updateLoading}
              />
            </div>

            {/* Bulk Lead Permission */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label className="text-base font-medium">
                  Bulk Lead Creation
                </Label>
                <p className="text-sm text-gray-600">
                  Allow user to import multiple leads via CSV or bulk operations
                </p>
                {pendingChanges.can_create_bulk_leads && (
                  <p className="text-xs text-blue-600">
                    Note: This automatically includes single lead creation
                    permission
                  </p>
                )}
              </div>
              <Switch
                checked={pendingChanges.can_create_bulk_leads}
                onCheckedChange={(checked) =>
                  handlePermissionChange("bulk", checked)
                }
                disabled={updateLoading}
              />
            </div>

            {/* Reason Input */}
            {hasChanges && (
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Change (Optional)</Label>
                <Textarea
                  id="reason"
                  placeholder="Enter reason for permission change..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  disabled={updateLoading}
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={updateLoading}
            >
              Cancel
            </Button>

            {hasChanges && (
              <>
                <Button
                  variant="outline"
                  onClick={handleResetChanges}
                  disabled={updateLoading}
                >
                  Reset
                </Button>
                <Button onClick={handleApplyChanges} disabled={updateLoading}>
                  {updateLoading && (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Apply Changes
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
