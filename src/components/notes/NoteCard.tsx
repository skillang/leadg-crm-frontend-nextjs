// src/components/notes/NoteCard.tsx (SIMPLIFIED)

"use client";

import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Pen, Trash } from "lucide-react";
import { Note } from "@/models/types/note";
import { useDeleteNoteMutation } from "@/redux/slices/notesApi";
import { cn } from "@/lib/utils";

interface NoteCardProps {
  note: Note;
  isSelected?: boolean;
  onSelect?: (noteId: string) => void;
  onEdit?: (note: Note) => void;
  className?: string;
}

const NoteCard: React.FC<NoteCardProps> = ({
  note,
  isSelected = false,
  onSelect,
  onEdit,
  className,
}) => {
  const [deleteNote, { isLoading: isDeleting }] = useDeleteNoteMutation();

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${note.title}"?`)) {
      try {
        await deleteNote(note.id).unwrap();
        console.log("Note deleted successfully");
      } catch (error) {
        console.error("Failed to delete note:", error);
        alert("Failed to delete note. Please try again.");
      }
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(note);
    }
  };

  const handleSelect = () => {
    if (onSelect) {
      onSelect(note.id);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();

    if (isToday) {
      return `Today ${date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })}`;
    } else {
      return date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  };

  return (
    <Card
      className={cn(
        "transition-all duration-200 hover:shadow-md",
        isSelected && "ring-2 ring-blue-500",
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-3 flex-1">
          {onSelect && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={handleSelect}
              aria-label="Select note"
            />
          )}

          <h3 className="font-semibold text-gray-900 line-clamp-1 flex-1">
            {note.title}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-100"
            onClick={handleEdit}
            disabled={isDeleting}
          >
            <Pen className="h-4 w-4 text-gray-600" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-100"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash className="h-4 w-4 text-gray-600" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-2">
            Last updated: {formatDate(note.updated_at)}
          </p>
          <p className="text-gray-700 text-sm leading-relaxed">
            {note.content}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default NoteCard;
