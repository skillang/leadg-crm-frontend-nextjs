// src/components/leads/EditLeadModal.tsx - FIXED VERSION
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Plus, Loader2 } from "lucide-react";
import {
  useUpdateLeadMutation,
  useGetUserLeadStatsQuery,
} from "@/redux/slices/leadsApi";
import { Lead } from "@/models/types/lead";
import { LEAD_STAGES } from "@/constants/stageConfig";

interface EditLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
}

interface EditLeadFormData {
  name: string;
  email: string;
  contact_number: string;
  source: string;
  stage: string;
  lead_score: number;
  tags: string[];
  assigned_to: string;
  assigned_to_name: string;
  notes: string;
}

interface UserStats {
  user_id: string;
  name: string;
  email: string;
  role: string;
  assigned_leads_count: number;
}

// ✅ NEW: Proper interface for update data payload
interface UpdateLeadData {
  lead_id: string;
  name: string;
  lead_score: number;
  stage: string;
  email?: string;
  contact_number?: string;
  source?: string;
  notes?: string;
  tags?: string[];
  assigned_to?: string;
  assigned_to_name?: string;
  assignment_method?: string;
}

// ✅ NEW: Proper error types for RTK Query
interface ApiErrorDetail {
  msg: string;
  type?: string;
  loc?: string[];
}

interface ApiError {
  data?: {
    detail?: string | ApiErrorDetail[];
  };
  message?: string;
  status?: number;
}

const SOURCES = [
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
  { value: "social_media", label: "Social Media" },
  { value: "email_campaign", label: "Email Campaign" },
  { value: "phone_call", label: "Phone Call" },
  { value: "walk_in", label: "Walk In" },
  { value: "other", label: "Other" },
];

