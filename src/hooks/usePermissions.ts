// src/hooks/usePermissions.ts

import { useCallback, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import {
  setLoading,
  setUpdateLoading,
  setError,
  setUpdateError,
  clearError,
  clearUpdateError,
  setUsers,
  setSummary,
  optimisticUpdatePermissions,
  confirmPermissionUpdate,
  rollbackPermissionUpdate,
  openPermissionsModal,
  closePermissionsModal,
  openConfirmModal,
  closeConfirmModal,
  setSearchTerm,
  setDepartmentFilter,
  setPermissionLevelFilter,
  clearFilters,
  refreshPermissions,
} from "@/redux/slices/permissionsSlice";
import {
  // UserWithPermissions,
  PermissionUpdateRequest,
  PermissionUpdateResponse,
  GetUsersPermissionsResponse,
  PermissionsSummary,
  // PermissionFilters,
} from "@/models/types/permissions";

// API Base URL
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// Custom hook for permissions management
export const usePermissions = () => {
  const dispatch = useAppDispatch();

  // Get state from Redux
  const {
    users,
    summary,
    loading,
    updateLoading,
    error,
    updateError,
    permissionsModalOpen,
    confirmModalOpen,
    currentUpdateUser,
    pendingUpdate,
    filters,
    // optimisticUpdates,
  } = useAppSelector((state) => state.permissions);

  // Get auth state for token
  const { token, user: currentUser } = useAppSelector((state) => state.auth);

  // Check if current user is admin
  const isAdmin = currentUser?.role === "admin";

  // ============ API CALLS ============

  // Fetch users with permissions
  const fetchUsersPermissions = useCallback(
    async (includeAdmins: boolean = false) => {
      if (!token || !isAdmin) {
        dispatch(setError("Unauthorized: Admin access required"));
        return;
      }

      dispatch(setLoading(true));
      dispatch(clearError());

      try {
        const response = await fetch(
          `${API_BASE_URL}/permissions/users?include_admins=${includeAdmins}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.detail || `HTTP ${response.status}: Failed to fetch users`
          );
        }

        const data: GetUsersPermissionsResponse = await response.json();

        if (data.success) {
          dispatch(setUsers(data.users));
          dispatch(setSummary(data.summary));
        } else {
          throw new Error("Failed to fetch users permissions");
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to fetch users permissions";
        dispatch(setError(message));
        console.error("Fetch users permissions error:", error);
      } finally {
        dispatch(setLoading(false));
      }
    },
    [token, isAdmin, dispatch]
  );

  // Update user permissions
  const updateUserPermissions = useCallback(
    async (updateRequest: PermissionUpdateRequest) => {
      if (!token || !isAdmin) {
        dispatch(setUpdateError("Unauthorized: Admin access required"));
        return false;
      }

      // Store original permissions for rollback
      const user = users.find((u) => u.email === updateRequest.user_email);
      if (!user) {
        dispatch(setUpdateError("User not found"));
        return false;
      }

      const originalPermissions = { ...user.permissions };

      dispatch(setUpdateLoading(true));
      dispatch(clearUpdateError());

      // Optimistic update
      dispatch(
        optimisticUpdatePermissions({
          user_email: updateRequest.user_email,
          can_create_single_lead: updateRequest.can_create_single_lead,
          can_create_bulk_leads: updateRequest.can_create_bulk_leads,
        })
      );

      try {
        const response = await fetch(
          `${API_BASE_URL}/permissions/users/update`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updateRequest),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.detail ||
              `HTTP ${response.status}: Failed to update permissions`
          );
        }

        const data: PermissionUpdateResponse = await response.json();

        if (data.success) {
          dispatch(confirmPermissionUpdate(data));
          return true;
        } else {
          throw new Error(data.message || "Failed to update permissions");
        }
      } catch (error) {
        // Rollback optimistic update
        dispatch(
          rollbackPermissionUpdate({
            user_email: updateRequest.user_email,
            originalPermissions,
          })
        );

        const message =
          error instanceof Error
            ? error.message
            : "Failed to update permissions";
        dispatch(setUpdateError(message));
        console.error("Update permissions error:", error);
        return false;
      } finally {
        dispatch(setUpdateLoading(false));
      }
    },
    [token, isAdmin, users, dispatch]
  );

  // Grant single lead permission
  const grantSinglePermission = useCallback(
    async (userEmail: string, reason?: string) => {
      return updateUserPermissions({
        user_email: userEmail,
        can_create_single_lead: true,
        can_create_bulk_leads: false, // Keep existing bulk permission
        reason,
      });
    },
    [updateUserPermissions]
  );

  // Grant bulk lead permission (includes single)
  const grantBulkPermission = useCallback(
    async (userEmail: string, reason?: string) => {
      return updateUserPermissions({
        user_email: userEmail,
        can_create_single_lead: true, // Bulk includes single
        can_create_bulk_leads: true,
        reason,
      });
    },
    [updateUserPermissions]
  );

  // Revoke all permissions
  const revokeAllPermissions = useCallback(
    async (userEmail: string, reason?: string) => {
      if (!token || !isAdmin) {
        dispatch(setUpdateError("Unauthorized: Admin access required"));
        return false;
      }

      dispatch(setUpdateLoading(true));
      dispatch(clearUpdateError());

      try {
        const url = `${API_BASE_URL}/permissions/users/${encodeURIComponent(
          userEmail
        )}/revoke-all`;
        const queryParams = reason
          ? `?reason=${encodeURIComponent(reason)}`
          : "";

        const response = await fetch(`${url}${queryParams}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.detail ||
              `HTTP ${response.status}: Failed to revoke permissions`
          );
        }

        const data = await response.json();

        if (data.success || response.status === 200) {
          // Refresh the users list to get updated data
          await fetchUsersPermissions();
          return true;
        } else {
          throw new Error(data.message || "Failed to revoke permissions");
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to revoke permissions";
        dispatch(setUpdateError(message));
        console.error("Revoke permissions error:", error);
        return false;
      } finally {
        dispatch(setUpdateLoading(false));
      }
    },
    [token, isAdmin, fetchUsersPermissions, dispatch]
  );

  // Get permission summary
  const fetchPermissionSummary = useCallback(async () => {
    if (!token || !isAdmin) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/permissions/summary`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data: PermissionsSummary = await response.json();
        dispatch(setSummary(data));
      }
    } catch (error) {
      console.error("Fetch permission summary error:", error);
    }
  }, [token, isAdmin, dispatch]);

  // Check specific user permissions
  const checkUserPermissions = useCallback(
    async (userEmail: string) => {
      if (!token || !isAdmin) {
        return null;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/permissions/users/${encodeURIComponent(
            userEmail
          )}/check`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.error("Check user permissions error:", error);
      }

      return null;
    },
    [token, isAdmin]
  );

  // ============ FILTER AND SEARCH ============

  // Get filtered users based on current filters
  const getFilteredUsers = useCallback(() => {
    let filtered = [...users];

    // Search filter
    if (filters.search_term) {
      const searchLower = filters.search_term.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.full_name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          user.first_name.toLowerCase().includes(searchLower) ||
          user.last_name.toLowerCase().includes(searchLower)
      );
    }

    // Department filter
    if (filters.department) {
      filtered = filtered.filter((user) =>
        user.departments.includes(filters.department)
      );
    }

    // Permission level filter
    if (filters.permission_level !== "all") {
      filtered = filtered.filter((user) => {
        const { permission_level } = user.permission_summary;
        switch (filters.permission_level) {
          case "none":
            return permission_level === 0;
          case "single":
            return permission_level === 1;
          case "bulk":
            return permission_level === 2;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [users, filters]);

  // ============ MODAL ACTIONS ============

  const openModal = useCallback(() => {
    dispatch(openPermissionsModal());
  }, [dispatch]);

  const closeModal = useCallback(() => {
    dispatch(closePermissionsModal());
  }, [dispatch]);

  const openConfirm = useCallback(
    (userEmail: string, pendingUpdate: PermissionUpdateRequest) => {
      dispatch(openConfirmModal({ user_email: userEmail, pendingUpdate }));
    },
    [dispatch]
  );

  const closeConfirm = useCallback(() => {
    dispatch(closeConfirmModal());
  }, [dispatch]);

  // ============ FILTER ACTIONS ============

  const updateSearchTerm = useCallback(
    (term: string) => {
      dispatch(setSearchTerm(term));
    },
    [dispatch]
  );

  const updateDepartmentFilter = useCallback(
    (department: string) => {
      dispatch(setDepartmentFilter(department));
    },
    [dispatch]
  );

  const updatePermissionLevelFilter = useCallback(
    (level: "all" | "none" | "single" | "bulk") => {
      dispatch(setPermissionLevelFilter(level));
    },
    [dispatch]
  );

  const resetFilters = useCallback(() => {
    dispatch(clearFilters());
  }, [dispatch]);

  // ============ ERROR HANDLING ============

  const clearErrors = useCallback(() => {
    dispatch(clearError());
    dispatch(clearUpdateError());
  }, [dispatch]);

  // ============ REFRESH ============

  const refresh = useCallback(() => {
    dispatch(refreshPermissions());
    fetchUsersPermissions();
  }, [dispatch, fetchUsersPermissions]);

  // ============ AUTO-FETCH ON MOUNT ============

  useEffect(() => {
    if (isAdmin && token && users.length === 0) {
      fetchUsersPermissions();
    }
  }, [isAdmin, token, users.length, fetchUsersPermissions]);

  // ============ RETURN HOOK API ============

  return {
    // State
    users: getFilteredUsers(),
    allUsers: users,
    summary,
    loading,
    updateLoading,
    error,
    updateError,
    isAdmin,

    // Modal state
    permissionsModalOpen,
    confirmModalOpen,
    currentUpdateUser,
    pendingUpdate,

    // Filters
    filters,

    // Actions
    fetchUsersPermissions,
    updateUserPermissions,
    grantSinglePermission,
    grantBulkPermission,
    revokeAllPermissions,
    fetchPermissionSummary,
    checkUserPermissions,

    // Modal actions
    openModal,
    closeModal,
    openConfirm,
    closeConfirm,

    // Filter actions
    updateSearchTerm,
    updateDepartmentFilter,
    updatePermissionLevelFilter,
    resetFilters,

    // Utility
    clearErrors,
    refresh,

    // Helpers
    // hasOptimisticUpdate: (userEmail: string) =>
    //   optimisticUpdates.has(userEmail),
    // getOptimisticUpdate: (userEmail: string) =>
    //   optimisticUpdates.get(userEmail),
  };
};
