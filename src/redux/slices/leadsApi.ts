// src/redux/slices/leadsApi.ts
import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  Lead,
  LeadDetails,
  CreateLeadRequest,
  LeadActivity,
} from "@/models/types/lead";
import { mockApi } from "@/services/mockApi";

// RTK Query API slice with lead details support
export const leadsApi = createApi({
  reducerPath: "leadsApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["Lead", "LeadDetails"],
  endpoints: (builder) => ({
    // Get all leads
    getLeads: builder.query<Lead[], void>({
      queryFn: async () => {
        try {
          const data = await mockApi.getLeads();
          return { data };
        } catch (error) {
          return { error: { status: "FETCH_ERROR", error: String(error) } };
        }
      },
      providesTags: ["Lead"],
    }),

    // Get single lead
    getLead: builder.query<Lead, string>({
      queryFn: async (id) => {
        try {
          const data = await mockApi.getLead(id);
          return { data };
        } catch (error) {
          return { error: { status: "FETCH_ERROR", error: String(error) } };
        }
      },
      providesTags: (result, error, id) => [{ type: "Lead", id }],
    }),

    // Get detailed lead information - NEW
    getLeadDetails: builder.query<LeadDetails, string>({
      queryFn: async (id) => {
        try {
          const data = await mockApi.getLeadDetails(id);
          return { data };
        } catch (error) {
          return { error: { status: "FETCH_ERROR", error: String(error) } };
        }
      },
      providesTags: (result, error, id) => [
        { type: "LeadDetails", id },
        { type: "Lead", id },
      ],
    }),

    // Update lead stage
    updateLeadStage: builder.mutation<Lead, { id: string; stage: string }>({
      queryFn: async ({ id, stage }) => {
        try {
          const data = await mockApi.updateLeadStage(id, stage);
          return { data };
        } catch (error) {
          return { error: { status: "FETCH_ERROR", error: String(error) } };
        }
      },
      invalidatesTags: (result, error, { id }) => [
        "Lead",
        { type: "LeadDetails", id },
      ],
    }),

    // Create new lead
    createLead: builder.mutation<Lead, CreateLeadRequest>({
      queryFn: async (leadData) => {
        try {
          const data = await mockApi.createLead(leadData);
          return { data };
        } catch (error) {
          return { error: { status: "FETCH_ERROR", error: String(error) } };
        }
      },
      invalidatesTags: ["Lead"],
    }),

    // Delete lead
    deleteLead: builder.mutation<void, string>({
      queryFn: async (id) => {
        try {
          await mockApi.deleteLead(id);
          return { data: undefined };
        } catch (error) {
          return { error: { status: "FETCH_ERROR", error: String(error) } };
        }
      },
      invalidatesTags: (result, error, id) => [
        "Lead",
        { type: "LeadDetails", id },
      ],
    }),

    // Update lead notes
    updateLeadNotes: builder.mutation<Lead, { id: string; notes: string }>({
      queryFn: async ({ id, notes }) => {
        try {
          const data = await mockApi.updateLeadNotes(id, notes);
          return { data };
        } catch (error) {
          return { error: { status: "FETCH_ERROR", error: String(error) } };
        }
      },
      invalidatesTags: (result, error, { id }) => [
        { type: "Lead", id },
        { type: "LeadDetails", id },
      ],
    }),

    // Add lead activity - NEW
    addLeadActivity: builder.mutation<
      LeadActivity,
      { id: string; activity: Omit<LeadActivity, "id" | "timestamp"> }
    >({
      queryFn: async ({ id, activity }) => {
        try {
          const data = await mockApi.addLeadActivity(id, activity);
          return { data };
        } catch (error) {
          return { error: { status: "FETCH_ERROR", error: String(error) } };
        }
      },
      invalidatesTags: (result, error, { id }) => [{ type: "LeadDetails", id }],
    }),
  }),
});

// Export hooks for use in components
export const {
  useGetLeadsQuery,
  useGetLeadQuery,
  useGetLeadDetailsQuery, // NEW
  useUpdateLeadStageMutation,
  useCreateLeadMutation,
  useDeleteLeadMutation,
  useUpdateLeadNotesMutation,
  useAddLeadActivityMutation, // NEW
} = leadsApi;
