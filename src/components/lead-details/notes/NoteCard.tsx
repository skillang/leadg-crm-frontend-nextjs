// src/components/notes/NoteCard.tsx (UPDATED to Handle Optional Content)

"use client";

import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Pen, Trash, Calendar, Clock, FileText } from "lucide-react";
import { Note } from "@/models/types/note";
import { useDeleteNoteMutation } from "@/redux/slices/notesApi";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useNotifications } from "@/components/common/NotificationSystem";
import { cn } from "@/lib/utils";
import { twoTileDateTime } from "@/utils/formatDate";

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
  const { showError, showConfirm, showWarning } = useNotifications();

  const handleDelete = () => {
    showConfirm({
      title: "Delete Note",
      description: `Are you sure you want to delete "${note.title}"? This action cannot be undone.`,
      confirmText: "Delete",
      variant: "destructive",
      onConfirm: async () => {
        try {
          await deleteNote(note.id).unwrap();
          showWarning(
            `Note "${note.title}" deleted successfully`,
            "Note Delete"
          );
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

  const { dateText, timeText } = twoTileDateTime(note.updated_at);

  // ✅ UPDATED: Handle optional content properly
  const getContentDisplay = (content?: string) => {
    const trimmedContent = content?.trim();

    if (!trimmedContent) {
      return {
        text: "No description provided",
        isEmpty: true,
        isTruncated: false,
      };
    }

    const maxLength = 150;
    if (trimmedContent.length <= maxLength) {
      return {
        text: trimmedContent,
        isEmpty: false,
        isTruncated: false,
      };
    }

    return {
      text: trimmedContent.substring(0, maxLength),
      isEmpty: false,
      isTruncated: true,
    };
  };

  const {
    text: displayContent,
    isEmpty: isContentEmpty,
    isTruncated,
  } = getContentDisplay(note.content);

  return (
    <Card
      className={cn(
        "transition-all duration-200  border-gray-200",
        isSelected && "ring-2 ring-blue-500",
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
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
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleEdit}
            disabled={isDeleting}
          >
            <Pen className="h-4 w-4 text-gray-600" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash className="h-4 w-4 text-gray-600" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        <Table>
          <TableBody>
            {/* Last updated row */}
            <TableRow>
              <TableCell className="py-2 text-gray-500 text-sm font-normal w-32">
                Last updated:
              </TableCell>
              <TableCell className="py-2">
                <div className="flex items-center gap-4 text-sm">
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <Calendar className="h-4 w-4" />
                    <span className="">{dateText}</span>
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span className="">{timeText}</span>
                  </Badge>
                </div>
              </TableCell>
            </TableRow>

            {/* Tags row - only show if tags exist */}
            {note.tags && note.tags.length > 0 && (
              <TableRow>
                <TableCell className="py-2 text-gray-500 text-sm font-normal align-top">
                  Tags:
                </TableCell>
                <TableCell className="py-2">
                  <div className="flex flex-wrap gap-2">
                    {note.tags.map((tag, tagIndex) => (
                      <Badge
                        key={tagIndex}
                        variant="secondary"
                        className="bg-gray-100 text-gray-700 text-xs"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            )}

            {/* Content row - ✅ UPDATED: Handle optional content */}
            <TableRow>
              <TableCell className="py-2 text-gray-500 text-sm font-normal align-top">
                Description:
              </TableCell>
              <TableCell className="py-2">
                <div
                  className={cn(
                    "text-sm leading-relaxed",
                    isContentEmpty ? "text-gray-400 italic" : "text-gray-700"
                  )}
                >
                  {isContentEmpty ? (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>{displayContent}</span>
                    </div>
                  ) : (
                    <div>
                      <span>{displayContent}</span>
                      {isTruncated && (
                        <>
                          <span>... </span>
                          <button
                            className="text-blue-600 hover:text-blue-800 font-medium"
                            onClick={() => {
                              // Could expand content or open full view
                              // For now, just show the full content in a simple alert
                              // In a real app, you might open a modal or expand inline
                              console.log("Full content:", note.content);
                            }}
                          >
                            read all
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </TableCell>
            </TableRow>

            {/* Created by row */}
            <TableRow
              className={cn(
                (!note.tags || note.tags.length === 0) && "border-b-0"
              )}
            >
              <TableCell className="py-2 text-gray-500 text-sm font-normal">
                Created by:
              </TableCell>
              <TableCell className="py-2">
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-700 text-xs"
                >
                  {note.created_by_name}
                </Badge>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default NoteCard;
