// src/components/notes/NotesContainer.tsx (UPDATED with Notification System)

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, PlusIcon, Loader2, AlertCircle, Trash2 } from "lucide-react";
import { Note } from "@/models/types/note";
import {
  useGetLeadNotesQuery,
  useDeleteNoteMutation,
} from "@/redux/slices/notesApi";
import { useNotifications } from "@/components/common/NotificationSystem"; // ✅ New import
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

  // ✅ NEW: Use simplified notification system
  const { showSuccess, showError, showConfirm } = useNotifications();

  // ✅ NEW: Add bulk delete mutation
  const [deleteNote, { isLoading: isDeletingNote }] = useDeleteNoteMutation();

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

  // ✅ NEW: Bulk delete functionality with confirmation
  const handleBulkDelete = () => {
    if (selectedNotes.length === 0) return;

    const selectedNoteTitles = notes
      .filter((note) => selectedNotes.includes(note.id))
      .map((note) => note.title)
      .slice(0, 3); // Show max 3 titles

    const titleDisplay =
      selectedNoteTitles.length === selectedNotes.length
        ? selectedNoteTitles.join(", ")
        : `${selectedNoteTitles.join(", ")} and ${
            selectedNotes.length - selectedNoteTitles.length
          } more`;

    showConfirm({
      title: "Delete Notes",
      description: `Are you sure you want to delete ${
        selectedNotes.length
      } note${
        selectedNotes.length > 1 ? "s" : ""
      }? (${titleDisplay})\n\nThis action cannot be undone.`,
      confirmText: "Delete All",
      variant: "destructive",
      onConfirm: async () => {
        let successCount = 0;
        let errorCount = 0;

        for (const noteId of selectedNotes) {
          try {
            await deleteNote(noteId).unwrap();
            successCount++;
          } catch (error) {
            console.error(`Failed to delete note ${noteId}:`, error);
            errorCount++;
          }
        }

        // Clear selection
        setSelectedNotes([]);

        // Show result notification
        if (successCount > 0 && errorCount === 0) {
          showSuccess(
            `Successfully deleted ${successCount} note${
              successCount > 1 ? "s" : ""
            }`,
            "Notes Deleted"
          );
        } else if (successCount > 0 && errorCount > 0) {
          showError(
            `Deleted ${successCount} note${
              successCount > 1 ? "s" : ""
            }, but failed to delete ${errorCount} note${
              errorCount > 1 ? "s" : ""
            }`,
            "Partial Success"
          );
        } else {
          showError(
            `Failed to delete ${errorCount} note${
              errorCount > 1 ? "s" : ""
            }. Please try again.`,
            "Delete Failed"
          );
        }
      },
    });
  };

  // ✅ NEW: Clear selection handler
  const handleClearSelection = () => {
    setSelectedNotes([]);
  };

  // ✅ NEW: Select all handler
  const handleSelectAll = () => {
    if (selectedNotes.length === notes.length) {
      setSelectedNotes([]);
    } else {
      setSelectedNotes(notes.map((note) => note.id));
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading notes...</span>
        </div>
      </div>
    );
  }

  // ✅ UPDATED: Better error handling with retry option
  if (error) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Failed to load notes
          </h3>
          <p className="text-gray-600 mb-4">
            There was an error loading the notes. Please try again.
          </p>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Actions */}
      <div className="flex items-center gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* ✅ NEW: Bulk actions when notes are selected */}
        {selectedNotes.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {selectedNotes.length} selected
            </span>
            <Button variant="outline" size="sm" onClick={handleClearSelection}>
              Clear
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkDelete}
              disabled={isDeletingNote}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        )}

        {/* ✅ NEW: Select all button when there are notes */}
        {notes.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleSelectAll}>
            {selectedNotes.length === notes.length
              ? "Deselect All"
              : "Select All"}
          </Button>
        )}

        {/* Create Note Button */}
        <Button onClick={handleCreateNote} className="gap-2">
          <PlusIcon className="h-4 w-4" />
          New Note
        </Button>
      </div>

      {/* Notes List */}
      {notes.length === 0 ? (
        <div className="text-center py-12">
          {searchQuery ? (
            <div>
              <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No notes found
              </h3>
              <p className="text-gray-600 mb-4">
                No notes match your search criteria.
              </p>
              <Button
                variant="outline"
                onClick={() => setSearchQuery("")}
                size="sm"
              >
                Clear Search
              </Button>
            </div>
          ) : (
            <div>
              <PlusIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No notes yet
              </h3>
              <p className="text-gray-600 mb-4">
                Start by creating your first note for this lead.
              </p>
              <Button onClick={handleCreateNote}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Create First Note
              </Button>
            </div>
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
