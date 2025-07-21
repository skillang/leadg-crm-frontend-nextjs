// src/redux/slices/experienceLevelsApi.ts

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../store";

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
    headers.set("accept", "application/json");
    return headers;
  },
});

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
