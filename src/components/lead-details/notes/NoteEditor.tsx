// src/components/notes/NoteEditor.tsx (UPDATED with Optional Content)

"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Loader2 } from "lucide-react";
import {
  Note,
  CreateNoteRequest,
  UpdateNoteRequest,
} from "@/models/types/note";
import {
  useCreateNoteMutation,
  useUpdateNoteMutation,
} from "@/redux/slices/notesApi";
import { useNotifications } from "@/components/common/NotificationSystem";
import { PREDEFINED_TAGS } from "@/constants/tagsConfig";

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

  const { showSuccess, showError } = useNotifications();

  const [formData, setFormData] = useState<{
    title: string;
    content: string;
    tags: string[];
  }>({
    title: "",
    content: "",
    tags: [],
  });

  const [newTag, setNewTag] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!note;
  const isLoading = isCreating || isUpdating;

  // Reset form when note changes or dialog opens
  useEffect(() => {
    if (isOpen) {
      if (note) {
        // Editing existing note
        setFormData({
          title: note.title,
          content: note.content || "", // ✅ Handle optional content
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
      setErrors({});
      setNewTag("");
    }
  }, [isOpen, note]);

  const handleInputChange = (
    field: keyof Pick<typeof formData, "title" | "content">,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleAddPredefinedTag = (tag: string) => {
    if (!formData.tags.includes(tag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  // ✅ UPDATED: Only validate title, content is optional
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Note title is required";
    } else if (formData.title.trim().length < 3) {
      newErrors.title = "Title must be at least 3 characters long";
    } else if (formData.title.trim().length > 200) {
      newErrors.title = "Title must be less than 200 characters";
    }

    // ✅ UPDATED: Content validation is optional
    if (formData.content && formData.content.trim().length > 5000) {
      newErrors.content = "Content must be less than 5000 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      if (isEditing && note) {
        // Update existing note
        const updateData: UpdateNoteRequest = {
          title: formData.title.trim(),
          content: formData.content.trim() || undefined, // ✅ Send undefined if empty
          tags: formData.tags,
        };

        await updateNote({
          noteId: note.id,
          noteData: updateData,
        }).unwrap();

        showSuccess(
          `Note "${formData.title}" updated successfully`,
          "Note Updated"
        );
      } else {
        // Create new note
        const createData: CreateNoteRequest = {
          title: formData.title.trim(),
          content: formData.content.trim() || undefined, // ✅ Send undefined if empty
          tags: formData.tags,
        };

        await createNote({
          leadId,
          noteData: createData,
        }).unwrap();

        showSuccess(
          `Note "${formData.title}" created successfully`,
          "Note Created"
        );
      }

      onClose();
    } catch (error) {
      console.error("Failed to save note:", error);
      const errorMessage = isEditing
        ? "Failed to update note. Please try again."
        : "Failed to create note. Please try again.";
      showError(errorMessage, "Error Saving Note");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto min-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {isEditing ? "Edit Note" : "Create New Note"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Enter note title..."
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          {/* Content - ✅ UPDATED: Made optional */}
          <div className="space-y-2">
            <Label htmlFor="content">
              Description{" "}
              <span className="text-gray-500 text-sm">(optional)</span>
            </Label>
            <Textarea
              id="content"
              placeholder="Write your note description here (optional)..."
              value={formData.content}
              onChange={(e) => handleInputChange("content", e.target.value)}
              rows={6}
              className={errors.content ? "border-red-500" : ""}
            />
            {errors.content && (
              <p className="text-sm text-red-500">{errors.content}</p>
            )}
            <p className="text-xs text-gray-500">
              You can create a note with just a title if needed.
            </p>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>

            {/* Add custom tag */}
            <div className="flex gap-2">
              <Input
                placeholder="Add a custom tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleTagKeyPress}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddTag}
                disabled={!newTag.trim()}
              >
                Add
              </Button>
            </div>

            {/* Predefined tags */}
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Quick tags:</p>
              <div className="flex flex-wrap gap-2">
                {PREDEFINED_TAGS.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className={`cursor-pointer hover:bg-blue-100 text-xs ${
                      formData.tags.includes(tag)
                        ? "bg-blue-100 border-blue-300"
                        : ""
                    }`}
                    onClick={() => handleAddPredefinedTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Selected tags */}
            {formData.tags.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Selected tags:</p>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="bg-blue-100 text-blue-800"
                    >
                      {tag}
                      <X
                        className="ml-1 h-3 w-3 cursor-pointer"
                        onClick={() => handleRemoveTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : isEditing ? (
                "Update Note"
              ) : (
                "Create Note"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NoteEditor;