const PREDEFINED_TAGS = [
  "USA",
  "Germany",
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

const EditLeadModal: React.FC<EditLeadModalProps> = ({
  isOpen,
  onClose,
  lead,
}) => {
  const [formData, setFormData] = useState<EditLeadFormData>({
    name: "",
    email: "",
    contact_number: "",
    source: "website",
    stage: "open",
    lead_score: 0,
    tags: [],
    assigned_to: "",
    assigned_to_name: "",
    notes: "",
  });

  const [newTag, setNewTag] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [updateLead, { isLoading: isUpdating }] = useUpdateLeadMutation();
  const { data: userStatsResponse, isLoading: isLoadingUsers } =
    useGetUserLeadStatsQuery();

  // Filter users to exclude admin role
  const assignableUsers =
    userStatsResponse?.user_stats?.filter(
      (user: UserStats) => user.role !== "admin"
    ) || [];

  // Initialize form data when lead changes
  useEffect(() => {
    if (lead && isOpen) {
      setFormData({
        name: lead.name || "",
        email: lead.email || "",
        contact_number: lead.contact || "",
        source: lead.source || "website",
        stage: lead.stage || "open",
        lead_score: lead.leadScore || 0,
        tags: lead.tags || [],
        assigned_to: lead.assignedTo || "",
        assigned_to_name: lead.assignedToName || "",
        notes: lead.notes || "",
      });
      setErrors({});
      setNewTag("");
    }
  }, [lead, isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setErrors({});
      setNewTag("");
    }
  }, [isOpen]);

  const handleInputChange = (
    field: keyof EditLeadFormData,
    value: string | number | string[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Handle assignment change - automatically populate email and name
  const handleAssignmentChange = (userId: string) => {
    const selectedUser = assignableUsers.find(
      (user: UserStats) => user.user_id === userId
    );
    if (selectedUser) {
      setFormData((prev) => ({
        ...prev,
        assigned_to: selectedUser.email, // Use email instead of user_id
        assigned_to_name: selectedUser.name,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        assigned_to: "",
        assigned_to_name: "",
      }));
    }

    if (errors.assigned_to) {
      setErrors((prev) => ({ ...prev, assigned_to: "" }));
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

    if (formData.lead_score < 0 || formData.lead_score > 100) {
      newErrors.lead_score = "Lead score must be between 0 and 100";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !lead) return;

    try {
      // ✅ FIXED: Use proper typed interface instead of 'any'
      const updateData: UpdateLeadData = {
        lead_id: lead.id,
        name: formData.name,
        lead_score: formData.lead_score,
        stage: formData.stage,
      };

      // Only include fields that have values
      if (formData.email.trim()) {
        updateData.email = formData.email;
      }
      if (formData.contact_number.trim()) {
        updateData.contact_number = formData.contact_number;
      }
      if (formData.source) {
        updateData.source = formData.source;
      }
      if (formData.notes.trim()) {
        updateData.notes = formData.notes;
      }
      if (formData.tags.length > 0) {
        updateData.tags = formData.tags;
      }

      // Assignment fields - send email, name, and method
      if (formData.assigned_to && formData.assigned_to_name) {
        updateData.assigned_to = formData.assigned_to; // This is the email
        updateData.assigned_to_name = formData.assigned_to_name;
        updateData.assignment_method = "manual by admin";
      }

      console.log("Sending update data:", updateData); // For debugging

      await updateLead(updateData).unwrap();
      onClose();
    } catch (error) {
      // ✅ FIXED: Use proper typed error instead of 'any'
      const apiError = error as ApiError;
      console.error("Failed to update lead:", apiError);
      let errorMessage = "Failed to update lead";

      if (apiError?.data?.detail) {
        if (Array.isArray(apiError.data.detail)) {
          // ✅ FIXED: Properly typed error detail items
          errorMessage = apiError.data.detail
            .map((e: ApiErrorDetail) => e.msg)
            .join(", ");
        } else if (typeof apiError.data.detail === "string") {
          errorMessage = apiError.data.detail;
        }
      } else if (apiError?.message) {
        errorMessage = apiError.message;
      }

      setErrors({ general: errorMessage });
    }
  };

  if (!lead) return null;

  // Get current assigned user for display
  const currentAssignedUser = assignableUsers.find(
    (user: UserStats) => user.email === formData.assigned_to
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Lead</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="status">Status & Tags</TabsTrigger>
            <TabsTrigger value="assignment">Assignment</TabsTrigger>
            <TabsTrigger value="additional">Additional Info</TabsTrigger>
          </TabsList>

          {/* General Error */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {errors.general}
            </div>
          )}

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-2">
                <Label>Name*</Label>
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

              {/* Contact Number */}
              <div className="space-y-2">
                <Label>Contact number*</Label>
                <Input
                  placeholder="+91 8765434567"
                  value={formData.contact_number}
                  onChange={(e) =>
                    handleInputChange("contact_number", e.target.value)
                  }
                  className={errors.contact_number ? "border-red-500" : ""}
                />
                {errors.contact_number && (
                  <p className="text-sm text-red-500">
                    {errors.contact_number}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label>Email*</Label>
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

              {/* Source */}
              <div className="space-y-2">
                <Label>Source*</Label>
                <Select
                  value={formData.source}
                  onValueChange={(value) => handleInputChange("source", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCES.map((source) => (
                      <SelectItem key={source.value} value={source.value}>
                        {source.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          {/* Status & Tags Tab */}
          <TabsContent value="status" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Stage */}
              <div className="space-y-2">
                <Label>Stage*</Label>
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
                <Label>Lead score*</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="8.5"
                  value={formData.lead_score}
                  onChange={(e) =>
                    handleInputChange(
                      "lead_score",
                      parseInt(e.target.value) || 0
                    )
                  }
                  className={errors.lead_score ? "border-red-500" : ""}
                />
                {errors.lead_score && (
                  <p className="text-sm text-red-500">{errors.lead_score}</p>
                )}
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags*</Label>
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

              {/* Predefined Tags */}
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

              {/* Current Tags */}
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
          </TabsContent>

          {/* Assignment Tab */}
          <TabsContent value="assignment" className="space-y-4">
            <div className="space-y-2">
              <Label>Assigned to*</Label>
              <Select
                value={currentAssignedUser?.user_id || ""}
                onValueChange={handleAssignmentChange}
                disabled={isLoadingUsers}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user to assign">
                    {currentAssignedUser ? (
                      <div className="flex items-center gap-2">
                        <span>{currentAssignedUser.name}</span>
                        <span className="text-xs text-gray-500">
                          ({currentAssignedUser.assigned_leads_count} leads)
                        </span>
                      </div>
                    ) : (
                      "Select user to assign"
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {assignableUsers.map((user: UserStats) => (
                    <SelectItem key={user.user_id} value={user.user_id}>
                      <div className="flex items-center gap-2">
                        <span>{user.name}</span>
                        <span className="text-xs text-gray-500">
                          ({user.assigned_leads_count} leads)
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isLoadingUsers && (
                <p className="text-sm text-gray-500">Loading users...</p>
              )}

              {/* Show current assignment info */}
              {formData.assigned_to && formData.assigned_to_name && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Will assign to:</strong> {formData.assigned_to_name}{" "}
                    ({formData.assigned_to})
                  </p>
                  <p className="text-xs text-blue-600">
                    Assignment method: Manual by admin
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Additional Info Tab */}
          <TabsContent value="additional" className="space-y-4">
            <div className="space-y-2">
              <Label>Additional Notes</Label>
              <Textarea
                placeholder="these are the custom notes added by the user"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={isUpdating}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isUpdating}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update lead"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditLeadModal;
