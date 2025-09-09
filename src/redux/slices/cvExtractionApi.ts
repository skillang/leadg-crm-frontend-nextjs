// src/redux/slices/cvExtractionApi.ts

import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQueryWithReauth } from "../utils/baseQuerryWithReauth";
import {
  CVExtraction,
  CVExtractionsResponse,
  CVUploadResponse,
  UpdateCVExtractionRequest,
  ConvertToLeadRequest,
  ConvertToLeadResponse,
} from "@/models/types/cvExtraction";

// Base query with authentication
const baseQuery = createBaseQueryWithReauth(
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
);

export const cvExtractionApi = createApi({
  reducerPath: "cvExtractionApi",
  baseQuery,
  tagTypes: ["CVExtraction"],
  endpoints: (builder) => ({
    // Upload CV file
    uploadCV: builder.mutation<CVUploadResponse, FormData>({
      query: (formData) => ({
        url: "/cv/upload",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["CVExtraction"],
    }),

    // Get CV extractions list
    getCVExtractions: builder.query<
      CVExtractionsResponse,
      {
        page?: number;
        limit?: number;
        status?: string;
        user_filter?: string;
      }
    >({
      query: ({ page = 1, limit = 20, status, user_filter }) => {
        const params = new URLSearchParams();
        params.append("page", page.toString());
        params.append("limit", limit.toString());
        if (status) params.append("status", status);
        if (user_filter) params.append("user_filter", user_filter);
        return `/cv/extractions?${params.toString()}`;
      },
      providesTags: ["CVExtraction"],
    }),

    // Update CV extraction
    updateCVExtraction: builder.mutation<
      CVExtraction,
      { processing_id: string; data: UpdateCVExtractionRequest }
    >({
      query: ({ processing_id, data }) => ({
        url: `/cv/extractions/${processing_id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["CVExtraction"],
    }),

    // Delete CV extraction
    deleteCVExtraction: builder.mutation<{ success: boolean }, string>({
      query: (processing_id) => ({
        url: `/cv/extractions/${processing_id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["CVExtraction"],
    }),

    // Convert CV to lead
    convertToLead: builder.mutation<
      ConvertToLeadResponse,
      ConvertToLeadRequest
    >({
      query: (data) => ({
        url: "/cv/convert-to-lead",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["CVExtraction"],
    }),
  }),
});

// Export hooks
export const {
  useUploadCVMutation,
  useGetCVExtractionsQuery,
  useUpdateCVExtractionMutation,
  useDeleteCVExtractionMutation,
  useConvertToLeadMutation,
} = cvExtractionApi;
