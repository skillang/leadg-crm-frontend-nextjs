// src/components/leads/SingleLeadModal.tsx - FIXED COUNTRY HANDLING

"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Loader2 } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNotifications } from "@/components/common/NotificationSystem";
import {
  useCreateLeadMutation,
  useGetAssignableUsersWithDetailsQuery,
} from "@/redux/slices/leadsApi";
import { useGetCategoriesQuery } from "@/redux/slices/categoriesApi";
import { useGetActiveStagesQuery } from "@/redux/slices/stagesApi";
import { useGetActiveStatusesQuery } from "@/redux/slices/statusesApi";
import MultiSelect, {
  STUDY_DESTINATIONS,
} from "@/components/common/MultiSelect";
import CourseLevelDropdown from "../common/CourseLevelDropdown";
import ExperienceLevelDropdown from "../common/ExperienceLevelDropdown";
import SourceDropdown from "../common/SourceDropdown";
import { StageSelect } from "../common/StageSelect";
import { StatusSelect } from "../common/StatusSelect";
import { CreateLeadApiRequest } from "@/models/types/lead";
import LeadAssignmentDropdown from "../common/LeadAssignmentDropdown";

// ✅ FIXED: Helper function to convert countries array to string for backend
const formatCountriesForBackend = (countries: string[]): string => {
  if (!countries || countries.length === 0) return "";
  return countries.join(", ");
};

// Course level constants - ✅ FIXED: Match backend enum values
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

// Experience levels - ✅ FIXED: Match backend enum values
export const EXPERIENCE_LEVELS = [
  { value: "fresher", label: "Fresher" },
  { value: "less_than_1_year", label: "Less than 1 Year" },
  { value: "1_to_3_years", label: "1-3 Years" },
  { value: "3_to_5_years", label: "3-5 Years" },
  { value: "5_to_10_years", label: "5-10 Years" },
  { value: "more_than_10_years", label: "More than 10 Years" },
];

// Nationalities
export const NATIONALITIES = [
  "Indian",
  "British",
  "German",
  "UAE",
  "French",
  "Chinese",
  "Japanese",
  "Bangladeshi",
  "Sri Lankan",
  "Nepalese",
  "African",
  "European",
  "Other",
];

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

interface SingleLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Form data interface
interface LeadFormData {
  name: string;
  email: string;
  contact_number: string;
  country_of_interest: string[]; // ✅ KEEP as array in frontend for UX
  course_level: string;
  source: string;
  category: string;
  assigned_to: string;
  assigned_to_name: string;
  stage: string;
  status: string;
  lead_score: number;
  notes: string;
  tags: string[];
  age?: number;
  experience?: string;
  nationality?: string;
  date_of_birth?: string;
  current_location?: string;
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

const SingleLeadModal: React.FC<SingleLeadModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState("details");
  const [assignmentMode, setAssignmentMode] = useState<
    "manual" | "auto_round_robin" | "selective_round_robin"
  >("manual");

  // ✅ FIXED: Add missing selectedUserEmails state
  const [selectedUserEmails, setSelectedUserEmails] = useState<string[]>([]);

  const [formData, setFormData] = useState<LeadFormData>({
    name: "",
    email: "",
    contact_number: "",
    country_of_interest: [],
    course_level: "",
    source: "website",
    category: "",
    assigned_to: "",
    assigned_to_name: "",
    stage: "",
    status: "",
    lead_score: 0,
    notes: "",
    tags: [],
    age: undefined,
    experience: "",
    nationality: "",
    date_of_birth: "",
    current_location: "",
  });

  const [newTag, setNewTag] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // API Hooks
  const [createLead, { isLoading: isCreating }] = useCreateLeadMutation();

  // ✅ UPDATED: Use Redux APIs for categories, stages, statuses, and assignable users
  const { data: categoriesResponse, isLoading: isLoadingCategories } =
    useGetCategoriesQuery({});
  const { data: stagesResponse, isLoading: isLoadingStages } =
    useGetActiveStagesQuery({});
  const { data: statusesResponse, isLoading: isLoadingStatuses } =
    useGetActiveStatusesQuery({});
  const { data: assignableUsersResponse } =
    useGetAssignableUsersWithDetailsQuery();

