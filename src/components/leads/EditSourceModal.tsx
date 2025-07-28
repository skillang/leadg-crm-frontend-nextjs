// src/components/sources/EditSourceModal.tsx

"use client";

import React, { useState, useEffect } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Source } from "@/models/types/source";

interface EditSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    display_name: string;
    description?: string;
    sort_order: number;
    is_active: boolean;
    is_default: boolean;
  }) => Promise<void>;
  source: Source | null;
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

const EditSourceModal: React.FC<EditSourceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  source,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    display_name: "",
    name: "",
    short_form: "",
    description: "",
    sort_order: 0,
    is_active: true,
    is_default: false,
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

  // Initialize form data when source changes
  useEffect(() => {
    if (source) {
      setFormData({
        display_name: source.display_name,
        name: source.name,
        short_form: source.short_form,
        description: source.description || "",
        sort_order: source.sort_order,
        is_active: source.is_active,
        is_default: source.is_default,
      });
      setErrors({});
    }
  }, [source]);

  const handleClose = () => {
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

    // Short Form validation - removed since it's now read-only

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
        description: formData.description.trim() || undefined,
        sort_order: formData.sort_order,
        is_active: formData.is_active,
        is_default: formData.is_default,
      });
      handleClose();
    } catch (error) {
      console.error("Failed to update source:", error);
    }
  };

  const handleInputChange = (
    field: keyof typeof formData,
    value: string | number | boolean
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

  if (!source) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Source</DialogTitle>
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
            />
            <p className="text-xs text-gray-500">
              Automatically generated from display name
            </p>
          </div>

          {/* Short Form - Read Only for consistency */}
          <div className="space-y-2">
            <Label htmlFor="short_form">Short Form (Cannot be changed)</Label>
            <Input
              id="short_form"
              type="text"
              value={formData.short_form}
              disabled
              className="bg-gray-50 text-gray-600"
            />
            <p className="text-xs text-gray-500">
              Short form cannot be changed to maintain lead ID consistency
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
          </div>

          {/* Switches */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is_active">Active Status</Label>
                <p className="text-xs text-gray-500">
                  Whether this source is available for new leads
                </p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  handleInputChange("is_active", checked)
                }
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is_default">Default Source</Label>
                <p className="text-xs text-gray-500">
                  Set as the default source for new leads
                </p>
              </div>
              <Switch
                id="is_default"
                checked={formData.is_default}
                onCheckedChange={(checked) =>
                  handleInputChange("is_default", checked)
                }
                disabled={isLoading}
              />
            </div>
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
              Update Source
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditSourceModal;
