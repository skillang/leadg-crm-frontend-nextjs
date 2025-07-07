// src/redux/slices/timelineApi.ts

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../store";
import {
  TimelineActivity,
  TimelineResponse,
  TimelineStats,
  TimelineFilters,
  ActivityType,
} from "@/models/types/timeline";

// Base query with authentication
const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const token = state.auth.token;

    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

// Transform API response to match our frontend types
const transformTimelineActivity = (
  apiActivity: Record<string, unknown>
): TimelineActivity => {
  return {
    id: (apiActivity.id || apiActivity._id) as string,
    activity_type: apiActivity.activity_type as string,
    title: apiActivity.description as string,
    description: apiActivity.description as string,
    timestamp: apiActivity.created_at as string,
    performed_by: apiActivity.created_by_id as string,
    performed_by_name: apiActivity.created_by_name as string,
    lead_id: (apiActivity.lead_id as string) || "",
    metadata: (apiActivity.metadata as Record<string, unknown>) || {},
    created_at: apiActivity.created_at as string,
    updated_at:
      (apiActivity.updated_at as string) || (apiActivity.created_at as string),
  };
};

export const timelineApi = createApi({
  reducerPath: "timelineApi",
  baseQuery,
  tagTypes: ["Timeline", "TimelineStats", "ActivityTypes"],
  endpoints: (builder) => ({
    // Get timeline activities for a specific lead
    getLeadTimeline: builder.query<
      TimelineResponse,
      { leadId: string } & TimelineFilters
    >({
      query: ({
        leadId,
        page = 1,
        limit = 20,
        activity_type,
        date_from,
        date_to,
        search,
      }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });

        if (activity_type) params.append("activity_type", activity_type);
        if (date_from) params.append("date_from", date_from);
        if (date_to) params.append("date_to", date_to);
        if (search) params.append("search", search);
        const url = `/timeline/leads/${leadId}?${params.toString()}`;
        return url;
      },
      transformResponse: (response: unknown): TimelineResponse => {
        if (typeof response === "string") {
          try {
            const parsed = JSON.parse(response) as {
              success?: boolean;
              timeline?: Record<string, unknown>[];
              activities?: Record<string, unknown>[];
              total?: number;
              page?: number;
              limit?: number;
              has_next?: boolean;
              has_prev?: boolean;
              total_pages?: number;
            };
            if (parsed.success && parsed.timeline) {
              return {
                activities:
                  parsed.timeline.map(transformTimelineActivity) || [],
                total: parsed.timeline.length || 0,
                page: 1,
                limit: 20,
                has_next: false,
                has_prev: false,
                total_pages: 1,
              };
            }

            return {
              activities:
                parsed.activities?.map(transformTimelineActivity) || [],
              total: parsed.total || 0,
              page: parsed.page || 1,
              limit: parsed.limit || 20,
              has_next: parsed.has_next || false,
              has_prev: parsed.has_prev || false,
              total_pages: parsed.total_pages || 1,
            };
          } catch (error) {
            console.error("Failed to parse timeline response:", error);
            return {
              activities: [],
              total: 0,
              page: 1,
              limit: 20,
              has_next: false,
              has_prev: false,
              total_pages: 1,
            };
          }
        }

        const parsed = response as {
          success?: boolean;
          timeline?: Record<string, unknown>[];
          activities?: Record<string, unknown>[];
          total?: number;
          page?: number;
          limit?: number;
          has_next?: boolean;
          has_prev?: boolean;
          total_pages?: number;
        };

        if (parsed.success && parsed.timeline) {
          return {
            activities: parsed.timeline.map(transformTimelineActivity) || [],
            total: parsed.timeline.length || 0,
            page: 1,
            limit: 20,
            has_next: false,
            has_prev: false,
            total_pages: 1,
          };
        }

        return {
          activities: parsed.activities?.map(transformTimelineActivity) || [],
          total: parsed.total || 0,
          page: parsed.page || 1,
          limit: parsed.limit || 20,
          has_next: parsed.has_next || false,
          has_prev: parsed.has_prev || false,
          total_pages: parsed.total_pages || 1,
        };
      },
      providesTags: (result, _error, { leadId }) => [
        { type: "Timeline", id: "LIST" },
        { type: "Timeline", id: leadId },
      ],
    }),

    // Get timeline statistics for a lead
    getLeadTimelineStats: builder.query<
      TimelineStats,
      { leadId: string; days?: number }
    >({
      query: ({ leadId, days = 30 }) => {
        const params = new URLSearchParams({
          days: days.toString(),
        });

        return `/timeline/leads/${leadId}/stats?${params.toString()}`;
      },
      transformResponse: (response: unknown): TimelineStats => {
        if (typeof response === "string") {
          try {
            const parsed = JSON.parse(response) as {
              total_activities?: number;
              activities_by_type?: Record<string, number>;
              recent_activity_count?: number;
              most_active_day?: string;
              activity_trend?: { date: string; count: number }[];
            };
            return {
              total_activities: parsed.total_activities || 0,
              activities_by_type: parsed.activities_by_type || {},
              recent_activity_count: parsed.recent_activity_count || 0,
              most_active_day: parsed.most_active_day || "",
              activity_trend: parsed.activity_trend || [],
            };
          } catch (error) {
            console.error("Failed to parse timeline stats:", error);
            return {
              total_activities: 0,
              activities_by_type: {},
              recent_activity_count: 0,
              most_active_day: "",
              activity_trend: [],
            };
          }
        }

        const parsed = response as {
          total_activities?: number;
          activities_by_type?: Record<string, number>;
          recent_activity_count?: number;
          most_active_day?: string;
          activity_trend?: { date: string; count: number }[];
        };

        return {
          total_activities: parsed.total_activities || 0,
          activities_by_type: parsed.activities_by_type || {},
          recent_activity_count: parsed.recent_activity_count || 0,
          most_active_day: parsed.most_active_day || "",
          activity_trend: parsed.activity_trend || [],
        };
      },
      providesTags: (result, _error, { leadId }) => [
        { type: "TimelineStats", id: leadId },
      ],
    }),

    // Get available activity types
    getActivityTypes: builder.query<ActivityType[], void>({
      query: () => "/timeline/activity-types",
      transformResponse: (response: unknown): ActivityType[] => {
        if (typeof response === "string") {
          try {
            const parsed = JSON.parse(response);
            if (Array.isArray(parsed)) {
              return parsed.map((type) => ({
                value: type,
                label: type.charAt(0).toUpperCase() + type.slice(1),
              }));
            }
            return [];
          } catch (error) {
            console.error("Failed to parse activity types:", error);
            return [];
          }
        }

        const parsed = response as string[];
        if (Array.isArray(parsed)) {
          return parsed.map((type) => ({
            value: type,
            label: type.charAt(0).toUpperCase() + type.slice(1),
          }));
        }

        return [];
      },
      providesTags: ["ActivityTypes"],
    }),

    // Debug endpoint for testing
    getTimelineDebug: builder.query<Record<string, unknown>, string>({
      query: (leadId) => `/timeline/debug/test/${leadId}`,
      transformResponse: (response: unknown): Record<string, unknown> => {
        if (typeof response === "string") {
          try {
            return JSON.parse(response);
          } catch (error) {
            console.error("Failed to parse debug response:", error);
            return { debug_data: response };
          }
        }
        return response as Record<string, unknown>;
      },
    }),
  }),
});

export const {
  useGetLeadTimelineQuery,
  useGetLeadTimelineStatsQuery,
  useGetActivityTypesQuery,
  useGetTimelineDebugQuery,
} = timelineApi;
