// src/services/userPermissions/userPermissionsService.ts

import {
  PermissionUpdateRequest,
  //   UserWithPermissions,
} from "@/models/types/permissions";

// Helper function to extract error messages
export const extractErrorMessage = (error: unknown): string => {
  if (!error) return "";

  const apiError = error as any;

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

// Service function for updating user permissions
export const updateUserPermissionsService = async (
  user: any,
  canCreateSingle: boolean,
  canCreateBulk: boolean,
  reason: string,
  {
    updateMutation,
    showSuccess,
    showError,
    refetch,
    onSuccess,
    onError,
  }: {
    updateMutation: any;
    showSuccess: (message: string, title?: string) => void;
    showError: (message: string, title?: string) => void;
    refetch: () => void;
    onSuccess: () => void;
    onError?: () => void;
  }
): Promise<void> => {
  if (!user) return;

  const updateRequest: PermissionUpdateRequest = {
    user_email: user.email,
    can_create_single_lead: canCreateSingle,
    can_create_bulk_leads: canCreateBulk,
    reason: reason.trim() || undefined,
  };

  try {
    await updateMutation(updateRequest).unwrap();

    showSuccess(
      `Permissions updated successfully for ${user.full_name}`,
      "Permissions Updated"
    );

    refetch();
    onSuccess();
  } catch (error) {
    console.error("Failed to update permissions:", error);

    // Extract error message
    const errorMessage = extractErrorMessage(error);
    showError(
      errorMessage || "Failed to update permissions. Please try again.",
      "Update Failed"
    );
    onError?.();
  }
};

// Service function for password reset email
export const sendPasswordResetEmailService = async (
  user: any,
  {
    forgotPasswordMutation,
    showSuccess,
    showError,
    onSuccess,
    onError,
  }: {
    forgotPasswordMutation: any;
    showSuccess: (message: string, title?: string) => void;
    showError: (message: string, title?: string) => void;
    onSuccess?: () => void;
    onError?: () => void;
  }
): Promise<void> => {
  try {
    const result = await forgotPasswordMutation({
      email: user.email,
    }).unwrap();

    if (result.success) {
      showSuccess(
        `Password reset email sent to ${user.email}`,
        "Reset Email Sent"
      );
      onSuccess?.();
    }
  } catch (error) {
    console.error("Reset password error:", error);
    const errorMessage = extractErrorMessage(error);
    showError(
      errorMessage || "Failed to send reset email. Please try again.",
      "Reset Failed"
    );
    onError?.();
  }
};

// Service function for setting temporary password
export const setTemporaryPasswordService = async (
  user: any,
  tempPassword: string,
  {
    adminResetPasswordMutation,
    showSuccess,
    showError,
    onSuccess,
    onError,
  }: {
    adminResetPasswordMutation: any;
    showSuccess: (message: string, title?: string) => void;
    showError: (message: string, title?: string) => void;
    onSuccess: () => void;
    onError?: () => void;
  }
): Promise<void> => {
  if (!tempPassword.trim()) {
    showError("Please enter a temporary password", "Validation Error");
    return;
  }

  try {
    const result = await adminResetPasswordMutation({
      user_email: user.email,
      temporary_password: tempPassword,
      reset_method: "admin_temporary",
      force_change_on_login: true,
    }).unwrap();

    if (result.success) {
      showSuccess(
        `Temporary password set for ${user.email}. User must change it on next login.`,
        "Temporary Password Set"
      );
      onSuccess();
    }
  } catch (error) {
    console.error("Set temp password error:", error);
    const errorMessage = extractErrorMessage(error);
    showError(
      errorMessage || "Failed to set temporary password. Please try again.",
      "Reset Failed"
    );
    onError?.();
  }
};

// Service function for navigation with unsaved changes
export const handleNavigationWithChangesService = (
  hasChanges: boolean,
  router: any,
  destination: string,
  {
    showConfirm,
  }: {
    showConfirm: (options: any) => void;
  }
): void => {
  if (hasChanges) {
    showConfirm({
      title: "Unsaved Changes",
      description:
        "You have unsaved changes. Are you sure you want to leave? All changes will be lost.",
      confirmText: "Leave without saving",
      cancelText: "Stay on page",
      variant: "destructive",
      onConfirm: () => {
        router.push(destination);
      },
    });
  } else {
    router.push(destination);
  }
};
