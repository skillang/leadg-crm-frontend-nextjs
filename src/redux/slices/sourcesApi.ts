// src/redux/slices/sourcesApi.ts

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../store";

// Types for Sources API
export interface Source {
  id: string;
  name: string;
  display_name: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  is_default: boolean;
  lead_count?: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SourcesResponse {
  sources: Source[];
  total: number;
  active_count: number;
  inactive_count: number;
}

export interface CreateSourceRequest {
  name: string;
  display_name: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
  is_default?: boolean;
}

export interface UpdateSourceRequest {
  name?: string;
  display_name?: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
  is_default?: boolean;
}

// Base query with authentication
const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const token = state.auth.token;

    if (token) {
      headers.set("authorization", `Bearer ${token}`);
      headers.set("accept", "application/json");
    }
    return headers;
  },
});

export const sourcesApi = createApi({
  reducerPath: "sourcesApi",
  baseQuery,
  tagTypes: ["Source"],
  endpoints: (builder) => ({
    // Get all sources
    getSources: builder.query<
      SourcesResponse,
      { include_lead_count?: boolean; active_only?: boolean }
    >({
      query: ({ include_lead_count = false, active_only = true }) => {
        const params = new URLSearchParams();
        if (include_lead_count) params.append("include_lead_count", "true");
        if (active_only) params.append("active_only", "true");
        return `/sources/?${params.toString()}`;
      },
      providesTags: ["Source"],
    }),

    // Get active sources only
    getActiveSources: builder.query<
      SourcesResponse,
      { include_lead_count?: boolean }
    >({
      query: ({ include_lead_count = false }) => {
        const params = new URLSearchParams();
        if (include_lead_count) params.append("include_lead_count", "true");
        return `/sources/active?${params.toString()}`;
      },
      providesTags: ["Source"],
    }),

    // Get inactive sources
    getInactiveSources: builder.query<
      SourcesResponse,
      { include_lead_count?: boolean }
    >({
      query: ({ include_lead_count = false }) => {
        const params = new URLSearchParams();
        if (include_lead_count) params.append("include_lead_count", "true");
        return `/sources/inactive?${params.toString()}`;
      },
      providesTags: ["Source"],
    }),

    // Get source by ID
    getSourceById: builder.query<Source, string>({
      query: (sourceId) => `/sources/${sourceId}`,
      providesTags: ["Source"],
    }),

    // Create source (Admin only)
    createSource: builder.mutation<
      { additionalProp1: unknown },
      CreateSourceRequest
    >({
      query: (sourceData) => ({
        url: "/sources/",
        method: "POST",
        body: sourceData,
      }),
      invalidatesTags: ["Source"],
    }),

    // Update source (Admin only)
    updateSource: builder.mutation<
      { additionalProp1: unknown },
      { sourceId: string; data: UpdateSourceRequest }
    >({
      query: ({ sourceId, data }) => ({
        url: `/sources/${sourceId}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Source"],
    }),

    // Delete source (Admin only)
    deleteSource: builder.mutation<{ additionalProp1: unknown }, string>({
      query: (sourceId) => ({
        url: `/sources/${sourceId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Source"],
    }),

    // Activate source (Admin only)
    activateSource: builder.mutation<{ additionalProp1: unknown }, string>({
      query: (sourceId) => ({
        url: `/sources/${sourceId}/activate`,
        method: "PATCH",
      }),
      invalidatesTags: ["Source"],
    }),

    // Deactivate source (Admin only)
    deactivateSource: builder.mutation<{ additionalProp1: unknown }, string>({
      query: (sourceId) => ({
        url: `/sources/${sourceId}/deactivate`,
        method: "PATCH",
      }),
      invalidatesTags: ["Source"],
    }),
  }),
});

export const {
  useGetSourcesQuery,
  useGetActiveSourcesQuery,
  useGetInactiveSourcesQuery,
  useGetSourceByIdQuery,
  useCreateSourceMutation,
  useUpdateSourceMutation,
  useDeleteSourceMutation,
  useActivateSourceMutation,
  useDeactivateSourceMutation,
} = sourcesApi;
