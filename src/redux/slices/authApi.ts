// src/redux/slices/authApi.ts

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import type { BaseQueryApi } from "@reduxjs/toolkit/query/react";
import { RootState } from "@/redux/store";
import { setError, clearAuthState, updateTokens } from "./authSlice";
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  LogoutRequest,
  LogoutResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  // CurrentUserResponse,
  // AdminRegisterRequest,
  // AdminRegisterResponse,
  // DeleteUserResponse,
} from "@/models/types/auth";

// API Base URL
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// Base query with headers
const baseQuery = fetchBaseQuery({
  baseUrl: `${API_BASE_URL}/auth`,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    headers.set("content-type", "application/json");
    return headers;
  },
});

// Enhanced base query with error handling
const baseQueryWithErrorHandling: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api: BaseQueryApi, extraOptions: Record<string, unknown>) => {
  const result = await baseQuery(args, api, extraOptions);

  if (result.error) {
    const { status, data } = result.error;

    if (status === 401) {
      api.dispatch(clearAuthState());
    } else if (status === 400 || status === 422) {
      if (
        typeof data === "object" &&
        data !== null &&
        ("detail" in data || "message" in data)
      ) {
        const message =
          (data as { detail?: string; message?: string }).detail ||
          (data as { detail?: string; message?: string }).message;
        api.dispatch(setError(message ?? "An error occurred"));
      } else {
        api.dispatch(setError("An error occurred"));
      }
    } else {
      api.dispatch(setError("Network error. Please try again."));
    }
  }

  return result;
};

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: baseQueryWithErrorHandling,
  tagTypes: ["Auth", "User", "Department"],
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: "/login",
        method: "POST",
        body: credentials,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(setError(null));
        } catch {
          // Error handled in baseQueryWithErrorHandling
        }
      },
      invalidatesTags: ["Auth", "User"],
    }),

    // Add this endpoint in your authApi endpoints section
    refreshToken: builder.mutation<RefreshTokenResponse, RefreshTokenRequest>({
      query: (refreshData) => ({
        url: "/refresh",
        method: "POST",
        body: refreshData,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          // Update tokens automatically
          dispatch(
            updateTokens({
              access_token: data.access_token,
              refresh_token: data.refresh_token || arg.refresh_token, // 🔥 Use new one if provided, else keep current
              expires_in: data.expires_in,
            })
          );
          dispatch(setError(null));
        } catch (error) {
          console.error("Token refresh failed:", error);
        }
      },
      invalidatesTags: ["Auth"],
    }),

    register: builder.mutation<RegisterResponse, RegisterRequest>({
      query: (userData) => ({
        url: "/register",
        method: "POST",
        body: userData,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(setError(null));
        } catch {
          // Error handled in baseQueryWithErrorHandling
        }
      },
    }),

    logout: builder.mutation<LogoutResponse, LogoutRequest>({
      query: (logoutData) => ({
        url: "/logout",
        method: "POST",
        body: logoutData,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(clearAuthState());
        } catch {
          dispatch(clearAuthState());
        }
      },
      invalidatesTags: ["Auth", "User"],
    }),
  }),
});

export const {
  useLoginMutation,
  useRefreshTokenMutation,
  useRegisterMutation,
  useLogoutMutation,
} = authApi;
