// src/redux/slices/campaignsApi.ts

import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQueryWithReauth } from "../utils/baseQuerryWithReauth";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// Campaign Template Interface
export interface CampaignTemplate {
  template_id: string;
  template_name: string;
  sequence_order: number;
  scheduled_day?: number | null;
  custom_date?: string | null;
}

// Main Campaign Interface
export interface Campaign {
  _id: string;
  campaign_id: string;
  campaign_name: string;
  campaign_type: "whatsapp" | "email";
  send_to_all: boolean;
  stage_ids: string[];
  source_ids: string[];
  use_custom_dates: boolean;
  campaign_duration_days: number | null;
  message_limit: number;
  send_time: string;
  send_on_weekends: boolean;
  templates: CampaignTemplate[];
  status: "active" | "paused" | "deleted";
  created_by: string;
  created_at: string;
  updated_at: string;
  enrolled_leads?: number;
  messages_sent?: number;
  messages_pending?: number;
}

// Request Interfaces
export interface CreateCampaignRequest {
  campaign_name: string;
  campaign_type: "whatsapp" | "email";
  send_to_all: boolean;
  stage_ids: string[];
  source_ids: string[];
  use_custom_dates: boolean;
  campaign_duration_days?: number;
  message_limit: number;
  send_time: string;
  send_on_weekends: boolean;
  templates: {
    template_id: string;
    template_name: string;
    sequence_order: number;
    custom_date?: string;
  }[];
}

// Response Interfaces
export interface CreateCampaignResponse {
  success: boolean;
  message: string;
  campaign_id: string;
  campaign_name: string;
  total_leads_enrolled: number;
  schedule_preview: {
    template_name: string;
    send_date: string;
    sequence: number;
  }[];
}

export interface CampaignsListResponse {
  success: boolean;
  campaigns: Campaign[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CampaignDetailResponse {
  success: boolean;
  campaign: Campaign;
}

export interface CampaignStatsResponse {
  success: boolean;
  campaign_id: string;
  campaign_name: string;
  status: string;
  enrollments: {
    total: number;
    active: number;
    completed: number;
    criteria_not_matched: number;
  };
  messages: {
    sent: number;
    pending: number;
    failed: number;
  };
}

export interface EnrolledLead {
  lead_id: string;
  lead_name: string;
  email?: string;
  phone?: string;
  enrollment_status: "active" | "completed" | "opted_out";
  messages_sent: number;
  messages_pending: number;
  current_sequence: number;
  enrolled_at: string;
  last_message_sent_at?: string;
}

export interface EnrolledLeadsResponse {
  success: boolean;
  enrollments: EnrolledLead[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ActionResponse {
  success: boolean;
  message: string;
}

// ============================================================================
// BASE QUERY CONFIGURATION
// ============================================================================

const baseQuery = createBaseQueryWithReauth(
  `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/campaigns`
);

// ============================================================================
// API SLICE
// ============================================================================

export const campaignsApi = createApi({
  reducerPath: "campaignsApi",
  baseQuery,
  tagTypes: ["Campaign", "CampaignStats", "EnrolledLeads"],

  endpoints: (builder) => ({
    // ========================================================================
    // CREATE CAMPAIGN
    // ========================================================================
    createCampaign: builder.mutation<
      CreateCampaignResponse,
      CreateCampaignRequest
    >({
      query: (campaignData) => ({
        url: "/create",
        method: "POST",
        body: campaignData,
      }),
      invalidatesTags: ["Campaign"],
      transformResponse: (response: CreateCampaignResponse) => {
        console.log("✅ Campaign created:", response);
        return response;
      },
      transformErrorResponse: (error) => {
        console.error("❌ Campaign creation error:", error);
        return error;
      },
    }),

    // ========================================================================
    // GET CAMPAIGNS LIST
    // ========================================================================
    getCampaigns: builder.query<
      CampaignsListResponse,
      {
        campaign_type?: "whatsapp" | "email";
        status?: "active" | "paused";
        page?: number;
        limit?: number;
      }
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.campaign_type)
          queryParams.append("campaign_type", params.campaign_type);
        if (params.status) queryParams.append("status", params.status);
        queryParams.append("page", String(params.page || 1));
        queryParams.append("limit", String(params.limit || 20));

        return `/list?${queryParams.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.campaigns.map(({ campaign_id }) => ({
                type: "Campaign" as const,
                id: campaign_id,
              })),
              { type: "Campaign", id: "LIST" },
            ]
          : [{ type: "Campaign", id: "LIST" }],
    }),

    // ========================================================================
    // GET CAMPAIGN BY ID
    // ========================================================================
    getCampaignById: builder.query<CampaignDetailResponse, string>({
      query: (campaignId) => `/${campaignId}`,
      providesTags: (result, error, campaignId) => [
        { type: "Campaign", id: campaignId },
      ],
    }),

    // ========================================================================
    // PAUSE CAMPAIGN
    // ========================================================================
    pauseCampaign: builder.mutation<ActionResponse, string>({
      query: (campaignId) => ({
        url: `/${campaignId}/pause`,
        method: "POST",
      }),
      invalidatesTags: (result, error, campaignId) => [
        { type: "Campaign", id: campaignId },
        { type: "Campaign", id: "LIST" },
      ],
    }),

    // ========================================================================
    // RESUME CAMPAIGN
    // ========================================================================
    resumeCampaign: builder.mutation<ActionResponse, string>({
      query: (campaignId) => ({
        url: `/${campaignId}/resume`,
        method: "POST",
      }),
      invalidatesTags: (result, error, campaignId) => [
        { type: "Campaign", id: campaignId },
        { type: "Campaign", id: "LIST" },
      ],
    }),

    // ========================================================================
    // DELETE CAMPAIGN
    // ========================================================================
    deleteCampaign: builder.mutation<ActionResponse, string>({
      query: (campaignId) => ({
        url: `/${campaignId}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Campaign", id: "LIST" }],
    }),

    // ========================================================================
    // GET CAMPAIGN STATS
    // ========================================================================
    getCampaignStats: builder.query<CampaignStatsResponse, string>({
      query: (campaignId) => `/${campaignId}/stats`,
      providesTags: (result, error, campaignId) => [
        { type: "CampaignStats", id: campaignId },
      ],
    }),

    // ========================================================================
    // GET ENROLLED LEADS
    // ========================================================================
    getEnrolledLeads: builder.query<
      EnrolledLeadsResponse,
      {
        campaignId: string;
        page?: number;
        limit?: number;
      }
    >({
      query: ({ campaignId, page = 1, limit = 20 }) => {
        const queryParams = new URLSearchParams();
        queryParams.append("page", String(page));
        queryParams.append("limit", String(limit));

        return `/${campaignId}/enrolled-leads?${queryParams.toString()}`;
      },
      providesTags: (result, error, { campaignId }) => [
        { type: "EnrolledLeads", id: campaignId },
      ],
    }),
  }),
});

export const {
  useCreateCampaignMutation,
  useGetCampaignsQuery,
  useGetCampaignByIdQuery,
  usePauseCampaignMutation,
  useResumeCampaignMutation,
  useDeleteCampaignMutation,
  useGetCampaignStatsQuery,
  useGetEnrolledLeadsQuery,
} = campaignsApi;
