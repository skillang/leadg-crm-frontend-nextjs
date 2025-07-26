// src/redux/slices/experienceLevelsApi.ts

import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQueryWithReauth } from "../utils/baseQuerryWithReauth";

// Types for Experience Levels
export interface ExperienceLevelOption {
  value: string;
  label: string;
}

export interface ExperienceLevelsResponse {
  success: boolean;
  data: ExperienceLevelOption[];
  total: number;
}

// Base query with authentication and auto-refresh
const baseQuery = createBaseQueryWithReauth(
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
);

export const experienceLevelsApi = createApi({
  reducerPath: "experienceLevelsApi",
  baseQuery,
  tagTypes: ["ExperienceLevel"],
  endpoints: (builder) => ({
    // Get all experience levels
    getExperienceLevels: builder.query<ExperienceLevelsResponse, void>({
      query: () => "/leads/constants/experience-levels",
      providesTags: [{ type: "ExperienceLevel", id: "LIST" }],
    }),
  }),
});

// Export hooks
export const { useGetExperienceLevelsQuery } = experienceLevelsApi;

// Helper function to transform experience levels to dropdown options
export const transformExperienceLevelsToOptions = (
  experienceLevels: ExperienceLevelOption[]
): ExperienceLevelOption[] => {
  return experienceLevels.map((level) => ({
    value: level.value,
    label: level.label,
  }));
};
