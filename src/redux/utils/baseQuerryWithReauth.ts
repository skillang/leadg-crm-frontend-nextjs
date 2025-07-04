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
      }

      headers.set("content-type", "application/json");
      return headers;
    },
  });

  return async (args, api, extraOptions) => {
    let result = await baseQuery(args, api, extraOptions);

    // Handle 401 errors (token expired)
    if (result.error && result.error.status === 401) {
      // console.log("🔄 Access token expired, attempting refresh...");

      const state = api.getState() as RootState;
      const refreshToken = state.auth.refreshToken;

      if (refreshToken) {
        try {
          // Attempt to refresh the token
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
            const newTokens = refreshResult.data as {
              access_token: string;
              refresh_token: string;
              expires_in: number;
            };

            // Update tokens in Redux
            api.dispatch(updateTokens(newTokens));

            // Update localStorage
            localStorage.setItem("access_token", newTokens.access_token);
            localStorage.setItem("refresh_token", newTokens.refresh_token);

            // console.log("✅ Token refreshed successfully");

            // Retry the original request with new token
            result = await baseQuery(args, api, extraOptions);
          } else {
            // console.log("❌ Token refresh failed");
            // Refresh failed, force logout
            await handleForceLogout(api);
          }
        } catch (error) {
          console.error("💥 Token refresh error:", error);
          // Refresh failed, force logout
          await handleForceLogout(api);
        }
      } else {
        // console.log("❌ No refresh token available");
        // No refresh token, force logout
        await handleForceLogout(api);
      }
    }

    return result;
  };
};

// Helper function to handle forced logout
const handleForceLogout = async (api: BaseQueryApi) => {
  // console.log("🚪 Forcing logout due to token expiration");

  // Clear tokens from localStorage
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");

  // Clear auth state
  api.dispatch(clearAuthState());

  // Show user notification
  if (typeof window !== "undefined") {
    alert("Your session has expired. Please log in again.");

    // Redirect to login page
    window.location.href = "/login";
  }
};
