// src/components/notes/NoteEditor.tsx (SIMPLIFIED)

"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Note,
  CreateNoteRequest,
  UpdateNoteRequest,
} from "@/models/types/note";
import {
  useCreateNoteMutation,
  useUpdateNoteMutation,
} from "@/redux/slices/notesApi";

interface NoteEditorProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  note?: Note; // If provided, we're editing; otherwise creating
}

const NoteEditor: React.FC<NoteEditorProps> = ({
  isOpen,
  onClose,
  leadId,
  note,
}) => {
  const [createNote, { isLoading: isCreating }] = useCreateNoteMutation();
  const [updateNote, { isLoading: isUpdating }] = useUpdateNoteMutation();

  const [formData, setFormData] = useState<{
    title: string;
    content: string;
    tags: string[];
  }>({
    title: "",
    content: "",
    tags: [],
  });

  const isEditing = !!note;
  const isLoading = isCreating || isUpdating;

  // Predefined tag options (matching your UI)
  const tagOptions = [
    "USA",
    "Germany",
    "IELTS Ready",
    "Engineering",
    "MBA",
    "Canada",
    "UK",
    "Fall 2025",
    "Budget",
    "Visa",
    "Documents",
  ];

  // Reset form when note changes or dialog opens
  useEffect(() => {
    if (isOpen) {
      if (note) {
        // Editing existing note
        setFormData({
          title: note.title,
          content: note.content,
          tags: [...note.tags],
        });
      } else {
        // Creating new note
        setFormData({
          title: "",
          content: "",
          tags: [],
        });
      }
    }
  }, [isOpen, note]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTagsChange = (selectedTags: string) => {
    // Convert comma-separated string to array
    const tagsArray = selectedTags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag);
    setFormData((prev) => ({
      ...prev,
      tags: tagsArray,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      alert("Note title and content are required");
      return;
    }

    try {
      if (isEditing && note) {
        // Update existing note
        const updateData: UpdateNoteRequest = {
          title: formData.title,
          content: formData.content,
          tags: formData.tags,
        };

        await updateNote({
          noteId: note.id,
          noteData: updateData,
        }).unwrap();

        console.log("Note updated successfully");
      } else {
        // Create new note
        const createData: CreateNoteRequest = {
          title: formData.title,
          content: formData.content,
          tags: formData.tags,
        };

        await createNote({
          leadId,
          noteData: createData,
        }).unwrap();

        console.log("Note created successfully");
      }

      onClose();
    } catch (error) {
      console.error("Failed to save note:", error);
      alert(
        `Failed to ${isEditing ? "update" : "create"} note. Please try again.`
      );
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit note" : "Create new note"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Note Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Note title
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Enter title"
              disabled={isLoading}
              required
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <textarea
              value={formData.content}
              onChange={(e) => handleInputChange("content", e.target.value)}
              placeholder="Write Description"
              className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical text-sm"
              disabled={isLoading}
              required
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags" className="text-sm font-medium">
              Tags *
            </Label>
            <Select
              value={formData.tags.join(", ")}
              onValueChange={handleTagsChange}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select tags" />
              </SelectTrigger>
              <SelectContent>
                {tagOptions.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
                {/* Allow custom combination */}
                <SelectItem value="USA, Germany, IELTS Ready">
                  USA, Germany, IELTS Ready
                </SelectItem>
                <SelectItem value="Engineering, Canada">
                  Engineering, Canada
                </SelectItem>
                <SelectItem value="MBA, UK, Fall 2025">
                  MBA, UK, Fall 2025
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {isEditing ? "Updating..." : "Creating..."}
                </div>
              ) : isEditing ? (
                "Update note"
              ) : (
                "Create note"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NoteEditor;
