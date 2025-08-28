// src/redux/slices/callDashboardApi.ts
// RTK Query API slice for Tata Tele Admin Call Dashboard

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../store";
import {
  AdminDashboardResponse,
  UserPerformanceResponse,
  FilterOptionsResponse,
  SummaryStatsResponse,
  RecordingPlayResponse,
  AdminDashboardRequest,
  UserPerformanceRequest,
  PlayRecordingRequest,
  CallDirection,
  PerformancePeriod,
  CallStatus,
  // ApiError,
} from "@/models/types/callDashboard";

// Base query with auth token
const baseQuery = fetchBaseQuery({
  baseUrl: `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin`,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    headers.set("content-type", "application/json");
    return headers;
  },
});

export const callDashboardApi = createApi({
  reducerPath: "callDashboardApi",
  baseQuery,
  tagTypes: [
    "CallDashboard",
    "UserPerformance",
    "FilterOptions",
    "SummaryStats",
    "Recording",
  ],

  endpoints: (builder) => ({
    // ========================================================================
    // MAIN DASHBOARD ENDPOINT
    // ========================================================================

    getCallDashboard: builder.query<
      AdminDashboardResponse,
      AdminDashboardRequest
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();

        // Add non-null parameters
        if (params.date_from) queryParams.append("date_from", params.date_from);
        if (params.date_to) queryParams.append("date_to", params.date_to);
        if (params.user_ids) queryParams.append("user_ids", params.user_ids);
        if (params.call_status)
          queryParams.append("call_status", params.call_status);
        if (params.call_direction)
          queryParams.append("call_direction", params.call_direction);

        return `/call-dashboard?${queryParams.toString()}`;
      },
      providesTags: ["CallDashboard"],
    }),

    // ========================================================================
    // USER PERFORMANCE ENDPOINTS
    // ========================================================================

    getUserPerformance: builder.query<
      UserPerformanceResponse,
      UserPerformanceRequest
    >({
      query: ({ user_id, ...params }) => {
        const queryParams = new URLSearchParams();
        if (params.date_from) queryParams.append("date_from", params.date_from);
        if (params.date_to) queryParams.append("date_to", params.date_to);
        if (params.include_day_comparison !== undefined) {
          queryParams.append(
            "include_day_comparison",
            String(params.include_day_comparison)
          );
        }

        return `/user-performance/${user_id}?${queryParams.toString()}`;
      },
      providesTags: (result, error, { user_id }) => [
        { type: "UserPerformance", id: user_id },
      ],
    }),

    // ========================================================================
    // WEEKLY/MONTHLY PERFORMERS
    // ========================================================================

    getWeeklyPerformers: builder.query<
      any, // eslint-disable-line @typescript-eslint/no-explicit-any
      { week_offset?: number; top_n?: number }
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.week_offset !== undefined)
          queryParams.append("week_offset", String(params.week_offset));
        if (params.top_n) queryParams.append("top_n", String(params.top_n));

        return `/weekly-performers?${queryParams.toString()}`;
      },
      providesTags: ["CallDashboard"],
    }),

    getMonthlyPerformers: builder.query<
      any, // eslint-disable-line @typescript-eslint/no-explicit-any
      { year?: number; month?: number; top_n?: number }
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.year) queryParams.append("year", String(params.year));
        if (params.month) queryParams.append("month", String(params.month));
        if (params.top_n) queryParams.append("top_n", String(params.top_n));

        return `/monthly-performers?${queryParams.toString()}`;
      },
      providesTags: ["CallDashboard"],
    }),

    // ========================================================================
    // RECORDING ENDPOINTS
    // ========================================================================

    playRecording: builder.mutation<
      RecordingPlayResponse,
      PlayRecordingRequest
    >({
      query: (body) => ({
        url: "/play-recording",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Recording"],
    }),

    getUserRecordings: builder.query<
      any, // eslint-disable-line @typescript-eslint/no-explicit-any
      {
        user_id: string;
        date_from?: string;
        date_to?: string;
        limit?: number;
        page?: number;
      }
    >({
      query: ({ user_id, ...params }) => {
        const queryParams = new URLSearchParams();
        if (params.date_from) queryParams.append("date_from", params.date_from);
        if (params.date_to) queryParams.append("date_to", params.date_to);
        queryParams.append("limit", String(params.limit || 20));
        queryParams.append("page", String(params.page || 1));

        return `/user-recordings/${user_id}?${queryParams.toString()}`;
      },
      providesTags: (result, error, { user_id }) => [
        { type: "Recording", id: user_id },
      ],
    }),

    getUserRecordingsCount: builder.query<
      { count: number },
      {
        user_id: string;
        date_from?: string;
        date_to?: string;
      }
    >({
      query: ({ user_id, ...params }) => {
        const queryParams = new URLSearchParams();
        if (params.date_from) queryParams.append("date_from", params.date_from);
        if (params.date_to) queryParams.append("date_to", params.date_to);

        return `/user-recordings-count/${user_id}?${queryParams.toString()}`;
      },
      providesTags: (result, error, { user_id }) => [
        { type: "Recording", id: `count-${user_id}` },
      ],
    }),
    /* eslint-disable @typescript-eslint/no-explicit-any */
    getRecordingDetails: builder.query<any, { call_id: string }>({
      query: ({ call_id }) => `/recording/${call_id}`,
      providesTags: (result, error, { call_id }) => [
        { type: "Recording", id: call_id },
      ],
    }),
    /* eslint-enable @typescript-eslint/no-explicit-any */

    // ========================================================================
    // FILTER OPTIONS & METADATA
    // ========================================================================

    getFilterOptions: builder.query<FilterOptionsResponse, void>({
      query: () => "/filter-options",
      providesTags: ["FilterOptions"],
    }),

    getSummaryStats: builder.query<
      SummaryStatsResponse,
      {
        date_from?: string;
        date_to?: string;
      }
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.date_from) queryParams.append("date_from", params.date_from);
        if (params.date_to) queryParams.append("date_to", params.date_to);

        return `/summary-stats?${queryParams.toString()}`;
      },
      providesTags: ["SummaryStats"],
    }),

    // ========================================================================
    // EXPORT DATA
    // ========================================================================

    exportCallData: builder.query<
      any, // eslint-disable-line @typescript-eslint/no-explicit-any
      {
        date_from: string;
        date_to: string;
        format?: "json" | "csv";
        user_ids?: string;
      }
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        queryParams.append("date_from", params.date_from);
        queryParams.append("date_to", params.date_to);
        if (params.format) queryParams.append("format", params.format);
        if (params.user_ids) queryParams.append("user_ids", params.user_ids);

        return `/export-call-data?${queryParams.toString()}`;
      },
    }),

    // ========================================================================
    // ADMIN ACTIVITY LOGS
    // ========================================================================

    getAdminActivityLogs: builder.query<
      any, // eslint-disable-line @typescript-eslint/no-explicit-any
      {
        date_from?: string;
        date_to?: string;
        action_type?: string;
        limit?: number;
      }
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.date_from) queryParams.append("date_from", params.date_from);
        if (params.date_to) queryParams.append("date_to", params.date_to);
        if (params.action_type)
          queryParams.append("action_type", params.action_type);
        queryParams.append("limit", String(params.limit || 50));

        return `/admin-activity-logs?${queryParams.toString()}`;
      },
    }),
  }),
});

