import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../store";
import { Lead } from "@/models/types/lead";

interface ApiLead {
  lead_id?: string;
  id?: string;
  name: string;
  stage?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  lead_score?: number;
  contact_number?: string;
  phone_number?: string;
  email?: string;
  source?: string;
  last_contacted?: string;
  notes?: string;
}

interface AssignmentHistory {
  assigned_to: string;
  assigned_to_name: string;
  assigned_by: string;
  assigned_by_name: string;
  assigned_at: string;
  assignment_method: string;
  notes: string;
}

interface RawLeadDetails {
  system_info: {
    id: string;
    lead_id: string;
    created_at: string;
    updated_at: string;
    last_contacted: string | null;
    status: string;
  };
  basic_info: {
    name: string;
    email: string;
    contact_number: string;
    country_of_interest?: string;
    course_level?: string;
    source: string;
  };
  status_and_tags: {
    stage: string;
    lead_score: number;
    priority: string;
    tags: string[];
  };
  assignment: {
    assigned_to: string;
    assigned_to_name: string;
    assignment_history: AssignmentHistory[];
  };
  additional_info: {
    notes: string;
  };
}

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
  assignmentHistory: AssignmentHistory[];
}

interface LeadStatsResponse {
  total_leads: number;
  open_leads: number;
  in_progress_leads: number;
  closed_won_leads: number;
  closed_lost_leads: number;
  my_leads: number;
}

interface CreateLeadApiRequest {
  basic_info: {
    name: string;
    email: string;
    contact_number: string;
    stage: string;
    lead_score: number;
    tags: string[];
  };
  assignment: {
    assigned_to: string | null;
  };
  additional_info: {
    notes: string;
  };
}

interface CreateLeadResponse {
  success: boolean;
  message: string;
  lead: ApiLead;
  assignment_info?: Record<string, unknown>;
  duplicate_check?: Record<string, unknown>;
}

interface UpdateLeadRequest {
  lead_id: string;
  name: string;
  lead_score: number;
  stage: string;
  email?: string;
  contact_number?: string;
  source?: string;
  notes?: string;
}

interface BulkLeadData {
  name: string;
  email: string;
  contact_number: string;
  source: string;
  country_of_interest: string;
  course_level: string;
}

interface BulkCreateResult {
  index: number;
  status: "created" | "failed" | "skipped";
  lead_id?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  error?: string;
}

interface BulkCreateLeadsResponse {
  success: boolean;
  message: string;
  summary: {
    total_attempted: number;
    successful_creates: number;
    failed_creates: number;
    duplicates_skipped: number;
  };
  results: BulkCreateResult[];
}

interface AssignableUser {
  id: string;
  name: string;
}

const baseQuery = fetchBaseQuery({
  baseUrl:
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1",
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const token = state.auth.token;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    headers.set("content-type", "application/json");
    return headers;
  },
  fetchFn: async (input, init) => {
    try {
      return await fetch(input, init);
    } catch (error) {
      console.error("Network error:", error);
      throw error;
    }
  },
});

const transformApiLead = (apiLead: ApiLead): Lead => ({
  id: apiLead.lead_id || apiLead.id || "unknown",
  name: apiLead.name || "Unknown",
  stage: apiLead.stage || apiLead.status || "initial",
  createdOn:
    apiLead.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
  leadScore: Number(apiLead.lead_score) || 0,
  contact: apiLead.contact_number || apiLead.phone_number || "",
  email: apiLead.email || "",
  source: apiLead.source || "website",
  media: "Email",
  lastActivity:
    apiLead.last_contacted?.split("T")[0] ||
    apiLead.updated_at?.split("T")[0] ||
    new Date().toISOString().split("T")[0],
  department: "Sales",
  notes: apiLead.notes || "",
});

const transformLeadDetailsResponse = (response: {
  lead: RawLeadDetails;
}): LeadDetailsResponse => {
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

export const leadsApi = createApi({
  reducerPath: "leadsApi",
  baseQuery,
  tagTypes: ["Lead", "LeadStats"],
  endpoints: (builder) => ({
    getLeads: builder.query<Lead[], void>({
      query: () => "/leads/",
      transformResponse: (response: { leads: ApiLead[] }) =>
        response.leads.map(transformApiLead),
    }),

    getMyLeads: builder.query<Lead[], void>({
      query: () => "/leads/my-leads-fast",
      transformResponse: (response: { leads: ApiLead[] }) =>
        Array.isArray(response.leads)
          ? response.leads.map(transformApiLead)
          : [],
    }),

    getLead: builder.query<Lead, string>({
      query: (leadId) => `/leads/${leadId}`,
      transformResponse: (response: { lead: ApiLead }) =>
        transformApiLead(response.lead),
      providesTags: (result, error, id) => [{ type: "Lead", id }],
    }),

    getLeadDetails: builder.query<LeadDetailsResponse, string>({
      query: (leadId) => `/leads/${leadId}`,
      transformResponse: transformLeadDetailsResponse,
      providesTags: (result, error, id) => [{ type: "Lead", id }],
    }),

    getLeadStats: builder.query<LeadStatsResponse, void>({
      query: () => "/leads/stats",
      transformResponse: (response: LeadStatsResponse) => response,
      providesTags: ["LeadStats"],
    }),

    createLead: builder.mutation<CreateLeadResponse, CreateLeadApiRequest>({
      query: (body) => ({
        url: "/leads/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Lead", "LeadStats"],
    }),

    bulkCreateLeads: builder.mutation<
      BulkCreateLeadsResponse,
      { leads: BulkLeadData[]; force_create?: boolean }
    >({
      query: ({ leads, force_create = false }) => ({
        url: `/leads/bulk-create?force_create=${force_create}`,
        method: "POST",
        body: leads,
      }),
      invalidatesTags: ["Lead", "LeadStats"],
    }),

    updateLeadStage: builder.mutation<
      ApiLead,
      {
        leadId: string;
        stage: string;
        currentLead: Lead;
      }
    >({
      query: ({ leadId, stage, currentLead }) => ({
        url: "/leads/update",
        method: "PUT",
        body: {
          lead_id: leadId,
          name: currentLead.name,
          lead_score: currentLead.leadScore,
          stage: stage,
          email: currentLead.email,
          contact_number: currentLead.contact,
          source: currentLead.source,
          notes: currentLead.notes,
        },
      }),
      invalidatesTags: ["Lead", "LeadStats"],
    }),

    updateLead: builder.mutation<ApiLead, UpdateLeadRequest>({
      query: (body) => ({
        url: "/leads/update",
        method: "PUT",
        body,
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

    fixMissingFields: builder.mutation<{ success: boolean }, void>({
      query: () => ({
        url: "/leads/fix-missing-fields",
        method: "POST",
      }),
      invalidatesTags: ["Lead", "LeadStats"],
    }),

    getAssignableUsers: builder.query<AssignableUser[], void>({
      query: () => "/leads/users/assignable",
      transformResponse: (response: { users: AssignableUser[] }) =>
        response.users || [],
    }),
  }),
});

export const {
  useGetLeadsQuery,
  useGetMyLeadsQuery,
  useGetLeadQuery,
  useGetLeadDetailsQuery,
  useGetLeadStatsQuery,
  useUpdateLeadStageMutation,
  useUpdateLeadMutation,
  useCreateLeadMutation,
  useDeleteLeadMutation,
  useGetAssignableUsersQuery,
  useBulkCreateLeadsMutation,
  useFixMissingFieldsMutation,
} = leadsApi;
