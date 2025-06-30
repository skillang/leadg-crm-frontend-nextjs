// src/redux/slices/contactsApi.ts - IMPROVED with better error handling

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../store";
import {
  Contact,
  CreateContactRequest,
  UpdateContactRequest,
  ContactsResponse,
  validateContactData,
} from "@/models/types/contact";

// Enhanced base query with better error handling
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
});

// Enhanced base query with request/response logging
const baseQueryWithLogging = async (args: any, api: any, extraOptions: any) => {
  // Log outgoing requests
  console.log("🌐 API Request:", {
    url: typeof args === "string" ? args : args.url,
    method: typeof args === "string" ? "GET" : args.method,
    body: typeof args === "string" ? undefined : args.body,
  });

  const result = await baseQuery(args, api, extraOptions);

  // Log responses
  if (result.error) {
    console.error("❌ API Error:", {
      status: result.error.status,
      data: result.error.data,
    });
  } else {
    console.log("✅ API Success:", result.data);
  }

  return result;
};

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
  is_primary: apiContact.is_primary || false,
  address: apiContact.address || "",
  notes: apiContact.notes || "",
  linked_leads: apiContact.linked_leads || [],
  created_by_name: apiContact.created_by_name || "Unknown",
  created_at: apiContact.created_at,
  updated_at: apiContact.updated_at,
});

export const contactsApi = createApi({
  reducerPath: "contactsApi",
  baseQuery: baseQueryWithLogging, // Use enhanced base query with logging
  tagTypes: ["Contact"],
  endpoints: (builder) => ({
    // Get contacts for a specific lead
    getLeadContacts: builder.query<ContactsResponse, string>({
      query: (leadId) => {
        console.log("🔍 Fetching contacts for lead:", leadId);
        return `/contacts/leads/${leadId}/contacts`;
      },
      transformResponse: (response: any): ContactsResponse => {
        console.log("📥 Raw contacts response:", response);

        return {
          success: response.success || true,
          data: {
            ...response.data,
            contacts: response.data?.contacts?.map(transformContact) || [],
            primary_contact: response.data?.primary_contact
              ? transformContact(response.data.primary_contact)
              : null,
          },
          timestamp: response.timestamp || new Date().toISOString(),
        };
      },
      providesTags: (result, error, leadId) => [
        { type: "Contact", id: "LIST" },
        { type: "Contact", id: leadId },
      ],
    }),

    // Get a specific contact
    getContact: builder.query<Contact, string>({
      query: (contactId) => {
        console.log("🔍 Fetching contact:", contactId);
        return `/contacts/${contactId}`;
      },
      transformResponse: (response: any) => {
        console.log("📥 Raw contact response:", response);
        return transformContact(response);
      },
      providesTags: (result, error, id) => [{ type: "Contact", id }],
    }),

    // Create a new contact
    createContact: builder.mutation<
      any,
      { leadId: string; contactData: CreateContactRequest }
    >({
      query: ({ leadId, contactData }) => {
        // Client-side validation
        const validationErrors = validateContactData(contactData);
        if (validationErrors.length > 0) {
          console.error("❌ Client validation failed:", validationErrors);
          throw new Error(`Validation failed: ${validationErrors.join(", ")}`);
        }

        console.log("📤 Creating contact for lead:", leadId);
        console.log("📤 Contact data:", contactData);

        // Clean the data before sending
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
          // NOTE: Some APIs might not need linked_leads for creation
          ...(contactData.linked_leads && {
            linked_leads: contactData.linked_leads,
          }),
        };

        console.log("📤 Cleaned contact data:", cleanedData);

        return {
          url: `/contacts/leads/${leadId}/contacts`,
          method: "POST",
          body: cleanedData,
        };
      },
      transformResponse: (response: any) => {
        console.log("📥 Create contact response:", response);
        return response;
      },
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
      query: ({ contactId, contactData }) => {
        console.log("📤 Updating contact:", contactId);
        console.log("📤 Update data:", contactData);

        // Clean the data before sending
        const cleanedData = Object.fromEntries(
          Object.entries(contactData).filter(
            ([_, value]) =>
              value !== undefined && value !== null && value !== ""
          )
        );

        console.log("📤 Cleaned update data:", cleanedData);

        return {
          url: `/contacts/${contactId}`,
          method: "PUT",
          body: cleanedData,
        };
      },
      transformResponse: (response: any) => {
        console.log("📥 Update contact response:", response);
        return response;
      },
      invalidatesTags: (result, error, { contactId }) => [
        { type: "Contact", id: contactId },
        { type: "Contact", id: "LIST" },
      ],
    }),

    // Set primary contact
    setPrimaryContact: builder.mutation<any, string>({
      query: (contactId) => {
        console.log("📤 Setting primary contact:", contactId);
        return {
          url: `/contacts/${contactId}/primary`,
          method: "PATCH",
        };
      },
      transformResponse: (response: any) => {
        console.log("📥 Set primary response:", response);
        return response;
      },
      invalidatesTags: (result, error, contactId) => [
        { type: "Contact", id: contactId },
        { type: "Contact", id: "LIST" },
      ],
    }),

    // Delete a contact
    deleteContact: builder.mutation<any, string>({
      query: (contactId) => {
        console.log("📤 Deleting contact:", contactId);
        return {
          url: `/contacts/${contactId}`,
          method: "DELETE",
        };
      },
      transformResponse: (response: any) => {
        console.log("📥 Delete contact response:", response);
        return response;
      },
      invalidatesTags: (result, error, contactId) => [
        { type: "Contact", id: contactId },
        { type: "Contact", id: "LIST" },
      ],
    }),

    // Test API connection
    testContactsAPI: builder.query<any, void>({
      query: () => {
        console.log("🔧 Testing contacts API connection...");
        return "/contacts/test"; // Assuming your backend has a test endpoint
      },
      transformResponse: (response: any) => {
        console.log("✅ API test response:", response);
        return response;
      },
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
