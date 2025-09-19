// src/redux/slices/timelineApi.ts

import { createApi } from "@reduxjs/toolkit/query/react";
import {
  TimelineActivity,
  TimelineResponse,
  TimelineStats,
  TimelineFilters,
  ActivityType,
  getActivityTypeConfig,
  getAllActivityTypeConfigs,
} from "@/models/types/timeline";
import { createBaseQueryWithReauth } from "../utils/baseQuerryWithReauth";

// Base query with authentication and auto-refresh
const baseQuery = createBaseQueryWithReauth(
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
);

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
        const parsed = response as {
          success?: boolean;
          timeline?: Record<string, unknown>[];
          pagination?: {
            total?: number;
            page?: number;
            limit?: number;
            pages?: number;
            has_next?: boolean;
            has_prev?: boolean;
          };
        };

        // Extract activities from timeline array
        const activities =
          parsed.timeline?.map(transformTimelineActivity) || [];

        // Extract pagination data from nested pagination object
        const pagination = parsed.pagination || {};

        return {
          activities: activities,
          // Use actual pagination values from backend, no hardcoded fallbacks
          total: pagination.total || 0,
          page: pagination.page || 1,
          limit: pagination.limit || 20, // This was the main problem - was hardcoded
          has_next: pagination.has_next || false,
          has_prev: pagination.has_prev || false,
          total_pages: pagination.pages || 1,
          // Include nested pagination for backward compatibility
          pagination: {
            total: pagination.total || 0,
            page: pagination.page || 1,
            pages: pagination.page || 1,
            limit: pagination.limit || 20,
            has_next: pagination.has_next || false,
            has_prev: pagination.has_prev || false,
          },
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

        return `/timeline/leads/${leadId}/stats/?${params.toString()}`;
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

    // Get available activity types (now dynamically generated)
    getActivityTypes: builder.query<ActivityType[], void>({
      query: () => "/timeline/activity-types",
      transformResponse: (response: unknown): ActivityType[] => {
        if (typeof response === "string") {
          try {
            const parsed = JSON.parse(response);
            if (Array.isArray(parsed)) {
              // Use the dynamic function to generate activity type configs
              return getAllActivityTypeConfigs(parsed);
            }
            return [];
          } catch (error) {
            console.error("Failed to parse activity types:", error);
            return [];
          }
        }

        const parsed = response as string[];
        if (Array.isArray(parsed)) {
          // Use the dynamic function to generate activity type configs
          return getAllActivityTypeConfigs(parsed);
        }

        return [];
      },
      providesTags: ["ActivityTypes"],
    }),

    // Get activity types for a specific lead (with counts)
    getLeadActivityTypes: builder.query<
      Array<ActivityType & { count: number }>,
      string
    >({
      query: (leadId) => `/timeline/leads/${leadId}/activity-types`,
      transformResponse: (
        response: unknown
      ): Array<ActivityType & { count: number }> => {
        if (typeof response === "string") {
          try {
            const parsed = JSON.parse(response) as Record<string, number>;
            return Object.entries(parsed).map(([type, count]) => ({
              ...getActivityTypeConfig(type),
              count,
            }));
          } catch (error) {
            console.error("Failed to parse lead activity types:", error);
            return [];
          }
        }

        const parsed = response as Record<string, number>;
        return Object.entries(parsed).map(([type, count]) => ({
          ...getActivityTypeConfig(type),
          count,
        }));
      },
      providesTags: (result, _error, leadId) => [
        { type: "ActivityTypes", id: leadId },
      ],
    }),

    // Get unique activity types across all leads (for admin filtering)
    getAllUniqueActivityTypes: builder.query<ActivityType[], void>({
      query: () => "/timeline/activity-types/all",
      transformResponse: (response: unknown): ActivityType[] => {
        if (typeof response === "string") {
          try {
            const parsed = JSON.parse(response);
            if (Array.isArray(parsed)) {
              return getAllActivityTypeConfigs(parsed);
            }
            return [];
          } catch (error) {
            console.error("Failed to parse all activity types:", error);
            return [];
          }
        }

        const parsed = response as string[];
        if (Array.isArray(parsed)) {
          return getAllActivityTypeConfigs(parsed);
        }

        return [];
      },
      providesTags: ["ActivityTypes"],
    }),
  }),
});

export const {
  useGetLeadTimelineQuery,
  useGetLeadTimelineStatsQuery,
  useGetActivityTypesQuery,
  useGetLeadActivityTypesQuery,
  useGetAllUniqueActivityTypesQuery,
} = timelineApi;
