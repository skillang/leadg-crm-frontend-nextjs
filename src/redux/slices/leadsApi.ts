// src/redux/slices/leadsApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../store";
import { Lead } from "@/models/types/lead";

// 🔥 FIXED: Updated base URL configuration to match auth API pattern
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

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
  current_location?: string;
  date_of_birth?: string;

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
    created_by: string;
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
    date_of_birth?: string;
    current_location?: string;
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
  current_location?: string;
  date_of_birth?: string;

  notes: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  lastContacted: string | null;
  status: string;
  assignmentHistory: AssignmentHistory[];
  leadCategory: string;
}

export interface FlatBulkLeadData {
  name: string;
  email: string;
  contact_number: string;
  source: string;
  category: string;
  age?: number;
  experience?: string;
  nationality?: string;
  date_of_birth?: string;
  current_location?: string;
  country_of_interest?: string;
  course_level?: string;
  stage: string;
  status: string;
  lead_score?: number;
  tags?: string[];
  notes?: string;
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
    current_location?: string;
    date_of_birth?: string;
    country_of_interest?: string;
    course_level?: string;
  };
  status_and_tags: {
    stage: string;
    status: string;
    lead_score: number;
    tags: string[];
  };
  assignment: {
    assigned_to: string | null;
  };
  additional_info: {
    notes: string;
  };
  // For selective round robin API calls
  selected_user_emails?: string;
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
  current_location?: string;
  country_of_interest?: string;
  course_level?: string;
  date_of_birth?: string;

  // Add index signature to allow dynamic assignment
  [key: string]: unknown;
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

interface PaginatedResponse<T> {
  leads?: T[];
  total?: number;
  page?: number;
  limit?: number;
  has_next?: boolean;
  has_prev?: boolean;
}

// API Response interfaces
interface CreateLeadResponse {
  success: boolean;
  message: string;
  lead: ApiLead;
}

interface BulkCreateResponse {
  success: boolean;
  message: string;
  created_count: number;
  failed_count: number;
  failed_leads?: unknown[];
  successful_creates: number;
  duplicates_skipped: number;
  failed_creates: number;
  total_attempted: number;
}

interface MultiAssignResponse {
  success: boolean;
  message: string;
  assignment_details: {
    lead_id: string;
    newly_assigned_users: string[];
    previously_assigned: string[];
  };
}

interface RemoveUserResponse {
  success: boolean;
  message: string;
  remaining_assignees: string[];
}

interface BulkAssignResponse {
  success: boolean;
  message: string;
  assignments_created: number;
  failed_assignments: number;
}

interface RoundRobinTestResponse {
  success: boolean;
  message: string;
  next_user: string;
  user_load_distribution: Record<string, number>;
}

interface RoundRobinPreviewResponse {
  success: boolean;
  available_users: UserWithDetails[];
  next_user_in_rotation: string;
  user_load_distribution: Record<string, number>;
}

