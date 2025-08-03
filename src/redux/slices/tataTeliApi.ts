// src/redux/slices/tataTeliApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQueryWithReauth } from "../utils/baseQuerryWithReauth";
import {
  ValidateCallRequest,
  ValidateCallResponse,
  ClickToCallRequest,
  ClickToCallResponse,
  CreateMappingRequest,
  UserMappingResponse,
} from "@/models/types/tatatTeli";

// Define interfaces for error handling
interface ApiErrorData {
  detail?: string;
  message?: string;
  error?: string;
}

interface ApiErrorResponse {
  data?: ApiErrorData;
  status: number;
  message?: string;
}

// Define interface for click to call body
interface ClickToCallBody {
  lead_id: string;
  notes?: string;
  call_purpose?: string;
  priority?: string;
}

// Base query with authentication and auto-refresh
const baseQuery = createBaseQueryWithReauth(
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
);

export const tataTeliApi = createApi({
  reducerPath: "tataTeliApi",
  baseQuery,
  tagTypes: ["TataUserMapping"],
  endpoints: (builder) => ({
    // Validate call - triggered when modal opens
    validateCall: builder.mutation<ValidateCallResponse, ValidateCallRequest>({
      query: ({ lead_id }) => ({
        url: "/tata-calls/validate-call",
        method: "POST",
        body: { lead_id },
      }),
      transformErrorResponse: (response: ApiErrorResponse) => {
        return {
          message: response?.data?.detail || "Failed to validate call",
          status: response.status,
        };
      },
    }),

    // Make call - click to call simple
    clickToCall: builder.mutation<ClickToCallResponse, ClickToCallRequest>({
      query: ({ lead_id, notes, call_purpose, priority }) => {
        const body: ClickToCallBody = { lead_id };

        // Only include optional fields if they have values
        if (notes) body.notes = notes;
        if (call_purpose) body.call_purpose = call_purpose;
        if (priority) body.priority = priority;

        return {
          url: "/tata-calls/click-to-call-simple",
          method: "POST",
          body,
        };
      },
      transformErrorResponse: (response: ApiErrorResponse) => {
        return {
          message: response?.data?.detail || "Failed to make call",
          status: response.status,
        };
      },
    }),

    // Get user mappings (admin only)
    getUserMappings: builder.query<UserMappingResponse[], void>({
      query: () => "/tata-users/mappings",
      providesTags: ["TataUserMapping"],
      transformErrorResponse: (response: ApiErrorResponse) => {
        return {
          message: response?.data?.detail || "Failed to fetch user mappings",
          status: response.status,
        };
      },
    }),

    // Create user mapping (admin only)
    createUserMapping: builder.mutation<
      UserMappingResponse,
      CreateMappingRequest
    >({
      query: (mappingData) => ({
        url: "/tata-users/mappings",
        method: "POST",
        body: mappingData,
      }),
      invalidatesTags: ["TataUserMapping"],
      transformErrorResponse: (response: ApiErrorResponse) => {
        return {
          message: response?.data?.detail || "Failed to create user mapping",
          status: response.status,
        };
      },
    }),
  }),
});

export const {
  useValidateCallMutation,
  useClickToCallMutation,
  useGetUserMappingsQuery,
  useCreateUserMappingMutation,
} = tataTeliApi;
