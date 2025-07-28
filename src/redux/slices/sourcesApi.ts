// src/redux/slices/sourcesApi.ts

import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQueryWithReauth } from "../utils/baseQuerryWithReauth";
import {
  Source,
  SourcesResponse,
  CreateSourceRequest,
  UpdateSourceRequest,
  // SourceMutationResponse,
} from "@/models/types/source";

// Base query with authentication
const baseQuery = createBaseQueryWithReauth(
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
);

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
