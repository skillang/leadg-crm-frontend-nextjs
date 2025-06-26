// src/components/notes/NotesContainer.tsx (SIMPLIFIED)

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, PlusIcon, Loader2, AlertCircle } from "lucide-react";
import { Note } from "@/models/types/note";
import { useGetLeadNotesQuery } from "@/redux/slices/notesApi";
import NoteCard from "./NoteCard";
import NoteEditor from "./NoteEditor";

interface NotesContainerProps {
  leadId: string;
}

const NotesContainer: React.FC<NotesContainerProps> = ({ leadId }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | undefined>();
  const [page, setPage] = useState(1);

  // API queries
  const {
    data: notesData,
    isLoading,
    error,
    refetch,
  } = useGetLeadNotesQuery({
    leadId,
    page,
    limit: 20,
    search: searchQuery || undefined,
  });

  const notes = notesData?.notes || [];
  const hasNextPage = notesData?.has_next || false;
  const hasPrevPage = notesData?.has_prev || false;
  const totalNotes = notesData?.total || 0;

  // Handlers
  const handleCreateNote = () => {
    setEditingNote(undefined);
    setIsEditorOpen(true);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setEditingNote(undefined);
  };

  const handleNoteSelect = (noteId: string) => {
    setSelectedNotes((prev) =>
      prev.includes(noteId)
        ? prev.filter((id) => id !== noteId)
        : [...prev, noteId]
    );
  };

  if (isLoading && page === 1) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading notes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-gray-600 mb-4">Failed to load notes</p>
          <Button onClick={() => refetch()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Updated Filtering Header - Clean Layout */}
      <div className="space-y-4">
        {/* First Row: Only Search + New Note Button */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-gray-300"
            />
          </div>

          <Button
            onClick={handleCreateNote}
            className="gap-2 bg-gray-900 hover:bg-gray-800"
          >
            <PlusIcon className="h-4 w-4" />
            New note
          </Button>
        </div>

        {/* Second Row: All Filter Options */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" className="gap-2">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Created by
          </Button>

          <Button variant="outline" className="gap-2">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
              />
            </svg>
            Tags
          </Button>

          <Button variant="outline" className="gap-2">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
              />
            </svg>
            Mentions
          </Button>

          <Button variant="outline" className="gap-2">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Documents
          </Button>

          <Button variant="outline" className="gap-2">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"
              />
            </svg>
            Sort
          </Button>
        </div>
      </div>

      {/* Notes List */}
      {notes.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg
              className="h-12 w-12 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? "No notes match your search" : "No notes yet"}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchQuery
              ? "Try adjusting your search criteria"
              : "Start by creating your first note for this lead"}
          </p>
          {!searchQuery && (
            <Button onClick={handleCreateNote}>Create First Note</Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              isSelected={selectedNotes.includes(note.id)}
              onSelect={handleNoteSelect}
              onEdit={handleEditNote}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {(hasNextPage || hasPrevPage) && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {notes.length} of {totalNotes} notes
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={!hasPrevPage || isLoading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={!hasNextPage || isLoading}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Note Editor Modal */}
      <NoteEditor
        isOpen={isEditorOpen}
        onClose={handleCloseEditor}
        leadId={leadId}
        note={editingNote}
      />
    </div>
  );
};

export default NotesContainer;
