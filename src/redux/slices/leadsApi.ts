// src/redux/slices/leadsApi.ts

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../store";
import { Lead, CreateLeadRequest } from "@/models/types/lead";

// Real base query with authentication
const baseQuery = fetchBaseQuery({
  baseUrl:
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1",
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const token = state.auth.token;

    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

// Transform backend data to frontend format
const transformApiLead = (apiLead: any): Lead => ({
  // ✅ FIX: Use lead_id (LD-1000 format) as primary ID
  id: apiLead.lead_id || apiLead.id, // Priority to lead_id
  name: apiLead.name,
  stage: apiLead.stage || apiLead.status,
  createdOn: apiLead.created_at?.split("T")[0] || "",
  leadScore: apiLead.lead_score || 0,
  contact: apiLead.contact_number || apiLead.phone_number || "",
  email: apiLead.email || "",
  source: apiLead.source || "Unknown",
  media: "Email",
  lastActivity:
    apiLead.last_contacted?.split("T")[0] ||
    apiLead.updated_at?.split("T")[0] ||
    "",
  department: "Sales",
  notes: apiLead.notes || "",
});

// Transform backend response to frontend format
const transformLeadDetailsResponse = (response: any): LeadDetailsResponse => {
  const lead = response.lead;

  return {
    id: lead.system_info.id,
    leadId: lead.system_info.lead_id,
    name: lead.basic_info.name,
    email: lead.basic_info.email,
    phoneNumber: lead.basic_info.contact_number,
    contact: lead.basic_info.contact_number,
    countryOfInterest: lead.basic_info.country_of_interest || "",
    courseLevel: lead.basic_info.course_level || "",
    source: lead.basic_info.source,
    stage: lead.status_and_tags.stage,
    leadScore: lead.status_and_tags.lead_score,
    priority: lead.status_and_tags.priority,
    tags: lead.status_and_tags.tags || [],
    assignedTo: lead.assignment.assigned_to,
    assignedToName: lead.assignment.assigned_to_name,
    notes: lead.additional_info.notes || "",
    createdAt: lead.system_info.created_at,
    updatedAt: lead.system_info.updated_at,
    lastContacted: lead.system_info.last_contacted,
    status: lead.system_info.status,
    assignmentHistory: lead.assignment.assignment_history || [],
  };
};

// Interface for the new update endpoint
interface UpdateLeadRequest {
  lead_id: string;
  name: string;
  lead_score: number;
  stage: string;
  // Add other fields that might be updated
  email?: string;
  contact_number?: string;
  source?: string;
  notes?: string;
}

// Extended interface for detailed lead response
interface LeadDetailsResponse {
  id: string;
  leadId: string;
  name: string;
  email: string;
  phoneNumber: string;
  contact: string;
  countryOfInterest: string;
  courseLevel: string;
  source: string;
  stage: string;
  leadScore: number;
  priority: string;
  tags: string[];
  assignedTo: string;
  assignedToName: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  lastContacted: string | null;
  status: string;
  assignmentHistory: Array<{
    assigned_to: string;
    assigned_to_name: string;
    assigned_by: string;
    assigned_by_name: string;
    assigned_at: string;
    assignment_method: string;
    notes: string;
  }>;
}

export const leadsApi = createApi({
  reducerPath: "leadsApi",
  baseQuery,
  tagTypes: ["Lead", "LeadStats"],
  endpoints: (builder) => ({
    getLeads: builder.query<Lead[], void>({
      query: () => "/leads/",
      transformResponse: (response: any) => {
        return response.leads?.map(transformApiLead) || [];
      },
      providesTags: ["Lead"],
    }),

    getMyLeads: builder.query<Lead[], void>({
      query: () => "/leads/my-leads-fast",
      transformResponse: (response: any) => {
        return response.leads?.map(transformApiLead) || [];
      },
      providesTags: ["Lead"],
    }),

    getLead: builder.query<Lead, string>({
      query: (id) => `/leads/${id}`,
      transformResponse: transformApiLead,
      providesTags: (result, error, id) => [{ type: "Lead", id }],
    }),

    getLeadDetails: builder.query<LeadDetailsResponse, string>({
      query: (leadId) => `/leads/${leadId}`,
      transformResponse: transformLeadDetailsResponse,
      providesTags: (result, error, id) => [{ type: "Lead", id }],
    }),

    // ✅ ALSO UPDATE: getLeadDetails to use correct ID
    // getLeadDetails: builder.query<any, string>({
    //   query: (leadId) => `/leads/${leadId}`,
    //   transformResponse: (response: any) => {
    //     const lead = response.lead || response;
    //     return {
    //       // ✅ FIX: Use lead_id consistently
    //       id: lead.lead_id || lead.id, // Priority to lead_id
    //       leadId: lead.lead_id || lead.id,
    //       name: lead.name,
    //       email: lead.email,
    //       phoneNumber: lead.contact_number || lead.phone_number,
    //       contact: lead.contact_number || lead.phone_number,
    //       countryOfInterest: Array.isArray(lead.country_of_interest)
    //         ? lead.country_of_interest
    //         : lead.country_of_interest
    //         ? [lead.country_of_interest]
    //         : [],
    //       courseLevel: lead.course_level || "Not specified",
    //       source: lead.source,
    //       tags: lead.tags || [],
    //       createdOn: lead.created_at?.split("T")[0] || "",
    //       stage: lead.stage || lead.status,
    //       leadScore: lead.lead_score || 0,
    //       department: "Sales",
    //       notes: lead.notes || "",
    //       lastActivity:
    //         lead.last_contacted?.split("T")[0] ||
    //         lead.updated_at?.split("T")[0] ||
    //         "",
    //       media: "Email",
    //     };
    //   },
    //   providesTags: (result, error, id) => [{ type: "Lead", id }],
    // }),

    getLeadStats: builder.query<any, void>({
      query: () => "/leads/stats",
      transformResponse: (response: any) => ({
        total: response.total_leads || 0,
        byStage: {
          open: response.open_leads || 0,
          in_progress: response.in_progress_leads || 0,
          "closed-won": response.closed_won_leads || 0,
          "closed-lost": response.closed_lost_leads || 0,
        },
        byDepartment: {
          Sales: response.my_leads || 0,
          Marketing: 0,
        },
        averageScore: 0,
        conversionRate:
          response.total_leads > 0
            ? (response.closed_won_leads / response.total_leads) * 100
            : 0,
      }),
      providesTags: ["LeadStats"],
    }),

    // UPDATED: New updateLeadStage mutation using the /leads/update endpoint
    updateLeadStage: builder.mutation<
      any,
      {
        leadId: string; // This should be LD-1000 format
        stage: string;
        currentLead: Lead;
      }
    >({
      query: ({ leadId, stage, currentLead }) => {
        // console.log("🔍 API Call - Lead ID being sent:", leadId);
        // console.log("🔍 API Call - Current lead:", currentLead);

        return {
          url: "/leads/update",
          method: "PUT",
          body: {
            lead_id: leadId, // ✅ Should now be LD-1000 format
            name: currentLead.name,
            lead_score: currentLead.leadScore,
            stage: stage,
            email: currentLead.email,
            contact_number: currentLead.contact,
            source: currentLead.source,
            notes: currentLead.notes,
          } as UpdateLeadRequest,
        };
      },
      invalidatesTags: ["Lead", "LeadStats"],
      transformResponse: (response: any) => {
        // console.log("🎯 API Response:", response);
        return response.lead || response;
      },
    }),

    // Alternative mutation if you want to update multiple fields at once
    updateLead: builder.mutation<any, UpdateLeadRequest>({
      query: (updateData) => ({
        url: "/leads/update",
        method: "PUT",
        body: updateData,
      }),
      invalidatesTags: ["Lead", "LeadStats"],
    }),

    createLead: builder.mutation<any, CreateLeadRequest>({
      query: (leadData) => ({
        url: "/leads/",
        method: "POST",
        body: {
          name: leadData.name,
          email: leadData.email || "",
          phone_number: leadData.contact,
          source: leadData.source?.toLowerCase() || "website",
          tags: [leadData.department],
          notes: leadData.notes,
        },
      }),
      invalidatesTags: ["Lead", "LeadStats"],
    }),

    deleteLead: builder.mutation<void, string>({
      query: (id) => ({
        url: `/leads/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Lead", "LeadStats"],
    }),

    getAssignableUsers: builder.query<any[], void>({
      query: () => "/leads/users/assignable",
      transformResponse: (response: any) => response.users || [],
    }),
  }),
});

export const {
  useGetLeadsQuery,
  useGetMyLeadsQuery,
  useGetLeadQuery,
  useGetLeadDetailsQuery, // This now returns the properly typed response
  useGetLeadStatsQuery,
  useUpdateLeadStageMutation,
  useUpdateLeadMutation,
  useCreateLeadMutation,
  useDeleteLeadMutation,
  useGetAssignableUsersQuery,
} = leadsApi;
