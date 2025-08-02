// src/redux/slices/whatsappApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  WhatsAppTemplate,
  AccountStatusResponse,
  ContactValidationResponse,
  SendTemplateResponse,
  SendTextResponse,
  TemplateMessageRequest,
  TextMessageRequest,
  TemplateApiResponse,
  CreateBulkWhatsAppJobRequest,
  CreateBulkWhatsAppJobResponse,
  BulkWhatsAppJobsResponse,
  BulkWhatsAppJobStatusResponse,
  // CancelBulkJobRequest,
  BulkWhatsAppStatsResponse,
  ValidatePhoneNumbersResponse,
} from "@/models/types/whatsapp";
import { createBaseQueryWithReauth } from "../utils/baseQuerryWithReauth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const baseQuery = createBaseQueryWithReauth(`${API_BASE_URL}`);

export const whatsappApi = createApi({
  reducerPath: "whatsappApi",
  baseQuery: baseQuery,
  tagTypes: ["WhatsAppStatus", "Templates"],
  endpoints: (builder) => ({
    // Check WhatsApp account status
    checkAccountStatus: builder.query<AccountStatusResponse, void>({
      query: () => "/whatsapp/account/status",
      providesTags: ["WhatsAppStatus"],
    }),

    // Validate contact number
    validateContact: builder.mutation<ContactValidationResponse, string>({
      query: (contact) => ({
        url: "/whatsapp/validate-contact",
        method: "POST",
        body: { contact },
      }),
    }),

    // Get available templates
    getTemplates: builder.query<WhatsAppTemplate[], void>({
      query: () => "/whatsapp/templates",
      providesTags: ["Templates"],
      transformResponse: (
        response: TemplateApiResponse | WhatsAppTemplate[]
      ) => {
        // Handle both direct array response and wrapped response
        if (Array.isArray(response)) {
          return response;
        }
        // Check for common response wrapper patterns
        return response.data || response.templates || [];
      },
    }),

    // Send template message
    sendTemplate: builder.mutation<
      SendTemplateResponse,
      TemplateMessageRequest
    >({
      query: ({ template_name, contact, lead_name }) => ({
        url: "/whatsapp/send-template",
        method: "POST",
        body: {
          template_name,
          contact,
          lead_name,
        },
      }),
      invalidatesTags: ["WhatsAppStatus"],
    }),

    // Send text message
    sendTextMessage: builder.mutation<SendTextResponse, TextMessageRequest>({
      query: ({ contact, message }) => ({
        url: "/whatsapp/send-text",
        method: "POST",
        body: {
          contact,
          message,
        },
      }),
      invalidatesTags: ["WhatsAppStatus"],
    }),

    createBulkWhatsAppJob: builder.mutation<
      CreateBulkWhatsAppJobResponse,
      CreateBulkWhatsAppJobRequest
    >({
      query: (data) => ({
        url: "/bulk-whatsapp/jobs",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["WhatsAppStatus"],
    }),

    // List bulk WhatsApp jobs with pagination
    getBulkWhatsAppJobs: builder.query<
      BulkWhatsAppJobsResponse,
      { page?: number; per_page?: number; status?: string }
    >({
      query: ({ page = 1, per_page = 20, status }) => {
        const params = new URLSearchParams();
        params.append("page", page.toString());
        params.append("per_page", per_page.toString());
        if (status) params.append("status", status);

        return `/bulk-whatsapp/jobs?${params.toString()}`;
      },
      providesTags: ["WhatsAppStatus"],
    }),

    // Get specific bulk job status
    getBulkWhatsAppJobStatus: builder.query<
      BulkWhatsAppJobStatusResponse,
      string
    >({
      query: (jobId) => `/bulk-whatsapp/jobs/${jobId}`,
      providesTags: ["WhatsAppStatus"],
    }),

    // Cancel bulk WhatsApp job
    cancelBulkWhatsAppJob: builder.mutation<
      string,
      { jobId: string; reason: string }
    >({
      query: ({ jobId, reason }) => ({
        url: `/bulk-whatsapp/jobs/${jobId}/cancel`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["WhatsAppStatus"],
    }),

    // Get bulk WhatsApp statistics
    getBulkWhatsAppStats: builder.query<BulkWhatsAppStatsResponse, void>({
      query: () => "/bulk-whatsapp/stats",
      providesTags: ["WhatsAppStatus"],
    }),

    // Get active WhatsApp jobs (Admin only)
    getActiveWhatsAppJobs: builder.query<unknown, void>({
      query: () => "/bulk-whatsapp/active-jobs",
      providesTags: ["WhatsAppStatus"],
    }),

    // Validate phone numbers for bulk messaging
    validatePhoneNumbers: builder.mutation<
      ValidatePhoneNumbersResponse,
      string[]
    >({
      query: (phoneNumbers) => ({
        url: "/bulk-whatsapp/validate-phone-numbers",
        method: "POST",
        body: phoneNumbers,
      }),
    }),

    // Health check for bulk WhatsApp service
    // getWhatsAppHealth: builder.query<any, void>({
    //   query: () => "/bulk-whatsapp/health",
    // }),
  }),
});

export const {
  useCheckAccountStatusQuery,
  useValidateContactMutation,
  useGetTemplatesQuery,
  useSendTemplateMutation,
  useSendTextMessageMutation,
  useCreateBulkWhatsAppJobMutation,
  useGetBulkWhatsAppJobsQuery,
  useGetBulkWhatsAppJobStatusQuery,
  useCancelBulkWhatsAppJobMutation,
  useGetBulkWhatsAppStatsQuery,
  useGetActiveWhatsAppJobsQuery,
  useValidatePhoneNumbersMutation,
} = whatsappApi;
