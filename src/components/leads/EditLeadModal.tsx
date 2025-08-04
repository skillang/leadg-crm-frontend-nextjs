// src/components/leads/EditLeadModal.tsx - FIXED TYPESCRIPT ERRORS

"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Loader2, Users, Crown, User, UserPlus } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useUpdateLeadMutation,
  useGetAssignableUsersWithDetailsQuery,
  useAssignLeadToMultipleUsersMutation,
  useRemoveUserFromAssignmentMutation,
} from "@/redux/slices/leadsApi";
import { useGetCategoriesQuery } from "@/redux/slices/categoriesApi";
import { useGetActiveStagesQuery } from "@/redux/slices/stagesApi";
import { useGetActiveStatusesQuery } from "@/redux/slices/statusesApi";
import MultiSelect, {
  STUDY_DESTINATIONS,
} from "@/components/common/MultiSelect";
import { Lead } from "@/models/types/lead";
import CourseLevelDropdown from "../common/CourseLevelDropdown";
import ExperienceLevelDropdown from "../common/ExperienceLevelDropdown";
import SourceDropdown from "../common/SourceDropdown";
import { useAuth } from "@/redux/hooks/useAuth";

// Constants - ✅ FIXED: Match backend enum values
export const COURSE_LEVEL_OPTIONS = [
  { value: "certificate", label: "Certificate" },
  { value: "diploma", label: "Diploma" },
  { value: "undergraduate", label: "Undergraduate" },
  { value: "graduate", label: "Graduate" },
  { value: "postgraduate", label: "Postgraduate" },
  { value: "doctorate", label: "Doctorate" },
  { value: "professional", label: "Professional" },
  { value: "vocational", label: "Vocational" },
];

export const EXPERIENCE_LEVELS = [
  { value: "fresher", label: "Fresher" },
  { value: "less_than_1_year", label: "Less than 1 Year" },
  { value: "1_to_3_years", label: "1-3 Years" },
  { value: "3_to_5_years", label: "3-5 Years" },
  { value: "5_to_10_years", label: "5-10 Years" },
  { value: "more_than_10_years", label: "More than 10 Years" },
];

export const NATIONALITIES = [
  "Indian",
  "American",
  "British",
  "Canadian",
  "Australian",
  "German",
  "French",
  "Chinese",
  "Japanese",
  "Korean",
  "Pakistani",
  "Bangladeshi",
  "Sri Lankan",
  "Nepalese",
  "African",
  "European",
  "Other",
];

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
  "USA",
  "UK",
  "Germany",
  "Canada",
  "Australia",
  "New Zealand",
  "Masters",
  "Bachelors",
  "PhD",
  "Scholarship",
  "Interview",
  "Application",
  "Budget",
  "Visa",
  "Documents",
  "Next Fall",
];

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface EditLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
}

