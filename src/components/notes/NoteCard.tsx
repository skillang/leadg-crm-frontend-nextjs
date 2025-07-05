// src/components/notes/NoteCard.tsx (UPDATED with Notification System)

"use client";

import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Pen, Trash, Calendar, Clock } from "lucide-react";
import { Note } from "@/models/types/note";
import { useDeleteNoteMutation } from "@/redux/slices/notesApi";
import { useNotifications } from "@/components/common/NotificationSystem"; // ✅ New import
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

  // ✅ NEW: Use simplified notification system
  const { showSuccess, showError, showConfirm } = useNotifications();

  // ✅ UPDATED: Replaced window.confirm with notification dialog
  const handleDelete = () => {
    showConfirm({
      title: "Delete Note",
      description: `Are you sure you want to delete "${note.title}"? This action cannot be undone.`,
      confirmText: "Delete",
      variant: "destructive",
      onConfirm: async () => {
        try {
          await deleteNote(note.id).unwrap();
          showSuccess(`Note "${note.title}" deleted successfully`);
        } catch (error) {
          console.error("Failed to delete note:", error);
          showError("Failed to delete note. Please try again.");
        }
      },
    });
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
      return {
        dateText: "Today",
        timeText: date.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
      };
    } else {
      return {
        dateText: date.toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
        }),
        timeText: date.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
      };
    }
  };

  const { dateText, timeText } = formatDate(note.updated_at);

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength)
      return { text: content, isTruncated: false };
    return { text: content.substring(0, maxLength), isTruncated: true };
  };

  const { text: truncatedContent, isTruncated } = truncateContent(note.content);

  return (
    <Card
      className={cn(
        "transition-all duration-200 hover:shadow-md border border-gray-200",
        isSelected && "ring-2 ring-blue-500",
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
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

      <CardContent className="pt-0 space-y-4">
        {/* Last updated section */}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="font-medium">Last updated:</span>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{dateText}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{timeText}</span>
          </div>
        </div>

        {/* Content section */}
        <div className="text-gray-700 text-sm leading-relaxed">
          <span>{truncatedContent}</span>
          {isTruncated && (
            <>
              <span>... </span>
              <button
                className="text-blue-600 hover:text-blue-800 font-medium"
                onClick={() => {
                  // Could expand content or open full view
                  // console.log("Read all clicked");
                }}
              >
                read all
              </button>
            </>
          )}
        </div>

        {/* Tags section - Now below the content */}
        {note.tags && note.tags.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm text-gray-700 font-medium">Tags:</span>
            <div className="flex flex-wrap gap-2">
              {note.tags.map((tag, tagIndex) => (
                <Badge
                  key={tagIndex}
                  variant="secondary"
                  className="bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm px-3 py-1"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NoteCard;
