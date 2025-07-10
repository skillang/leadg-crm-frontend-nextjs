// src/redux/slices/authApi.ts

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import type { BaseQueryApi } from "@reduxjs/toolkit/query/react";
import { RootState } from "@/redux/store";
import { setError, clearAuthState } from "./authSlice";

// API Base URL
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// Types
interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: string;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    role: "admin" | "user";
    is_active: boolean;
    phone: string;
    department: string;
    created_at: string;
    last_login: string;
  };
}

interface RegisterRequest {
  department: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  phone: string;
  role: "admin" | "user";
  username: string;
}

interface RegisterResponse {
  success: boolean;
  message: string;
  user: CurrentUserResponse;
}

interface LogoutRequest {
  refresh_token: string;
}

interface LogoutResponse {
  success: boolean;
  message: string;
  data: Record<string, unknown>;
}

interface CurrentUserResponse {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: "admin" | "user";
  is_active: boolean;
  phone: string;
  department: string;
  created_at: string;
  last_login: string;
}

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
  tagTypes: ["Auth", "User"],
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

    getCurrentUser: builder.query<CurrentUserResponse, void>({
      query: () => ({
        url: "/me",
        method: "GET",
      }),
      providesTags: ["Auth", "User"],
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
  useRegisterMutation,
  useGetCurrentUserQuery,
  useLogoutMutation,
} = authApi;
