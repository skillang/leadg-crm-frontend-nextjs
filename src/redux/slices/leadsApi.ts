// src/redux/slices/leadsApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../store";
import { Lead } from "@/models/types/lead";

// Updated interfaces to match new backend structure
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
  category?: string;

  // Enhanced assignment fields
  assigned_to?: string; // Primary assignee email
  assigned_to_name?: string; // Primary assignee name
  co_assignees?: string[]; // Co-assignee emails
  co_assignees_names?: string[]; // Co-assignee names
  is_multi_assigned?: boolean; // Multi-assignment flag
  assignment_method?: string; // Assignment method

  // New fields
  age?: number;
  experience?: string;
  nationality?: string;

  course_level?: string;
  country_of_interest?: string;
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
    category: string;
    age?: number;
    experience?: string;
    nationality?: string;
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
    co_assignees: string[];
    co_assignees_names: string[];
    is_multi_assigned: boolean;
    assignment_method: string;
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

  // Enhanced assignment fields
  assignedTo: string;
  assignedToName: string;
  coAssignees: string[];
  coAssigneesNames: string[];
  isMultiAssigned: boolean;
  assignmentMethod: string;

  // New fields
  age?: number;
  experience?: string;
  nationality?: string;

  notes: string;
  createdAt: string;
  updatedAt: string;
  lastContacted: string | null;
  status: string;
  assignmentHistory: AssignmentHistory[];
  leadCategory: string;
}

// Updated user interfaces for multi-assignment
interface UserWithDetails {
  email: string;
  name: string;
  is_active: boolean;
  current_lead_count: number;
  departments: string[];
}

interface AssignableUsersResponse {
  total_users: number;
  users: UserWithDetails[];
}

interface UserStats {
  user_id: string;
  name: string;
  email: string;
  role: string;
  assigned_leads_count: number;
}

interface UserLeadStatsResponse {
  success: boolean;
  user_stats: UserStats[];
  summary: {
    total_users: number;
    total_leads: number;
    assigned_leads: number;
    unassigned_leads: number;
  };
  performance: string;
}

// Enhanced create lead request
export interface CreateLeadApiRequest {
  basic_info: {
    name: string;
    email: string;
    contact_number: string;
    source: string;
    category: string;
    age?: number;
    experience?: string;
    nationality?: string;
  };
  status_and_tags: {
    stage: string;
    lead_score: number;
    tags: string[];
  };
  additional_info: {
    notes: string;
  };
}

// Enhanced update lead request with multi-assignment
interface UpdateLeadRequest {
  lead_id: string;
  name: string;
  lead_score: number;
  stage: string;
  email?: string;
  contact_number?: string;
  source?: string;
  notes?: string;
  tags?: string[];

  // Assignment fields
  assigned_to?: string;
  assigned_to_name?: string;
  assignment_method?: string;

  // New demographic fields
  age?: number;
  experience?: string;
  nationality?: string;
  country_of_interest?: string;
  course_level?: string;

  // Add index signature to allow dynamic assignment
  [key: string]: any;
}

// Multi-assignment specific requests
interface MultiAssignRequest {
  reason: string;
  user_emails: string[];
}

interface RemoveUserFromAssignmentRequest {
  reason: string;
  user_email: string;
}

interface BulkAssignSelectiveRequest {
  assignment_method: "selected_users" | "all_users";
  lead_ids: string[];
  selected_user_emails?: string[];
}

interface SelectiveRoundRobinTestRequest {
  selected_user_emails: string[];
}

interface LeadStatsResponse {
  total_leads: number;
  open_leads: number;
  in_progress_leads: number;
  closed_won_leads: number;
  closed_lost_leads: number;
  my_leads: number;
}

export interface BulkLeadData {
  basic_info: {
    name: string;
    email: string;
    contact_number: string;
    source: string;
    category: string;
    age?: number;
    experience?: string;
    nationality?: string;
  };
  status_and_tags: {
    stage: string;
    lead_score: number;
    tags: string[];
  };
  additional_info: {
    notes: string;
  };
}

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

