// src/components/leads/SingleLeadModal.tsx - FIXED VERSION WITH CATEGORY

"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SOURCE_OPTIONS } from "@/constants/sourceConfig";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/components/common/NotificationSystem";
import {
  useCreateLeadMutation,
  useGetAssignableUsersQuery,
} from "@/redux/slices/leadsApi";
import { useGetCategoriesQuery } from "@/redux/slices/categoriesApi";
import { LEAD_STAGES } from "@/constants/stageConfig";

// API Error interface
interface ValidationError {
  loc: string[];
  msg: string;
  type: string;
}

interface ApiError {
  data?: {
    detail?: string | ValidationError[];
    message?: string;
  };
  message?: string;
  status?: number;
}

// User type for assignment
// type UserForAssignment = {
//   id?: string;
//   email?: string;
//   name?: string;
//   first_name?: string;
//   last_name?: string;
//   username?: string;
// };

interface SingleLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ✅ FIXED: Form data interface with category
interface LeadFormData {
  name: string;
  email: string;
  contact_number: string;
  source: string;
  category: string; // ✅ ADDED: Category field
  assigned_to: string;
  stage: string;
  lead_score: number;
  notes: string;
  tags: string[];
}

// ✅ FIXED: API payload interface matching backend expectation
interface CreateLeadPayload {
  basic_info: {
    name: string;
    email: string;
    contact_number: string;
    source: string;
    category: string; // ✅ ADDED: Category field
  };
  status_and_tags: {
    stage: string;
    lead_score: number;
    tags: string[];
  };
  additional_info: {
    notes: string;
  };
}

const PREDEFINED_TAGS = [
  "IELTS Ready",
  "Engineering",
  "MBA",
  "Medical",
  "Arts",
  "Business",
  "Technology",
  "High Priority",
  "Follow Up",
  "Hot Lead",
  "Healthcare",
  "Experienced",
];

