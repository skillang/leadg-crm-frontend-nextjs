// src/redux/slices/passwordResetApi.ts
// Password Reset API Slice for LeadG CRM Frontend
// Uses RTK Query with createBaseQueryWithReauth for automatic token refresh

import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQueryWithReauth } from "../utils/baseQuerryWithReauth";
import {
  // Request types
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ValidateTokenRequest,
  AdminResetPasswordRequest,

  // Response types
  ForgotPasswordResponse,
  ResetPasswordResponse,
  ValidateResetTokenResponse,
  AdminResetPasswordResponse,
  PasswordResetStats,
  UserResetHistoryResponse,

  // Utility types
  PasswordResetAPIError,
} from "@/models/types/passwordReset";

// Create base query with authentication and token refresh
const baseQuery = createBaseQueryWithReauth(
  `${
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
  }/auth/password-reset`
);

// Password Reset API slice
export const passwordResetApi = createApi({
  reducerPath: "passwordResetApi",
  baseQuery,
  tagTypes: ["PasswordReset", "ResetHistory", "ResetStats"],

  endpoints: (builder) => ({
    // ========================================================================
    // USER SELF-SERVICE ENDPOINTS (No Authentication Required)
    // ========================================================================

    forgotPassword: builder.mutation<
      ForgotPasswordResponse,
      ForgotPasswordRequest
    >({
      query: (forgotPasswordData) => ({
        url: "/forgot-password",
        method: "POST",
        body: forgotPasswordData,
      }),
      // No auth required for this endpoint - it's public
      transformResponse: (response: ForgotPasswordResponse) => {
        // Log for debugging (remove in production)
        console.log("🔐 Forgot password response:", response);
        return response;
      },
      transformErrorResponse: (response: PasswordResetAPIError) => {
        console.error("❌ Forgot password error:", response);
        return response;
      },
    }),

    validateResetToken: builder.query<
      ValidateResetTokenResponse,
      ValidateTokenRequest
    >({
      query: (validateData) => ({
        url: `/validate-token?token=${encodeURIComponent(validateData.token)}`,
        method: "GET",
      }),
      // Cache token validation for 5 minutes to avoid repeated calls
      keepUnusedDataFor: 300,
      transformResponse: (response: ValidateResetTokenResponse) => {
        console.log("🔍 Token validation response:", response);
        return response;
      },
    }),

    resetPassword: builder.mutation<
      ResetPasswordResponse,
      ResetPasswordRequest
    >({
      query: (resetPasswordData) => ({
        url: "/reset-password",
        method: "POST",
        body: resetPasswordData,
      }),
      transformResponse: (response: ResetPasswordResponse) => {
        console.log("✅ Password reset response:", response);
        return response;
      },
      // Invalidate token validation cache after successful reset
      invalidatesTags: ["PasswordReset"],
    }),

    // ========================================================================
    // ADMIN ENDPOINTS (Authentication Required)
    // ========================================================================

    adminResetUserPassword: builder.mutation<
      AdminResetPasswordResponse,
      AdminResetPasswordRequest
    >({
      query: (adminResetData) => ({
        url: "/admin/reset-user-password",
        method: "POST",
        body: adminResetData,
      }),
      transformResponse: (response: AdminResetPasswordResponse) => {
        console.log("👨‍💼 Admin password reset response:", response);
        return response;
      },
      // Invalidate related data after admin reset
      invalidatesTags: ["ResetHistory", "ResetStats"],
    }),

    getPasswordResetStatistics: builder.query<PasswordResetStats, void>({
      query: () => ({
        url: "/admin/reset-statistics",
        method: "GET",
      }),
      // Cache stats for 5 minutes
      keepUnusedDataFor: 300,
      providesTags: ["ResetStats"],
    }),

    getUserResetHistory: builder.query<
      UserResetHistoryResponse,
      { userEmail: string; limit?: number }
    >({
      query: ({ userEmail, limit = 10 }) => ({
        url: `/admin/user-reset-history?user_email=${encodeURIComponent(
          userEmail
        )}&limit=${limit}`,
        method: "GET",
      }),
      // Cache history for 10 minutes
      keepUnusedDataFor: 600,
      providesTags: (result, error, { userEmail }) => [
        { type: "ResetHistory" as const, id: userEmail },
      ],
    }),

    revokeUserResetTokens: builder.mutation<
      { success: boolean; message: string; tokens_revoked: number },
      { userEmail: string }
    >({
      query: ({ userEmail }) => ({
        url: `/admin/revoke-user-tokens?user_email=${encodeURIComponent(
          userEmail
        )}`,
        method: "POST",
      }),
      // Invalidate user's reset history after revoking tokens
      invalidatesTags: (result, error, { userEmail }) => [
        { type: "ResetHistory" as const, id: userEmail },
        "ResetStats",
      ],
    }),

    cleanupExpiredTokens: builder.mutation<
      { success: boolean; message: string; timestamp: string },
      void
    >({
      query: () => ({
        url: "/admin/cleanup-expired-tokens",
        method: "POST",
      }),
      // Refresh stats after cleanup
      invalidatesTags: ["ResetStats"],
    }),

    // ========================================================================
    // UTILITY ENDPOINTS
    // ========================================================================

    getPasswordResetHealth: builder.query<
      {
        service: string;
        status: string;
        timestamp: string;
        features: {
          user_self_service: boolean;
          admin_reset: boolean;
          email_integration: boolean;
          rate_limiting: boolean;
          token_cleanup: boolean;
        };
        email_service?: {
          configured: boolean;
          connection: boolean;
        };
      },
      void
    >({
      query: () => ({
        url: "/health",
        method: "GET",
      }),
      // Cache health check for 2 minutes
      keepUnusedDataFor: 120,
    }),
  }),
});

// Export hooks for use in components
export const {
  // User self-service hooks (no auth required)
  useForgotPasswordMutation,
  useValidateResetTokenQuery,
  useLazyValidateResetTokenQuery,
  useResetPasswordMutation,

  // Admin hooks (auth required)
  useAdminResetUserPasswordMutation,
  useGetPasswordResetStatisticsQuery,
  useGetUserResetHistoryQuery,
  useLazyGetUserResetHistoryQuery,
  useRevokeUserResetTokensMutation,
  useCleanupExpiredTokensMutation,

  // Utility hooks
  useGetPasswordResetHealthQuery,
} = passwordResetApi;
