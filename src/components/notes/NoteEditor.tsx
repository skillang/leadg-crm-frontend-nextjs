// src/components/notes/NoteEditor.tsx (UPDATED with Persistent Tags and Tick Marks)

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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Check } from "lucide-react";
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
    "Australia",
    "New Zealand",
    "Masters",
    "Bachelors",
    "PhD",
    "Scholarship",
    "Interview",
    "Application",
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

  const handleTagToggle = (selectedTag: string) => {
    setFormData((prev) => {
      const isSelected = prev.tags.includes(selectedTag);

      if (isSelected) {
        // Remove tag if already selected
        return {
          ...prev,
          tags: prev.tags.filter((tag) => tag !== selectedTag),
        };
      } else {
        // Add tag if not selected
        return {
          ...prev,
          tags: [...prev.tags, selectedTag],
        };
      }
    });
  };

  const handleTagRemove = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
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

  const getSelectedTagsText = () => {
    if (formData.tags.length === 0) return "Select tags";
    if (formData.tags.length === 1)
      return `${formData.tags.length} tag selected`;
    return `${formData.tags.length} tags selected`;
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

          {/* Tags - Multi-Select with Persistent Options */}
          <div className="space-y-2">
            <Label htmlFor="tags" className="text-sm font-medium">
              Tags *
            </Label>

            {/* Tag Selection Dropdown with Checkmarks */}
            <Select
              onValueChange={handleTagToggle}
              disabled={isLoading}
              value=""
            >
              <SelectTrigger>
                <SelectValue placeholder={getSelectedTagsText()} />
              </SelectTrigger>
              <SelectContent>
                {tagOptions.map((tag) => {
                  const isSelected = formData.tags.includes(tag);
                  return (
                    <SelectItem
                      key={tag}
                      value={tag}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <span className="flex-1">{tag}</span>
                        {isSelected && (
                          <Check className="h-4 w-4 text-blue-600 ml-auto" />
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {/* Selected Tags Display */}
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 border border-gray-300 rounded-md min-h-[40px] bg-gray-50">
                {formData.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="flex items-center gap-1 bg-blue-100 text-blue-800 hover:bg-blue-200"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleTagRemove(tag)}
                      disabled={isLoading}
                      className="hover:bg-blue-300 rounded-full p-0.5 ml-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
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
