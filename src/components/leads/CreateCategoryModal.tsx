// src/components/categories/CreateCategoryModal.tsx

"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
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

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    short_form: string;
    description?: string;
    is_active: boolean;
  }) => Promise<void>;
  isLoading?: boolean;
}

const CreateCategoryModal: React.FC<CreateCategoryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    short_form: "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleClose = () => {
    setFormData({
      name: "",
      short_form: "",
      description: "",
    });
    setErrors({});
    onClose();
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Category name is required";
    }

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
        short_form: formData.short_form.trim().toUpperCase(),
        description: formData.description.trim() || undefined,
        is_active: true, // New categories are active by default
      });
      handleClose();
    } catch (error) {
      console.error("Failed to create category:", error);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: field === "short_form" ? value.toUpperCase() : value,
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
          <DialogTitle>Create New Category</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          {/* Short Form */}
          <div className="space-y-2">
            <Label htmlFor="short_form">
              Short Form <span className="text-red-500">*</span>
            </Label>
            <Input
              id="short_form"
              type="text"
              placeholder="e.g., NS, SA, WA"
              value={formData.short_form}
              onChange={(e) => handleInputChange("short_form", e.target.value)}
              className={errors.short_form ? "border-red-500" : ""}
              maxLength={4}
              disabled={isLoading}
            />
            {errors.short_form && (
              <p className="text-sm text-red-500">{errors.short_form}</p>
            )}
            <p className="text-xs text-gray-500">
              2-4 uppercase letters used for lead ID generation (e.g., NS-001)
            </p>
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
              Create Category
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCategoryModal;