// Enhanced transformation functions
const transformApiLead = (apiLead: ApiLead): Lead => ({
  id: apiLead.lead_id || apiLead.id || "",
  leadId: apiLead.lead_id || apiLead.id || "", // Fixed: ensure leadId is always present
  name: apiLead.name || "",
  email: apiLead.email || "",
  contact: apiLead.contact_number || apiLead.phone_number || "",
  phoneNumber: apiLead.contact_number || apiLead.phone_number || "", // Fixed: added phoneNumber
  source: apiLead.source || "",
  stage: apiLead.stage || "",
  leadScore: apiLead.lead_score || 0,
  status: apiLead.status || "",

  // Enhanced assignment fields
  assignedTo: apiLead.assigned_to || "",
  assignedToName: apiLead.assigned_to_name || "",
  coAssignees: apiLead.co_assignees || [],
  coAssigneesNames: apiLead.co_assignees_names || [],
  isMultiAssigned: apiLead.is_multi_assigned || false,
  assignmentMethod: apiLead.assignment_method || "",

  // New fields
  age: apiLead.age,
  experience: apiLead.experience,
  nationality: apiLead.nationality,

  courseLevel: apiLead.course_level || "",
  countryOfInterest: apiLead.country_of_interest || "",
  notes: apiLead.notes || "",
  createdAt: apiLead.created_at || "",
  updatedAt: apiLead.updated_at || "",
  lastContacted: apiLead.last_contacted || null,
  leadCategory: apiLead.category || "",
  tags: [], // Fixed: provide default empty array instead of never[]
  priority: "medium", // Fixed: provide default priority
});

const transformLeadDetailsResponse = (
  data: RawLeadDetails
): LeadDetailsResponse => ({
  id: data.system_info.id,
  leadId: data.system_info.lead_id,
  name: data.basic_info.name,
  email: data.basic_info.email,
  phoneNumber: data.basic_info.contact_number,
  contact: data.basic_info.contact_number,
  countryOfInterest: data.basic_info.country_of_interest || "",
  courseLevel: data.basic_info.course_level || "",
  source: data.basic_info.source,
  stage: data.status_and_tags.stage,
  leadScore: data.status_and_tags.lead_score,
  priority: data.status_and_tags.priority,
  tags: data.status_and_tags.tags,

  // Enhanced assignment fields
  assignedTo: data.assignment.assigned_to,
  assignedToName: data.assignment.assigned_to_name,
  coAssignees: data.assignment.co_assignees,
  coAssigneesNames: data.assignment.co_assignees_names,
  isMultiAssigned: data.assignment.is_multi_assigned,
  assignmentMethod: data.assignment.assignment_method,

  // New fields
  age: data.basic_info.age,
  experience: data.basic_info.experience,
  nationality: data.basic_info.nationality,

  notes: data.additional_info.notes,
  createdAt: data.system_info.created_at,
  updatedAt: data.system_info.updated_at,
  lastContacted: data.system_info.last_contacted,
  status: data.system_info.status,
  assignmentHistory: data.assignment.assignment_history,
  leadCategory: data.basic_info.category,
});

