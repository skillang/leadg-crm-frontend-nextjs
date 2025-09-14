// src/services/statusManagement/statusManagementService.ts

import { Status } from "@/models/types/status";
import { ApiError } from "@/models/types/apiError";

// Helper function to extract error messages
export const extractErrorMessage = (
  error: unknown,
  defaultMessage: string
): string => {
  const apiError = error as ApiError;

  if (apiError?.data?.detail) {
    return apiError.data.detail;
  } else if (apiError?.data?.message) {
    return apiError.data.message;
  } else if (apiError?.message) {
    return apiError.message;
  } else if (typeof error === "string") {
    return error;
  }

  return defaultMessage;
};

// Data filtering utilities
export const filterStatusesByTab = (
  statuses: Status[],
  activeTab: string
): Status[] => {
  switch (activeTab) {
    case "active":
      return statuses.filter((status) => status.is_active);
    case "inactive":
      return statuses.filter((status) => !status.is_active);
    case "all":
    default:
      return statuses;
  }
};

// Calculate summary statistics
export const calculateStatusStats = (statusesData: any) => {
  return {
    total: statusesData?.total || 0,
    active: statusesData?.active_count || 0,
    inactive: statusesData?.inactive_count || 0,
  };
};

// Service function for status deletion with lead count check
export const deleteStatusService = async (
  status: Status,
  force: boolean = false,
  {
    deleteMutation,
    showSuccess,
    showError,
    showConfirm,
    onSuccess,
    onError,
  }: {
    deleteMutation: any;
    showSuccess: (message: string) => void;
    showError: (message: string) => void;
    showConfirm: (options: any) => void;
    onSuccess?: () => void;
    onError?: () => void;
  }
): Promise<void> => {
  // If status has leads and force is not true, show force delete option
  if (status.lead_count > 0 && !force) {
    showConfirm({
      title: `Status "${status.display_name}" has ${status.lead_count} leads`,
      description: `This status cannot be deleted because it has ${status.lead_count} associated leads. You can either:\n\n1. Reassign all leads to another status first, or\n2. Force delete (leads will be moved to default status)`,
      confirmText: "Force Delete",
      cancelText: "Cancel",
      variant: "destructive",
      onConfirm: async () => {
        // Recursively call with force = true
        await deleteStatusService(status, true, {
          deleteMutation,
          showSuccess,
          showError,
          showConfirm,
          onSuccess,
          onError,
        });
      },
    });
    return;
  }

  // Show normal delete confirmation
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
        const result = await deleteMutation({
          statusId: status.id,
          force,
        }).unwrap();

        showSuccess(result.message || "Status deleted successfully");
        onSuccess?.();
      } catch (error: unknown) {
        console.error("Delete error:", error);
        const errorMessage = extractErrorMessage(
          error,
          "Failed to delete status"
        );
        showError(errorMessage);
        onError?.();
      }
    },
  });
};

// Service function for status activation/deactivation
export const toggleStatusService = async (
  status: Status,
  {
    activateMutation,
    deactivateMutation,
    showSuccess,
    showError,
    onSuccess,
    onError,
  }: {
    activateMutation: any;
    deactivateMutation: any;
    showSuccess: (message: string) => void;
    showError: (message: string) => void;
    onSuccess?: () => void;
    onError?: () => void;
  }
): Promise<void> => {
  try {
    if (status.is_active) {
      await deactivateMutation(status.id).unwrap();
      showSuccess(`Status "${status.display_name}" deactivated`);
    } else {
      await activateMutation(status.id).unwrap();
      showSuccess(`Status "${status.display_name}" activated`);
    }
    onSuccess?.();
  } catch (error: unknown) {
    const errorMessage = extractErrorMessage(error, "Failed to toggle status");
    showError(errorMessage);
    onError?.();
  }
};

// Service function for status reordering
export const moveStatusService = async (
  status: Status,
  direction: "up" | "down",
  statuses: Status[],
  {
    reorderMutation,
    showSuccess,
    showError,
    onSuccess,
    onError,
  }: {
    reorderMutation: any;
    showSuccess: (message: string) => void;
    showError: (message: string) => void;
    onSuccess?: () => void;
    onError?: () => void;
  }
): Promise<void> => {
  const currentIndex = statuses.findIndex((s) => s.id === status.id);

  // Check if move is possible
  if (
    (direction === "up" && currentIndex === 0) ||
    (direction === "down" && currentIndex === statuses.length - 1)
  ) {
    return; // Can't move further
  }

  const newOrder = [...statuses];
  const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

  // Swap positions
  [newOrder[currentIndex], newOrder[swapIndex]] = [
    newOrder[swapIndex],
    newOrder[currentIndex],
  ];

  // Update sort_order values
  newOrder.forEach((status, index) => {
    status.sort_order = index + 1;
  });

  try {
    const reorderData = newOrder.map((status) => ({
      id: status.id,
      sort_order: status.sort_order,
    }));

    await reorderMutation(reorderData).unwrap();
    showSuccess(`Status "${status.display_name}" moved ${direction}`);
    onSuccess?.();
  } catch (error: unknown) {
    const errorMessage = extractErrorMessage(error, "Failed to reorder status");
    showError(errorMessage);
    onError?.();
  }
};

// Service function for setting up default statuses
export const setupDefaultStatusesService = async ({
  setupDefaultsMutation,
  showSuccess,
  showError,
  showConfirm,
  onSuccess,
  onError,
}: {
  setupDefaultsMutation: any;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showConfirm: (options: any) => void;
  onSuccess?: () => void;
  onError?: () => void;
}): Promise<void> => {
  showConfirm({
    title: "Setup Default Statuses",
    description:
      "This will create default statuses for your CRM. This will add standard lead workflow statuses. Continue?",
    confirmText: "Setup Default Statuses",
    cancelText: "Cancel",
    variant: "default",
    onConfirm: async () => {
      try {
        const result = await setupDefaultsMutation().unwrap();
        showSuccess(result.message || "Default statuses created successfully!");
        onSuccess?.();
      } catch (error: unknown) {
        const errorMessage = extractErrorMessage(
          error,
          "Failed to setup default statuses"
        );
        showError(errorMessage);
        onError?.();
      }
    },
  });
};
