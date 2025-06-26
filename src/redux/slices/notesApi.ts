// src/redux/slices/notesApi.ts (SIMPLIFIED)

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../store";
import {
  Note,
  CreateNoteRequest,
  UpdateNoteRequest,
  NotesResponse,
} from "@/models/types/note";

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
const transformNote = (apiNote: any): Note => ({
  id: apiNote.id || apiNote._id,
  title: apiNote.title,
  content: apiNote.content,
  tags: apiNote.tags || [],
  lead_id: apiNote.lead_id,
  created_by: apiNote.created_by,
  created_by_name: apiNote.created_by_name,
  created_at: apiNote.created_at,
  updated_at: apiNote.updated_at,
  updated_by: apiNote.updated_by,
  updated_by_name: apiNote.updated_by_name,
});

export const notesApi = createApi({
  reducerPath: "notesApi",
  baseQuery,
  tagTypes: ["Note"],
  endpoints: (builder) => ({
    // Get notes for a specific lead
    getLeadNotes: builder.query<
      NotesResponse,
      {
        leadId: string;
        page?: number;
        limit?: number;
        search?: string;
      }
    >({
      query: ({ leadId, page = 1, limit = 20, search }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });

        if (search) params.append("search", search);

        return `/notes/leads/${leadId}/notes?${params.toString()}`;
      },
      transformResponse: (response: any): NotesResponse => ({
        notes: response.notes?.map(transformNote) || [],
        total: response.total || 0,
        page: response.page || 1,
        limit: response.limit || 20,
        has_next: response.has_next || false,
        has_prev: response.has_prev || false,
        available_tags: response.available_tags || [],
      }),
      providesTags: (result, error, { leadId }) => [
        { type: "Note", id: "LIST" },
        { type: "Note", id: leadId },
      ],
    }),

    // Get a specific note
    getNote: builder.query<Note, string>({
      query: (noteId) => `/notes/${noteId}`,
      transformResponse: transformNote,
      providesTags: (result, error, id) => [{ type: "Note", id }],
    }),

    // Create a new note
    createNote: builder.mutation<
      any,
      { leadId: string; noteData: CreateNoteRequest }
    >({
      query: ({ leadId, noteData }) => ({
        url: `/notes/leads/${leadId}/notes`,
        method: "POST",
        body: {
          title: noteData.title,
          content: noteData.content,
          note_type: "general", // Default type for API compatibility
          tags: noteData.tags,
          is_important: false, // Default for API compatibility
          is_private: false, // Default for API compatibility
        },
      }),
      invalidatesTags: (result, error, { leadId }) => [
        { type: "Note", id: "LIST" },
        { type: "Note", id: leadId },
      ],
    }),

    // Update a note
    updateNote: builder.mutation<
      any,
      { noteId: string; noteData: UpdateNoteRequest }
    >({
      query: ({ noteId, noteData }) => ({
        url: `/notes/${noteId}`,
        method: "PUT",
        body: {
          title: noteData.title,
          content: noteData.content,
          tags: noteData.tags,
        },
      }),
      invalidatesTags: (result, error, { noteId }) => [
        { type: "Note", id: noteId },
        { type: "Note", id: "LIST" },
      ],
    }),

    // Delete a note
    deleteNote: builder.mutation<any, string>({
      query: (noteId) => ({
        url: `/notes/${noteId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, noteId) => [
        { type: "Note", id: noteId },
        { type: "Note", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetLeadNotesQuery,
  useGetNoteQuery,
  useCreateNoteMutation,
  useUpdateNoteMutation,
  useDeleteNoteMutation,
} = notesApi;
