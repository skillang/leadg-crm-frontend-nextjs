// src/services/leadSources/leadSourcesService.ts

import {
  Source,
  CreateSourceRequest,
  UpdateSourceRequest,
} from "@/models/types/source";

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
  const apiError = error as any;

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
export const filterSources = (
  sources: Source[],
  searchTerm: string
): Source[] => {
  if (!searchTerm.trim()) return sources;

  const lowerSearchTerm = searchTerm.toLowerCase();

  return sources.filter(
    (source) =>
      source.name.toLowerCase().includes(lowerSearchTerm) ||
      source.display_name.toLowerCase().includes(lowerSearchTerm) ||
      source.short_form.toLowerCase().includes(lowerSearchTerm) ||
      (source.description &&
        source.description.toLowerCase().includes(lowerSearchTerm))
  );
};

// Combine and filter sources based on show inactive toggle
export const combineAndFilterSources = (
  activeSources: Source[],
  inactiveSources: Source[],
  showInactive: boolean,
  searchTerm: string
): Source[] => {
  const allSources = [
    ...activeSources,
    ...(showInactive ? inactiveSources : []),
  ];

  return filterSources(allSources, searchTerm);
};

// Calculate summary statistics
export const calculateSourceStats = (
  activeSourcesData: any,
  inactiveSourcesData: any,
  allSources: Source[]
) => {
  return {
    totalSources:
      (activeSourcesData?.total || 0) + (inactiveSourcesData?.total || 0),
    activeSources: activeSourcesData?.total || 0,
    inactiveSources: inactiveSourcesData?.total || 0,
    totalLeads: allSources.reduce(
      (total, source) => total + (source.lead_count || 0),
      0
    ),
  };
};

// Service functions for CRUD operations
export const createSourceService = async (
  sourceData: CreateSourceRequest,
  {
    createMutation,
    showSuccess,
    showError,
    onSuccess,
    onError,
  }: {
    createMutation: any;
    showSuccess: (message: string, title?: string) => void;
    showError: (message: string, title?: string) => void;
    onSuccess: () => void;
    onError?: () => void;
  }
): Promise<void> => {
  try {
    await createMutation(sourceData).unwrap();

    showSuccess(
      `Source "${sourceData.display_name}" created successfully!`,
      "Source Created"
    );
    onSuccess();
  } catch (error: unknown) {
    console.error("Failed to create source:", error);
    const errorMessage = extractErrorMessage(
      error,
      "Failed to create source. Please try again."
    );
    showError(errorMessage, "Creation Failed");
    onError?.();
  }
};

export const updateSourceService = async (
  editingSource: Source,
  sourceData: UpdateSourceRequest,
  {
    updateMutation,
    showSuccess,
    showError,
    onSuccess,
    onError,
  }: {
    updateMutation: any;
    showSuccess: (message: string, title?: string) => void;
    showError: (message: string, title?: string) => void;
    onSuccess: () => void;
    onError?: () => void;
  }
): Promise<void> => {
  try {
    await updateMutation({
      sourceId: editingSource.id,
      data: {
        ...sourceData,
        name: generateInternalName(
          sourceData.display_name || editingSource.display_name
        ),
        // Keep existing short_form - don't allow editing to maintain lead ID consistency
        short_form: editingSource.short_form,
      },
    }).unwrap();

    showSuccess(
      `Source "${sourceData.display_name}" updated successfully!`,
      "Source Updated"
    );
    onSuccess();
  } catch (error: unknown) {
    console.error("Failed to update source:", error);
    const errorMessage = extractErrorMessage(
      error,
      "Failed to update source. Please try again."
    );
    showError(errorMessage, "Update Failed");
    onError?.();
  }
};

export const deleteSourceService = async (
  source: Source,
  {
    deleteMutation,
    showSuccess,
    showError,
    showConfirm,
    onSuccess,
    onError,
  }: {
    deleteMutation: any;
    showSuccess: (message: string, title?: string) => void;
    showError: (message: string, title?: string) => void;
    showConfirm: (options: any) => void;
    onSuccess?: () => void;
    onError?: () => void;
  }
): Promise<void> => {
  // Check if source has leads before showing confirmation
  if (source.lead_count && source.lead_count > 0) {
    showError(
      `Cannot delete "${source.display_name}" because it has ${source.lead_count} associated leads. Please reassign or remove the leads first.`,
      "Cannot Delete Source"
    );
    return;
  }

  // Use notification system for confirmation
  showConfirm({
    title: "Delete Source",
    description: `Are you sure you want to permanently delete the source "${source.display_name}"? This action cannot be undone.`,
    confirmText: "Delete Source",
    cancelText: "Cancel",
    variant: "destructive",
    onConfirm: async () => {
      try {
        await deleteMutation(source.id).unwrap();

        showSuccess(
          `Source "${source.display_name}" deleted successfully!`,
          "Source Deleted"
        );
        onSuccess?.();
      } catch (error: unknown) {
        const errorMessage = extractErrorMessage(
          error,
          "Failed to delete source"
        );
        showError(errorMessage, "Delete Failed");
        onError?.();
      }
    },
  });
};

export const activateDeactivateSourceService = async (
  source: Source,
  action: "activate" | "deactivate",
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
    showSuccess: (message: string, title?: string) => void;
    showError: (message: string, title?: string) => void;
    onSuccess?: () => void;
    onError?: () => void;
  }
): Promise<void> => {
  try {
    if (action === "activate") {
      await activateMutation(source.id).unwrap();
      showSuccess(
        `Source "${source.display_name}" activated successfully!`,
        "Source Activated"
      );
    } else {
      await deactivateMutation(source.id).unwrap();
      showSuccess(
        `Source "${source.display_name}" deactivated successfully!`,
        "Source Deactivated"
      );
    }

    onSuccess?.();
  } catch (error: unknown) {
    const errorMessage = extractErrorMessage(
      error,
      `Failed to ${action} source`
    );
    showError(
      errorMessage,
      `${action === "activate" ? "Activation" : "Deactivation"} Failed`
    );
    onError?.();
  }
};
