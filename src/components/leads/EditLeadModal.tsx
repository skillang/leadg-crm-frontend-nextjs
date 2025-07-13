// src/components/leads/EditLeadModal.tsx - UPDATED WITH COUNTRY & COURSE LEVEL
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
import { SOURCE_OPTIONS } from "@/constants/sourceConfig";
import { PREDEFINED_TAGS } from "@/constants/tagsConfig";
import CountryMultiSelect, {
  formatCountriesForBackend,
  parseCountriesFromString,
  STUDY_DESTINATIONS,
} from "@/components/common/CountryMultiSelect";

// ✅ ADDED: Course level options
export const COURSE_LEVEL_OPTIONS = [
  { value: "bachelor's_degree", label: "Bachelor's Degree" },
  { value: "master's_degree", label: "Master's Degree" },
  { value: "phd", label: "PhD" },
  { value: "diploma", label: "Diploma" },
  { value: "certificate", label: "Certificate" },
];

// ✅ Extended Lead interface for edit modal (handles both basic Lead and detailed Lead)
interface ExtendedLead extends Lead {
  countryOfInterest?: string;
  courseLevel?: string;
  phoneNumber?: string;
}

interface EditLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: ExtendedLead | null; // ✅ Use extended interface that handles optional fields
}

interface EditLeadFormData {
  name: string;
  email: string;
  contact_number: string;
  country_of_interest: string[]; // ✅ UPDATED: Array for multi-select
  course_level: string;
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

interface UpdateLeadData {
  lead_id: string;
  name: string;
  lead_score: number;
  stage: string;
  email?: string;
  contact_number?: string;
  country_of_interest?: string; // ✅ String for backend (comma-separated)
  course_level?: string;
  source?: string;
  notes?: string;
  tags?: string[];
  assigned_to?: string;
  assigned_to_name?: string;
  assignment_method?: string;
}

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

const EditLeadModal: React.FC<EditLeadModalProps> = ({
  isOpen,
  onClose,
  lead,
}) => {
  const [formData, setFormData] = useState<EditLeadFormData>({
    name: "",
    email: "",
    contact_number: "",
    country_of_interest: [], // ✅ UPDATED: Array for multi-select
    course_level: "",
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
      console.log("🔍 Lead object in EditLeadModal:", lead);
      console.log("🔍 Lead courseLevel:", lead.courseLevel);
      console.log("🔍 Lead countryOfInterest:", lead.countryOfInterest);
      setFormData({
        name: lead.name || "",
        email: lead.email || "",
        contact_number: lead.contact || lead.phoneNumber || "",
        // ✅ UPDATED: Parse country string to array
        country_of_interest: lead.countryOfInterest
          ? parseCountriesFromString(lead.countryOfInterest)
          : [],
        course_level: lead.courseLevel || "",
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
        assigned_to: selectedUser.email,
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
      const updateData: UpdateLeadData = {
        lead_id: lead.id, // ✅ Use Lead.id (basic interface)
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
      if (formData.country_of_interest.length > 0) {
        // ✅ UPDATED: Convert array to string
        updateData.country_of_interest = formatCountriesForBackend(
          formData.country_of_interest
        );
      }
      if (formData.course_level.trim()) {
        // ✅ UPDATED: Check for non-empty string
        updateData.course_level = formData.course_level;
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
        updateData.assigned_to = formData.assigned_to;
        updateData.assigned_to_name = formData.assigned_to_name;
        updateData.assignment_method = "manual by admin";
      }

      console.log("Sending update data:", updateData);

      await updateLead(updateData).unwrap();
      onClose();
    } catch (error) {
      const apiError = error as ApiError;
      console.error("Failed to update lead:", apiError);
      let errorMessage = "Failed to update lead";

      if (apiError?.data?.detail) {
        if (Array.isArray(apiError.data.detail)) {
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

  const handleAssignmentChangeByName = (userName: string) => {
    console.log("Assignment change by name:", userName);

    const selectedUser = assignableUsers.find(
      (user: UserStats) => user.name === userName
    );

    if (selectedUser) {
      setFormData((prev) => ({
        ...prev,
        assigned_to: selectedUser.email,
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

  if (!lead) return null;

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
                    {SOURCE_OPTIONS.map((source) => (
                      <SelectItem key={source.value} value={source.value}>
                        {source.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* ✅ UPDATED: Country of Interest - Multi Select with Clear Preview */}
              <div className="space-y-2 col-span-2">
                <Label>Countries of Interest</Label>
                <CountryMultiSelect
                  value={formData.country_of_interest}
                  onChange={(countries) =>
                    handleInputChange("country_of_interest", countries)
                  }
                  disabled={isUpdating}
                  placeholder={
                    formData.country_of_interest.length > 0
                      ? `Current: ${formData.country_of_interest
                          .map((c) => {
                            const country = STUDY_DESTINATIONS.find(
                              (dest) => dest.value === c
                            );
                            return country?.label || c;
                          })
                          .join(", ")}`
                      : "Select countries..."
                  }
                />
                {/* Show current selection clearly */}
                {formData.country_of_interest.length > 0 && (
                  <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                    <span className="font-medium">Currently selected:</span>{" "}
                    {formData.country_of_interest
                      .map((countryValue) => {
                        const country = STUDY_DESTINATIONS.find(
                          (c) => c.value === countryValue
                        );
                        return country?.label || countryValue;
                      })
                      .join(", ")}
                  </div>
                )}
              </div>

              {/* ✅ UPDATED: Course Level with Clear Current Value Display */}
              <div className="space-y-2 col-span-2">
                <p>course level: {formData.course_level}</p>
                <Label>Course Level</Label>
                <Select
                  value={formData.course_level}
                  onValueChange={(value) =>
                    handleInputChange("course_level", value)
                  }
                >
                  <SelectTrigger
                    className={
                      formData.course_level
                        ? "text-gray-900 font-medium"
                        : "text-gray-500"
                    }
                  >
                    <SelectValue placeholder="Select course level">
                      {formData.course_level && (
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          {COURSE_LEVEL_OPTIONS.find(
                            (level) => level.value === formData.course_level
                          )?.label || formData.course_level}
                        </span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {COURSE_LEVEL_OPTIONS.map((level) => (
                      <SelectItem
                        key={level.value}
                        value={level.value}
                        className={
                          formData.course_level === level.value
                            ? "bg-green-50 font-medium"
                            : ""
                        }
                      >
                        <div className="flex items-center gap-2">
                          {formData.course_level === level.value && (
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          )}
                          {level.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Show current selection clearly */}
                {formData.course_level && (
                  <div className="text-sm text-gray-600 bg-green-50 p-2 rounded">
                    <span className="font-medium">Currently selected:</span>{" "}
                    {COURSE_LEVEL_OPTIONS.find(
                      (level) => level.value === formData.course_level
                    )?.label || formData.course_level}
                  </div>
                )}
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
              {/* <div className="space-y-2">
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
              </div> */}
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
            {/* Current Assignment Display */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Current Assignment
              </Label>
              <div className="p-3 bg-gray-50 rounded-md border">
                <p className="text-sm">
                  <span className="font-medium">Assigned counsellor is:</span>{" "}
                  <span className="text-blue-600 font-semibold">
                    {formData.assigned_to_name || "Unassigned"}
                  </span>
                </p>
                {formData.assigned_to_name && (
                  <p className="text-xs text-gray-500 mt-1">
                    Email: {formData.assigned_to || "Not available"}
                  </p>
                )}
              </div>
            </div>

            {/* Change Assignment */}
            <div className="space-y-2">
              <Label>Change Assignment To</Label>
              <Select
                value={formData.assigned_to_name}
                onValueChange={handleAssignmentChangeByName}
                disabled={isLoadingUsers}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select new counsellor">
                    {formData.assigned_to_name ? (
                      <div className="flex items-center gap-2">
                        <span>{formData.assigned_to_name}</span>
                        <span className="text-xs text-gray-500">
                          (
                          {assignableUsers.find(
                            (u) => u.name === formData.assigned_to_name
                          )?.assigned_leads_count || 0}{" "}
                          leads )
                        </span>
                      </div>
                    ) : (
                      "Select counsellor to assign"
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {assignableUsers.map((user: UserStats) => (
                    <SelectItem key={user.user_id} value={user.name}>
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
                <p className="text-sm text-gray-500">Loading counsellors...</p>
              )}

              {/* Helper text */}
              <p className="text-xs text-gray-500">
                Select a different counsellor to reassign this lead
              </p>
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
