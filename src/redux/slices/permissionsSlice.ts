// src/redux/slices/permissionsSlice.ts

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  UserPermissions,
  // PermissionSummary,
  UserWithPermissions,
  PermissionUpdateRequest,
  PermissionUpdateResponse,
  PermissionsSummary,
  PermissionFilters,
} from "@/models/types/permissions";

// ✅ Define permissions state interface
interface PermissionsState {
  // Users and permissions data
  users: UserWithPermissions[];
  summary: PermissionsSummary | null;

  // Loading states
  loading: boolean;
  updateLoading: boolean;

  // Error states
  error: string | null;
  updateError: string | null;

  // Modal states
  permissionsModalOpen: boolean;
  confirmModalOpen: boolean;

  // Current operation tracking
  currentUpdateUser: string | null;
  pendingUpdate: PermissionUpdateRequest | null;

  // Filters and search (using the imported interface)
  filters: PermissionFilters;

  // Optimistic updates
  optimisticUpdates: Record<string, PermissionUpdateRequest>;
}

// ✅ Initial state following your pattern
const initialState: PermissionsState = {
  users: [],
  summary: null,
  loading: false,
  updateLoading: false,
  error: null,
  updateError: null,
  permissionsModalOpen: false,
  confirmModalOpen: false,
  currentUpdateUser: null,
  pendingUpdate: null,
  filters: {
    search_term: "",
    department: "",
    permission_level: "all",
  },
  optimisticUpdates: {},
};

