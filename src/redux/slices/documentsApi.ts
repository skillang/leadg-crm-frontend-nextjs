// src/redux/slices/documentsApi.ts

import { createApi } from "@reduxjs/toolkit/query/react";
import {
  Document,
  UploadDocumentRequest,
  UpdateDocumentRequest,
  ApproveDocumentRequest,
  RejectDocumentRequest,
  DocumentsResponse,
  DocumentType,
  DocumentStatus,
  ApiDocumentResponse,
  ApiDocumentsListResponse,
  ApiDocumentTypesResponse,
  ApiDocumentStatusesResponse,
  DocumentUploadResponse,
  DocumentUpdateResponse,
  DocumentDeleteResponse,
  DocumentApprovalResponse,
  AdminDashboardResponse,
} from "@/models/types/documents";
import { createBaseQueryWithReauth } from "../utils/baseQuerryWithReauth";

const baseQuery = createBaseQueryWithReauth(
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
);

// Transform API response to match our frontend types
const transformDocument = (apiDocument: ApiDocumentResponse): Document => ({
  id: apiDocument.id,
  lead_id: apiDocument.lead_id,
  filename: apiDocument.filename,
  document_type: apiDocument.document_type,
  file_size: apiDocument.file_size,
  mime_type: apiDocument.mime_type,
  status: apiDocument.status,
  uploaded_by_name: apiDocument.uploaded_by_name,
  uploaded_at: apiDocument.uploaded_at,
  notes: apiDocument.notes || "",
  expiry_date: apiDocument.expiry_date || "",
  approved_by_name: apiDocument.approved_by_name || "",
  approved_at: apiDocument.approved_at || "",
  approval_notes: apiDocument.approval_notes || "",
  lead_context: apiDocument.lead_context || {},
});

