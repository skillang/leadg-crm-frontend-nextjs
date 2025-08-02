// src/redux/utils/baseQueryWithReauth.ts

import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  BaseQueryFn,
  FetchArgs,
  BaseQueryApi,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import { RootState } from "../store";
import { clearAuthState, updateTokens } from "../slices/authSlice";

// Global notification service - will be set by NotificationProvider
let globalNotificationService: {
  showError: (description: string, title?: string) => void;
  showWarning: (description: string, title?: string) => void;
  showSuccess: (description: string, title?: string) => void;
  showConfirm: (options: {
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "default" | "destructive";
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
  }) => void;
} | null = null;

// Function to set the notification service (called from NotificationProvider)
export const setNotificationService = (
  service: typeof globalNotificationService
) => {
  globalNotificationService = service;
};

// Enhanced base query that handles token refresh and automatic logout
export const createBaseQueryWithReauth = (
  baseUrl: string
): BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> => {
  const baseQuery = fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const token = state.auth.token;

      if (token) {
        headers.set("authorization", `Bearer ${token}`);
        headers.set("accept", "application/json");
      }

      // ✅ FIXED: Don't set Content-Type manually - let RTK Query handle it
      // RTK Query will automatically:
      // - Set "application/json" for object bodies
      // - Let browser set "multipart/form-data; boundary=..." for FormData
      // This ensures FormData uploads work correctly

      return headers;
    },
  });

  return async (args, api, extraOptions) => {
    let result = await baseQuery(args, api, extraOptions);

    // Handle 401 errors (token expired)
    if (result.error && result.error.status === 401) {
      console.log("🔄 Access token expired, attempting refresh...");

      const state = api.getState() as RootState;
      const refreshToken =
        state.auth.refreshToken || localStorage.getItem("refresh_token");

      if (refreshToken) {
        try {
          const refreshResult = await baseQuery(
            {
              url: "/auth/refresh",
              method: "POST",
              body: { refresh_token: refreshToken },
            },
            api,
            extraOptions
          );

          if (refreshResult.data) {
            const refreshResponseData = refreshResult.data as {
              access_token: string;
              token_type: string;
              expires_in: number;
              refresh_token?: string;
            };

            const newTokens = {
              access_token: refreshResponseData.access_token,
              refresh_token: refreshResponseData.refresh_token || refreshToken,
              expires_in: refreshResponseData.expires_in,
            };

            // Update tokens in Redux
            api.dispatch(updateTokens(newTokens));

            // Update localStorage
            localStorage.setItem("access_token", newTokens.access_token);
            localStorage.setItem("refresh_token", newTokens.refresh_token);

            console.log("✅ Token refreshed successfully");

            if (refreshResponseData.refresh_token) {
              console.log(
                "🔄 New refresh token received (token rotation enabled)"
              );
            } else {
              console.log("⚠️ Same refresh token kept (no token rotation)");
            }

            // Retry the original request with new access token
            result = await baseQuery(args, api, extraOptions);
          } else {
            console.log("❌ Token refresh failed - no data in response");
            await handleForceLogout(api);
          }
        } catch (error) {
          console.error("💥 Token refresh error:", error);
          await handleForceLogout(api);
        }
      } else {
        console.log("❌ No refresh token available");
        await handleForceLogout(api);
      }
    }

    return result;
  };
};

const handleForceLogout = async (api: BaseQueryApi) => {
  console.log("🚪 Forcing logout due to token expiration");

  try {
    // Clear tokens from localStorage
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_data");
    localStorage.removeItem("token_created_at");

    // Clear auth state
    api.dispatch(clearAuthState());

    // 🔥 NEW: Use notification system if available
    if (globalNotificationService && typeof window !== "undefined") {
      // Show notification instead of browser alert
      globalNotificationService.showWarning(
        "Your session has expired. You will be redirected to the login page.",
        "Session Expired"
      );

      // Wait a moment for user to see the notification
      setTimeout(() => {
        redirectToLogin();
      }, 2000);
    } else {
      // Fallback to browser alert if notification system not available
      if (typeof window !== "undefined" && window.location) {
        const message = "Your session has expired. Please log in again.";

        if (window.confirm) {
          window.confirm(message);
        } else {
          alert(message);
        }

        redirectToLogin();
      }
    }
  } catch (error) {
    console.error("💥 Error during force logout:", error);
    // Still try to redirect even if cleanup fails
    redirectToLogin();
  }
};

// Helper function to handle redirect
const redirectToLogin = () => {
  if (typeof window !== "undefined" && window.location) {
    const currentPath = window.location.pathname;
    if (!currentPath.includes("/login") && !currentPath.includes("/auth")) {
      window.location.href = "/login";
    }
  }
};
