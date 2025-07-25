// src/redux/slices/emailApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../store";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// Types
export interface EmailTemplate {
  key: string;
  name: string;
  subject: string;
  description: string;
  template_type: string;
  is_active: boolean;
}

export interface EmailTemplatesResponse {
  success: boolean;
  templates: EmailTemplate[];
  total: number;
  message: string;
}

export interface SendEmailRequest {
  template_key: string;
  sender_email_prefix: string;
  scheduled_time?: string;
}

export interface BulkEmailRequest {
  lead_ids: string[];
  template_key: string;
  sender_email_prefix: string;
  scheduled_time?: string;
}

export interface EmailResponse {
  success: boolean;
  data: {
    email_id: string;
    lead_id?: string;
    message: string;
    scheduled: boolean;
    scheduled_time: string | null;
    created_at: string;
  };
}

export interface EmailHistoryItem {
  email_id: string;
  template_name: string;
  status: "sent" | "failed" | "pending" | "cancelled";
  scheduled_time: string | null;
  sent_time: string | null;
  created_at: string;
  sender_email: string;
  created_by_name: string;
}

export interface EmailHistoryResponse {
  success: boolean;
  emails: EmailHistoryItem[];
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ScheduledEmail {
  email_id: string;
  lead_id: string;
  lead_name: string;
  template_name: string;
  status: "pending" | "sent" | "failed" | "cancelled";
  scheduled_time: string;
  created_at: string;
}

export interface ScheduledEmailsResponse {
  success: boolean;
  emails: ScheduledEmail[];
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface EmailStats {
  total_sent: number;
  total_pending: number;
  total_failed: number;
  total_cancelled: number;
  success_rate: number;
  monthly_sent: number;
}

export interface EmailStatsResponse {
  success: boolean;
  stats: EmailStats;
}

// 🔥 NEW: Proper type for scheduler status
export interface SchedulerStatus {
  is_running: boolean;
  last_run: string | null;
  next_run: string | null;
  pending_jobs: number;
  failed_jobs: number;
  total_processed: number;
  uptime: string;
  version: string;
}

export interface SchedulerStatusResponse {
  success: boolean;
  status: SchedulerStatus;
}

export const emailApi = createApi({
  reducerPath: "emailApi",
  baseQuery: fetchBaseQuery({
    // baseUrl: `${API_BASE_URL}/auth`,
    baseUrl: `${API_BASE_URL}/emails`,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["EmailTemplate", "EmailHistory", "ScheduledEmail", "EmailStats"],
  endpoints: (builder) => ({
    // Get email templates
    getEmailTemplates: builder.query<EmailTemplatesResponse, void>({
      query: () => "/templates",
      providesTags: ["EmailTemplate"],
    }),

    // Test CMS connection
    testCmsConnection: builder.query<
      { success: boolean; message: string },
      void
    >({
      query: () => "/templates/test",
    }),

    // Send email to individual lead
    sendEmailToLead: builder.mutation<
      EmailResponse,
      { leadId: string; data: SendEmailRequest }
    >({
      query: ({ leadId, data }) => ({
        url: `/leads/${leadId}/send`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["EmailHistory", "EmailStats", "ScheduledEmail"],
    }),

    // Send bulk email
    sendBulkEmail: builder.mutation<EmailResponse, BulkEmailRequest>({
      query: (data) => ({
        url: "/bulk-send",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["EmailHistory", "EmailStats", "ScheduledEmail"],
    }),

    // Get email history for a lead
    getLeadEmailHistory: builder.query<
      EmailHistoryResponse,
      {
        leadId: string;
        page?: number;
        limit?: number;
        status?: "sent" | "failed" | "pending" | "cancelled";
      }
    >({
      query: ({ leadId, page = 1, limit = 10, status }) => {
        const params = new URLSearchParams();
        params.append("page", page.toString());
        params.append("limit", limit.toString());
        if (status) params.append("status", status);

        return `/leads/${leadId}/history?${params.toString()}`;
      },
      providesTags: (result, error, { leadId }) => [
        { type: "EmailHistory", id: leadId },
      ],
    }),

    // Get scheduled emails
    getScheduledEmails: builder.query<
      ScheduledEmailsResponse,
      {
        page?: number;
        limit?: number;
        status?: "pending" | "sent" | "failed" | "cancelled";
      }
    >({
      query: ({ page = 1, limit = 20, status = "pending" }) => {
        const params = new URLSearchParams();
        params.append("page", page.toString());
        params.append("limit", limit.toString());
        params.append("status", status);

        return `/scheduled?${params.toString()}`;
      },
      providesTags: ["ScheduledEmail"],
    }),

    // Cancel scheduled email
    cancelScheduledEmail: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (emailId) => ({
        url: `/scheduled/${emailId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ScheduledEmail", "EmailStats"],
    }),

    // Get email statistics
    getEmailStats: builder.query<EmailStatsResponse, void>({
      query: () => "/stats",
      providesTags: ["EmailStats"],
    }),

    // Get scheduler status (Admin only)
    getSchedulerStatus: builder.query<SchedulerStatusResponse, void>({
      query: () => "/scheduler/status",
    }),

    // Test email connection (Admin only)
    testEmailConnection: builder.query<
      { success: boolean; message: string },
      void
    >({
      query: () => "/test-connection",
    }),
  }),
});

export const {
  useGetEmailTemplatesQuery,
  useTestCmsConnectionQuery,
  useSendEmailToLeadMutation,
  useSendBulkEmailMutation,
  useGetLeadEmailHistoryQuery,
  useGetScheduledEmailsQuery,
  useCancelScheduledEmailMutation,
  useGetEmailStatsQuery,
  useGetSchedulerStatusQuery,
  useTestEmailConnectionQuery,
} = emailApi;