export const documentsApi = createApi({
  reducerPath: "documentsApi",
  baseQuery,
  tagTypes: ["Document", "DocumentTypes"],
  endpoints: (builder) => ({
    // Get documents for a specific lead
    getLeadDocuments: builder.query<
      DocumentsResponse,
      {
        leadId: string;
        page?: number;
        limit?: number;
        document_type?: string;
        status?: string;
      }
    >({
      query: ({ leadId, page = 1, limit = 10, document_type, status }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });

        if (document_type) params.append("document_type", document_type);
        if (status) params.append("status", status);

        return `/documents/leads/${leadId}/documents?${params.toString()}`;
      },
      transformResponse: (
        response: ApiDocumentsListResponse
      ): DocumentsResponse => ({
        documents: response.documents?.map(transformDocument) || [],
        total_count: response.total_count || 0,
        page: response.page || 1,
        limit: response.limit || 10,
        total_pages: response.total_pages || 1,
      }),
      providesTags: (result, error, { leadId }) => [
        { type: "Document", id: "LIST" },
        { type: "Document", id: leadId },
      ],
    }),

    // Get a specific document
    getDocument: builder.query<Document, string>({
      query: (documentId) => `/documents/${documentId}`,
      transformResponse: transformDocument,
      providesTags: (result, error, id) => [{ type: "Document", id }],
    }),

    // Upload a new document
    uploadDocument: builder.mutation<
      DocumentUploadResponse,
      { leadId: string; documentData: UploadDocumentRequest }
    >({
      query: ({ leadId, documentData }) => {
        const formData = new FormData();
        formData.append("file", documentData.file);
        formData.append("document_type", documentData.document_type);
        if (documentData.notes) {
          formData.append("notes", documentData.notes);
        }

        return {
          url: `/documents/leads/${leadId}/upload`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: (result, error, { leadId }) => [
        { type: "Document", id: "LIST" },
        { type: "Document", id: leadId },
      ],
    }),

    // Update a document
    updateDocument: builder.mutation<
      DocumentUpdateResponse,
      { documentId: string; documentData: UpdateDocumentRequest }
    >({
      query: ({ documentId, documentData }) => ({
        url: `/documents/${documentId}`,
        method: "PUT",
        body: documentData,
      }),
      invalidatesTags: (result, error, { documentId }) => [
        { type: "Document", id: documentId },
        { type: "Document", id: "LIST" },
      ],
    }),

    // Delete a document
    deleteDocument: builder.mutation<DocumentDeleteResponse, string>({
      query: (documentId) => ({
        url: `/documents/${documentId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, documentId) => [
        { type: "Document", id: documentId },
        { type: "Document", id: "LIST" },
      ],
    }),

    // Download a document
    downloadDocument: builder.mutation<Blob, string>({
      query: (documentId) => ({
        url: `/documents/${documentId}/download`,
        method: "GET",
        responseHandler: (response) => response.blob(),
      }),
    }),

    // Approve a document (Admin only)
    approveDocument: builder.mutation<
      DocumentApprovalResponse,
      { documentId: string; approvalData: ApproveDocumentRequest }
    >({
      query: ({ documentId, approvalData }) => ({
        url: `/documents/${documentId}/approve`,
        method: "PATCH",
        body: approvalData,
      }),
      invalidatesTags: (result, error, { documentId }) => [
        { type: "Document", id: documentId },
        { type: "Document", id: "LIST" },
      ],
    }),

    // Reject a document (Admin only)
    rejectDocument: builder.mutation<
      DocumentApprovalResponse,
      { documentId: string; rejectionData: RejectDocumentRequest }
    >({
      query: ({ documentId, rejectionData }) => ({
        url: `/documents/${documentId}/reject`,
        method: "PATCH",
        body: rejectionData,
      }),
      invalidatesTags: (result, error, { documentId }) => [
        { type: "Document", id: documentId },
        { type: "Document", id: "LIST" },
      ],
    }),

    // Get document types
    getDocumentTypes: builder.query<DocumentType[], void>({
      query: () => "/documents/types/list",
      transformResponse: (
        response: ApiDocumentTypesResponse
      ): DocumentType[] => {
        if (response.document_types && Array.isArray(response.document_types)) {
          return response.document_types.map((type) => ({
            value: type.value,
            label: type.label,
          }));
        }
        return [];
      },
      providesTags: ["DocumentTypes"],
    }),

    // Get document statuses
    getDocumentStatuses: builder.query<DocumentStatus[], void>({
      query: () => "/documents/status/list",
      transformResponse: (
        response: ApiDocumentStatusesResponse
      ): DocumentStatus[] => {
        if (response.statuses && Array.isArray(response.statuses)) {
          return response.statuses.map((status) => ({
            value: status.value,
            label: status.label,
          }));
        }
        return [];
      },
      providesTags: ["DocumentTypes"],
    }),

    // Get my documents (across all leads)
    getMyDocuments: builder.query<
      DocumentsResponse,
      {
        page?: number;
        limit?: number;
        status?: string;
      }
    >({
      query: ({ page = 1, limit = 20, status }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });

        if (status) params.append("status", status);

        return `/documents/my-documents?${params.toString()}`;
      },
      transformResponse: (
        response: ApiDocumentsListResponse
      ): DocumentsResponse => ({
        documents: response.documents?.map(transformDocument) || [],
        total_count: response.total_count || 0,
        page: response.page || 1,
        limit: response.limit || 20,
        total_pages: response.total_pages || 1,
      }),
      providesTags: [{ type: "Document", id: "MY_DOCUMENTS" }],
    }),

    // Get admin document dashboard
    getAdminDocumentDashboard: builder.query<AdminDashboardResponse, void>({
      query: () => "/documents/admin/dashboard",
      providesTags: [{ type: "Document", id: "ADMIN_DASHBOARD" }],
    }),

    // Get pending documents for approval (Admin only)
    getPendingDocuments: builder.query<
      DocumentsResponse,
      {
        page?: number;
        limit?: number;
      }
    >({
      query: ({ page = 1, limit = 20 }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });

        return `/documents/admin/pending?${params.toString()}`;
      },
      transformResponse: (
        response: ApiDocumentsListResponse
      ): DocumentsResponse => ({
        documents: response.documents?.map(transformDocument) || [],
        total_count: response.total_count || 0,
        page: response.page || 1,
        limit: response.limit || 20,
        total_pages: response.total_pages || 1,
      }),
      providesTags: [{ type: "Document", id: "PENDING" }],
    }),
  }),
});

export const {
  useGetLeadDocumentsQuery,
  useGetDocumentQuery,
  useUploadDocumentMutation,
  useUpdateDocumentMutation,
  useDeleteDocumentMutation,
  useDownloadDocumentMutation,
  useApproveDocumentMutation,
  useRejectDocumentMutation,
  useGetDocumentTypesQuery,
  useGetDocumentStatusesQuery,
  useGetMyDocumentsQuery,
  useGetAdminDocumentDashboardQuery,
  useGetPendingDocumentsQuery,
} = documentsApi;
