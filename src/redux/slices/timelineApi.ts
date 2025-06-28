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
  baseUrl:
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1",
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
const transformTimelineActivity = (apiActivity: any): TimelineActivity => ({
  id: apiActivity.id || apiActivity._id,
  activity_type: apiActivity.activity_type,
  title: apiActivity.title,
  description: apiActivity.description,
  timestamp: apiActivity.timestamp,
  performed_by: apiActivity.performed_by,
  performed_by_name: apiActivity.performed_by_name,
  lead_id: apiActivity.lead_id,
  metadata: apiActivity.metadata || {},
  created_at: apiActivity.created_at,
  updated_at: apiActivity.updated_at,
});

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

        return `/timeline/leads/${leadId}?${params.toString()}`;
      },
      transformResponse: (response: any): TimelineResponse => {
        // Handle both string and object responses from API
        if (typeof response === "string") {
          try {
            const parsed = JSON.parse(response);
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

        return {
          activities: response.activities?.map(transformTimelineActivity) || [],
          total: response.total || 0,
          page: response.page || 1,
          limit: response.limit || 20,
          has_next: response.has_next || false,
          has_prev: response.has_prev || false,
          total_pages: response.total_pages || 1,
        };
      },
      providesTags: (result, error, { leadId }) => [
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
      transformResponse: (response: any): TimelineStats => {
        // Handle both string and object responses from API
        if (typeof response === "string") {
          try {
            const parsed = JSON.parse(response);
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

        return {
          total_activities: response.total_activities || 0,
          activities_by_type: response.activities_by_type || {},
          recent_activity_count: response.recent_activity_count || 0,
          most_active_day: response.most_active_day || "",
          activity_trend: response.activity_trend || [],
        };
      },
      providesTags: (result, error, { leadId }) => [
        { type: "TimelineStats", id: leadId },
      ],
    }),

    // Get available activity types
    getActivityTypes: builder.query<ActivityType[], void>({
      query: () => "/timeline/activity-types",
      transformResponse: (response: any): ActivityType[] => {
        // Handle both string and object responses from API
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

        if (Array.isArray(response)) {
          return response.map((type) => ({
            value: type,
            label: type.charAt(0).toUpperCase() + type.slice(1),
          }));
        }

        return [];
      },
      providesTags: ["ActivityTypes"],
    }),

    // Debug endpoint for testing
    getTimelineDebug: builder.query<any, string>({
      query: (leadId) => `/timeline/debug/test/${leadId}`,
      transformResponse: (response: any) => {
        // Handle string response from debug endpoint
        if (typeof response === "string") {
          try {
            return JSON.parse(response);
          } catch (error) {
            return { debug_data: response };
          }
        }
        return response;
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