// ============================================================================
// EXPORT HOOKS
// ============================================================================

export const {
  // Main dashboard
  useGetCallDashboardQuery,
  useLazyGetCallDashboardQuery,

  // User performance
  useGetUserPerformanceQuery,
  useLazyGetUserPerformanceQuery,

  // Performers
  useGetWeeklyPerformersQuery,
  useGetMonthlyPerformersQuery,

  // Recordings
  usePlayRecordingMutation,
  useGetUserRecordingsQuery,
  useGetUserRecordingsCountQuery,
  useGetRecordingDetailsQuery,

  // Metadata
  useGetFilterOptionsQuery,
  useGetSummaryStatsQuery,

  // Export & logs
  useExportCallDataQuery,
  useLazyExportCallDataQuery,
  useGetAdminActivityLogsQuery,
} = callDashboardApi;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Helper to build dashboard query params
export const buildDashboardQuery = (filters: {
  dateFrom?: string;
  dateTo?: string;
  period?: string;
  userIds?: string[];
  callStatus?: string;
  callDirection?: string;
  page?: number;
  limit?: number;
}): AdminDashboardRequest => ({
  date_from: filters.dateFrom,
  date_to: filters.dateTo,
  period: filters.period as PerformancePeriod,
  user_ids: filters.userIds?.join(","),
  call_status: filters.callStatus as CallStatus,
  call_direction: filters.callDirection as CallDirection,
  page: filters.page || 1,
  limit: filters.limit || 50,
});

// Helper to build user performance query
export const buildUserPerformanceQuery = (
  userId: string,
  filters: {
    period?: string;
    dateFrom?: string;
    dateTo?: string;
    includeDayComparison?: boolean;
  }
): UserPerformanceRequest => ({
  user_id: userId,
  period: filters.period as PerformancePeriod,
  date_from: filters.dateFrom,
  date_to: filters.dateTo,
  include_day_comparison: filters.includeDayComparison ?? true,
});

export default callDashboardApi;
