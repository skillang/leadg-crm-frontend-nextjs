// src/redux/slices/facebookApi.ts

import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQueryWithReauth } from "../utils/baseQuerryWithReauth";

// ============================
// INTERFACES / TYPES
// ============================

// Facebook Form interfaces
export interface FacebookFormCategoryMapping {
  category: string;
  confidence: "high" | "medium" | "low";
  reasoning: string;
  matched_keywords: string[];
  priority_level: number;
}

export interface FacebookForm {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  created_time: string;
  leads_count: number;
  page_id: string;
  category_mapping: FacebookFormCategoryMapping;
  suggested_category: string;
  mapping_confidence: "high" | "medium" | "low";
  mapping_reasoning: string;
}

export interface FacebookFormsResponse {
  success: boolean;
  forms: FacebookForm[];
}

// Facebook Lead interfaces
export interface FacebookLead {
  facebook_lead_id: string;
  form_id: string;
  platform: string;
  created_time: string;
  ad_id?: string | null;
  campaign_id?: string | null;
  adset_id?: string | null;
  name: string;
  email: string;
  phone: string;
  course_interest: string;
  city: string;
  experience: string;
  education: string;
  age: string;
  nationality: string;
  source: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw_field_data: Record<string, any>;
}

export interface FacebookLeadsPreviewResponse {
  success: boolean;
  leads: FacebookLead[];
}

// Import Lead Request interface
export interface ImportLeadRequest {
  form_id: string;
  category_override?: string | null;
  auto_assign: boolean;
  limit: number;
}

export interface ImportLeadResponse {
  success: boolean;
  message: string;
  form_info?: {
    form_id: string;
    form_name: string;
    assigned_category: string;
  };
  import_status?: "completed" | "in_progress";
  stats?: {
    total_facebook_leads: number;
    imported_count: number;
    failed_count: number;
    skipped_count: number;
  };
  errors?: string[];
}

// ============================
// BASE QUERY
// ============================

const baseQuery = createBaseQueryWithReauth(
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
);

// ============================
// RTK QUERY API SLICE
// ============================

export const facebookApi = createApi({
  reducerPath: "facebookApi",
  baseQuery,
  tagTypes: ["FacebookForm", "FacebookLead"],
  endpoints: (builder) => ({
    // ========================================================================
    // GET ALL FACEBOOK FORMS
    // ========================================================================
    getFacebookForms: builder.query<FacebookFormsResponse, void>({
      query: () => "/facebook/forms",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transformResponse: (response: any): FacebookFormsResponse => {
        // Handle both direct response and nested response structures
        if (response && typeof response === "object") {
          if (response.forms && Array.isArray(response.forms)) {
            return {
              success: response.success ?? true,
              forms: response.forms,
            };
          }
          // If response is already an array, wrap it
          if (Array.isArray(response)) {
            return {
              success: true,
              forms: response,
            };
          }
        }

        // Fallback for unexpected response structure
        console.warn("Unexpected Facebook forms response structure:", response);
        return {
          success: false,
          forms: [],
        };
      },
      providesTags: [{ type: "FacebookForm", id: "LIST" }],
    }),

    // ========================================================================
    // PREVIEW LEADS FROM SPECIFIC FORM
    // ========================================================================
    previewFacebookFormLeads: builder.query<
      FacebookLeadsPreviewResponse,
      { form_id: string; limit?: number }
    >({
      query: ({ form_id, limit = 10 }) => {
        const params = new URLSearchParams();
        params.append("limit", limit.toString());

        return `/facebook/forms/${form_id}/preview?${params.toString()}`;
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transformResponse: (response: any): FacebookLeadsPreviewResponse => {
        // Handle both direct response and nested response structures
        if (response && typeof response === "object") {
          if (response.leads && Array.isArray(response.leads)) {
            return {
              success: response.success ?? true,
              leads: response.leads,
            };
          }
          // If response is already an array, wrap it
          if (Array.isArray(response)) {
            return {
              success: true,
              leads: response,
            };
          }
        }

        // Fallback for unexpected response structure
        console.warn(
          "Unexpected Facebook leads preview response structure:",
          response
        );
        return {
          success: false,
          leads: [],
        };
      },
      providesTags: (result, error, { form_id }) => [
        { type: "FacebookLead", id: form_id },
      ],
    }),

    // ========================================================================
    // IMPORT LEADS FROM SINGLE FACEBOOK FORM
    // ========================================================================
    importFacebookFormLeads: builder.mutation<
      ImportLeadResponse,
      ImportLeadRequest
    >({
      query: (importData) => ({
        url: "/facebook/import/single-form",
        method: "POST",
        body: importData,
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transformResponse: (response: any): ImportLeadResponse => {
        // Handle new enhanced response format with stats
        if (response && typeof response === "object") {
          if (response.stats) {
            // New format with detailed stats
            return {
              success: response.success ?? true,
              message: response.message || "Import completed successfully",
              form_info: response.form_info,
              import_status: response.import_status || "completed",
              stats: {
                total_facebook_leads: response.stats.total_facebook_leads || 0,
                imported_count: response.stats.imported_count || 0,
                failed_count: response.stats.failed_count || 0,
                skipped_count: response.stats.skipped_count || 0,
              },
              errors: response.errors || [],
            };
          }

          // Handle old format (existing logic)
          return {
            success: response.success ?? true,
            message: response.message || "Import completed successfully",
            errors: response.errors || [],
          };
        }

        // Fallback for string responses
        if (typeof response === "string") {
          return {
            success: true,
            message: response,
          };
        }

        // Fallback for unexpected response structure
        console.warn("Unexpected import response structure:", response);
        return {
          success: false,
          message: "Import failed with unexpected response",
        };
      },
      invalidatesTags: [
        { type: "FacebookForm", id: "LIST" },
        { type: "FacebookLead", id: "LIST" },
      ],
    }),
  }),
});

// ============================
// EXPORT HOOKS
// ============================

export const {
  useGetFacebookFormsQuery,
  usePreviewFacebookFormLeadsQuery,
  useImportFacebookFormLeadsMutation,
} = facebookApi;

// ============================
// HELPER FUNCTIONS
// ============================

// Helper function to format confidence level for display
export const formatConfidenceLevel = (confidence: string): string => {
  switch (confidence) {
    case "high":
      return "High Confidence";
    case "medium":
      return "Medium Confidence";
    case "low":
      return "Low Confidence";
    default:
      return "Unknown";
  }
};

// Helper function to get confidence color for UI
export const getConfidenceColor = (confidence: string): string => {
  switch (confidence) {
    case "high":
      return "text-green-600 bg-green-100";
    case "medium":
      return "text-yellow-600 bg-yellow-100";
    case "low":
      return "text-red-600 bg-red-100";
    default:
      return "text-gray-600 bg-gray-100";
  }
};

// Helper function to format form status
export const formatFormStatus = (status: string): string => {
  switch (status) {
    case "ACTIVE":
      return "Active";
    case "INACTIVE":
      return "Inactive";
    case "ARCHIVED":
      return "Archived";
    default:
      return status;
  }
};

// Helper function to get status color for UI
export const getStatusColor = (status: string): string => {
  switch (status) {
    case "ACTIVE":
      return "text-green-600 bg-green-100";
    case "INACTIVE":
      return "text-gray-600 bg-gray-100";
    case "ARCHIVED":
      return "text-red-600 bg-red-100";
    default:
      return "text-gray-600 bg-gray-100";
  }
};