interface AssignmentDetailsResponse {
  success: boolean;
  assignment_details: {
    current_assignees: string[];
    assignment_history: AssignmentHistory[];
    is_multi_assigned: boolean;
  };
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
    date_of_birth?: string;
    current_location?: string;
    date_of_borth?: string;
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

// 🔥 FIXED: Updated base query to work with https://leadg.in/api base URL
const baseQuery = fetchBaseQuery({
  baseUrl: `${API_BASE_URL}`, // Uses https://leadg.in/api directly
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
  leadId: apiLead.lead_id || apiLead.id || "",
  name: apiLead.name || "",
  email: apiLead.email || "",
  contact: apiLead.contact_number || apiLead.phone_number || "",
  phoneNumber: apiLead.contact_number || apiLead.phone_number || "",
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
  date_of_birth: apiLead.date_of_birth,
  current_location: apiLead.current_location || "",

  courseLevel: apiLead.course_level || "",
  countryOfInterest: apiLead.country_of_interest || "",
  notes: apiLead.notes || "",
  createdAt: apiLead.created_at || "",
  createdBy: apiLead.created_at || "",
  updatedAt: apiLead.updated_at || "",
  lastContacted: apiLead.last_contacted || null,
  leadCategory: apiLead.category || "",
  tags: [],
  priority: "medium",
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
  date_of_birth: data.basic_info.date_of_birth,
  current_location: data.basic_info.current_location,

  notes: data.additional_info.notes,
  createdAt: data.system_info.created_at,
  createdBy: data.system_info.created_by,
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
      Lead[] | PaginatedResponse<Lead>,
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
        const url = `/leads/?${searchParams.toString()}`;
        return url;
      },
      serializeQueryArgs: ({ queryArgs }) => {
        const cacheKey = `page=${queryArgs.page || 1}-limit=${
          queryArgs.limit || 20
        }-status=${queryArgs.lead_status || "all"}-search=${
          queryArgs.search || ""
        }`;
        return cacheKey;
      },
      transformResponse: (response: unknown) => {
        const isValidResponse = (obj: unknown): obj is { leads: ApiLead[] } => {
          return (
            typeof obj === "object" &&
            obj !== null &&
            "leads" in obj &&
            Array.isArray((obj as { leads: unknown }).leads)
          );
        };

        const isPaginatedResponse = (
          obj: unknown
        ): obj is PaginatedResponse<ApiLead> => {
          return (
            typeof obj === "object" &&
            obj !== null &&
            "leads" in obj &&
            Array.isArray((obj as { leads: unknown }).leads) &&
            "total" in obj
          );
        };

        if (isPaginatedResponse(response)) {
          return {
            leads: response.leads!.map(transformApiLead),
            total: response.total,
            page: response.page,
            limit: response.limit,
            has_next: response.has_next,
            has_prev: response.has_prev,
          };
        } else if (isValidResponse(response)) {
          return response.leads.map(transformApiLead);
        } else if (Array.isArray(response)) {
          return response.map(transformApiLead);
        }
        return [];
      },
      providesTags: (result) => [
        { type: "Lead", id: "LIST" },
        ...(Array.isArray(result)
          ? result.map(({ id }) => ({ type: "Lead" as const, id }))
          : (result as PaginatedResponse<Lead>)?.leads?.map(({ id }) => ({
              type: "Lead" as const,
              id,
            })) || []),
      ],
    }),

    getMyLeads: builder.query<
      Lead[] | PaginatedResponse<Lead>,
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
        const url = `/leads/my-leads/?${searchParams.toString()}`;
        return url;
      },
      serializeQueryArgs: ({ queryArgs }) => {
        const cacheKey = `myLeads-page=${queryArgs.page || 1}-limit=${
          queryArgs.limit || 20
        }-status=${queryArgs.lead_status || "all"}-search=${
          queryArgs.search || ""
        }`;
        return cacheKey;
      },
      transformResponse: (response: unknown) => {
        const isValidResponse = (obj: unknown): obj is { leads: ApiLead[] } => {
          return (
            typeof obj === "object" &&
            obj !== null &&
            "leads" in obj &&
            Array.isArray((obj as { leads: unknown }).leads)
          );
        };

        const isPaginatedResponse = (
          obj: unknown
        ): obj is PaginatedResponse<ApiLead> => {
          return (
            typeof obj === "object" &&
            obj !== null &&
            "leads" in obj &&
            Array.isArray((obj as { leads: unknown }).leads) &&
            "total" in obj
          );
        };

        if (isPaginatedResponse(response)) {
          return {
            leads: response.leads!.map(transformApiLead),
            total: response.total,
            page: response.page,
            limit: response.limit,
            has_next: response.has_next,
            has_prev: response.has_prev,
          };
        } else if (isValidResponse(response)) {
          return response.leads.map(transformApiLead);
        } else if (Array.isArray(response)) {
          return [];
        }
        return [];
      },
      providesTags: (result) => [
        { type: "Lead", id: "MY_LIST" },
        ...(Array.isArray(result)
          ? result.map(({ id }) => ({ type: "Lead" as const, id }))
          : (result as PaginatedResponse<Lead>)?.leads?.map(({ id }) => ({
              type: "Lead" as const,
              id,
            })) || []),
      ],
    }),

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
      transformResponse: (response: {
        success: boolean;
        lead: RawLeadDetails;
      }) => {
        return transformLeadDetailsResponse(response.lead);
      },
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
        return `/leads/stats/?${searchParams.toString()}`;
      },
      transformResponse: (response: LeadStatsResponse) => response,
      providesTags: ["LeadStats"],
    }),

    getAssignableUsersWithDetails: builder.query<AssignableUsersResponse, void>(
      {
        query: () => "/leads/users/assignable-with-details/",
        providesTags: ["AssignableUsers"],
      }
    ),

    getUserLeadStats: builder.query<UserLeadStatsResponse, void>({
      query: () => "/leads/admin/user-lead-stats/",
      transformResponse: (response: UserLeadStatsResponse) => response,
      providesTags: ["AssignableUsers"],
    }),

    createLead: builder.mutation<
      CreateLeadResponse,
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

    bulkCreateLeadsFlat: builder.mutation<
      BulkCreateResponse,
      {
        leads: FlatBulkLeadData[];
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
        if (force_create) searchParams.append("force_create", "false");
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
        url: "/leads/update/",
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
        url: "/leads/update/",
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

    assignLeadToMultipleUsers: builder.mutation<
      MultiAssignResponse,
      {
        leadId: string;
        userEmails: string[];
        reason: string;
      }
    >({
      query: ({ leadId, userEmails, reason }) => ({
        url: `/leads/leads/${leadId}/assign-multiple/`,
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
      RemoveUserResponse,
      {
        leadId: string;
        userEmail: string;
        reason: string;
      }
    >({
      query: ({ leadId, userEmail, reason }) => ({
        url: `/leads/leads/${leadId}/remove-user/`,
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

    bulkAssignSelective: builder.mutation<
      BulkAssignResponse,
      BulkAssignSelectiveRequest
    >({
      query: (body) => ({
        url: "/leads/assignment/bulk-assign-selective/",
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
      RoundRobinTestResponse,
      SelectiveRoundRobinTestRequest
    >({
      query: (body) => ({
        url: "/leads/assignment/selective-round-robin/test/",
        method: "POST",
        body,
      }),
    }),

    previewRoundRobinAssignment: builder.query<
      RoundRobinPreviewResponse,
      { selected_users?: string }
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.selected_users) {
          searchParams.append("selected_users", params.selected_users);
        }
        return `/leads/assignment/round-robin-preview/?${searchParams.toString()}`;
      },
    }),

    getLeadAssignmentDetails: builder.query<AssignmentDetailsResponse, string>({
      query: (leadId) => `/leads/leads/${leadId}/assignments/`,
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
  useBulkCreateLeadsFlatMutation,
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
