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

      headers.set("content-type", "application/json");
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
          // 🔥 FIX: Change URL from "/auth/refresh" to "/refresh"
          const refreshResult = await baseQuery(
            {
              url: "/refresh", // ✅ FIXED - Correct endpoint URL
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
              refresh_token?: string; // Optional - backend might not return new refresh token
            };

            // 🔥 FIX: Handle both cases - with or without new refresh token
            const newTokens = {
              access_token: refreshResponseData.access_token,
              refresh_token: refreshResponseData.refresh_token || refreshToken, // Use new one if provided, else keep current
              expires_in: refreshResponseData.expires_in,
            };

            // Update tokens in Redux
            api.dispatch(updateTokens(newTokens));

            // Update localStorage
            localStorage.setItem("access_token", newTokens.access_token);
            localStorage.setItem("refresh_token", newTokens.refresh_token);

            console.log("✅ Token refreshed successfully");

            // 🔥 FIX: Log whether we got a new refresh token
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

// 🔥 ENHANCED: Better logout handling with error management
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

    // Show user notification (only in browser environment)
    if (typeof window !== "undefined" && window.location) {
      // 🔥 FIX: Better user notification
      const message = "Your session has expired. Please log in again.";

      // Try to show a more user-friendly notification if available
      if (window.confirm) {
        window.confirm(message);
      } else {
        alert(message);
      }

      // 🔥 FIX: Only redirect if not already on login page
      const currentPath = window.location.pathname;
      if (!currentPath.includes("/login") && !currentPath.includes("/auth")) {
        window.location.href = "/login";
      }
    }
  } catch (error) {
    console.error("💥 Error during force logout:", error);
    // Still try to redirect even if cleanup fails
    if (typeof window !== "undefined" && window.location) {
      window.location.href = "/login";
    }
  }
};
