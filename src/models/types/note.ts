// src/models/types/note.ts (SIMPLIFIED)

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  lead_id: string;
  created_by: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  updated_by?: string;
  updated_by_name?: string;
}

export interface CreateNoteRequest {
  title: string;
  content: string;
  tags: string[];
}

export interface UpdateNoteRequest {
  title?: string;
  content?: string;
  tags?: string[];
}

export interface NotesResponse {
  notes: Note[];
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
  has_prev: boolean;
  available_tags: string[];
}
