// src/redux/slices/emailApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQueryWithReauth } from "../utils/baseQuerryWithReauth";
import {
  // EmailTemplate,
  EmailTemplatesResponse,
  SendEmailRequest,
  BulkEmailRequest,
  EmailResponse,
  // EmailHistoryItem,
  EmailHistoryResponse,
  // ScheduledEmail,
  ScheduledEmailsResponse,
  // EmailStats,
  EmailStatsResponse, 
  // SchedulerStatus,
  SchedulerStatusResponse,
  // EmailStatus,
} from "@/models/types/email";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// Base query with authentication and auto-refresh
const baseQuery = createBaseQueryWithReauth(`${API_BASE_URL}/emails`);

export const emailApi = createApi({
  reducerPath: "emailApi",
  baseQuery: baseQuery,
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
