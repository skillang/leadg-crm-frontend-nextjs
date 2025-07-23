// src/redux/slices/stagesApi.ts

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../store";
import {
  Stage,
  StagesResponse,
  CreateStageRequest,
  CreateStageResponse,
  UpdateStageRequest,
  StageReorderRequest,
} from "@/models/types/stage";

// Transform API response to match our interface
const transformStage = (stage: Record<string, unknown>): Stage => ({
  id: String(stage.id || ""),
  name: String(stage.name || ""),
  display_name: String(stage.display_name || ""),
  description: String(stage.description || ""),
  color: String(stage.color || "#6B7280"),
  sort_order: Number(stage.sort_order || 0),
  is_active: Boolean(stage.is_active),
  is_default: Boolean(stage.is_default),
  lead_count: Number(stage.lead_count || 0),
  created_by: String(stage.created_by || ""),
  created_at: String(stage.created_at || ""),
  updated_at: String(stage.updated_at || ""),
});

export const stagesApi = createApi({
  reducerPath: "stagesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken;
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["Stage"],
  endpoints: (builder) => ({
    // Get all stages
    getStages: builder.query<
      StagesResponse,
      { include_lead_count?: boolean; active_only?: boolean }
    >({
      query: ({ include_lead_count = false, active_only = true } = {}) => {
        const params = new URLSearchParams();
        if (include_lead_count) params.append("include_lead_count", "true");
        if (!active_only) params.append("active_only", "false");
        return `/stages?${params.toString()}`;
      },
      transformResponse: (response: unknown): StagesResponse => {
        const parsed = response as {
          stages?: Record<string, unknown>[];
          total?: number;
          active_count?: number;
          inactive_count?: number;
        };
        return {
          stages: parsed.stages?.map(transformStage) || [],
          total: parsed.total || 0,
          active_count: parsed.active_count || 0,
          inactive_count: parsed.inactive_count || 0,
        };
      },
      providesTags: [{ type: "Stage", id: "LIST" }],
    }),

    // Get active stages only
    getActiveStages: builder.query<
      StagesResponse,
      { include_lead_count?: boolean }
    >({
      query: ({ include_lead_count = false } = {}) => {
        const params = new URLSearchParams();
        if (include_lead_count) params.append("include_lead_count", "true");
        return `/stages/active?${params.toString()}`;
      },
      transformResponse: (response: unknown): StagesResponse => {
        const parsed = response as {
          stages?: Record<string, unknown>[];
          total?: number;
          active_count?: number;
          inactive_count?: number;
        };
        return {
          stages: parsed.stages?.map(transformStage) || [],
          total: parsed.total || 0,
          active_count: parsed.active_count || 0,
          inactive_count: parsed.inactive_count || 0,
        };
      },
      providesTags: [{ type: "Stage", id: "ACTIVE" }],
    }),

    // Get inactive stages
    getInactiveStages: builder.query<
      StagesResponse,
      { include_lead_count?: boolean }
    >({
      query: ({ include_lead_count = false } = {}) => {
        const params = new URLSearchParams();
        if (include_lead_count) params.append("include_lead_count", "true");
        return `/stages/inactive?${params.toString()}`;
      },
      transformResponse: (response: unknown): StagesResponse => {
        const parsed = response as {
          stages?: Record<string, unknown>[];
          total?: number;
          active_count?: number;
          inactive_count?: number;
        };
        return {
          stages: parsed.stages?.map(transformStage) || [],
          total: parsed.total || 0,
          active_count: parsed.active_count || 0,
          inactive_count: parsed.inactive_count || 0,
        };
      },
      providesTags: [{ type: "Stage", id: "INACTIVE" }],
    }),

    // Get stage by ID
    getStageById: builder.query<Stage, string>({
      query: (stageId) => `/stages/${stageId}`,
      transformResponse: (response: unknown): Stage => {
        return transformStage(response as Record<string, unknown>);
      },
      providesTags: (result, _error, id) => [{ type: "Stage", id }],
    }),

    // Get default stage name
    getDefaultStageName: builder.query<string, void>({
      query: () => "/stages/default/name",
      transformResponse: (response: unknown): string => {
        return String(response || "");
      },
    }),

    // Create stage (Admin only)
    createStage: builder.mutation<CreateStageResponse, CreateStageRequest>({
      query: (stageData) => ({
        url: "/stages",
        method: "POST",
        body: stageData,
      }),
      invalidatesTags: [
        { type: "Stage", id: "LIST" },
        { type: "Stage", id: "ACTIVE" },
      ],
    }),

    // Update stage (Admin only)
    updateStage: builder.mutation<
      CreateStageResponse,
      { stageId: string; stageData: UpdateStageRequest }
    >({
      query: ({ stageId, stageData }) => ({
        url: `/stages/${stageId}`,
        method: "PUT",
        body: stageData,
      }),
      invalidatesTags: (_result, _error, { stageId }) => [
        { type: "Stage", id: stageId },
        { type: "Stage", id: "LIST" },
        { type: "Stage", id: "ACTIVE" },
      ],
    }),

    // Delete stage (Admin only)
    deleteStage: builder.mutation<
      { message: string },
      { stageId: string; force?: boolean }
    >({
      query: ({ stageId, force = false }) => {
        const params = new URLSearchParams();
        if (force) params.append("force", "true");
        return {
          url: `/stages/${stageId}?${params.toString()}`,
          method: "DELETE",
        };
      },
      invalidatesTags: (_result, _error, { stageId }) => [
        { type: "Stage", id: stageId },
        { type: "Stage", id: "LIST" },
        { type: "Stage", id: "ACTIVE" },
      ],
    }),

    // Activate stage (Admin only)
    activateStage: builder.mutation<{ message: string }, string>({
      query: (stageId) => ({
        url: `/stages/${stageId}/activate`,
        method: "PATCH",
      }),
      async onQueryStarted(stageId, { queryFulfilled }) {
        try {
          await queryFulfilled;
          // console.log("Activate stage API result:", result);
        } catch (error) {
          console.error("Activate stage API error:", error);
        }
      },
      invalidatesTags: (_result, _error, stageId) => [
        { type: "Stage", id: stageId },
        { type: "Stage", id: "LIST" },
        { type: "Stage", id: "ACTIVE" },
        { type: "Stage", id: "INACTIVE" },
      ],
    }),

    // Deactivate stage (Admin only)
    deactivateStage: builder.mutation<{ message: string }, string>({
      query: (stageId) => ({
        url: `/stages/${stageId}/deactivate`,
        method: "PATCH",
      }),
      async onQueryStarted(stageId, { queryFulfilled }) {
        try {
          await queryFulfilled;
          // console.log("Deactivate stage API result:", result);
        } catch (error) {
          console.error("Deactivate stage API error:", error);
        }
      },
      invalidatesTags: (_result, _error, stageId) => [
        { type: "Stage", id: stageId },
        { type: "Stage", id: "LIST" },
        { type: "Stage", id: "ACTIVE" },
        { type: "Stage", id: "INACTIVE" },
      ],
    }),

    // Reorder stages (Admin only)
    reorderStages: builder.mutation<{ message: string }, StageReorderRequest[]>(
      {
        query: (reorderData) => ({
          url: "/stages/reorder",
          method: "PATCH",
          body: reorderData,
        }),
        invalidatesTags: [
          { type: "Stage", id: "LIST" },
          { type: "Stage", id: "ACTIVE" },
        ],
      }
    ),

    // Setup default stages (Admin only)
    setupDefaultStages: builder.mutation<string, void>({
      query: () => ({
        url: "/stages/setup/defaults",
        method: "POST",
      }),
      invalidatesTags: [
        { type: "Stage", id: "LIST" },
        { type: "Stage", id: "ACTIVE" },
      ],
    }),
  }),
});

export const {
  useGetStagesQuery,
  useGetActiveStagesQuery,
  useGetInactiveStagesQuery,
  useGetStageByIdQuery,
  useGetDefaultStageNameQuery,
  useCreateStageMutation,
  useUpdateStageMutation,
  useDeleteStageMutation,
  useActivateStageMutation,
  useDeactivateStageMutation,
  useReorderStagesMutation,
  useSetupDefaultStagesMutation,
} = stagesApi;
