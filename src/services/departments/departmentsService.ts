// src/services/departments/departmentsService.ts

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

// Form validation utility
export const validateDepartmentForm = (formData: {
  name: string;
  description: string;
}): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!formData.name.trim()) {
    errors.name = "Department name is required";
  }

  if (!formData.description.trim()) {
    errors.description = "Description is required";
  }

  return errors;
};

// Calculate department statistics
export const calculateDepartmentStats = (departmentsData: any) => {
  return {
    total: departmentsData?.total_count || 0,
    predefined: departmentsData?.predefined_count || 0,
    custom: departmentsData?.custom_count || 0,
  };
};

// Service function for creating departments
export const createDepartmentService = async (
  formData: {
    name: string;
    description: string;
    is_active: boolean;
  },
  {
    createMutation,
    showSuccess,
    showError,
    refetch,
    onSuccess,
    onError,
  }: {
    createMutation: any;
    showSuccess: (message: string, title?: string) => void;
    showError: (message: string, title?: string) => void;
    refetch: () => void;
    onSuccess: () => void;
    onError?: () => void;
  }
): Promise<void> => {
  // Validate form
  const validationErrors = validateDepartmentForm(formData);
  if (Object.keys(validationErrors).length > 0) {
    const firstError = Object.values(validationErrors)[0];
    showError(firstError, "Validation Error");
    onError?.();
    return;
  }

  try {
    await createMutation({
      name: formData.name.trim(),
      description: formData.description.trim(),
      is_active: formData.is_active,
    }).unwrap();

    showSuccess(
      `Department "${formData.name}" created successfully!`,
      "Department Created"
    );

    refetch();
    onSuccess();
  } catch (error) {
    console.error("Failed to create department:", error);
    const errorMessage = extractErrorMessage(
      error,
      "Failed to create department. Please try again."
    );
    showError(errorMessage, "Creation Failed");
    onError?.();
  }
};

// Service function for deleting departments
export const deleteDepartmentService = async (
  departmentId: string,
  departmentName: string,
  {
    deleteMutation,
    showSuccess,
    showError,
    showConfirm,
    refetch,
    onSuccess,
    onError,
  }: {
    deleteMutation: any;
    showSuccess: (message: string, title?: string) => void;
    showError: (message: string, title?: string) => void;
    showConfirm: (options: any) => void;
    refetch: () => void;
    onSuccess?: () => void;
    onError?: () => void;
  }
): Promise<void> => {
  showConfirm({
    title: "Delete Department",
    description: `Are you sure you want to delete "${departmentName}"? This action cannot be undone.`,
    confirmText: "Delete",
    variant: "destructive",
    onConfirm: async () => {
      try {
        await deleteMutation(departmentId).unwrap();

        showSuccess(
          `Department "${departmentName}" deleted successfully!`,
          "Department Deleted"
        );

        refetch();
        onSuccess?.();
      } catch (error) {
        console.error("Failed to delete department:", error);
        const errorMessage = extractErrorMessage(
          error,
          "Failed to delete department. Please try again."
        );
        showError(errorMessage, "Deletion Failed");
        onError?.();
      }
    },
  });
};
