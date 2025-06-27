// src/redux/slices/authApi.ts (UPDATED with enhanced base query)

import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQueryWithReauth } from "../utils/baseQuerryWithReauth";

// API Base URL - Update this to match your FastAPI backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Enhanced types based on your API documentation
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
  user: Record<string, any>;
}

interface LogoutRequest {
  refresh_token: string;
}

interface LogoutResponse {
  success: boolean;
  message: string;
  data: Record<string, any>;
}

interface RefreshTokenRequest {
  refresh_token: string;
}

interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
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

// RTK Query API slice for authentication with enhanced base query
export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: createBaseQueryWithReauth(`${API_BASE_URL}/api/v1/auth`),
  tagTypes: ["Auth", "User"],
  endpoints: (builder) => ({
    // Login user
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: "/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Auth", "User"],
    }),

    // Register user
    register: builder.mutation<RegisterResponse, RegisterRequest>({
      query: (userData) => ({
        url: "/register",
        method: "POST",
        body: userData,
      }),
    }),

    // Get current user info
    getCurrentUser: builder.query<CurrentUserResponse, void>({
      query: () => ({
        url: "/me",
        method: "GET",
      }),
      providesTags: ["Auth", "User"],
    }),

    // Refresh token
    refreshToken: builder.mutation<RefreshTokenResponse, RefreshTokenRequest>({
      query: (refreshData) => ({
        url: "/refresh",
        method: "POST",
        body: refreshData,
      }),
    }),

    // Logout user
    logout: builder.mutation<LogoutResponse, LogoutRequest>({
      query: (logoutData) => ({
        url: "/logout",
        method: "POST",
        body: logoutData,
      }),
      invalidatesTags: ["Auth", "User"],
    }),
  }),
});

// Export hooks for use in components
export const {
  useLoginMutation,
  useRegisterMutation,
  useGetCurrentUserQuery,
  useRefreshTokenMutation,
  useLogoutMutation,
} = authApi;
