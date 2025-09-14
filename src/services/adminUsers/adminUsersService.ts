// src/services/adminUsers/adminUsersService.ts

export interface UserStats {
  user_id: string;
  name: string;
  email: string;
  role: string;
  assigned_leads_count: number;
}

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

// Service function for deleting users
export const deleteUserService = async (
  user: UserStats,
  currentUserEmail: string,
  allUsers: UserStats[],
  {
    deleteMutation,
    showWarning,
    showError,
    showConfirm,
    refetch,
    onSuccess,
    onError,
  }: {
    deleteMutation: any;
    showWarning: (message: string, title?: string) => void;
    showError: (message: string, title?: string) => void;
    showConfirm: (options: any) => void;
    refetch: () => void;
    onSuccess?: () => void;
    onError?: () => void;
  }
): Promise<void> => {
  // Prevent self-deletion
  if (user.email === currentUserEmail) {
    showWarning("You cannot delete your own account.");
    return;
  }

  // Check if user can be deleted
  if (!canDeleteUser(user, currentUserEmail, allUsers)) {
    showWarning("Cannot delete the last admin user.");
    return;
  }

  // Use showConfirm from notification system
  showConfirm({
    title: "Delete User Account",
    description: `Are you sure you want to delete "${user.name}" (${user.email})? This action cannot be undone. The user will be deactivated and their data will be preserved for audit purposes.`,
    confirmText: "Delete User",
    cancelText: "Cancel",
    variant: "destructive",
    onConfirm: async () => {
      try {
        // Call delete user API using user email
        await deleteMutation(user.email).unwrap();

        // Success handling
        showWarning(
          `User "${user.name}" has been successfully deleted`,
          "User Deleted"
        );

        // Refresh user stats
        refetch();
        onSuccess?.();
      } catch (error: unknown) {
        console.error("Failed to delete user:", error);

        // Extract error message
        const errorMessage = extractErrorMessage(
          error,
          "Failed to delete user. Please try again."
        );

        showError(errorMessage, "Deletion Failed");
        onError?.();
      }
    },
  });
};

// Utility function to sort users
export const sortUsers = (users: UserStats[]): UserStats[] => {
  return [...users].sort((a: UserStats, b: UserStats) => {
    // Admins first
    if (a.role === "admin" && b.role !== "admin") return -1;
    if (a.role !== "admin" && b.role === "admin") return 1;

    // Then by assigned leads count (descending)
    if (a.assigned_leads_count !== b.assigned_leads_count) {
      return b.assigned_leads_count - a.assigned_leads_count;
    }

    // Finally by name (ascending)
    return a.name.localeCompare(b.name);
  });
};

// Utility function to check if user can be deleted
export const canDeleteUser = (
  user: UserStats,
  currentUserEmail: string,
  allUsers: UserStats[]
): boolean => {
  // Cannot delete self
  if (user.email === currentUserEmail) return false;

  // Check if this is the last admin
  const adminCount = allUsers.filter(
    (u: UserStats) => u.role === "admin"
  ).length;
  if (user.role === "admin" && adminCount <= 1) return false;

  return true;
};
