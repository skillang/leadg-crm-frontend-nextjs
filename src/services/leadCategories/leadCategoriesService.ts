// src/services/leadCategories/leadCategoriesService.ts

import { Category } from "@/models/types/category";

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
export const filterCategories = (
  categories: Category[],
  searchTerm: string
): Category[] => {
  if (!searchTerm.trim()) return categories;

  const lowerSearchTerm = searchTerm.toLowerCase();

  return categories.filter(
    (category) =>
      category.name.toLowerCase().includes(lowerSearchTerm) ||
      category.short_form.toLowerCase().includes(lowerSearchTerm) ||
      (category.description &&
        category.description.toLowerCase().includes(lowerSearchTerm))
  );
};

// Process categories data with filtering
export const processCategoriesData = (
  categoriesData: any,
  searchTerm: string
): {
  filteredCategories: Category[];
  stats: {
    total: number;
    active: number;
    inactive: number;
  };
} => {
  const categories = categoriesData?.categories || [];
  const filteredCategories = filterCategories(categories, searchTerm);

  const stats = {
    total: categoriesData?.summary?.total || 0,
    active: categoriesData?.summary?.active || 0,
    inactive: categoriesData?.summary?.inactive || 0,
  };

  return { filteredCategories, stats };
};

// Service function for creating categories
export const createCategoryService = async (
  categoryData: {
    name: string;
    short_form: string;
    description?: string;
    is_active: boolean;
  },
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
    await createMutation(categoryData).unwrap();

    showSuccess(
      `Category "${categoryData.name}" created successfully!`,
      "Category Created"
    );
    onSuccess();
  } catch (error) {
    console.error("Failed to create category:", error);
    const errorMessage = extractErrorMessage(
      error,
      "Failed to create category. Please try again."
    );
    showError(errorMessage, "Creation Failed");
    onError?.();
  }
};

// Service function for updating categories
export const updateCategoryService = async (
  editingCategory: Category,
  categoryData: {
    name: string;
    description?: string;
    is_active: boolean;
  },
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
      categoryId: editingCategory.id,
      data: categoryData,
    }).unwrap();

    showSuccess(
      `Category "${categoryData.name}" updated successfully!`,
      "Category Updated"
    );
    onSuccess();
  } catch (error) {
    console.error("Failed to update category:", error);
    const errorMessage = extractErrorMessage(
      error,
      "Failed to update category. Please try again."
    );
    showError(errorMessage, "Update Failed");
    onError?.();
  }
};
