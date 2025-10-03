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
    // localStorage.removeItem("access_token");
    // localStorage.removeItem("refresh_token");
    // localStorage.removeItem("user_data");
    // localStorage.removeItem("token_created_at");

    document.cookie = "access_token=; path=/; max-age=0";
    document.cookie = "user_role=; path=/; max-age=0";

    // Clear auth state
    api.dispatch(clearAuthState());

    // ✅ Use custom notification system instead of window.alert
    if (globalNotificationService && typeof window !== "undefined") {
      globalNotificationService.showConfirm({
        title: "Session Expired",
        description:
          "Your session has expired. Please log in again. To stay logged in, make sure to select 'Remember me for 30 days' next time",
        confirmText: "Go to Login",
        cancelText: "Stay Here",
        variant: "default",
        onConfirm: () => {
          redirectToLogin();
        },
        onCancel: () => {
          // User chose to stay, show additional guidance
          globalNotificationService?.showWarning(
            "You will need to refresh the page or navigate to login manually to continue.",
            "Authentication Required"
          );
        },
      });
    } else {
      // Fallback for when notification system isn't available
      if (typeof window !== "undefined" && window.location) {
        const userConfirmed = window.confirm(
          "Your session has expired. Please log in again."
        );
        if (userConfirmed) {
          redirectToLogin();
        }
      }
    }
  } catch (error) {
    console.error("💥 Error during force logout:", error);

    // Show error notification and still redirect
    if (globalNotificationService) {
      globalNotificationService.showError(
        "An error occurred during logout. You will be redirected to login.",
        "Logout Error"
      );
    }

    // Still redirect even if cleanup fails
    setTimeout(() => {
      redirectToLogin();
    }, 2000);
  }
};

// Helper function to handle redirect
const redirectToLogin = () => {
  if (typeof window !== "undefined" && window.location) {
    const currentPath = window.location.pathname;
    if (!currentPath.includes("/login") && !currentPath.includes("/auth")) {
      // Add some delay to allow user to see notifications
      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
    }
  }
};
