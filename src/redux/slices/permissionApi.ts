// src/redux/slices/permissionsApi.ts

import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQueryWithReauth } from "../utils/baseQuerryWithReauth";
import {
  // UserWithPermissions,
  PermissionUpdateRequest,
  PermissionUpdateResponse,
  GetUsersPermissionsResponse,
  PermissionsSummary,
  UserPermissionCheck,
  PermissionAuditLogResponse,
  PermissionValidationResult,
} from "@/models/types/permissions";

// API Base URL
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// Create permissions API following your pattern
export const permissionsApi = createApi({
  reducerPath: "permissionsApi",
  baseQuery: createBaseQueryWithReauth(`${API_BASE_URL}/permissions`),
  tagTypes: ["UserPermissions", "PermissionSummary", "PermissionAudit"],
  endpoints: (builder) => ({
    // Get all users with permissions
    getUsersPermissions: builder.query<
      GetUsersPermissionsResponse,
      { includeAdmins?: boolean }
    >({
      query: ({ includeAdmins = false } = {}) => ({
        url: "/users",
        method: "GET",
        params: { include_admins: includeAdmins },
      }),
      providesTags: ["UserPermissions"],
    }),

    // Update user permissions
    updateUserPermissions: builder.mutation<
      PermissionUpdateResponse,
      PermissionUpdateRequest
    >({
      query: (updateRequest) => ({
        url: "/users/update",
        method: "POST",
        body: updateRequest,
      }),
      invalidatesTags: ["UserPermissions", "PermissionSummary"],
    }),

    // Grant single lead permission
    grantSinglePermission: builder.mutation<
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any,
      { userEmail: string; reason?: string }
    >({
      query: ({ userEmail, reason }) => ({
        url: `/users/${encodeURIComponent(userEmail)}/grant-single`,
        method: "POST",
        params: reason ? { reason } : {},
      }),
      invalidatesTags: ["UserPermissions", "PermissionSummary"],
    }),

    // Grant bulk lead permission

    grantBulkPermission: builder.mutation<
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any,
      { userEmail: string; reason?: string }
    >({
      query: ({ userEmail, reason }) => ({
        url: `/users/${encodeURIComponent(userEmail)}/grant-bulk`,
        method: "POST",
        params: reason ? { reason } : {},
      }),
      invalidatesTags: ["UserPermissions", "PermissionSummary"],
    }),

    // Revoke all permissions
    revokeAllPermissions: builder.mutation<
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any,
      { userEmail: string; reason?: string }
    >({
      query: ({ userEmail, reason }) => ({
        url: `/users/${encodeURIComponent(userEmail)}/revoke-all`,
        method: "POST",
        params: reason ? { reason } : {},
      }),
      invalidatesTags: ["UserPermissions", "PermissionSummary"],
    }),

    // Get permission summary
    getPermissionSummary: builder.query<PermissionsSummary, void>({
      query: () => ({
        url: "/summary",
        method: "GET",
      }),
      providesTags: ["PermissionSummary"],
    }),

    // Check specific user permissions
    checkUserPermissions: builder.query<UserPermissionCheck, string>({
      query: (userEmail) => ({
        url: `/users/${encodeURIComponent(userEmail)}/check`,
        method: "GET",
      }),
      providesTags: (result, error, userEmail) => [
        { type: "UserPermissions", id: userEmail },
      ],
    }),

    // Get permission audit log
    getPermissionAuditLog: builder.query<
      PermissionAuditLogResponse,
      {
        limit?: number;
        skip?: number;
        userEmail?: string;
      }
    >({
      query: ({ limit = 50, skip = 0, userEmail } = {}) => ({
        url: "/audit-log",
        method: "GET",
        params: {
          limit,
          skip,
          ...(userEmail && { user_email: userEmail }),
        },
      }),
      providesTags: ["PermissionAudit"],
    }),

    // Validate permission system
    validatePermissionSystem: builder.query<PermissionValidationResult, void>({
      query: () => ({
        url: "/validate",
        method: "POST",
      }),
    }),
  }),
});

// Export hooks following your pattern
export const {
  useGetUsersPermissionsQuery,
  useUpdateUserPermissionsMutation,
  useGrantSinglePermissionMutation,
  useGrantBulkPermissionMutation,
  useRevokeAllPermissionsMutation,
  useGetPermissionSummaryQuery,
  useCheckUserPermissionsQuery,
  useGetPermissionAuditLogQuery,
  useValidatePermissionSystemQuery,
} = permissionsApi;
