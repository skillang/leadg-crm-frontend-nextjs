// src/redux/slices/fcmApi.ts

import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQueryWithReauth } from "../utils/baseQuerryWithReauth";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// Request Types
export interface RegisterTokenRequest {
  fcm_token: string;
  device_info: string;
}

export interface UpdateTokenRequest {
  fcm_token: string;
  device_info: string;
}

export interface SendTestNotificationRequest {
  user_email?: string;
  title: string;
  message: string;
}

// Response Types
export interface RegisterTokenResponse {
  success: boolean;
  message: string;
  user_email: string;
  token_registered_at: string;
}

export interface UpdateTokenResponse {
  success: boolean;
  message: string;
  user_email: string;
  token_registered_at: string;
}

export interface RemoveTokenResponse {
  success: boolean;
  message: string;
}

export interface TokenStatusResponse {
  success: boolean;
  has_token: string | boolean;
  token_registered: string;
  last_updated: string;
  device_info: string;
}

export interface MyFcmStatusResponse {
  success: boolean;
  user_email: string;
  has_fcm_token: boolean;
  token_registered_at: string;
  device_info: string;
  status: string;
  message: string;
}

export interface FirebaseStatusResponse {
  success: boolean;
  firebase_initialized: boolean;
  message: string;
}

export interface TestNotificationResponse {
  success: boolean;
  message: string;
  notification_id?: string;
  sent_to?: string;
}

// Error Response Type
export interface ValidationError {
  detail: Array<{
    loc: (string | number)[];
    msg: string;
    type: string;
  }>;
}

// ============================================================================
// BASE QUERY CONFIGURATION
// ============================================================================

const baseQuery = createBaseQueryWithReauth(
  `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}`
);

// ============================================================================
// API SLICE
// ============================================================================

export const fcmApi = createApi({
  reducerPath: "fcmApi",
  baseQuery,
  tagTypes: ["FCMToken", "FCMStatus"],

  endpoints: (builder) => ({
    // ========================================================================
    // REGISTER FCM TOKEN
    // ========================================================================
    registerFcmToken: builder.mutation<
      RegisterTokenResponse,
      RegisterTokenRequest
    >({
      query: (tokenData) => ({
        url: "/fcm/register-token",
        method: "POST",
        body: tokenData,
      }),
      invalidatesTags: ["FCMToken", "FCMStatus"],
      transformResponse: (response: RegisterTokenResponse) => {
        console.log("✅ FCM token registered:", response);
        return response;
      },
      transformErrorResponse: (error) => {
        console.error("❌ FCM token registration error:", error);
        return error;
      },
    }),

    // ========================================================================
    // UPDATE FCM TOKEN
    // ========================================================================
    updateFcmToken: builder.mutation<UpdateTokenResponse, UpdateTokenRequest>({
      query: (tokenData) => ({
        url: "/fcm/update-token",
        method: "PUT",
        body: tokenData,
      }),
      invalidatesTags: ["FCMToken", "FCMStatus"],
      transformResponse: (response: UpdateTokenResponse) => {
        console.log("✅ FCM token updated:", response);
        return response;
      },
      transformErrorResponse: (error) => {
        console.error("❌ FCM token update error:", error);
        return error;
      },
    }),

    // ========================================================================
    // REMOVE FCM TOKEN
    // ========================================================================
    removeFcmToken: builder.mutation<RemoveTokenResponse, void>({
      query: () => ({
        url: "/fcm/remove-token",
        method: "DELETE",
      }),
      invalidatesTags: ["FCMToken", "FCMStatus"],
      transformResponse: (response: RemoveTokenResponse) => {
        console.log("✅ FCM token removed:", response);
        return response;
      },
      transformErrorResponse: (error) => {
        console.error("❌ FCM token removal error:", error);
        return error;
      },
    }),

    // ========================================================================
    // GET FCM TOKEN STATUS
    // ========================================================================
    getFcmTokenStatus: builder.query<TokenStatusResponse, void>({
      query: () => "/fcm/token-status",
      providesTags: ["FCMToken"],
      transformResponse: (response: TokenStatusResponse) => {
        console.log("📊 FCM token status:", response);
        return response;
      },
    }),

    // ========================================================================
    // GET MY FCM STATUS (Test Endpoint)
    // ========================================================================
    getMyFcmStatus: builder.query<MyFcmStatusResponse, void>({
      query: () => "/fcm-test/my-fcm-status",
      providesTags: ["FCMStatus"],
      transformResponse: (response: MyFcmStatusResponse) => {
        console.log("📊 My FCM status:", response);
        return response;
      },
    }),

    // ========================================================================
    // CHECK FIREBASE STATUS (Test Endpoint)
    // ========================================================================
    getFirebaseStatus: builder.query<FirebaseStatusResponse, void>({
      query: () => "/fcm-test/firebase-status",
      transformResponse: (response: FirebaseStatusResponse) => {
        console.log("🔥 Firebase status:", response);
        return response;
      },
    }),

    // ========================================================================
    // SEND TEST NOTIFICATION (Test Endpoint)
    // ========================================================================
    sendTestNotification: builder.mutation<
      TestNotificationResponse,
      SendTestNotificationRequest
    >({
      query: (notificationData) => ({
        url: "/fcm-test/test-notification",
        method: "POST",
        body: notificationData,
      }),
      transformResponse: (response: TestNotificationResponse) => {
        console.log("✅ Test notification sent:", response);
        return response;
      },
      transformErrorResponse: (error) => {
        console.error("❌ Test notification error:", error);
        return error;
      },
    }),
  }),
});

// ============================================================================
// EXPORT HOOKS
// ============================================================================

export const {
  // Mutations
  useRegisterFcmTokenMutation,
  useUpdateFcmTokenMutation,
  useRemoveFcmTokenMutation,
  useSendTestNotificationMutation,

  // Queries
  useGetFcmTokenStatusQuery,
  useGetMyFcmStatusQuery,
  useGetFirebaseStatusQuery,

  // Lazy Queries
  useLazyGetFcmTokenStatusQuery,
  useLazyGetMyFcmStatusQuery,
  useLazyGetFirebaseStatusQuery,
} = fcmApi;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if FCM token is valid
 */
export const isValidFcmToken = (token: string | null | undefined): boolean => {
  if (!token) return false;
  // FCM tokens are typically 152-163 characters long
  return token.length >= 140 && token.includes(":");
};

/**
 * Get device info string
 */
export const getDeviceInfo = (): string => {
  const userAgent = navigator.userAgent;
  let browserName = "Unknown Browser";
  let osName = "Unknown OS";

  // Detect browser
  if (userAgent.indexOf("Chrome") > -1) {
    browserName = "Chrome";
  } else if (userAgent.indexOf("Safari") > -1) {
    browserName = "Safari";
  } else if (userAgent.indexOf("Firefox") > -1) {
    browserName = "Firefox";
  } else if (userAgent.indexOf("Edge") > -1) {
    browserName = "Edge";
  }

  // Detect OS
  if (userAgent.indexOf("Windows") > -1) {
    osName = "Windows";
  } else if (userAgent.indexOf("Mac") > -1) {
    osName = "macOS";
  } else if (userAgent.indexOf("Linux") > -1) {
    osName = "Linux";
  } else if (userAgent.indexOf("Android") > -1) {
    osName = "Android";
  } else if (userAgent.indexOf("iOS") > -1) {
    osName = "iOS";
  }

  return `${browserName} on ${osName}`;
};

// ============================================================================
// EXPORT API REDUCER
// ============================================================================

export default fcmApi.reducer;
