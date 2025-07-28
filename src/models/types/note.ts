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

// =============== API TYPES ===============
export interface ApiNote {
  id?: string;
  _id?: string;
  title: string;
  content: string;
  tags?: string[];
  lead_id: string;
  created_by: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  updated_by: string;
  updated_by_name: string;
}

export interface ApiNotesResponse {
  notes?: ApiNote[];
  total?: number;
  page?: number;
  limit?: number;
  has_next?: boolean;
  has_prev?: boolean;
  available_tags?: string[];
}

// =============== NOTE MUTATION RESPONSES ===============
export interface CreateNoteResponse {
  message: string;
  note: Note;
}

export interface UpdateNoteResponse {
  message: string;
  note: Note;
}

export interface DeleteNoteResponse {
  message: string;
}

// =============== TRANSFORMATION FUNCTION ===============
export const transformNote = (apiNote: ApiNote): Note => ({
  id: apiNote.id || apiNote._id || "",
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

// =============== NOTE VALIDATION ===============
export const validateNoteData = (note: CreateNoteRequest): string[] => {
  const errors: string[] = [];

  if (!note.title?.trim()) {
    errors.push("Title is required");
  } else if (note.title.trim().length < 3) {
    errors.push("Title must be at least 3 characters long");
  }

  if (!note.content?.trim()) {
    errors.push("Content is required");
  } else if (note.content.trim().length < 10) {
    errors.push("Content must be at least 10 characters long");
  }

  return errors;
};

// =============== NOTE CONSTANTS ===============
export const NOTE_TYPES = [
  { value: "general", label: "General Note" },
  { value: "follow_up", label: "Follow Up" },
  { value: "meeting", label: "Meeting Notes" },
  { value: "call", label: "Call Notes" },
  { value: "task", label: "Task Related" },
  { value: "important", label: "Important" },
] as const;

export const DEFAULT_NOTE_TAGS = [
  "important",
  "follow-up",
  "meeting",
  "call",
  "progress",
  "issue",
  "decision",
  "todo",
  "completed",
  "urgent",
] as const;

// =============== HELPER FUNCTIONS ===============
export const formatNoteDate = (dateString: string): string => {
  const date = new Date(dateString);
  return (
    date.toLocaleDateString() +
    " " +
    date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  );
};

export const getNotesByTag = (notes: Note[], tag: string): Note[] => {
  return notes.filter((note) => note.tags.includes(tag));
};

export const searchNotes = (notes: Note[], searchTerm: string): Note[] => {
  const term = searchTerm.toLowerCase();
  return notes.filter(
    (note) =>
      note.title.toLowerCase().includes(term) ||
      note.content.toLowerCase().includes(term) ||
      note.tags.some((tag) => tag.toLowerCase().includes(term))
  );
};
