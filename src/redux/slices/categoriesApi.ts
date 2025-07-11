// src/redux/slices/categoriesApi.ts

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../store";
import {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CategoriesResponse,
  ApiCategoryResponse,
  CreateCategoryResponse,
  UpdateCategoryResponse,
} from "@/models/types/category";

// Base query with authentication
const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
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

// Transform API response to match our frontend types
const transformCategory = (apiCategory: ApiCategoryResponse): Category => ({
  id: apiCategory.id,
  name: apiCategory.name,
  short_form: apiCategory.short_form,
  description: apiCategory.description,
  is_active: apiCategory.is_active,
  lead_count: apiCategory.lead_count,
  next_lead_number: apiCategory.next_lead_number,
  created_by: apiCategory.created_by,
  created_at: apiCategory.created_at,
  updated_at: apiCategory.updated_at,
});

export const categoriesApi = createApi({
  reducerPath: "categoriesApi",
  baseQuery,
  tagTypes: ["Category"],
  endpoints: (builder) => ({
    // Get all categories
    getCategories: builder.query<
      CategoriesResponse,
      { include_inactive?: boolean } | void
    >({
      query: (params = {}) => {
        // const { include_inactive = false } = params;
        const urlParams = new URLSearchParams();
        // if (include_inactive) urlParams.append("include_inactive", "true");
        return `/lead-categories?${urlParams.toString()}`;
      },
      transformResponse: (response: {
        success: boolean;
        categories: ApiCategoryResponse[];
        summary: {
          total: number;
          active: number;
          inactive: number;
        };
      }): CategoriesResponse => ({
        success: response.success,
        categories: response.categories.map(transformCategory),
        summary: response.summary,
      }),
      providesTags: (result) => [
        { type: "Category", id: "LIST" },
        ...(result?.categories || []).map(({ id }) => ({
          type: "Category" as const,
          id,
        })),
      ],
    }),

    // Create new category (Admin only)
    createCategory: builder.mutation<
      CreateCategoryResponse,
      CreateCategoryRequest
    >({
      query: (categoryData) => ({
        url: "/lead-categories/",
        method: "POST",
        body: categoryData,
      }),
      transformResponse: (
        response: CreateCategoryResponse
      ): CreateCategoryResponse => ({
        success: response.success,
        message: response.message,
        category: response.category,
      }),
      invalidatesTags: [{ type: "Category", id: "LIST" }],
    }),

    // Update category (Admin only)
    updateCategory: builder.mutation<
      UpdateCategoryResponse,
      { categoryId: string; data: UpdateCategoryRequest }
    >({
      query: ({ categoryId, data }) => ({
        url: `/lead-categories/${categoryId}`,
        method: "PUT",
        body: data,
      }),
      transformResponse: (
        response: UpdateCategoryResponse
      ): UpdateCategoryResponse => ({
        success: response.success,
        message: response.message,
        category: response.category,
      }),
      invalidatesTags: (result, error, { categoryId }) => [
        { type: "Category", id: "LIST" },
        { type: "Category", id: categoryId },
      ],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
} = categoriesApi;
