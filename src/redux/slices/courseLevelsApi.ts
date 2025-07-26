import { createApi } from "@reduxjs/toolkit/query/react";
import {
  CourseLevel,
  CreateCourseLevelRequest,
  UpdateCourseLevelRequest,
  CourseLevelsResponse,
  CreateCourseLevelResponse,
  UpdateCourseLevelResponse,
  CourseLevelOption,
} from "@/models/types/courseLevel";
import { createBaseQueryWithReauth } from "../utils/baseQuerryWithReauth";

// Base query with authentication and auto-refresh
const baseQuery = createBaseQueryWithReauth(
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
);

export const courseLevelsApi = createApi({
  reducerPath: "courseLevelsApi",
  baseQuery,
  tagTypes: ["CourseLevel"],
  endpoints: (builder) => ({
    // Get all course levels
    getCourseLevels: builder.query<
      CourseLevelsResponse,
      { include_lead_count?: boolean; active_only?: boolean }
    >({
      query: ({ include_lead_count = false, active_only = true } = {}) => {
        const params = new URLSearchParams();
        if (include_lead_count) params.append("include_lead_count", "true");
        if (!active_only) params.append("active_only", "false");
        return `/course-levels/?${params.toString()}`;
      },
      providesTags: [{ type: "CourseLevel", id: "LIST" }],
    }),

    // Get active course levels only (for dropdowns)
    getActiveCourseLevels: builder.query<
      CourseLevelsResponse,
      { include_lead_count?: boolean }
    >({
      query: ({ include_lead_count = false } = {}) => {
        const params = new URLSearchParams();
        if (include_lead_count) params.append("include_lead_count", "true");
        return `/course-levels/active?${params.toString()}`;
      },
      providesTags: [{ type: "CourseLevel", id: "ACTIVE" }],
    }),

    // Get inactive course levels only (Admin view)
    getInactiveCourseLevels: builder.query<
      CourseLevelsResponse,
      { include_lead_count?: boolean }
    >({
      query: ({ include_lead_count = false } = {}) => {
        const params = new URLSearchParams();
        if (include_lead_count) params.append("include_lead_count", "true");
        return `/course-levels/inactive?${params.toString()}`;
      },
      providesTags: [{ type: "CourseLevel", id: "INACTIVE" }],
    }),

    // Get course level by ID
    getCourseLevelById: builder.query<CourseLevel, string>({
      query: (courseLevelId) => `/course-levels/${courseLevelId}`,
      providesTags: (result, error, courseLevelId) => [
        { type: "CourseLevel", id: courseLevelId },
      ],
    }),

    // Create new course level (Admin only)
    createCourseLevel: builder.mutation<
      CreateCourseLevelResponse,
      CreateCourseLevelRequest
    >({
      query: (courseLevelData) => ({
        url: `/course-levels/`,
        method: "POST",
        body: courseLevelData,
      }),
      invalidatesTags: [
        { type: "CourseLevel", id: "LIST" },
        { type: "CourseLevel", id: "ACTIVE" },
      ],
    }),

    // Update course level (Admin only)
    updateCourseLevel: builder.mutation<
      UpdateCourseLevelResponse,
      { courseLevelId: string; data: UpdateCourseLevelRequest }
    >({
      query: ({ courseLevelId, data }) => ({
        url: `/course-levels/${courseLevelId}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { courseLevelId }) => [
        { type: "CourseLevel", id: "LIST" },
        { type: "CourseLevel", id: "ACTIVE" },
        { type: "CourseLevel", id: "INACTIVE" },
        { type: "CourseLevel", id: courseLevelId },
      ],
    }),

    // Delete course level (Admin only)
    deleteCourseLevel: builder.mutation<{ message: string }, string>({
      query: (courseLevelId) => ({
        url: `/course-levels/${courseLevelId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, courseLevelId) => [
        { type: "CourseLevel", id: "LIST" },
        { type: "CourseLevel", id: "ACTIVE" },
        { type: "CourseLevel", id: "INACTIVE" },
        { type: "CourseLevel", id: courseLevelId },
      ],
    }),

    // Activate course level (Admin only)
    activateCourseLevel: builder.mutation<{ message: string }, string>({
      query: (courseLevelId) => ({
        url: `/course-levels/${courseLevelId}/activate`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, courseLevelId) => [
        { type: "CourseLevel", id: "LIST" },
        { type: "CourseLevel", id: "ACTIVE" },
        { type: "CourseLevel", id: "INACTIVE" },
        { type: "CourseLevel", id: courseLevelId },
      ],
    }),

    // Deactivate course level (Admin only)
    deactivateCourseLevel: builder.mutation<{ message: string }, string>({
      query: (courseLevelId) => ({
        url: `/course-levels/${courseLevelId}/deactivate`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, courseLevelId) => [
        { type: "CourseLevel", id: "LIST" },
        { type: "CourseLevel", id: "ACTIVE" },
        { type: "CourseLevel", id: "INACTIVE" },
        { type: "CourseLevel", id: courseLevelId },
      ],
    }),
  }),
});

// Export hooks
export const {
  useGetCourseLevelsQuery,
  useGetActiveCourseLevelsQuery,
  useGetInactiveCourseLevelsQuery,
  useGetCourseLevelByIdQuery,
  useCreateCourseLevelMutation,
  useUpdateCourseLevelMutation,
  useDeleteCourseLevelMutation,
  useActivateCourseLevelMutation,
  useDeactivateCourseLevelMutation,
} = courseLevelsApi;

// Helper function to transform course levels to dropdown options
export const transformCourseLevelsToOptions = (
  courseLevels: CourseLevel[]
): CourseLevelOption[] => {
  return courseLevels.map((level) => ({
    value: level.name,
    label: level.display_name,
  }));
};
