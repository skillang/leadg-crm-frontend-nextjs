// src/redux/slices/statusesApi.ts

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../store";

// Types for Status management
export interface Status {
  id: string;
  name: string;
  display_name: string;
  description: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  is_default: boolean;
  lead_count: number;
  created_by: string;
  created_at: string;
  updated_at: string | null;
}

export interface CreateStatusRequest {
  name: string;
  display_name: string;
  description: string;
  color?: string;
  sort_order?: number;
  is_active?: boolean;
  is_default?: boolean;
}

export interface UpdateStatusRequest {
  display_name?: string;
  description?: string;
  color?: string;
  sort_order?: number;
  is_active?: boolean;
  is_default?: boolean;
}

export interface StatusesResponse {
  statuses: Status[];
  total: number;
  active_count: number;
  inactive_count: number;
}

export interface CreateStatusResponse {
  success: boolean;
  message: string;
  status: Status;
}

export interface StatusReorderItem {
  id: string;
  sort_order: number;
}

// Base query with authentication
const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const token = state.auth.token;

    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    headers.set("content-type", "application/json");
    headers.set("accept", "application/json");
    return headers;
  },
});

export const statusesApi = createApi({
  reducerPath: "statusesApi",
  baseQuery,
  tagTypes: ["Status"],
  endpoints: (builder) => ({
    // Get all statuses
    getStatuses: builder.query<
      StatusesResponse,
      { include_lead_count?: boolean; active_only?: boolean }
    >({
      query: ({ include_lead_count = false, active_only = true }) => {
        const params = new URLSearchParams();
        if (include_lead_count) params.append("include_lead_count", "true");
        if (!active_only) params.append("active_only", "false");
        return `/statuses/?${params.toString()}`;
      },
      providesTags: [{ type: "Status", id: "LIST" }],
    }),

    // Get active statuses only
    getActiveStatuses: builder.query<
      StatusesResponse,
      { include_lead_count?: boolean }
    >({
      query: ({ include_lead_count = false }) => {
        const params = new URLSearchParams();
        if (include_lead_count) params.append("include_lead_count", "true");
        return `/statuses/active?${params.toString()}`;
      },
      providesTags: [{ type: "Status", id: "ACTIVE" }],
    }),

    // Get inactive statuses only
    getInactiveStatuses: builder.query<
      StatusesResponse,
      { include_lead_count?: boolean }
    >({
      query: ({ include_lead_count = false }) => {
        const params = new URLSearchParams();
        if (include_lead_count) params.append("include_lead_count", "true");
        return `/statuses/inactive?${params.toString()}`;
      },
      providesTags: [{ type: "Status", id: "INACTIVE" }],
    }),

    // Get status by ID
    getStatusById: builder.query<Status, string>({
      query: (statusId) => `/statuses/${statusId}`,
      providesTags: (result, error, statusId) => [
        { type: "Status", id: statusId },
      ],
    }),

    // Get default status name
    getDefaultStatusName: builder.query<string, void>({
      query: () => "/statuses/default/name",
    }),

    // Create new status (Admin only)
    createStatus: builder.mutation<CreateStatusResponse, CreateStatusRequest>({
      query: (statusData) => ({
        url: "/statuses/",
        method: "POST",
        body: statusData,
      }),
      invalidatesTags: [
        { type: "Status", id: "LIST" },
        { type: "Status", id: "ACTIVE" },
      ],
    }),

    // Update status (Admin only)
    updateStatus: builder.mutation<
      { success: boolean; message: string; status: Status },
      { statusId: string; statusData: UpdateStatusRequest }
    >({
      query: ({ statusId, statusData }) => ({
        url: `/statuses/${statusId}`,
        method: "PUT",
        body: statusData,
      }),
      invalidatesTags: (result, error, { statusId }) => [
        { type: "Status", id: statusId },
        { type: "Status", id: "LIST" },
        { type: "Status", id: "ACTIVE" },
        { type: "Status", id: "INACTIVE" },
      ],
    }),

    // Delete status (Admin only)
    deleteStatus: builder.mutation<
      { success: boolean; message: string },
      { statusId: string; force?: boolean }
    >({
      query: ({ statusId, force = false }) => {
        const params = force ? "?force=true" : "";
        return {
          url: `/statuses/${statusId}${params}`,
          method: "DELETE",
        };
      },
      invalidatesTags: [
        { type: "Status", id: "LIST" },
        { type: "Status", id: "ACTIVE" },
        { type: "Status", id: "INACTIVE" },
      ],
    }),

    // Activate status (Admin only)
    activateStatus: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (statusId) => ({
        url: `/statuses/${statusId}/activate`,
        method: "PATCH",
      }),
      invalidatesTags: [
        { type: "Status", id: "LIST" },
        { type: "Status", id: "ACTIVE" },
        { type: "Status", id: "INACTIVE" },
      ],
    }),

    // Deactivate status (Admin only)
    deactivateStatus: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (statusId) => ({
        url: `/statuses/${statusId}/deactivate`,
        method: "PATCH",
      }),
      invalidatesTags: [
        { type: "Status", id: "LIST" },
        { type: "Status", id: "ACTIVE" },
        { type: "Status", id: "INACTIVE" },
      ],
    }),

    // Reorder statuses (Admin only)
    reorderStatuses: builder.mutation<
      { success: boolean; message: string },
      StatusReorderItem[]
    >({
      query: (reorderData) => ({
        url: "/statuses/reorder",
        method: "PATCH",
        body: reorderData,
      }),
      invalidatesTags: [
        { type: "Status", id: "LIST" },
        { type: "Status", id: "ACTIVE" },
      ],
    }),

    // Setup default statuses (Admin only)
    setupDefaultStatuses: builder.mutation<string, void>({
      query: () => ({
        url: "/statuses/setup/defaults",
        method: "POST",
      }),
      invalidatesTags: [
        { type: "Status", id: "LIST" },
        { type: "Status", id: "ACTIVE" },
      ],
    }),
  }),
});

export const {
  useGetStatusesQuery,
  useGetActiveStatusesQuery,
  useGetInactiveStatusesQuery,
  useGetStatusByIdQuery,
  useGetDefaultStatusNameQuery,
  useCreateStatusMutation,
  useUpdateStatusMutation,
  useDeleteStatusMutation,
  useActivateStatusMutation,
  useDeactivateStatusMutation,
  useReorderStatusesMutation,
  useSetupDefaultStatusesMutation,
} = statusesApi;
