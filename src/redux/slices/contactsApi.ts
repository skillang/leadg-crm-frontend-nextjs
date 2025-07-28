// src/redux/slices/contactsApi.ts

import {
  createApi,
  fetchBaseQuery,
  BaseQueryFn,
} from "@reduxjs/toolkit/query/react";
import {
  Contact,
  CreateContactRequest,
  UpdateContactRequest,
  ContactsResponse,
  validateContactData,
} from "@/models/types/contact";
import type { RootState } from "../store";
import type { FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { transformContact, RawContact } from "@/models/types/contact";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/",
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const token = state.auth.token;

    if (token) headers.set("authorization", `Bearer ${token}`);
    headers.set("content-type", "application/json");
    headers.set("accept", "application/json"); // Add this

    return headers;
  },
});

const baseQueryWithLogging: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  // console.log("🌐 API Request:", {
  //   url: typeof args === "string" ? args : args.url,
  //   method: typeof args === "string" ? "GET" : args.method,
  //   body: typeof args === "string" ? undefined : args.body,
  // });

  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error) {
    console.error("❌ API Error:", {
      status: result.error.status,
      data: result.error.data,
    });
  }

  return result;
};

export const contactsApi = createApi({
  reducerPath: "contactsApi",
  baseQuery: baseQueryWithLogging,
  tagTypes: ["Contact"],
  endpoints: (builder) => ({
    getLeadContacts: builder.query<ContactsResponse, string>({
      query: (leadId) => `/contacts/leads/${leadId}/contacts`,
      transformResponse: (response: {
        success: boolean;
        data: {
          lead_id: string;
          lead_info: {
            lead_id: string;
            name: string;
            email: string;
            status: string;
          };
          contacts: RawContact[];
          total_count: number;
          primary_contact?: RawContact;
          contact_summary: {
            total: number;
            by_role: Record<string, number>;
            by_relationship: Record<string, number>;
          };
        };
        timestamp?: string;
      }): ContactsResponse => ({
        success: response.success || true,
        data: {
          lead_id: response.data.lead_id,
          lead_info: response.data.lead_info,
          contacts: response.data.contacts.map(transformContact),
          total_count: response.data.total_count,
          primary_contact: response.data.primary_contact
            ? transformContact(response.data.primary_contact)
            : null,
          contact_summary: response.data.contact_summary,
        },
        timestamp: response.timestamp || new Date().toISOString(),
      }),
      providesTags: (result, _error, leadId) => [
        { type: "Contact", id: "LIST" },
        { type: "Contact", id: leadId },
      ],
    }),

    getContact: builder.query<Contact, string>({
      query: (contactId) => `/contacts/${contactId}`,
      transformResponse: (response: RawContact) => transformContact(response),
      providesTags: (result, _error, id) => [{ type: "Contact", id }],
    }),

    createContact: builder.mutation<
      unknown,
      { leadId: string; contactData: CreateContactRequest }
    >({
      query: ({ leadId, contactData }) => {
        const validationErrors = validateContactData(contactData);
        if (validationErrors.length > 0) {
          throw new Error(`Validation failed: ${validationErrors.join(", ")}`);
        }

        const cleanedData = {
          first_name: contactData.first_name.trim(),
          last_name: contactData.last_name.trim(),
          email: contactData.email.trim().toLowerCase(),
          phone: contactData.phone.trim(),
          role: contactData.role,
          relationship: contactData.relationship,
          is_primary: contactData.is_primary || false,
          address: contactData.address?.trim() || "",
          notes: contactData.notes?.trim() || "",
          ...(contactData.linked_leads && {
            linked_leads: contactData.linked_leads,
          }),
        };

        return {
          url: `/contacts/leads/${leadId}/contacts`,
          method: "POST",
          body: cleanedData,
        };
      },
      invalidatesTags: (_result, _error, { leadId }) => [
        { type: "Contact", id: "LIST" },
        { type: "Contact", id: leadId },
      ],
    }),

    updateContact: builder.mutation<
      unknown,
      { contactId: string; contactData: UpdateContactRequest }
    >({
      query: ({ contactId, contactData }) => {
        const cleanedData = Object.fromEntries(
          Object.entries(contactData).filter(
            ([, value]) => value !== undefined && value !== null && value !== ""
          )
        );

        return {
          url: `/contacts/${contactId}`,
          method: "PUT",
          body: cleanedData,
        };
      },
      invalidatesTags: (_result, _error, { contactId }) => [
        { type: "Contact", id: contactId },
        { type: "Contact", id: "LIST" },
      ],
    }),

    setPrimaryContact: builder.mutation<unknown, string>({
      query: (contactId) => ({
        url: `/contacts/${contactId}/primary`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, contactId) => [
        { type: "Contact", id: contactId },
        { type: "Contact", id: "LIST" },
      ],
    }),

    deleteContact: builder.mutation<unknown, string>({
      query: (contactId) => ({
        url: `/contacts/${contactId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, contactId) => [
        { type: "Contact", id: contactId },
        { type: "Contact", id: "LIST" },
      ],
    }),

    testContactsAPI: builder.query<unknown, void>({
      query: () => "/contacts/test",
    }),
  }),
});

export const {
  useGetLeadContactsQuery,
  useGetContactQuery,
  useCreateContactMutation,
  useUpdateContactMutation,
  useSetPrimaryContactMutation,
  useDeleteContactMutation,
  useTestContactsAPIQuery,
} = contactsApi;