  const { showSuccess, showError } = useNotifications();

  // Memoized data
  const categories = React.useMemo(
    () => categoriesResponse?.categories || [],
    [categoriesResponse?.categories]
  );

  const stages = React.useMemo(
    () => stagesResponse?.stages || [],
    [stagesResponse?.stages]
  );

  const statuses = React.useMemo(
    () => statusesResponse?.statuses || [],
    [statusesResponse?.statuses]
  );

  const assignableUsers = React.useMemo(
    () => assignableUsersResponse?.users || [],
    [assignableUsersResponse?.users]
  );

  const defaultStage = React.useMemo(
    () => stages.find((stage) => stage.is_default) || stages[0],
    [stages]
  );

  const defaultStatus = React.useMemo(
    () => statuses.find((status) => status.is_default) || statuses[0],
    [statuses]
  );

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: "",
        email: "",
        contact_number: "",
        country_of_interest: [],
        course_level: "",
        source: "website",
        category: "",
        assigned_to: "",
        assigned_to_name: "",
        stage: "",
        status: "",
        lead_score: 0,
        notes: "",
        tags: [],
        age: undefined,
        experience: "",
        nationality: "",
        date_of_birth: "",
        current_location: "",
      });
      setErrors({});
      setNewTag("");
      setActiveTab("details");
      setAssignmentMode("manual");
      setSelectedUserEmails([]);
    }
  }, [isOpen]);

  // Auto-select first category
  useEffect(() => {
    if (isOpen && categories.length > 0 && !formData.category) {
      setFormData((prev) => ({
        ...prev,
        category: categories[0]?.name || "",
      }));
    }
  }, [isOpen, categories, formData.category]);

  // Auto-select default stage and status
  useEffect(() => {
    if (isOpen && defaultStage && !formData.stage) {
      setFormData((prev) => ({
        ...prev,
        stage: defaultStage.name,
      }));
    }
  }, [isOpen, defaultStage, formData.stage]);

  useEffect(() => {
    if (isOpen && defaultStatus && !formData.status) {
      setFormData((prev) => ({
        ...prev,
        status: defaultStatus.name,
      }));
    }
  }, [isOpen, defaultStatus, formData.status]);

  const handleAssignmentChange = (assignment: {
    type: "unassigned" | "all_users" | "selective_round_robin" | "manual";
    assigned_to?: string;
    assigned_users?: string[];
  }) => {
    // Update assignment mode based on type
    setAssignmentMode(
      assignment.type === "unassigned"
        ? "manual"
        : assignment.type === "selective_round_robin"
        ? "selective_round_robin"
        : assignment.type === "all_users"
        ? "auto_round_robin"
        : "manual"
    );

    // Update form data
    if (assignment.type === "unassigned") {
      setFormData((prev) => ({
        ...prev,
        assigned_to: "",
        assigned_to_name: "",
      }));
      setSelectedUserEmails([]);
    } else if (assignment.type === "manual" && assignment.assigned_to) {
      const selectedUser = assignableUsers.find(
        (user) => user.email === assignment.assigned_to
      );
      setFormData((prev) => ({
        ...prev,
        assigned_to: assignment.assigned_to || "",
        assigned_to_name: selectedUser?.name || assignment.assigned_to || "",
      }));
    } else if (
      assignment.type === "selective_round_robin" &&
      assignment.assigned_users
    ) {
      setSelectedUserEmails(assignment.assigned_users);
      setFormData((prev) => ({
        ...prev,
        assigned_to: "",
        assigned_to_name: "",
      }));
    }
  };

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

    if (!formData.category) {
      newErrors.category = "Category is required";
    }

    if (!formData.stage) {
      newErrors.stage = "Stage is required";
    }

    if (!formData.status) {
      newErrors.status = "Status is required";
    }

    if (formData.lead_score < 0 || formData.lead_score > 100) {
      newErrors.lead_score = "Lead score must be between 0 and 100";
    }

    if (formData.age && (formData.age < 16 || formData.age > 100)) {
      newErrors.age = "Age must be between 16 and 100";
    }

    // Validate selective round robin
    if (
      assignmentMode === "selective_round_robin" &&
      selectedUserEmails.length === 0
    ) {
      newErrors.assignment =
        "Please select at least one counselor for selective round robin";
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
      // ✅ FIXED: Use the correct API payload structure
      const payload: CreateLeadApiRequest = {
        basic_info: {
          name: formData.name.trim(),
          email: formData.email.trim(),
          contact_number: formData.contact_number.trim(),
          source: formData.source,
          category: formData.category,
        },
        status_and_tags: {
          stage: formData.stage,
          status: formData.status,
          lead_score: formData.lead_score,
          tags: formData.tags,
        },
        assignment: {
          assigned_to: getAssignmentValue(assignmentMode, formData.assigned_to),
        },
        additional_info: {
          notes: formData.notes.trim(),
        },
      };

      // ✅ FIXED: Convert countries array to string for backend
      if (formData.country_of_interest.length > 0) {
        payload.basic_info.country_of_interest = formatCountriesForBackend(
          formData.country_of_interest
        );
      }

      if (formData.course_level && formData.course_level.trim()) {
        payload.basic_info.course_level = formData.course_level;
      }

      if (formData.age && formData.age > 0) {
        payload.basic_info.age = formData.age;
      }

      if (formData.experience && formData.experience.trim()) {
        payload.basic_info.experience = formData.experience;
      }

      if (formData.nationality && formData.nationality.trim()) {
        payload.basic_info.nationality = formData.nationality;
      }

      if (formData.current_location && formData.current_location.trim()) {
        payload.basic_info.current_location = formData.current_location;
      }

      if (formData.date_of_birth && formData.date_of_birth.trim()) {
        payload.basic_info.date_of_birth = formData.date_of_birth.trim();
      }

      // console.log(
      //   "🚀 Creating lead with payload:",
      //   JSON.stringify(payload, null, 2)
      // );

      // ✅ FIXED: Handle different assignment modes properly
      let result;

      if (
        assignmentMode === "selective_round_robin" &&
        selectedUserEmails.length > 0
      ) {
        // For selective round robin, add selected_user_emails to payload
        const payloadWithEmails = {
          ...payload,
          selected_user_emails: selectedUserEmails.join(","),
        };

        result = await createLead(payloadWithEmails).unwrap();
      } else {
        // For manual assignment and auto round robin, use standard payload
        result = await createLead(payload).unwrap();
      }

      showSuccess(
        result.message || "Lead created successfully!",
        `Lead ID: ${result.lead?.lead_id || "Generated"}`
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
  // Helper function to convert assignment mode to backend value
  const getAssignmentValue = (mode: string, assignedTo?: string) => {
    switch (mode) {
      case "manual":
        return assignedTo || "unassigned";
      case "auto_round_robin":
      case "selective_round_robin":
        return "round_robin";
      default:
        return "unassigned";
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl  max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Add Lead</DialogTitle>
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
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      placeholder="Enter full name"
                      className={errors.name ? "border-red-500" : ""}
                      disabled={isCreating}
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
                      disabled={isCreating}
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
                      type="tel"
                      value={formData.contact_number}
                      onChange={(e) =>
                        handleInputChange("contact_number", e.target.value)
                      }
                      placeholder="Enter contact number"
                      className={errors.contact_number ? "border-red-500" : ""}
                      disabled={isCreating}
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
                      placeholder="Enter age"
                      min="16"
                      max="100"
                      disabled={isCreating}
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
                      disabled={isCreating}
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
                      disabled={isCreating}
                    >
                      <SelectTrigger>
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
                    <Label htmlFor="current_location">Current Location</Label>
                    <Input
                      id="current_location"
                      type="text"
                      value={formData.current_location}
                      onChange={(e) =>
                        handleInputChange("current_location", e.target.value)
                      }
                      placeholder="Enter current location"
                      disabled={isCreating}
                    />
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
                      required={false}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="source">Source</Label>
                    <SourceDropdown
                      value={formData.source}
                      onValueChange={(value) =>
                        handleInputChange("source", value)
                      }
                      disabled={isCreating}
                      placeholder="Select source"
                    />
                  </div>

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
                    disabled={isCreating}
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
                <div className="grid grid-cols-2 gap-4">
                  <StageSelect
                    value={formData.stage}
                    onValueChange={(value) => handleInputChange("stage", value)}
                    stages={stages}
                    disabled={isCreating}
                    isLoading={isLoadingStages}
                    required={true}
                    error={errors.stage}
                  />

                  <div className="space-y-2">
                    <StatusSelect
                      value={formData.status}
                      onValueChange={(value) =>
                        handleInputChange("status", value)
                      }
                      statuses={statuses}
                      disabled={isCreating}
                      isLoading={isLoadingStatuses}
                      error={errors.status}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lead_score">
                      Lead Score (0-100) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="lead_score"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.lead_score}
                      onChange={(e) =>
                        handleInputChange(
                          "lead_score",
                          parseInt(e.target.value) || 0
                        )
                      }
                      placeholder="Enter score"
                      className={errors.lead_score ? "border-red-500" : ""}
                      disabled={isCreating}
                    />
                    {errors.lead_score && (
                      <p className="text-sm text-red-500">
                        {errors.lead_score}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>
                    Tags <span className="text-red-500">*</span>
                  </Label>

                  {/* Add custom tag */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a tag"
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
              </TabsContent>

              {/* Assignment Tab */}
              <TabsContent value="assignment" className="space-y-4 mt-0">
                <div className="space-y-4">
                  <LeadAssignmentDropdown
                    mode="create"
                    currentAssignment={formData.assigned_to || "unassigned"}
                    onAssignmentChange={handleAssignmentChange}
                    disabled={isCreating}
                    showLabel={true}
                  />

                  {/* Show current assignment details */}
                  {assignmentMode === "selective_round_robin" &&
                    selectedUserEmails.length > 0 && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-medium text-blue-900">
                          Selective Round Robin - Selected Counselors (
                          {selectedUserEmails.length})
                        </h4>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedUserEmails.map((email) => {
                            const user = assignableUsers.find(
                              (u) => u.email === email
                            );
                            return (
                              <Badge key={email} variant="secondary">
                                {user?.name || email}
                              </Badge>
                            );
                          })}
                        </div>
                        <p className="text-sm text-blue-700 mt-1">
                          Lead will be assigned to the next available counselor
                          from the selected list.
                        </p>
                      </div>
                    )}

                  {assignmentMode === "auto_round_robin" && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-900">
                        Auto Round Robin Assignment
                      </h4>
                      <p className="text-sm text-green-700 mt-1">
                        Lead will be automatically assigned to the next
                        available counselor in rotation among all active users.
                      </p>
                    </div>
                  )}

                  {formData.assigned_to && assignmentMode === "manual" && (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-900">
                        Manual Assignment
                      </h4>
                      <p className="text-sm text-gray-700 mt-1">
                        Assigned to:{" "}
                        <strong>
                          {formData.assigned_to_name || formData.assigned_to}
                        </strong>
                      </p>
                    </div>
                  )}

                  {errors.assignment && (
                    <p className="text-sm text-red-500">{errors.assignment}</p>
                  )}
                </div>
              </TabsContent>

              {/* Additional Info Tab */}
              <TabsContent value="additional" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Add any additional notes about this lead..."
                    rows={6}
                    disabled={isCreating}
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
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Lead
              </Button>
            </div>
          </Tabs>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SingleLeadModal;
