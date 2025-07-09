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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Loader2 } from "lucide-react";
import {
  useCreateLeadMutation,
  useGetAssignableUsersQuery,
} from "@/redux/slices/leadsApi";
import { useNotifications } from "@/components/common/NotificationSystem";
import { LEAD_STAGES } from "@/constants/stageConfig";

// Type definitions for better type safety
interface ValidationError {
  loc: string[];
  msg: string;
  type: string;
}

interface ApiErrorResponse {
  data?: {
    detail?: string | ValidationError[];
    message?: string;
  };
  message?: string;
  status?: number;
}

// ✅ FIXED: Type definition to work with existing AssignableUser interface
type UserForAssignment = {
  id?: string;
  email?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
};

interface SingleLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LeadFormData {
  name: string;
  email: string;
  contact_number: string;
  assigned_to: string;
  stage: string;
  lead_score: number;
  notes: string;
  tags: string[];
}

// ✅ NEW: Interface for create lead API payload
interface CreateLeadPayload {
  basic_info: {
    name: string;
    email: string;
    contact_number: string;
    stage: string;
    lead_score: number;
    tags: string[];
  };
  assignment: {
    assigned_to: string | null;
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
];

const SingleLeadModal: React.FC<SingleLeadModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [formData, setFormData] = useState<LeadFormData>({
    name: "",
    email: "",
    contact_number: "",
    assigned_to: "",
    stage: "initial",
    lead_score: 0,
    notes: "",
    tags: [],
  });

  const [newTag, setNewTag] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createLead, { isLoading: isCreating }] = useCreateLeadMutation();

  // ✅ FIXED: Use the existing AssignableUser type from the API
  const { data: assignableUsers = [], isLoading: isLoadingUsers } =
    useGetAssignableUsersQuery();

  // ✅ UPDATED: Use the new notification method names
  const { showSuccess, showError } = useNotifications();

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: "",
        email: "",
        contact_number: "",
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";

    if (!formData.contact_number.trim()) {
      newErrors.contact_number = "Contact number is required";
    } else {
      const phoneRegex = /^[+]?[\d\s\-\(\)]{10,}$/;
      if (!phoneRegex.test(formData.contact_number)) {
        newErrors.contact_number = "Please enter a valid contact number";
      }
    }

    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }
    }

    if (formData.lead_score < 0 || formData.lead_score > 100) {
      newErrors.lead_score = "Lead score must be between 0 and 100";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      // ✅ FIXED: Properly typed API payload
      const apiPayload: CreateLeadPayload = {
        basic_info: {
          name: formData.name.trim(),
          email: formData.email.trim() || "",
          contact_number: formData.contact_number.trim(),
          stage: formData.stage,
          lead_score: formData.lead_score,
          tags: formData.tags,
        },
        assignment: {
          assigned_to: formData.assigned_to || null,
        },
        additional_info: {
          notes: formData.notes.trim(),
        },
      };

      await createLead(apiPayload).unwrap();

      // ✅ UPDATED: Use showSuccess instead of notifications.success
      showSuccess(
        `Lead "${formData.name}" created successfully!`,
        "Lead Created"
      );
      onClose();
    } catch (error) {
      // ✅ FIXED: Properly typed error handling
      const apiError = error as ApiErrorResponse;
      let errorMessage = "Failed to create lead. Please try again.";

      if (apiError?.data?.detail) {
        errorMessage = Array.isArray(apiError.data.detail)
          ? apiError.data.detail
              .map((err: ValidationError) => err.msg)
              .join(", ")
          : apiError.data.detail;
      } else if (apiError?.message) {
        errorMessage = apiError.message;
      }

      // ✅ UPDATED: Use showError instead of notifications.error
      showError(errorMessage, "Error Creating Lead");
    }
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Create new lead
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label>
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="Krishna Reddy"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Assigned To */}
          <div className="space-y-2">
            <Label>Assign to</Label>
            <Select
              value={formData.assigned_to || "auto"}
              onValueChange={(value) =>
                handleInputChange("assigned_to", value === "auto" ? "" : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Person" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto-assign (Round Robin)</SelectItem>
                {isLoadingUsers ? (
                  <SelectItem value="loading" disabled>
                    Loading users...
                  </SelectItem>
                ) : (
                  // ✅ FIXED: Clean type assertion with proper fallbacks
                  assignableUsers.map((user, index) => {
                    const typedUser = user as UserForAssignment;
                    const displayName =
                      typedUser.name ||
                      (typedUser.first_name && typedUser.last_name
                        ? `${typedUser.first_name} ${typedUser.last_name}`
                        : typedUser.email ||
                          typedUser.username ||
                          typedUser.id ||
                          "Unknown User");
                    const value =
                      typedUser.email || typedUser.id || `user_${index}`;

                    return (
                      <SelectItem key={typedUser.id || index} value={value}>
                        {displayName}
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Contact Number */}
          <div className="space-y-2">
            <Label>
              Contact number <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="+91 8765434567"
              value={formData.contact_number}
              onChange={(e) =>
                handleInputChange("contact_number", e.target.value)
              }
              className={errors.contact_number ? "border-red-500" : ""}
            />
            {errors.contact_number && (
              <p className="text-sm text-red-500">{errors.contact_number}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              placeholder="kris.redy@gmail.com"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Stage */}
          <div className="space-y-2">
            <Label>Stage</Label>
            <Select
              value={formData.stage}
              onValueChange={(value) => handleInputChange("stage", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAD_STAGES.map((stage) => (
                  <SelectItem key={stage.value} value={stage.value}>
                    {stage.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lead Score */}
          <div className="space-y-2">
            <Label>Lead Score (0-100)</Label>
            <Input
              type="number"
              min="0"
              max="100"
              placeholder="50"
              value={formData.lead_score}
              onChange={(e) =>
                handleInputChange("lead_score", parseInt(e.target.value) || 0)
              }
              className={errors.lead_score ? "border-red-500" : ""}
            />
            {errors.lead_score && (
              <p className="text-sm text-red-500">{errors.lead_score}</p>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleTagKeyPress}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTag}
                disabled={!newTag.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

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
                  {formData.tags.includes(tag) && (
                    <Plus className="ml-1 h-3 w-3 rotate-45" />
                  )}
                </Badge>
              ))}
            </div>

            {formData.tags.length > 0 && (
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
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="Additional notes about the lead..."
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isCreating}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create new lead"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SingleLeadModal;
