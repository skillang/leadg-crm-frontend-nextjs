// src/services/courseLevels/courseLevelService.ts

import {
  CourseLevel,
  CreateCourseLevelRequest,
  UpdateCourseLevelRequest,
} from "@/models/types/courseLevel";
import { ApiError } from "@/models/types/apiError";

// Utility function for generating internal names
export const generateInternalName = (displayName: string): string => {
  return displayName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace one or more spaces with single hyphen
    .replace(/[^a-z0-9-]/g, "") // Remove any character that's not lowercase letter, number, or hyphen
    .replace(/-+/g, "-") // Replace multiple consecutive hyphens with single hyphen
    .replace(/^-|-$/g, ""); // Remove leading and trailing hyphens
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

// Service functions
export const createCourseLevelService = async (
  formData: CreateCourseLevelRequest,
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

    showSuccess(
      `Course level "${formData.display_name}" created successfully!`
    );
    refetchActive();
    onSuccess();
  } catch (error: unknown) {
    const errorMessage = extractErrorMessage(
      error,
      "Failed to create course level"
    );
    showError(errorMessage);
    onError?.();
  }
};

export const updateCourseLevelService = async (
  courseLevel: CourseLevel,
  formData: UpdateCourseLevelRequest,
  {
    updateMutation,
    showSuccess,
    showError,
    refetchActive,
    refetchInactive,
    onSuccess,
    onError,
  }: {
    updateMutation: any;
    showSuccess: (message: string) => void;
    showError: (message: string) => void;
    refetchActive: () => void;
    refetchInactive: () => void;
    onSuccess: () => void;
    onError?: () => void;
  }
): Promise<void> => {
  try {
    // Remove 'name' from formData since it shouldn't be updated
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { name: _name, ...updateData } = formData;

    await updateMutation({
      courseLevelId: courseLevel.id,
      data: updateData,
    }).unwrap();

    showSuccess(
      `Course level "${courseLevel.display_name}" updated successfully!`
    );

    // Refetch both tabs since status might have changed
    refetchActive();
    refetchInactive();
    onSuccess();
  } catch (error: unknown) {
    const errorMessage = extractErrorMessage(
      error,
      "Failed to update course level"
    );
    showError(errorMessage);
    onError?.();
  }
};

export const deleteCourseLevelService = async (
  courseLevel: CourseLevel,
  activeTab: string,
  {
    deleteMutation,
    showSuccess,
    showError,
    showConfirm,
    refetchActive,
    refetchInactive,
    onSuccess,
    onError,
  }: {
    deleteMutation: any;
    showSuccess: (message: string) => void;
    showError: (message: string) => void;
    showConfirm: (options: any) => void;
    refetchActive: () => void;
    refetchInactive: () => void;
    onSuccess?: () => void;
    onError?: () => void;
  }
): Promise<void> => {
  // Check if course level has leads before showing confirmation
  if (courseLevel.lead_count > 0) {
    showError(
      `Cannot delete "${courseLevel.display_name}" because it has ${courseLevel.lead_count} associated leads. Please reassign or remove the leads first.`
    );
    return;
  }

  // Use notification system for confirmation
  showConfirm({
    title: "Delete Course Level",
    description: `Are you sure you want to permanently delete the course level "${courseLevel.display_name}"? This action cannot be undone.`,
    confirmText: "Delete Course Level",
    cancelText: "Cancel",
    variant: "destructive",
    onConfirm: async () => {
      try {
        await deleteMutation(courseLevel.id).unwrap();

        showSuccess(
          `Course level "${courseLevel.display_name}" deleted successfully!`
        );

        // Refetch only the current active tab's data
        if (activeTab === "active") {
          refetchActive();
        } else {
          refetchInactive();
        }

        onSuccess?.();
      } catch (error: unknown) {
        const errorMessage = extractErrorMessage(
          error,
          "Failed to delete course level"
        );
        showError(errorMessage);
        onError?.();
      }
    },
  });
};

export const activateDeactivateCourseLevelService = async (
  courseLevel: CourseLevel,
  action: "activate" | "deactivate",
  {
    activateMutation,
    deactivateMutation,
    showSuccess,
    showError,
    refetchActive,
    refetchInactive,
    onSuccess,
    onError,
  }: {
    activateMutation: any;
    deactivateMutation: any;
    showSuccess: (message: string) => void;
    showError: (message: string) => void;
    refetchActive: () => void;
    refetchInactive: () => void;
    onSuccess?: () => void;
    onError?: () => void;
  }
): Promise<void> => {
  try {
    if (action === "activate") {
      await activateMutation(courseLevel.id).unwrap();
      showSuccess(
        `Course level "${courseLevel.display_name}" activated successfully!`
      );
    } else {
      await deactivateMutation(courseLevel.id).unwrap();
      showSuccess(
        `Course level "${courseLevel.display_name}" deactivated successfully!`
      );
    }

    // Refetch both tabs since activation/deactivation moves items between tabs
    refetchActive();
    refetchInactive();
    onSuccess?.();
  } catch (error: unknown) {
    const errorMessage = extractErrorMessage(
      error,
      `Failed to ${action} course level`
    );
    showError(errorMessage);
    onError?.();
  }
};

// Data filtering and sorting utilities
export const filterCourseLevels = (
  courseLevels: CourseLevel[],
  searchTerm: string
): CourseLevel[] => {
  if (!searchTerm.trim()) return courseLevels;

  const lowerSearchTerm = searchTerm.toLowerCase();

  return courseLevels.filter(
    (level) =>
      level.name.toLowerCase().includes(lowerSearchTerm) ||
      level.display_name.toLowerCase().includes(lowerSearchTerm) ||
      level.description?.toLowerCase().includes(lowerSearchTerm)
  );
};

export const sortCourseLevels = (
  courseLevels: CourseLevel[],
  sortBy: "name" | "created_at" | "sort_order",
  sortOrder: "asc" | "desc"
): CourseLevel[] => {
  return [...courseLevels].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "created_at":
        comparison =
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case "sort_order":
        comparison = a.sort_order - b.sort_order;
        break;
      default:
        comparison = 0;
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });
};

export const filterAndSortCourseLevels = (
  courseLevels: CourseLevel[],
  searchTerm: string,
  sortBy: "name" | "created_at" | "sort_order",
  sortOrder: "asc" | "desc"
): CourseLevel[] => {
  const filtered = filterCourseLevels(courseLevels, searchTerm);
  return sortCourseLevels(filtered, sortBy, sortOrder);
};
