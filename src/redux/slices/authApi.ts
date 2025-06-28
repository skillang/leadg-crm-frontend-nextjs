// src/redux/slices/authApi.ts (REVERTED to simple version)

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { User, LoginCredentials, RegisterData } from "@/redux/types/Leads";

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Types (keep these as they were)
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

// REVERTED: Back to simple fetchBaseQuery (no enhanced base query)
export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE_URL}/api/v1/auth`,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth.token;
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      headers.set("content-type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["Auth", "User"],
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: "/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Auth", "User"],
    }),

    register: builder.mutation<RegisterResponse, RegisterRequest>({
      query: (userData) => ({
        url: "/register",
        method: "POST",
        body: userData,
      }),
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
      invalidatesTags: ["Auth", "User"],
    }),

    // REMOVED: refreshToken endpoint (not needed for simple solution)
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetCurrentUserQuery,
  useLogoutMutation,
  // REMOVED: useRefreshTokenMutation
} = authApi;
