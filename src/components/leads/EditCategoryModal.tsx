// src/components/categories/EditCategoryModal.tsx

"use client";

import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
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
import type { Category } from "@/models/types/category";

interface EditCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description?: string;
    is_active: boolean;
  }) => Promise<void>;
  category: Category | null;
  isLoading?: boolean;
}

const EditCategoryModal: React.FC<EditCategoryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  category,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form data when category changes
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || "",
        is_active: category.is_active,
      });
    }
  }, [category]);

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Category name is required";
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
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        is_active: formData.is_active,
      });
      handleClose();
    } catch (error) {
      console.error("Failed to update category:", error);
    }
  };

  const handleInputChange = (
    field: keyof typeof formData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field as string]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  if (!category) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Short Form Display (Read-only) */}
          <div className="space-y-2">
            <Label htmlFor="short_form_display">Short Form</Label>
            <Input
              id="short_form_display"
              type="text"
              value={category.short_form}
              disabled
              className="bg-gray-50"
            />
            <p className="text-xs text-gray-500">
              Short form cannot be changed to maintain lead ID consistency
            </p>
          </div>

          {/* Category Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Category Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="e.g., Nursing, Study Abroad"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={errors.name ? "border-red-500" : ""}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of this category..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3}
              disabled={isLoading}
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                handleInputChange("is_active", checked)
              }
              disabled={isLoading}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>

          {/* Category Stats (Read-only) */}
          <div className="bg-gray-50 p-3 rounded-lg space-y-2">
            <h4 className="text-sm font-medium text-gray-700">
              Category Statistics
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Leads:</span>
                <span className="ml-2 font-medium">{category.lead_count}</span>
              </div>
              <div>
                <span className="text-gray-600">Next Lead Number:</span>
                <span className="ml-2 font-medium">
                  {category.next_lead_number}
                </span>
              </div>
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
              Update Category
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCategoryModal;
