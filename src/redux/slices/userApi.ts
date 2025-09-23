// src/redux/slices/userApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQueryWithReauth } from "../utils/baseQuerryWithReauth";
import {
  CurrentUserResponse,
  AdminRegisterRequest,
  AdminRegisterResponse,
  DeleteUserResponse,
} from "@/models/types/auth";
import {
  DepartmentsResponse,
  CreateDepartmentRequest,
  CreateDepartmentResponse,
} from "@/models/types/department";

const baseQuery = createBaseQueryWithReauth(
  `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth`
);

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery,
  tagTypes: ["User", "Department", "Role"],
  endpoints: (builder) => ({
    // User endpoints
    getCurrentUser: builder.query<CurrentUserResponse, void>({
      query: () => "/me",
      providesTags: ["User"],
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
      invalidatesTags: ["User", "Department"],
    }),

    deleteUser: builder.mutation<DeleteUserResponse, string>({
      query: (userId) => ({
        url: `/users/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["User", "Department"],
    }),

    // Department endpoints
    getDepartments: builder.query<
      DepartmentsResponse,
      { include_user_count?: boolean }
    >({
      query: ({ include_user_count = true } = {}) => ({
        url: `/departments?include_user_count=${include_user_count}`,
        method: "GET",
      }),
      providesTags: ["Department"],
      keepUnusedDataFor: 300,
    }),

    createDepartment: builder.mutation<
      CreateDepartmentResponse,
      CreateDepartmentRequest
    >({
      query: (departmentData) => ({
        url: "/departments",
        method: "POST",
        body: departmentData,
      }),
      invalidatesTags: ["Department"],
    }),

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
  useGetCurrentUserQuery,
  useAdminRegisterUserMutation,
  useDeleteUserMutation,
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
  //   useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
} = userApi;
