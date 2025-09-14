// src/services/stageManagement/stageManagementService.ts

import { Stage, CreateStageRequest } from "@/models/types/stage";
import { ApiError } from "@/models/types/apiError";

// Utility function for generating internal names
export const generateInternalName = (displayName: string): string => {
  return displayName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
};

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

// Data processing utilities
export const sortStagesByOrder = (stages: Stage[]): Stage[] => {
  return [...stages].sort((a, b) => a.sort_order - b.sort_order);
};

export const calculateStageStats = (
  activeStagesData: any,
  inactiveStagesData: any
) => {
  return {
    totalActive: activeStagesData?.stages?.length || 0,
    totalInactive: inactiveStagesData?.stages?.length || 0,
    totalStages:
      (activeStagesData?.stages?.length || 0) +
      (inactiveStagesData?.stages?.length || 0),
  };
};

// Service function for creating stages
export const createStageService = async (
  formData: CreateStageRequest,
  {
    createMutation,
    showSuccess,
    showError,
    refetchActive,
    onSuccess,
    onError,
  }: {
    createMutation: any;
    showSuccess: (message: string) => void;
    showError: (message: string) => void;
    refetchActive: () => void;
    onSuccess: () => void;
    onError?: () => void;
  }
): Promise<void> => {
  try {
    await createMutation(formData).unwrap();

    showSuccess(`Stage "${formData.display_name}" created successfully!`);
    refetchActive();
    onSuccess();
  } catch (error: unknown) {
    console.error("Create stage error:", error);
    const errorMessage = extractErrorMessage(error, "Failed to create stage");
    showError(errorMessage);
    onError?.();
  }
};

// Service function for updating stages
export const updateStageService = async (
  editingStage: Stage,
  {
    updateMutation,
    showSuccess,
    showError,
    onSuccess,
    onError,
  }: {
    updateMutation: any;
    showSuccess: (message: string) => void;
    showError: (message: string) => void;
    onSuccess: () => void;
    onError?: () => void;
  }
): Promise<void> => {
  try {
    // Exclude 'name' from updates since it shouldn't be changed
    await updateMutation({
      stageId: editingStage.id,
      stageData: {
        display_name: editingStage.display_name,
        description: editingStage.description,
        color: editingStage.color,
        sort_order: editingStage.sort_order,
        is_active: editingStage.is_active,
        is_default: editingStage.is_default,
      },
    }).unwrap();

    showSuccess(`Stage "${editingStage.display_name}" updated successfully!`);
    onSuccess();
  } catch (error: unknown) {
    console.error("Update stage error:", error);
    const errorMessage = extractErrorMessage(error, "Failed to update stage");
    showError(errorMessage);
    onError?.();
  }
};

// Service function for deleting stages with lead count check
export const deleteStageService = async (
  stage: Stage,
  {
    deleteMutation,
    showSuccess,
    showError,
    showConfirm,
    refetchActive,
    onSuccess,
    onError,
  }: {
    deleteMutation: any;
    showSuccess: (message: string) => void;
    showError: (message: string) => void;
    showConfirm: (options: any) => void;
    refetchActive: () => void;
    onSuccess?: () => void;
    onError?: () => void;
  }
): Promise<void> => {
  const hasLeads = stage.lead_count > 0;

  // Check if stage has leads before showing confirmation
  if (hasLeads) {
    showError(
      `Cannot delete "${stage.display_name}" because it has ${stage.lead_count} associated leads. Please reassign or remove the leads first.`
    );
    return;
  }

  showConfirm({
    title: "Delete Stage",
    description: `Are you sure you want to permanently delete the stage "${stage.display_name}"? This action cannot be undone.`,
    confirmText: "Delete Stage",
    cancelText: "Cancel",
    variant: "destructive",
    onConfirm: async () => {
      try {
        await deleteMutation({ stageId: stage.id, force: hasLeads }).unwrap();
        showSuccess(`Stage "${stage.display_name}" deleted successfully!`);
        refetchActive();
        onSuccess?.();
      } catch (error: unknown) {
        console.error("Delete stage error:", error);
        const errorMessage = extractErrorMessage(
          error,
          "Failed to delete stage"
        );
        showError(errorMessage);
        onError?.();
      }
    },
  });
};

// Service function for activating/deactivating stages
export const toggleStageStatusService = async (
  stageId: string,
  currentlyActive: boolean,
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
    let result;
    if (currentlyActive) {
      // Currently active, so deactivate it
      result = await deactivateMutation(stageId).unwrap();
      showSuccess("Stage deactivated successfully!");
    } else {
      // Currently inactive, so activate it
      result = await activateMutation(stageId).unwrap();
      showSuccess(result.message || "Stage activated successfully!");
    }
    onSuccess?.();
  } catch (error: unknown) {
    console.error("Toggle stage status error:", error);
    const errorMessage = extractErrorMessage(
      error,
      `Failed to ${currentlyActive ? "deactivate" : "activate"} stage`
    );
    showError(errorMessage);
    onError?.();
  }
};

// Service function for reordering stages
export const reorderStageService = async (
  stageId: string,
  direction: "up" | "down",
  stages: Stage[],
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
  const sortedStages = [...stages].sort((a, b) => a.sort_order - b.sort_order);
  const currentIndex = sortedStages.findIndex((s) => s.id === stageId);

  if (currentIndex === -1) return;
  if (direction === "up" && currentIndex === 0) return;
  if (direction === "down" && currentIndex === sortedStages.length - 1) return;

  const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  const reorderData = sortedStages.map((stage, index) => ({
    id: stage.id,
    sort_order:
      index === currentIndex
        ? newIndex + 1
        : index === newIndex
        ? currentIndex + 1
        : index + 1,
  }));

  try {
    await reorderMutation(reorderData).unwrap();
    showSuccess("Stages reordered successfully!");
    onSuccess?.();
  } catch (error: unknown) {
    console.error("Reorder error:", error);
    const errorMessage = extractErrorMessage(error, "Failed to reorder stages");
    showError(errorMessage);
    onError?.();
  }
};

// Service function for setting up default stages
export const setupDefaultStagesService = async ({
  setupDefaultMutation,
  showSuccess,
  showError,
  showConfirm,
  refetchActive,
  onSuccess,
  onError,
}: {
  setupDefaultMutation: any;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showConfirm: (options: any) => void;
  refetchActive: () => void;
  onSuccess?: () => void;
  onError?: () => void;
}): Promise<void> => {
  showConfirm({
    title: "Setup Default Stages",
    description:
      "This will create default stages for your CRM. This will add standard lead workflow stages. Continue?",
    confirmText: "Setup Default Stages",
    cancelText: "Cancel",
    variant: "default",
    onConfirm: async () => {
      try {
        await setupDefaultMutation().unwrap();
        showSuccess("Default stages created successfully!");
        refetchActive();
        onSuccess?.();
      } catch (error: unknown) {
        console.error("Setup defaults error:", error);
        const errorMessage = extractErrorMessage(
          error,
          "Failed to setup default stages"
        );
        showError(errorMessage);
        onError?.();
      }
    },
  });
};