// ✅ Create permissions slice following your established patterns
const permissionsSlice = createSlice({
  name: "permissions",
  initialState,
  reducers: {
    // ============ LOADING STATES ============
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    setUpdateLoading: (state, action: PayloadAction<boolean>) => {
      state.updateLoading = action.payload;
    },

    // ============ ERROR HANDLING ============
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    setUpdateError: (state, action: PayloadAction<string | null>) => {
      state.updateError = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },

    clearUpdateError: (state) => {
      state.updateError = null;
    },

    // ============ DATA MANAGEMENT ============
    setUsers: (state, action: PayloadAction<UserWithPermissions[]>) => {
      state.users = action.payload;
      state.loading = false;
      state.error = null;
    },

    setSummary: (state, action: PayloadAction<PermissionsSummary>) => {
      state.summary = action.payload;
    },

    // ============ PERMISSION UPDATES ============
    // Optimistic update - immediately update UI before API call
    optimisticUpdatePermissions: (
      state,
      action: PayloadAction<{
        user_email: string;
        can_create_single_lead: boolean;
        can_create_bulk_leads: boolean;
      }>
    ) => {
      const { user_email, can_create_single_lead, can_create_bulk_leads } =
        action.payload;

      // Store optimistic update
      state.optimisticUpdates[user_email] = {
        user_email,
        can_create_single_lead,
        can_create_bulk_leads,
      };

      // Update user in the list
      const userIndex = state.users.findIndex(
        (user) => user.email === user_email
      );
      if (userIndex !== -1) {
        state.users[userIndex].permissions.can_create_single_lead =
          can_create_single_lead;
        state.users[userIndex].permissions.can_create_bulk_leads =
          can_create_bulk_leads;

        // Update permission summary
        state.users[userIndex].permission_summary.has_any_permission =
          can_create_single_lead || can_create_bulk_leads;
        state.users[userIndex].permission_summary.permission_level =
          can_create_bulk_leads ? 2 : can_create_single_lead ? 1 : 0;
      }
    },

    // Confirm successful update from API
    confirmPermissionUpdate: (
      state,
      action: PayloadAction<PermissionUpdateResponse>
    ) => {
      const { user_email, updated_permissions } = action.payload;

      // Remove from optimistic updates
      delete state.optimisticUpdates[user_email];

      // Update with server response
      const userIndex = state.users.findIndex(
        (user) => user.email === user_email
      );
      if (userIndex !== -1) {
        state.users[userIndex].permissions = updated_permissions;

        // Update permission summary
        state.users[userIndex].permission_summary.has_any_permission =
          updated_permissions.can_create_single_lead ||
          updated_permissions.can_create_bulk_leads;
        state.users[userIndex].permission_summary.permission_level =
          updated_permissions.can_create_bulk_leads
            ? 2
            : updated_permissions.can_create_single_lead
            ? 1
            : 0;
        state.users[userIndex].permission_summary.granted_by =
          updated_permissions.granted_by;
        state.users[userIndex].permission_summary.granted_at =
          updated_permissions.granted_at;
      }

      state.updateLoading = false;
      state.updateError = null;
    },

    // Rollback optimistic update on API failure
    rollbackPermissionUpdate: (
      state,
      action: PayloadAction<{
        user_email: string;
        originalPermissions: UserPermissions;
      }>
    ) => {
      const { user_email, originalPermissions } = action.payload;

      // Remove from optimistic updates
      delete state.optimisticUpdates[user_email];

      // Restore original permissions
      const userIndex = state.users.findIndex(
        (user) => user.email === user_email
      );
      if (userIndex !== -1) {
        state.users[userIndex].permissions = originalPermissions;

        // Restore permission summary
        state.users[userIndex].permission_summary.has_any_permission =
          originalPermissions.can_create_single_lead ||
          originalPermissions.can_create_bulk_leads;
        state.users[userIndex].permission_summary.permission_level =
          originalPermissions.can_create_bulk_leads
            ? 2
            : originalPermissions.can_create_single_lead
            ? 1
            : 0;
      }

      state.updateLoading = false;
    },

    // ============ MODAL MANAGEMENT ============
    openPermissionsModal: (state) => {
      state.permissionsModalOpen = true;
      state.error = null;
      state.updateError = null;
    },

    closePermissionsModal: (state) => {
      state.permissionsModalOpen = false;
      state.error = null;
      state.updateError = null;
      state.currentUpdateUser = null;
      state.pendingUpdate = null;
      state.optimisticUpdates = {};
    },

    openConfirmModal: (
      state,
      action: PayloadAction<{
        user_email: string;
        pendingUpdate: PermissionUpdateRequest;
      }>
    ) => {
      state.confirmModalOpen = true;
      state.currentUpdateUser = action.payload.user_email;
      state.pendingUpdate = action.payload.pendingUpdate;
    },

    closeConfirmModal: (state) => {
      state.confirmModalOpen = false;
      state.currentUpdateUser = null;
      state.pendingUpdate = null;
    },

    // ============ FILTERS AND SEARCH ============
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.filters.search_term = action.payload;
    },

    setDepartmentFilter: (state, action: PayloadAction<string>) => {
      state.filters.department = action.payload;
    },

    setPermissionLevelFilter: (
      state,
      action: PayloadAction<"all" | "none" | "single" | "bulk">
    ) => {
      state.filters.permission_level = action.payload;
    },

    clearFilters: (state) => {
      state.filters = {
        search_term: "",
        department: "",
        permission_level: "all",
      };
    },

    // ============ BULK OPERATIONS ============
    setBulkPermissions: (
      state,
      action: PayloadAction<{
        user_emails: string[];
        can_create_single_lead: boolean;
        can_create_bulk_leads: boolean;
      }>
    ) => {
      const { user_emails, can_create_single_lead, can_create_bulk_leads } =
        action.payload;

      user_emails.forEach((email) => {
        const userIndex = state.users.findIndex((user) => user.email === email);
        if (userIndex !== -1) {
          state.users[userIndex].permissions.can_create_single_lead =
            can_create_single_lead;
          state.users[userIndex].permissions.can_create_bulk_leads =
            can_create_bulk_leads;

          // Update permission summary
          state.users[userIndex].permission_summary.has_any_permission =
            can_create_single_lead || can_create_bulk_leads;
          state.users[userIndex].permission_summary.permission_level =
            can_create_bulk_leads ? 2 : can_create_single_lead ? 1 : 0;
        }
      });
    },

    // ============ REFRESH AND RESET ============
    refreshPermissions: (state) => {
      state.loading = true;
      state.error = null;
      state.optimisticUpdates = {};
    },

    resetPermissionsState: () => {
      return initialState;
    },
  },
});

// ✅ Export actions following your pattern
export const {
  // Loading states
  setLoading,
  setUpdateLoading,

  // Error handling
  setError,
  setUpdateError,
  clearError,
  clearUpdateError,

  // Data management
  setUsers,
  setSummary,

  // Permission updates
  optimisticUpdatePermissions,
  confirmPermissionUpdate,
  rollbackPermissionUpdate,

  // Modal management
  openPermissionsModal,
  closePermissionsModal,
  openConfirmModal,
  closeConfirmModal,

  // Filters and search
  setSearchTerm,
  setDepartmentFilter,
  setPermissionLevelFilter,
  clearFilters,

  // Bulk operations
  setBulkPermissions,

  // Refresh and reset
  refreshPermissions,
  resetPermissionsState,
} = permissionsSlice.actions;

// ✅ Export reducer following your pattern
export default permissionsSlice.reducer;
