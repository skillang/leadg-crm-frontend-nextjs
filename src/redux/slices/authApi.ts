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

interface AdminRegisterRequest {
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  password: string;
  role: "admin" | "user";
  phone: string;
  departments: string[];
}

interface AdminRegisterResponse {
  success: boolean;
  message: string;
  user: {
    id: string;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    role: string;
    created_at: string;
  };
}

// ADD these to your existing src/redux/slices/authApi.ts file

// 1. ADD these interface types (add them with your existing types)
interface AdminRegisterRequest {
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  password: string;
  role: "admin" | "user";
  phone: string;
  departments: string[];
}

interface AdminRegisterResponse {
  success: boolean;
  message: string;
  user: {
    id: string;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    role: string;
    created_at: string;
  };
}

// 🔥 NEW: Department types
interface Department {
  id?: string;
  name: string;
  display_name: string;
  description: string;
  is_predefined: boolean;
  is_active: boolean;
  created_at?: string;
  created_by?: string;
  user_count: number;
}

interface DepartmentsResponse {
  success: boolean;
  departments: {
    predefined: Department[];
    custom: Department[];
    all: Department[];
  };
  total_count: number;
  predefined_count: number;
  custom_count: number;
}

interface CreateDepartmentRequest {
  name: string;
  description: string;
  is_active: boolean;
}

interface CreateDepartmentResponse {
  success: boolean;
  message: string;
  department: Department;
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

    adminRegisterUser: builder.mutation<
      AdminRegisterResponse,
      AdminRegisterRequest
    >({
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
      // 🔥 FIX: Invalidate both User AND Department tags
      invalidatesTags: ["User", "Department"], // Add "Department" here
    }),

    getDepartments: builder.query<
      DepartmentsResponse,
      { include_user_count?: boolean }
    >({
      query: ({ include_user_count = true } = {}) => ({
        url: `/departments?include_user_count=${include_user_count}`,
        method: "GET",
      }),
      providesTags: ["Department"],
      // Cache for 5 minutes since departments don't change often
      keepUnusedDataFor: 300,
    }),

    // 🔥 NEW: Create department (admin only)
    createDepartment: builder.mutation<
      CreateDepartmentResponse,
      CreateDepartmentRequest
    >({
      query: (departmentData) => ({
        url: "/departments",
        method: "POST",
        body: departmentData,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(setError(null));
        } catch (error) {
          console.error("Department creation failed:", error);
        }
      },
      invalidatesTags: ["Department"], // Refresh departments list
    }),

    // 🔥 NEW: Update department (admin only)
    updateDepartment: builder.mutation<
      CreateDepartmentResponse,
      { departmentId: string; departmentData: Partial<CreateDepartmentRequest> }
    >({
      query: ({ departmentId, departmentData }) => ({
        url: `/departments/${departmentId}`,
        method: "PUT",
        body: departmentData,
      }),
      invalidatesTags: ["Department"],
    }),

    // 🔥 NEW: Delete department (admin only)
    deleteDepartment: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (departmentId) => ({
        url: `/departments/${departmentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Department"],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetCurrentUserQuery,
  useLogoutMutation,
  // 🔥 NEW HOOKS
  useAdminRegisterUserMutation,
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
} = authApi;