export const leadsApi = createApi({
  reducerPath: "leadsApi",
  baseQuery,
  tagTypes: ["Lead", "LeadDetails", "LeadStats", "AssignableUsers"],
  endpoints: (builder) => ({
    // Enhanced leads query with multi-assignment support
    getLeads: builder.query<
      Lead[],
      {
        page?: number;
        limit?: number;
        lead_status?: string;
        assigned_to?: string;
        search?: string;
        include_multi_assigned?: boolean;
        assigned_to_me?: boolean;
      }
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== "") {
            searchParams.append(key, value.toString());
          }
        });
        return `/leads/?${searchParams.toString()}`;
      },
      transformResponse: (response: { leads: ApiLead[] }) =>
        response?.leads ? response.leads.map(transformApiLead) : [],
      providesTags: (result) => [
        { type: "Lead", id: "LIST" },
        ...(result || []).map(({ id }) => ({ type: "Lead" as const, id })),
      ],
    }),

    // Enhanced my leads query
    getMyLeads: builder.query<
      Lead[],
      {
        page?: number;
        limit?: number;
        lead_status?: string;
        search?: string;
        include_co_assignments?: boolean;
      }
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== "") {
            searchParams.append(key, value.toString());
          }
        });
        return `/leads/my-leads?${searchParams.toString()}`;
      },
      transformResponse: (response: { leads: ApiLead[] }) =>
        response?.leads ? response.leads.map(transformApiLead) : [],
      providesTags: (result) => [
        { type: "Lead", id: "MY_LIST" },
        ...(result || []).map(({ id }) => ({ type: "Lead" as const, id })),
      ],
    }),

    // Enhanced leads with extended assignment info
    getLeadsExtended: builder.query<
      ApiLead[],
      {
        page?: number;
        limit?: number;
        include_multi_assigned?: boolean;
        assigned_to_user?: string;
      }
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== "") {
            searchParams.append(key, value.toString());
          }
        });
        return `/leads/leads-extended/?${searchParams.toString()}`;
      },
      providesTags: ["Lead"],
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
      providesTags: (result, error, id) => [
        { type: "LeadDetails", id },
        { type: "Lead", id: result?.leadId },
      ],
    }),

    getLeadStats: builder.query<
      LeadStatsResponse,
      { include_multi_assignment_stats?: boolean }
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.include_multi_assignment_stats !== undefined) {
          searchParams.append(
            "include_multi_assignment_stats",
            params.include_multi_assignment_stats.toString()
          );
        }
        return `/leads/stats?${searchParams.toString()}`;
      },
      transformResponse: (response: LeadStatsResponse) => response,
      providesTags: ["LeadStats"],
    }),

    // Enhanced assignable users with details
    getAssignableUsersWithDetails: builder.query<AssignableUsersResponse, void>(
      {
        query: () => "/leads/users/assignable-with-details",
        providesTags: ["AssignableUsers"],
      }
    ),

    getUserLeadStats: builder.query<UserLeadStatsResponse, void>({
      query: () => "/leads/admin/user-lead-stats",
      transformResponse: (response: UserLeadStatsResponse) => response,
      providesTags: ["AssignableUsers"],
    }),

    // Create lead with selective round robin support
    createLead: builder.mutation<
      any,
      CreateLeadApiRequest & {
        force_create?: boolean;
        selected_user_emails?: string;
      }
    >({
      query: ({ force_create = false, selected_user_emails, ...body }) => {
        const searchParams = new URLSearchParams();
        if (force_create) searchParams.append("force_create", "true");
        if (selected_user_emails)
          searchParams.append("selected_user_emails", selected_user_emails);

        return {
          url: `/leads/?${searchParams.toString()}`,
          method: "POST",
          body,
        };
      },
      invalidatesTags: [
        { type: "Lead", id: "LIST" },
        { type: "Lead", id: "MY_LIST" },
        "LeadStats",
        "AssignableUsers",
      ],
    }),

    // Enhanced bulk create with assignment options
    bulkCreateLeads: builder.mutation<
      any,
      {
        leads: BulkLeadData[];
        force_create?: boolean;
        assignment_method?: string;
        selected_user_emails?: string;
      }
    >({
      query: ({
        leads,
        force_create = false,
        assignment_method = "all_users",
        selected_user_emails,
      }) => {
        const searchParams = new URLSearchParams();
        if (force_create) searchParams.append("force_create", "true");
        if (assignment_method)
          searchParams.append("assignment_method", assignment_method);
        if (selected_user_emails)
          searchParams.append("selected_user_emails", selected_user_emails);

        return {
          url: `/leads/bulk-create?${searchParams.toString()}`,
          method: "POST",
          body: leads,
        };
      },
      invalidatesTags: [
        { type: "Lead", id: "LIST" },
        { type: "Lead", id: "MY_LIST" },
        "LeadStats",
        "AssignableUsers",
      ],
    }),

    updateLead: builder.mutation<ApiLead, UpdateLeadRequest>({
      query: (body) => ({
        url: "/leads/update",
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { lead_id }) => [
        { type: "Lead", id: lead_id },
        { type: "LeadDetails", id: lead_id },
        { type: "Lead", id: "LIST" },
        { type: "Lead", id: "MY_LIST" },
        "LeadStats",
        "AssignableUsers",
      ],
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
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          setTimeout(() => {
            dispatch(
              leadsApi.util.invalidateTags([
                { type: "Lead", id: arg.leadId },
                { type: "Lead", id: "MY_LIST" },
                { type: "LeadDetails", id: arg.leadId },
              ])
            );
          }, 100);
        } catch {
          // Handle error
        }
      },
    }),

    // Multi-assignment endpoints
    assignLeadToMultipleUsers: builder.mutation<
      any,
      {
        leadId: string;
        userEmails: string[];
        reason: string;
      }
    >({
      query: ({ leadId, userEmails, reason }) => ({
        url: `/leads/leads/${leadId}/assign-multiple`,
        method: "POST",
        body: {
          user_emails: userEmails,
          reason,
        },
      }),
      invalidatesTags: (result, error, { leadId }) => [
        { type: "Lead", id: leadId },
        { type: "LeadDetails", id: leadId },
        { type: "Lead", id: "LIST" },
        { type: "Lead", id: "MY_LIST" },
        "LeadStats",
      ],
    }),

    removeUserFromAssignment: builder.mutation<
      any,
      {
        leadId: string;
        userEmail: string;
        reason: string;
      }
    >({
      query: ({ leadId, userEmail, reason }) => ({
        url: `/leads/leads/${leadId}/remove-user`,
        method: "DELETE",
        body: {
          user_email: userEmail,
          reason,
        },
      }),
      invalidatesTags: (result, error, { leadId }) => [
        { type: "Lead", id: leadId },
        { type: "LeadDetails", id: leadId },
        { type: "Lead", id: "LIST" },
        { type: "Lead", id: "MY_LIST" },
        "LeadStats",
      ],
    }),

    bulkAssignSelective: builder.mutation<any, BulkAssignSelectiveRequest>({
      query: (body) => ({
        url: "/leads/assignment/bulk-assign-selective",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "Lead", id: "LIST" },
        { type: "Lead", id: "MY_LIST" },
        "LeadStats",
      ],
    }),

    testSelectiveRoundRobin: builder.mutation<
      any,
      SelectiveRoundRobinTestRequest
    >({
      query: (body) => ({
        url: "/leads/assignment/selective-round-robin/test",
        method: "POST",
        body,
      }),
    }),

    previewRoundRobinAssignment: builder.query<
      any,
      { selected_users?: string }
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.selected_users) {
          searchParams.append("selected_users", params.selected_users);
        }
        return `/leads/assignment/round-robin-preview?${searchParams.toString()}`;
      },
    }),

    getLeadAssignmentDetails: builder.query<any, string>({
      query: (leadId) => `/leads/leads/${leadId}/assignments`,
      providesTags: (result, error, leadId) => [
        { type: "LeadDetails", id: leadId },
      ],
    }),

    deleteLead: builder.mutation<void, string>({
      query: (id) => ({
        url: `/leads/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [
        { type: "Lead", id: "LIST" },
        { type: "Lead", id: "MY_LIST" },
        "LeadStats",
      ],
    }),
  }),
});

export const {
  useGetLeadsQuery,
  useGetMyLeadsQuery,
  useGetLeadsExtendedQuery,
  useGetLeadQuery,
  useGetLeadDetailsQuery,
  useGetLeadStatsQuery,
  useGetAssignableUsersWithDetailsQuery,
  useGetUserLeadStatsQuery,
  useCreateLeadMutation,
  useBulkCreateLeadsMutation,
  useUpdateLeadMutation,
  useUpdateLeadStageMutation,
  useAssignLeadToMultipleUsersMutation,
  useRemoveUserFromAssignmentMutation,
  useBulkAssignSelectiveMutation,
  useTestSelectiveRoundRobinMutation,
  usePreviewRoundRobinAssignmentQuery,
  useGetLeadAssignmentDetailsQuery,
  useDeleteLeadMutation,
} = leadsApi;
