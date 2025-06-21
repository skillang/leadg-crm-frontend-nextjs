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
  id: apiLead,
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

    updateLeadStage: builder.mutation<Lead, { id: string; stage: string }>({
      query: ({ id, stage }) => ({
        url: `/leads/${id}/status`,
        method: "PATCH",
        body: {
          status: stage,
          notes: `Stage updated to ${stage}`,
        },
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

    updateLead: builder.mutation<Lead, { id: string; notes: string }>({
      query: ({ id, notes }) => ({
        url: `/leads/${id}`,
        method: "PUT",
        body: { notes },
      }),
      invalidatesTags: ["Lead"],
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
  useGetLeadStatsQuery,
  useUpdateLeadStageMutation,
  useCreateLeadMutation,
  useDeleteLeadMutation,
  useUpdateLeadMutation,
  useGetAssignableUsersQuery,
} = leadsApi;