const SingleLeadModal: React.FC<SingleLeadModalProps> = ({
  isOpen,
  onClose,
}) => {
  // ✅ FIXED: Form state with category
  const [formData, setFormData] = useState<LeadFormData>({
    name: "",
    email: "",
    contact_number: "",
    source: "website",
    category: "", // ✅ ADDED: Category field
    assigned_to: "",
    stage: "initial",
    lead_score: 0,
    notes: "",
    tags: [],
  });

  const [newTag, setNewTag] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // API Hooks
  const [createLead, { isLoading: isCreating }] = useCreateLeadMutation();
  // const { data: assignableUsers = [], isLoading: isLoadingUsers } =
  //   useGetAssignableUsersQuery();
  const { data: categoriesResponse, isLoading: isLoadingCategories } =
    useGetCategoriesQuery({});
  const { showSuccess, showError } = useNotifications();

  // ✅ FIXED: Memoize categories to prevent infinite loop
  const categories = React.useMemo(
    () => categoriesResponse?.categories || [],
    [categoriesResponse?.categories]
  );

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: "",
        email: "",
        contact_number: "",
        source: "website",
        category: "",
        assigned_to: "",
        stage: "initial",
        lead_score: 0,
        notes: "",
        tags: [],
      });
      setErrors({});
      setNewTag("");
    }
  }, [isOpen]);

  // ✅ FIXED: Separate effect for auto-selecting category
  useEffect(() => {
    if (isOpen && categories.length > 0 && !formData.category) {
      setFormData((prev) => ({
        ...prev,
        category: categories[0]?.name || "",
      }));
    }
  }, [isOpen, categories, formData.category]);

  const handleInputChange = (
    field: keyof LeadFormData,
    value: string | number | string[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      handleInputChange("tags", [...formData.tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    handleInputChange(
      "tags",
      formData.tags.filter((tag) => tag !== tagToRemove)
    );
  };

  const handleAddPredefinedTag = (tag: string) => {
    if (!formData.tags.includes(tag)) {
      handleInputChange("tags", [...formData.tags, tag]);
    }
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.contact_number.trim()) {
      newErrors.contact_number = "Contact number is required";
    } else {
      const phoneRegex = /^[+]?[\d\s\-\(\)]{7,15}$/;
      if (!phoneRegex.test(formData.contact_number)) {
        newErrors.contact_number = "Invalid contact number format";
      }
    }

    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Invalid email format";
      }
    }

    // ✅ ADDED: Category validation
    if (!formData.category) {
      newErrors.category = "Category is required";
    }

    if (formData.lead_score < 0 || formData.lead_score > 100) {
      newErrors.lead_score = "Lead score must be between 0 and 100";
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
      // ✅ FIXED: Payload structure matching backend expectation
      const payload: CreateLeadPayload = {
        basic_info: {
          name: formData.name.trim(),
          email: formData.email.trim(),
          contact_number: formData.contact_number.trim(),
          source: formData.source,
          category: formData.category, // ✅ ADDED: Category field
        },
        status_and_tags: {
          stage: formData.stage,
          lead_score: formData.lead_score,
          tags: formData.tags,
        },
        additional_info: {
          notes: formData.notes.trim(),
        },
      };

      console.log(
        "🚀 Creating lead with payload:",
        JSON.stringify(payload, null, 2)
      );

      const result = await createLead(payload).unwrap();

      showSuccess(
        result.message || "Lead created successfully!",
        `Lead ID: ${result.lead.lead_id}`
      );
      onClose();
    } catch (error) {
      console.error("❌ Failed to create lead:", error);

      const apiError = error as ApiError;
      let errorMessage = "Failed to create lead";

      if (apiError.data?.detail) {
        if (typeof apiError.data.detail === "string") {
          errorMessage = apiError.data.detail;
        } else if (Array.isArray(apiError.data.detail)) {
          const validationErrors = apiError.data.detail as ValidationError[];
          errorMessage = validationErrors
            .map((err) => `${err.loc.join(".")}: ${err.msg}`)
            .join(", ");
        }
      } else if (apiError.data?.message) {
        errorMessage = apiError.data.message;
      } else if (apiError.message) {
        errorMessage = apiError.message;
      }

      showError("Error", errorMessage);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Lead</DialogTitle>
          <DialogDescription>
            Add a new lead to the system. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter full name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className={errors.name ? "border-red-500" : ""}
                disabled={isCreating}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={errors.email ? "border-red-500" : ""}
                disabled={isCreating}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Contact Number */}
            <div className="space-y-2">
              <Label htmlFor="contact_number">
                Contact Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="contact_number"
                type="tel"
                placeholder="Enter contact number"
                value={formData.contact_number}
                onChange={(e) =>
                  handleInputChange("contact_number", e.target.value)
                }
                className={errors.contact_number ? "border-red-500" : ""}
                disabled={isCreating}
              />
              {errors.contact_number && (
                <p className="text-sm text-red-500">{errors.contact_number}</p>
              )}
            </div>

            {/* Source and Category Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Source */}
              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Select
                  value={formData.source}
                  onValueChange={(value) => handleInputChange("source", value)}
                  disabled={isCreating}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* ✅ ADDED: Category Selection */}
              <div className="space-y-2">
                <Label htmlFor="category">
                  Category <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    handleInputChange("category", value)
                  }
                  disabled={isCreating || isLoadingCategories}
                >
                  <SelectTrigger
                    className={errors.category ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name} ({category.short_form})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-red-500">{errors.category}</p>
                )}
                {isLoadingCategories && (
                  <p className="text-xs text-gray-500">Loading categories...</p>
                )}
              </div>
            </div>
          </div>

          {/* Status and Tags */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Status & Tags</h3>

            {/* Stage and Lead Score Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Stage */}
              <div className="space-y-2">
                <Label htmlFor="stage">Stage</Label>
                <Select
                  value={formData.stage}
                  onValueChange={(value) => handleInputChange("stage", value)}
                  disabled={isCreating}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_STAGES.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className={`${option.className} mb-1`}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Lead Score */}
              <div className="space-y-2">
                <Label htmlFor="lead_score">Lead Score (0-100)</Label>
                <Input
                  id="lead_score"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Enter score"
                  value={formData.lead_score}
                  onChange={(e) =>
                    handleInputChange(
                      "lead_score",
                      parseInt(e.target.value) || 0
                    )
                  }
                  className={errors.lead_score ? "border-red-500" : ""}
                  disabled={isCreating}
                />
                {errors.lead_score && (
                  <p className="text-sm text-red-500">{errors.lead_score}</p>
                )}
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-3">
              <Label>Tags</Label>

              {/* Tag Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add custom tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleTagKeyPress}
                  disabled={isCreating}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddTag}
                  disabled={!newTag.trim() || isCreating}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Predefined Tags */}
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Quick add:</p>
                <div className="flex flex-wrap gap-2">
                  {PREDEFINED_TAGS.map((tag) => (
                    <Button
                      key={tag}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddPredefinedTag(tag)}
                      disabled={formData.tags.includes(tag) || isCreating}
                      className="h-7 text-xs"
                    >
                      + {tag}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Selected Tags */}
              {formData.tags.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Selected tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          disabled={isCreating}
                          className="ml-1 text-gray-500 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Additional Information</h3>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes about this lead..."
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                rows={4}
                disabled={isCreating}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Lead
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SingleLeadModal;