interface EditLeadFormData {
  name: string;
  email: string;
  contact_number: string;
  country_of_interest: string[];
  course_level: string;
  source: string;
  category: string;
  stage: string;
  status: string;
  lead_score: number;
  tags: string[];
  assigned_to: string;
  assigned_to_name: string;
  notes: string;
  age?: number;
  experience?: string;
  nationality?: string;
  date_of_birth?: string;
  current_location?: string;
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

// 🔥 FIXED: Updated interface to match UpdateLeadRequest from leadsApi.ts
interface LeadUpdateData {
  lead_id: string;
  name: string;
  email?: string;
  contact_number?: string;
  source?: string;
  category: string;
  stage: string;
  status: string;
  lead_score: number;
  tags?: string[];
  notes?: string;
  country_of_interest?: string;
  course_level?: string;
  age?: number;
  experience?: string;
  nationality?: string;
  date_of_birth?: string;
  current_location?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  assignment_method?: string;
  // 🔥 FIXED: Add index signature to allow dynamic assignment
  [key: string]: unknown;
}

// Multi-assignment request interface
interface MultiAssignmentRequest {
  leadId: string;
  userEmails: string[];
  reason: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Helper function to parse countries from string
const parseCountriesFromString = (countryString: string): string[] => {
  if (!countryString || typeof countryString !== "string") return [];
  return countryString
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const EditLeadModal: React.FC<EditLeadModalProps> = ({
  isOpen,
  onClose,
  lead,
}) => {
  const [activeTab, setActiveTab] = useState("details");
  const [formData, setFormData] = useState<EditLeadFormData>({
    name: "",
    email: "",
    contact_number: "",
    country_of_interest: [],
    course_level: "",
    source: "website",
    category: "",
    stage: "",
    status: "",
    lead_score: 0,
    tags: [],
    current_location: "",
    assigned_to: "",
    assigned_to_name: "",
    notes: "",
  });

  const [newTag, setNewTag] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showMultiAssignment, setShowMultiAssignment] = useState(false);
  const [selectedCoAssignees, setSelectedCoAssignees] = useState<string[]>([]);
  const [multiAssignReason, setMultiAssignReason] = useState("");

  const { isAdmin, userEmail } = useAuth();
  // API hooks - Fixed: Removed unused variables
  const [updateLead, { isLoading: isUpdating }] = useUpdateLeadMutation();
  const [assignToMultiple, { isLoading: isAssigningMultiple }] =
    useAssignLeadToMultipleUsersMutation();
  const [removeFromAssignment] = useRemoveUserFromAssignmentMutation();

  const { data: assignableUsersResponse } =
    useGetAssignableUsersWithDetailsQuery();
  const { data: categoriesResponse } = useGetCategoriesQuery({});
  const { data: stagesResponse, isLoading: isLoadingStages } =
    useGetActiveStagesQuery({});
  const { data: statusesResponse, isLoading: isLoadingStatuses } =
    useGetActiveStatusesQuery({});

  // Memoized data
  const assignableUsers = assignableUsersResponse?.users || [];
  const categories = categoriesResponse?.categories || [];
  const stages = stagesResponse?.stages || [];
  const statuses = statusesResponse?.statuses || [];
  const availableUsers = isAdmin
    ? assignableUsers
    : assignableUsers.filter((user) => user.email === userEmail);

  // Initialize form data when lead changes
  useEffect(() => {
    if (lead && isOpen) {
      const newFormData = {
        name: lead.name || "",
        email: lead.email || "",
        contact_number: lead.contact || lead.phoneNumber || "",
        country_of_interest: lead.countryOfInterest
          ? parseCountriesFromString(lead.countryOfInterest)
          : [],
        course_level: lead.courseLevel || "",
        source: lead.source || "website",
        category: lead.leadCategory || "",
        stage: lead.stage || "",
        status: lead.status || "",
        lead_score: lead.leadScore || 0,
        tags: lead.tags || [],
        assigned_to: lead.assignedTo || "",
        assigned_to_name: lead.assignedToName || "",
        notes: lead.notes || "",
        age: lead.age,
        experience: lead.experience,
        nationality: lead.nationality,
        date_of_birth: lead.date_of_birth,
        current_location: lead.current_location || "",
      };

      setFormData(newFormData);
      setErrors({});
      setNewTag("");
      setShowMultiAssignment(false);
      setSelectedCoAssignees(lead.coAssignees || []);
      setMultiAssignReason("");
      setActiveTab("details");
    }
  }, [lead, isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setErrors({});
      setNewTag("");
      setShowMultiAssignment(false);
      setSelectedCoAssignees([]);
      setMultiAssignReason("");
      setActiveTab("details");
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

  const handleAssignmentChange = (userEmail: string) => {
    if (userEmail === "unassigned") {
      setFormData((prev) => ({
        ...prev,
        assigned_to: "",
        assigned_to_name: "",
      }));
    } else {
      const selectedUser = assignableUsers.find(
        (user) => user.email === userEmail
      );
      if (selectedUser) {
        setFormData((prev) => ({
          ...prev,
          assigned_to: selectedUser.email,
          assigned_to_name: selectedUser.name,
        }));
      }
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

    if (formData.age && (formData.age < 16 || formData.age > 100)) {
      newErrors.age = "Age must be between 16 and 100";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !lead) return;

    try {
      // 🔥 FIXED: Create properly typed update data object that matches UpdateLeadRequest
      const updateData: LeadUpdateData = {
        lead_id: lead.leadId || lead.id,
        name: formData.name,
        email: formData.email,
        contact_number: formData.contact_number,
        country_of_interest: formData.country_of_interest.join(", "),
        source: formData.source,
        category: formData.category,
        stage: formData.stage,
        status: formData.status,
        lead_score: formData.lead_score,
        tags: formData.tags,
        notes: formData.notes,
      };

      // ✅ FIXED: Only include optional fields if they have valid values
      if (formData.course_level && formData.course_level.trim()) {
        updateData.course_level = formData.course_level;
      }

      if (formData.age && formData.age > 0) {
        updateData.age = formData.age;
      }

      if (formData.experience && formData.experience.trim()) {
        updateData.experience = formData.experience;
      }

      if (formData.nationality && formData.nationality.trim()) {
        updateData.nationality = formData.nationality;
      }

      if (formData.current_location && formData.current_location.trim()) {
        updateData.current_location = formData.current_location;
      }

      if (formData.date_of_birth && formData.date_of_birth.trim()) {
        updateData.date_of_birth = formData.date_of_birth;
      }

      // Assignment fields
      if (formData.assigned_to && formData.assigned_to_name) {
        updateData.assigned_to = formData.assigned_to;
        updateData.assigned_to_name = formData.assigned_to_name;
        updateData.assignment_method = "manual by admin";
      }

      // console.log("Sending update data:", updateData);

      // 🔥 FIXED: The updateData now properly matches UpdateLeadRequest interface
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

  const handleMultiAssign = async () => {
    if (
      !lead ||
      selectedCoAssignees.length === 0 ||
      !multiAssignReason.trim()
    ) {
      setErrors({ multiAssign: "Please select users and provide a reason" });
      return;
    }

    try {
      const allAssignees = formData.assigned_to
        ? [formData.assigned_to, ...selectedCoAssignees]
        : selectedCoAssignees;

      // Fixed: Properly typed multi-assignment request
      const multiAssignRequest: MultiAssignmentRequest = {
        leadId: lead.leadId || lead.id,
        userEmails: allAssignees,
        reason: multiAssignReason,
      };

      await assignToMultiple(multiAssignRequest).unwrap();

      setShowMultiAssignment(false);
      setSelectedCoAssignees([]);
      setMultiAssignReason("");
      onClose();
    } catch (error) {
      const apiError = error as ApiError;
      console.error("Failed to assign to multiple users:", apiError);
      setErrors({ multiAssign: "Failed to assign to multiple users" });
    }
  };

  const handleRemoveCoAssignee = async (userEmail: string) => {
    if (!lead) return;

    try {
      await removeFromAssignment({
        leadId: lead.leadId || lead.id,
        userEmail,
        reason: "Removed via edit modal",
      }).unwrap();

      setSelectedCoAssignees((prev) =>
        prev.filter((email) => email !== userEmail)
      );
    } catch (error) {
      console.error("Failed to remove user from assignment:", error);
      setErrors({ multiAssign: "Failed to remove user from assignment" });
    }
  };

  const getAvailableUsers = () => {
    return availableUsers.filter(
      (user) =>
        user.email !== formData.assigned_to &&
        !selectedCoAssignees.includes(user.email)
    );
  };

  const getCurrentAssignees = () => {
    if (!lead) return [];

    const assignees = [];
    if (lead.assignedTo && lead.assignedToName) {
      assignees.push({
        email: lead.assignedTo,
        name: lead.assignedToName,
        isPrimary: true,
      });
    }

    if (lead.coAssignees && lead.coAssigneesNames) {
      lead.coAssignees.forEach((email, index) => {
        assignees.push({
          email,
          name: lead.coAssigneesNames?.[index] || email,
          isPrimary: false,
        });
      });
    }

    return assignees;
  };

  if (!lead) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] min-w-xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Edit Lead
            {lead.isMultiAssigned && (
              <Badge variant="secondary" className="ml-2">
                <Users className="h-3 w-3 mr-1" />
                {getCurrentAssignees().length} Assignees
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="h-full">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="h-full"
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="status">Status & Tags</TabsTrigger>
              <TabsTrigger value="assignment">Assignment</TabsTrigger>
              <TabsTrigger value="additional">Additional Info</TabsTrigger>
            </TabsList>

            <div className="mt-6 max-h-[calc(90vh-200px)] overflow-y-auto">
              {errors.general && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{errors.general}</AlertDescription>
                </Alert>
              )}

              {/* Details Tab */}
              <TabsContent value="details" className="space-y-4 mt-0">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      disabled
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      placeholder="Enter lead name"
                      className={errors.name ? "border-red-500" : ""}
                      // disabled={isUpdating}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500">{errors.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      placeholder="Enter email address"
                      className={errors.email ? "border-red-500" : ""}
                      disabled
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact_number">
                      Contact Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="contact_number"
                      value={formData.contact_number}
                      onChange={(e) =>
                        handleInputChange("contact_number", e.target.value)
                      }
                      placeholder="Enter contact number"
                      className={errors.contact_number ? "border-red-500" : ""}
                      disabled
                    />
                    {errors.contact_number && (
                      <p className="text-sm text-red-500">
                        {errors.contact_number}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      value={formData.age || ""}
                      onChange={(e) =>
                        handleInputChange("age", parseInt(e.target.value) || 0)
                      }
                      placeholder="Age"
                      min="16"
                      max="100"
                      disabled={isUpdating}
                    />
                    {errors.age && (
                      <p className="text-sm text-red-500">{errors.age}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <ExperienceLevelDropdown
                      value={formData.experience}
                      onValueChange={(value) =>
                        handleInputChange("experience", value)
                      }
                      label="Experience Level"
                      placeholder="Select experience level"
                      disabled={isUpdating}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nationality">Nationality</Label>
                    <Select
                      value={formData.nationality}
                      onValueChange={(value) =>
                        handleInputChange("nationality", value)
                      }
                      disabled={isUpdating}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select nationality" />
                      </SelectTrigger>
                      <SelectContent>
                        {NATIONALITIES.map((nationality) => (
                          <SelectItem key={nationality} value={nationality}>
                            {nationality}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="current-location">
                      Current Location <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="current-location"
                      value={formData.current_location}
                      onChange={(e) =>
                        handleInputChange("current_location", e.target.value)
                      }
                      placeholder="Current location"
                      className={
                        errors.current_location ? "border-red-500" : ""
                      }
                      disabled={isUpdating}
                    />
                    {errors.current_location && (
                      <p className="text-sm text-red-500">
                        {errors.current_location}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <CourseLevelDropdown
                      value={formData.course_level}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          course_level: value,
                        }))
                      }
                      label="Course Level"
                      placeholder="Select course level"
                      className="w-full"
                      required={false}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        handleInputChange("category", value)
                      }
                      disabled
                    >
                      <SelectTrigger>
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="source">Source *</Label>
                    <SourceDropdown
                      value={formData.source}
                      onValueChange={(value) =>
                        handleInputChange("source", value)
                      }
                      disabled
                      placeholder="Select source"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Countries of Interest</Label>
                  <MultiSelect
                    options={STUDY_DESTINATIONS}
                    value={formData.country_of_interest}
                    onChange={(value) =>
                      handleInputChange("country_of_interest", value)
                    }
                    disabled={isUpdating}
                    placeholder="Select countries..."
                    searchPlaceholder="Search countries..."
                    emptyMessage="No countries found."
                    maxDisplayItems={3}
                    showCheckbox={true}
                    allowSingleSelect={false}
                  />
                </div>
              </TabsContent>

              {/* Status & Tags Tab */}
              <TabsContent value="status" className="space-y-4 mt-0">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stage">Stage</Label>
                    <Select
                      value={formData.stage}
                      onValueChange={(value) =>
                        handleInputChange("stage", value)
                      }
                      disabled={isUpdating || isLoadingStages}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                      <SelectContent>
                        {stages.map((stage) => (
                          <SelectItem key={stage.id} value={stage.name}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: stage.color }}
                              />
                              {stage.display_name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        handleInputChange("status", value)
                      }
                      disabled={isUpdating || isLoadingStatuses}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((status) => (
                          <SelectItem key={status.id} value={status.name}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: status.color }}
                              />
                              {status.display_name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lead_score">Lead Score</Label>
                    <Input
                      id="lead_score"
                      type="number"
                      value={formData.lead_score}
                      onChange={(e) =>
                        handleInputChange(
                          "lead_score",
                          parseInt(e.target.value) || 0
                        )
                      }
                      placeholder="Lead score"
                      min="0"
                      max="100"
                      disabled={isUpdating}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Tags</Label>

                  {/* Add custom tag */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a tag"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={handleTagKeyPress}
                      disabled={isUpdating}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddTag}
                      disabled={!newTag.trim() || isUpdating}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Predefined tags */}
                  <div className="flex flex-wrap gap-2">
                    {PREDEFINED_TAGS.map((tag) => (
                      <Badge
                        key={tag}
                        variant={
                          formData.tags.includes(tag) ? "default" : "outline"
                        }
                        className="cursor-pointer"
                        onClick={() => handleAddPredefinedTag(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
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
                            className="flex items-center gap-1"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              disabled={isUpdating}
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
              </TabsContent>

              {/* Assignment Tab */}
              <TabsContent value="assignment" className="space-y-4 mt-0">
                {/* Current Assignments Display */}
                {lead.isMultiAssigned && getCurrentAssignees().length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        Current Assignments
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {getCurrentAssignees().map((assignee) => (
                          <Badge
                            key={assignee.email}
                            variant={
                              assignee.isPrimary ? "default" : "secondary"
                            }
                            className="flex items-center gap-1"
                          >
                            {assignee.isPrimary ? (
                              <Crown className="h-3 w-3" />
                            ) : (
                              <User className="h-3 w-3" />
                            )}
                            {assignee.name}
                            {assignee.isPrimary && " (Primary)"}
                            {!assignee.isPrimary && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveCoAssignee(assignee.email)
                                }
                                className="ml-1 hover:bg-red-500 hover:text-white rounded-full p-0.5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-3 space-y-2">
                    <Label htmlFor="assigned_to">
                      Primary Assigned Counselor
                    </Label>
                    <Select
                      value={formData.assigned_to}
                      onValueChange={handleAssignmentChange}
                      disabled={isUpdating}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select assigned counselor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {availableUsers.map((user) => (
                          <SelectItem key={user.email} value={user.email}>
                            {user.name} ({user.current_lead_count} leads)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {isAdmin && (
                    <div className="space-y-2">
                      <Label>&nbsp;</Label>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setShowMultiAssignment(!showMultiAssignment)
                        }
                        className="w-full"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        {showMultiAssignment ? "Hide" : "Add"} Co-Assignees
                      </Button>
                    </div>
                  )}
                </div>

                {/* Multi-Assignment Section */}
                {showMultiAssignment && (
                  <Card className="border-dashed">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Multi-Assignment Setup
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Co-Assignees</Label>
                          <Select
                            value=""
                            onValueChange={(value) => {
                              if (
                                value &&
                                !selectedCoAssignees.includes(value)
                              ) {
                                setSelectedCoAssignees([
                                  ...selectedCoAssignees,
                                  value,
                                ]);
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select additional counselors" />
                            </SelectTrigger>
                            <SelectContent>
                              {getAvailableUsers().map((user) => (
                                <SelectItem key={user.email} value={user.email}>
                                  {user.name} ({user.current_lead_count} leads)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {selectedCoAssignees.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {selectedCoAssignees.map((email) => {
                                const user = assignableUsers.find(
                                  (u) => u.email === email
                                );
                                return (
                                  <Badge
                                    key={email}
                                    variant="secondary"
                                    className="flex items-center gap-1"
                                  >
                                    {user?.name || email}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setSelectedCoAssignees((prev) =>
                                          prev.filter((e) => e !== email)
                                        )
                                      }
                                      className="hover:bg-red-500 hover:text-white rounded-full p-0.5"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="multiAssignReason">Reason</Label>
                          <Input
                            id="multiAssignReason"
                            value={multiAssignReason}
                            onChange={(e) =>
                              setMultiAssignReason(e.target.value)
                            }
                            placeholder="Assignment reason"
                          />
                        </div>
                      </div>

                      {errors.multiAssign && (
                        <Alert variant="destructive">
                          <AlertDescription>
                            {errors.multiAssign}
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={handleMultiAssign}
                          disabled={
                            selectedCoAssignees.length === 0 ||
                            !multiAssignReason.trim() ||
                            isAssigningMultiple
                          }
                          size="sm"
                        >
                          {isAssigningMultiple
                            ? "Applying..."
                            : "Apply Multi-Assignment"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowMultiAssignment(false)}
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Additional Info Tab */}
              <TabsContent value="additional" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Add notes about this lead..."
                    rows={6}
                    disabled={isUpdating}
                  />
                </div>
              </TabsContent>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Update Lead
              </Button>
            </div>
          </Tabs>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditLeadModal;
