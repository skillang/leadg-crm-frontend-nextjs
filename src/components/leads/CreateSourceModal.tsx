// src/components/sources/CreateSourceModal.tsx

"use client";

import React, { useState, useEffect } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CreateSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    display_name: string;
    short_form: string;
    description?: string;
    sort_order: number;
    is_active: boolean;
    is_default: boolean;
  }) => Promise<void>;
  isLoading?: boolean;
}

// Utility function to generate internal name from display name
const generateInternalName = (displayName: string): string => {
  return displayName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
};

const CreateSourceModal: React.FC<CreateSourceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    display_name: "",
    name: "",
    short_form: "",
    description: "",
    sort_order: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-generate internal name when display name changes
  useEffect(() => {
    if (formData.display_name) {
      const generatedName = generateInternalName(formData.display_name);
      setFormData((prev) => ({
        ...prev,
        name: generatedName,
      }));
    }
  }, [formData.display_name]);

  const handleClose = () => {
    setFormData({
      display_name: "",
      name: "",
      short_form: "",
      description: "",
      sort_order: 0,
    });
    setErrors({});
    onClose();
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Display Name validation
    if (!formData.display_name.trim()) {
      newErrors.display_name = "Display name is required";
    } else if (formData.display_name.trim().length < 2) {
      newErrors.display_name = "Display name must be at least 2 characters";
    } else if (formData.display_name.trim().length > 100) {
      newErrors.display_name = "Display name must not exceed 100 characters";
    }

    // Short Form validation
    if (!formData.short_form.trim()) {
      newErrors.short_form = "Short form is required";
    } else if (
      formData.short_form.length < 2 ||
      formData.short_form.length > 4
    ) {
      newErrors.short_form = "Short form must be 2-4 characters";
    } else if (!/^[A-Z]+$/.test(formData.short_form)) {
      newErrors.short_form = "Short form must contain only uppercase letters";
    }

    // Description validation
    if (formData.description.trim().length > 200) {
      newErrors.description = "Description must not exceed 200 characters";
    }

    // Sort Order validation
    if (formData.sort_order < 0) {
      newErrors.sort_order = "Sort order cannot be negative";
    } else if (formData.sort_order > 9999) {
      newErrors.sort_order = "Sort order must not exceed 9999";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({
        display_name: formData.display_name.trim(),
        name: formData.name,
        short_form: formData.short_form.trim().toUpperCase(),
        description: formData.description.trim() || undefined,
        sort_order: formData.sort_order,
        is_active: true, // New sources are active by default
        is_default: false, // New sources are not default by default
      });
      handleClose();
    } catch (error) {
      console.error("Failed to create source:", error);
    }
  };

  const handleInputChange = (
    field: keyof typeof formData,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]:
        field === "short_form" && typeof value === "string"
          ? value.toUpperCase()
          : value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Source</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Display Name - First Field */}
          <div className="space-y-2">
            <Label htmlFor="display_name">
              Display Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="display_name"
              type="text"
              placeholder="e.g., Social Media, Website, Email Campaign"
              value={formData.display_name}
              onChange={(e) =>
                handleInputChange("display_name", e.target.value)
              }
              className={errors.display_name ? "border-red-500" : ""}
              disabled={isLoading}
            />
            {errors.display_name && (
              <div className="flex items-center text-sm text-red-600">
                <AlertTriangle className="h-4 w-4 mr-1" />
                {errors.display_name}
              </div>
            )}
            <p className="text-xs text-gray-500">
              This is the user-friendly name displayed in the UI
            </p>
          </div>

          {/* Auto-generated Internal Name - Read Only */}
          <div className="space-y-2">
            <Label htmlFor="name">Name (Internal) - Auto Generated</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              disabled
              className="bg-gray-50 text-gray-600"
              placeholder="Auto-generated from display name"
            />
            <p className="text-xs text-gray-500">
              Automatically generated from display name (spaces → hyphens,
              lowercase)
            </p>
          </div>

          {/* Short Form */}
          <div className="space-y-2">
            <Label htmlFor="short_form">
              Short Form <span className="text-red-500">*</span>
            </Label>
            <Input
              id="short_form"
              type="text"
              placeholder="e.g., SM, WB, EC"
              value={formData.short_form}
              onChange={(e) => handleInputChange("short_form", e.target.value)}
              className={errors.short_form ? "border-red-500" : ""}
              maxLength={4}
              disabled={isLoading}
              style={{ textTransform: "uppercase" }}
            />
            {errors.short_form && (
              <div className="flex items-center text-sm text-red-600">
                <AlertTriangle className="h-4 w-4 mr-1" />
                {errors.short_form}
              </div>
            )}
            <p className="text-xs text-gray-500">
              2-4 uppercase letters used for lead ID generation (e.g., SM-001)
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of this source..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3}
              disabled={isLoading}
              className={errors.description ? "border-red-500" : ""}
              maxLength={200}
            />
            {errors.description && (
              <div className="flex items-center text-sm text-red-600">
                <AlertTriangle className="h-4 w-4 mr-1" />
                {errors.description}
              </div>
            )}
            <p className="text-xs text-gray-500">
              {formData.description.length}/200 characters
            </p>
          </div>

          {/* Sort Order */}
          <div className="space-y-2">
            <Label htmlFor="sort_order">Sort Order</Label>
            <Input
              id="sort_order"
              type="number"
              placeholder="0"
              value={formData.sort_order}
              onChange={(e) =>
                handleInputChange("sort_order", parseInt(e.target.value) || 0)
              }
              className={errors.sort_order ? "border-red-500" : ""}
              min={0}
              max={9999}
              disabled={isLoading}
            />
            {errors.sort_order && (
              <div className="flex items-center text-sm text-red-600">
                <AlertTriangle className="h-4 w-4 mr-1" />
                {errors.sort_order}
              </div>
            )}
            <p className="text-xs text-gray-500">
              Display order in lists (0 = first)
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Source
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSourceModal;
