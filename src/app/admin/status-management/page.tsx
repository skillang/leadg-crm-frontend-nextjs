// src/pages/admin/StatusManagement.tsx

"use client";

import React, { useState, useMemo } from "react";
import {
  useGetStatusesQuery,
  useDeleteStatusMutation,
  useActivateStatusMutation,
  useDeactivateStatusMutation,
  useReorderStatusesMutation,
  useSetupDefaultStatusesMutation,
} from "@/redux/slices/statusesApi";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Settings, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useNotifications } from "@/components/common/NotificationSystem";
import StatusForm from "@/components/admin/StatusForm";
import StatusCard from "@/components/admin/StausCard";
import { Status } from "@/models/types/status";

// Define API error interface for better type safety
interface ApiError {
  data?: {
    detail?: string;
    message?: string;
  };
  message?: string;
  status?: number;
}

const StatusManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingStatus, setEditingStatus] = useState<Status | null>(null);

  // Use existing notification system
  const { showSuccess, showError, showConfirm } = useNotifications();

  // API Queries
  const {
    data: statusesData,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetStatusesQuery({
    include_lead_count: true,
    active_only: false,
  });

  // Mutations - removed unused isDeleting
  const [deleteStatus] = useDeleteStatusMutation();
  const [activateStatus, { isLoading: isActivating }] =
    useActivateStatusMutation();
  const [deactivateStatus, { isLoading: isDeactivating }] =
    useDeactivateStatusMutation();
  const [reorderStatuses, { isLoading: isReordering }] =
    useReorderStatusesMutation();
  const [setupDefaults, { isLoading: isSettingUp }] =
    useSetupDefaultStatusesMutation();

  // Use useMemo to prevent unnecessary re-renders in useCallback dependencies
  const statuses = useMemo(
    () => statusesData?.statuses || [],
    [statusesData?.statuses]
  );

  const stats = {
    total: statusesData?.total || 0,
    active: statusesData?.active_count || 0,
    inactive: statusesData?.inactive_count || 0,
  };

  const filteredStatuses = statuses.filter((status) => {
    if (activeTab === "active") return status.is_active;
    if (activeTab === "inactive") return !status.is_active;
    return true; // all
  });

  // Handle status deletion with useCallback to prevent re-renders
  const handleDeleteStatus = React.useCallback(
    (status: Status, force = false) => {
      // Check if status has leads and show appropriate dialog
      if (status.lead_count > 0 && !force) {
        showConfirm({
          title: `Status "${status.display_name}" has ${status.lead_count} leads`,
          description: `This status cannot be deleted because it has ${status.lead_count} associated leads. You can either:\n\n1. Deactivate it (recommended) - Status will be hidden but data preserved\n2. Force delete - Permanently delete status and reassign leads to default status`,
          confirmText: "Force Delete",
          cancelText: "Deactivate Instead",
          variant: "destructive",
          onConfirm: async () => {
            // Force delete
            try {
              const result = await deleteStatus({
                statusId: status.id,
                force: true,
              }).unwrap();
              showSuccess(
                result.message || "Status force deleted successfully"
              );
            } catch (error: unknown) {
              const apiError = error as ApiError;
              showError(
                apiError?.data?.detail || "Failed to force delete status"
              );
            }
          },
          onCancel: async () => {
            // Deactivate instead
            try {
              await deactivateStatus(status.id).unwrap();
              showSuccess(
                `Status "${status.display_name}" deactivated (data preserved)`
              );
            } catch (error: unknown) {
              const apiError = error as ApiError;
              showError(
                apiError?.data?.detail || "Failed to deactivate status"
              );
            }
          },
        });
      } else {
        // No leads or already forcing - proceed with normal delete
        const title = force
          ? `Force Delete Status "${status.display_name}"`
          : `Delete Status "${status.display_name}"`;

        const description = force
          ? "This will permanently delete the status and reassign associated leads to the default status. This action cannot be undone."
          : "Are you sure you want to delete this status? This action cannot be undone.";

        showConfirm({
          title,
          description,
          confirmText: force ? "Force Delete" : "Delete",
          variant: "destructive",
          onConfirm: async () => {
            try {
              const result = await deleteStatus({
                statusId: status.id,
                force,
              }).unwrap();

              showSuccess(result.message || "Status deleted successfully");
            } catch (error: unknown) {
              console.error("Delete error:", error);
              const apiError = error as ApiError;
              showError(apiError?.data?.detail || "Failed to delete status");
            }
          },
        });
      }
    },
    [deleteStatus, deactivateStatus, showConfirm, showSuccess, showError]
  );

  // Handle status activation/deactivation with useCallback
  const handleToggleStatus = React.useCallback(
    async (status: Status) => {
      try {
        if (status.is_active) {
          await deactivateStatus(status.id).unwrap();
          showSuccess(`Status "${status.display_name}" deactivated`);
        } else {
          await activateStatus(status.id).unwrap();
          showSuccess(`Status "${status.display_name}" activated`);
        }
      } catch (error: unknown) {
        const apiError = error as ApiError;
        showError(apiError?.data?.detail || "Failed to toggle status");
      }
    },
    [activateStatus, deactivateStatus, showSuccess, showError]
  );

  // Handle status reordering with useCallback
  const handleMoveStatus = React.useCallback(
    async (status: Status, direction: "up" | "down") => {
      const currentIndex = statuses.findIndex((s) => s.id === status.id);
      if (
        (direction === "up" && currentIndex === 0) ||
        (direction === "down" && currentIndex === statuses.length - 1)
      ) {
        return;
      }

      const newOrder = [...statuses];
      const swapIndex =
        direction === "up" ? currentIndex - 1 : currentIndex + 1;

      // Swap positions
      [newOrder[currentIndex], newOrder[swapIndex]] = [
        newOrder[swapIndex],
        newOrder[currentIndex],
      ];

      // Create reorder data
      const reorderData = newOrder.map((s, index) => ({
        id: s.id,
        sort_order: index + 1,
      }));

      try {
        await reorderStatuses(reorderData).unwrap();
        showSuccess("Status order updated");
      } catch (error: unknown) {
        const apiError = error as ApiError;
        showError(apiError?.data?.detail || "Failed to reorder statuses");
      }
    },
    [statuses, reorderStatuses, showSuccess, showError]
  );

  // Handle setup default statuses with useCallback
  const handleSetupDefaults = React.useCallback(async () => {
    try {
      await setupDefaults().unwrap();
      showSuccess("Default statuses created successfully");
      refetch();
    } catch (error: unknown) {
      const apiError = error as ApiError;
      showError(apiError?.data?.detail || "Failed to setup default statuses");
    }
  }, [setupDefaults, showSuccess, showError, refetch]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Error Loading Statuses
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {(error as ApiError)?.data?.detail || "Something went wrong"}
              </p>
              <Button onClick={() => refetch()} variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Lead Status Management
          </h1>
          <p className="text-gray-600 mt-2">
            Manage lead statuses for your CRM workflow
          </p>
        </div>
        <div className="flex space-x-3">
          {stats.total === 0 && (
            <Button
              onClick={handleSetupDefaults}
              disabled={isSettingUp}
              variant="outline"
            >
              <Settings className="w-4 h-4 mr-2" />
              Setup Defaults
            </Button>
          )}
          <Button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Status
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Settings className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Statuses
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Active Statuses
                </p>
                <p className="text-2xl font-bold text-green-700">
                  {stats.active}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <EyeOff className="h-6 w-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Inactive Statuses
                </p>
                <p className="text-2xl font-bold text-gray-700">
                  {stats.inactive}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Management Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Status List</CardTitle>
          <CardDescription>
            Manage your lead statuses. Drag and drop to reorder.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
              <TabsTrigger value="active">Active ({stats.active})</TabsTrigger>
              <TabsTrigger value="inactive">
                Inactive ({stats.inactive})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {filteredStatuses.length === 0 ? (
                <div className="text-center py-12">
                  <Settings className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No statuses found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {activeTab === "all"
                      ? "Get started by creating your first status"
                      : `No ${activeTab} statuses available`}
                  </p>
                  {activeTab === "all" && (
                    <Button onClick={() => setShowForm(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Status
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredStatuses.map((status, index) => (
                    <StatusCard
                      key={status.id}
                      status={status}
                      isFirst={index === 0}
                      isLast={index === filteredStatuses.length - 1}
                      onEdit={() => {
                        setEditingStatus(status);
                        setShowForm(true);
                      }}
                      onDelete={(status) => handleDeleteStatus(status)}
                      onToggle={() => handleToggleStatus(status)}
                      onMoveUp={() => handleMoveStatus(status, "up")}
                      onMoveDown={() => handleMoveStatus(status, "down")}
                      isProcessing={
                        isActivating || isDeactivating || isReordering
                      }
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Status Form Modal */}
      {showForm && (
        <StatusForm
          status={editingStatus}
          onClose={() => {
            setShowForm(false);
            setEditingStatus(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditingStatus(null);
            showSuccess(
              editingStatus
                ? "Status updated successfully"
                : "Status created successfully"
            );
          }}
        />
      )}
    </div>
  );
};

export default StatusManagement;
