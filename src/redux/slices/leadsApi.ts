// src/redux/slices/leadsApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQueryWithReauth } from "../utils/baseQuerryWithReauth";
import {
  Lead,
  ApiLead,
  LeadDetailsResponse,
  RawLeadDetails,
  FlatBulkLeadData,
  CreateLeadApiRequest,
  UpdateLeadRequest,
  LeadStatsResponse,
  PaginatedResponse,
  CreateLeadResponse,
  BulkCreateResponse,
  MultiAssignResponse,
  RemoveUserResponse,
  BulkAssignResponse,
  RoundRobinTestResponse,
  RoundRobinPreviewResponse,
  AssignmentDetailsResponse,
  BulkAssignSelectiveRequest,
  SelectiveRoundRobinTestRequest,
  UserLeadStatsResponse,
  AssignableUsersResponse,
  transformApiLead,
  transformLeadDetailsResponse,
} from "@/models/types/lead";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// const baseQuery = createBaseQueryWithReauth(
//   process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
// );

export const leadsApi = createApi({
  reducerPath: "leadsApi",
  baseQuery: createBaseQueryWithReauth(`${API_BASE_URL}`),
  tagTypes: ["Lead", "LeadDetails", "LeadStats", "AssignableUsers"],
  endpoints: (builder) => ({
    // Enhanced leads query with multi-assignment support
    getLeads: builder.query<
      Lead[] | PaginatedResponse<Lead>,
      {
        page?: number;
        limit?: number;
        lead_status?: string;
        status?: string;
        stage?: string;
        category?: string;
        source?: string;
        assigned_to?: string;
        search?: string;
        include_multi_assigned?: boolean;
        assigned_to_me?: boolean;
        created_from?: string;
        created_to?: string;
        updated_from?: string;
        updated_to?: string;
        last_contacted_from?: string;
        last_contacted_to?: string;
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
        status?: string;
        stage?: string;
        category?: string;
        source?: string;
        search?: string;
        include_co_assignments?: boolean;
        created_from?: string;
        created_to?: string;
        updated_from?: string; // 🆕 NEW
        updated_to?: string; // 🆕 NEW
        last_contacted_from?: string; // 🆕 NEW
        last_contacted_to?: string; // 🆕 NEW
      }
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== "") {
            searchParams.append(key, value.toString());
          }
        });
        const url = `/leads/my-leads?${searchParams.toString()}`;
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
        return `leads/stats?${searchParams.toString()}`;
      },
      transformResponse: (response: LeadStatsResponse) => response,
      providesTags: ["LeadStats"],
    }),

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
        url: "leads/update", // ✅ Remove leading slash and trailing slash
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
        url: "leads/update",
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
