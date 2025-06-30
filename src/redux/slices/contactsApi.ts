// src/redux/slices/contactsApi.ts

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../store";
import {
  Contact,
  CreateContactRequest,
  UpdateContactRequest,
  ContactsResponse,
} from "@/models/types/contact";

// Base query with authentication
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

// Transform API response to match our frontend types
const transformContact = (apiContact: any): Contact => ({
  id: apiContact.id,
  lead_id: apiContact.lead_id,
  first_name: apiContact.first_name,
  last_name: apiContact.last_name,
  full_name:
    apiContact.full_name || `${apiContact.first_name} ${apiContact.last_name}`,
  email: apiContact.email,
  phone: apiContact.phone,
  role: apiContact.role,
  relationship: apiContact.relationship,
  is_primary: apiContact.is_primary,
  address: apiContact.address || "",
  notes: apiContact.notes || "",
  linked_leads: apiContact.linked_leads || [],
  created_by_name: apiContact.created_by_name,
  created_at: apiContact.created_at,
  updated_at: apiContact.updated_at,
});

export const contactsApi = createApi({
  reducerPath: "contactsApi",
  baseQuery,
  tagTypes: ["Contact"],
  endpoints: (builder) => ({
    // Get contacts for a specific lead
    getLeadContacts: builder.query<ContactsResponse, string>({
      query: (leadId) => `/contacts/leads/${leadId}/contacts`,
      transformResponse: (response: any): ContactsResponse => ({
        success: response.success,
        data: {
          ...response.data,
          contacts: response.data.contacts?.map(transformContact) || [],
          primary_contact: response.data.primary_contact
            ? transformContact(response.data.primary_contact)
            : null,
        },
        timestamp: response.timestamp,
      }),
      providesTags: (result, error, leadId) => [
        { type: "Contact", id: "LIST" },
        { type: "Contact", id: leadId },
      ],
    }),

    // Get a specific contact
    getContact: builder.query<Contact, string>({
      query: (contactId) => `/contacts/${contactId}`,
      transformResponse: transformContact,
      providesTags: (result, error, id) => [{ type: "Contact", id }],
    }),

    // Create a new contact
    createContact: builder.mutation<
      any,
      { leadId: string; contactData: CreateContactRequest }
    >({
      query: ({ leadId, contactData }) => ({
        url: `/contacts/leads/${leadId}/contacts`,
        method: "POST",
        body: contactData,
      }),
      invalidatesTags: (result, error, { leadId }) => [
        { type: "Contact", id: "LIST" },
        { type: "Contact", id: leadId },
      ],
    }),

    // Update a contact
    updateContact: builder.mutation<
      any,
      { contactId: string; contactData: UpdateContactRequest }
    >({
      query: ({ contactId, contactData }) => ({
        url: `/contacts/${contactId}`,
        method: "PUT",
        body: contactData,
      }),
      invalidatesTags: (result, error, { contactId }) => [
        { type: "Contact", id: contactId },
        { type: "Contact", id: "LIST" },
      ],
    }),

    // Set primary contact
    setPrimaryContact: builder.mutation<any, string>({
      query: (contactId) => ({
        url: `/contacts/${contactId}/primary`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, contactId) => [
        { type: "Contact", id: contactId },
        { type: "Contact", id: "LIST" },
      ],
    }),

    // Delete a contact
    deleteContact: builder.mutation<any, string>({
      query: (contactId) => ({
        url: `/contacts/${contactId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, contactId) => [
        { type: "Contact", id: contactId },
        { type: "Contact", id: "LIST" },
      ],
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
} = contactsApi;
