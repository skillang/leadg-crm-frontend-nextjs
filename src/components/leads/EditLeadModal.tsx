// src/components/leads/EditLeadModal.tsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Users,
  X,
  Plus,
  Info,
  UserPlus,
  UserMinus,
  Crown,
} from "lucide-react";
import {
  useUpdateLeadMutation,
  useGetAssignableUsersWithDetailsQuery,
  useAssignLeadToMultipleUsersMutation,
  useRemoveUserFromAssignmentMutation,
} from "@/redux/slices/leadsApi";
import { Lead } from "@/models/types/lead";

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
  stage: string;
  lead_score: number;
  tags: string[];
  assigned_to: string;
  assigned_to_name: string;
  notes: string;
  age?: number;
  experience?: string;
  nationality?: string;
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

const COUNTRIES = [
  "USA",
  "Canada",
  "UK",
  "Australia",
  "Germany",
  "France",
  "Spain",
  "Italy",
  "Netherlands",
  "Sweden",
  "Norway",
  "Denmark",
  "Switzerland",
  "Austria",
  "Belgium",
  "Ireland",
  "New Zealand",
  "Singapore",
  "Japan",
  "South Korea",
];

const SOURCES = [
  "website",
  "referral",
  "social_media",
  "email_campaign",
  "cold_call",
  "trade_show",
  "webinar",
  "content_marketing",
  "paid_ads",
  "organic_search",
];

const STAGES = [
  "open",
  "contacted",
  "qualified",
  "proposal",
  "negotiation",
  "closed_won",
  "closed_lost",
];

const COURSE_LEVELS = [
  "certificate",
  "diploma",
  "bachelor",
  "master",
  "phd",
  "professional",
];

const EXPERIENCE_LEVELS = [
  "fresher",
  "1-2_years",
  "3-5_years",
  "5-10_years",
  "10+_years",
];

const PREDEFINED_TAGS = [
  "High Priority",
  "Follow Up",
  "Interested",
  "Budget Confirmed",
  "Decision Maker",
  "Hot Lead",
  "Warm Lead",
  "Cold Lead",
];

const parseCountriesFromString = (countryString: string): string[] => {
  if (!countryString || typeof countryString !== "string") return [];
  return countryString
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
};

const EditLeadModal: React.FC<EditLeadModalProps> = ({
  isOpen,
  onClose,
  lead,
}) => {
  const [formData, setFormData] = useState<EditLeadFormData>({
    name: "",
    email: "",
    contact_number: "",
    country_of_interest: [],
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
  const [showMultiAssignment, setShowMultiAssignment] = useState(false);
  const [selectedCoAssignees, setSelectedCoAssignees] = useState<string[]>([]);
  const [multiAssignReason, setMultiAssignReason] = useState("");

  // API hooks
  const [updateLead, { isLoading: isUpdating }] = useUpdateLeadMutation();
  const [assignToMultiple, { isLoading: isAssigningMultiple }] =
    useAssignLeadToMultipleUsersMutation();
  const [removeFromAssignment, { isLoading: isRemoving }] =
    useRemoveUserFromAssignmentMutation();

  const { data: assignableUsersResponse, isLoading: isLoadingUsers } =
    useGetAssignableUsersWithDetailsQuery();

  const assignableUsers = assignableUsersResponse?.users || [];

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
        stage: lead.stage || "open",
        lead_score: lead.leadScore || 0,
        tags: lead.tags || [],
        assigned_to: lead.assignedTo || "",
        assigned_to_name: lead.assignedToName || "",
        notes: lead.notes || "",
        age: lead.age,
        experience: lead.experience,
        nationality: lead.nationality,
      };

      setFormData(newFormData);
      setErrors({});
      setNewTag("");
      setShowMultiAssignment(false);
      setSelectedCoAssignees(lead.coAssignees || []);
      setMultiAssignReason("");
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !lead) return;

    try {
      const updateData: Record<string, any> = {
        lead_id: lead.leadId || lead.id,
        name: formData.name,
        email: formData.email,
        contact_number: formData.contact_number,
        country_of_interest: formData.country_of_interest.join(", "),
        course_level: formData.course_level,
        source: formData.source,
        stage: formData.stage,
        lead_score: formData.lead_score,
        tags: formData.tags,
        notes: formData.notes,
        age: formData.age,
        experience: formData.experience,
        nationality: formData.nationality,
      };

      // Assignment fields - send email, name, and method
      if (formData.assigned_to && formData.assigned_to_name) {
        updateData.assigned_to = formData.assigned_to;
        updateData.assigned_to_name = formData.assigned_to_name;
        updateData.assignment_method = "manual by admin";
      }

      console.log("Sending update data:", updateData);

      await updateLead(updateData as any).unwrap(); // Type assertion to bypass strict typing
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
      // Include primary assignee if one exists
      const allAssignees = formData.assigned_to
        ? [formData.assigned_to, ...selectedCoAssignees]
        : selectedCoAssignees;

      await assignToMultiple({
        leadId: lead.leadId || lead.id,
        userEmails: allAssignees,
        reason: multiAssignReason,
      }).unwrap();

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
    return assignableUsers.filter(
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Edit Lead: {lead.name}
            {lead.isMultiAssigned && (
              <Badge variant="secondary" className="ml-2">
                <Users className="h-3 w-3 mr-1" />
                {getCurrentAssignees().length} Assignees
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <Alert variant="destructive">
              <AlertDescription>{errors.general}</AlertDescription>
            </Alert>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter lead name"
                className={errors.name ? "border-red-500" : ""}
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
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Enter email address"
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact">Contact Number *</Label>
              <Input
                id="contact"
                value={formData.contact_number}
                onChange={(e) =>
                  handleInputChange("contact_number", e.target.value)
                }
                placeholder="Enter contact number"
                className={errors.contact_number ? "border-red-500" : ""}
              />
              {errors.contact_number && (
                <p className="text-sm text-red-500">{errors.contact_number}</p>
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="experience">Experience</Label>
              <Select
                value={formData.experience}
                onValueChange={(value) =>
                  handleInputChange("experience", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select experience" />
                </SelectTrigger>
                <SelectContent>
                  {EXPERIENCE_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level.replace("_", "-")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select nationality" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="course_level">Course Level</Label>
              <Select
                value={formData.course_level}
                onValueChange={(value) =>
                  handleInputChange("course_level", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select course level" />
                </SelectTrigger>
                <SelectContent>
                  {COURSE_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
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
                  handleInputChange("lead_score", parseInt(e.target.value) || 0)
                }
                placeholder="Lead score"
                min="0"
                max="100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Select
                value={formData.source}
                onValueChange={(value) => handleInputChange("source", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {SOURCES.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source.replace("_", " ").toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stage">Stage</Label>
              <Select
                value={formData.stage}
                onValueChange={(value) => handleInputChange("stage", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {stage.replace("_", " ").toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Assignment Management */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              Assignment Management
            </h3>

            {/* Current Assignments Display */}
            {lead.isMultiAssigned && getCurrentAssignees().length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Current Assignments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {getCurrentAssignees().map((assignee) => (
                      <Badge
                        key={assignee.email}
                        variant={assignee.isPrimary ? "default" : "secondary"}
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
                <Label htmlFor="assigned_to">Primary Assigned Counselor</Label>
                <Select
                  value={formData.assigned_to}
                  onValueChange={handleAssignmentChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assigned counselor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {assignableUsers.map((user) => (
                      <SelectItem key={user.email} value={user.email}>
                        {user.name} ({user.current_lead_count} leads)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowMultiAssignment(!showMultiAssignment)}
                  className="w-full"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {showMultiAssignment ? "Hide" : "Add"} Co-Assignees
                </Button>
              </div>
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
                          if (value && !selectedCoAssignees.includes(value)) {
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
                        onChange={(e) => setMultiAssignReason(e.target.value)}
                        placeholder="Assignment reason"
                      />
                    </div>
                  </div>

                  {errors.multiAssign && (
                    <Alert variant="destructive">
                      <AlertDescription>{errors.multiAssign}</AlertDescription>
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
          </div>

          <Separator />

          {/* Tags Section */}
          <div className="space-y-4">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="flex items-center gap-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:bg-red-500 hover:text-white rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), handleAddTag())
                }
                placeholder="Add a custom tag"
                className="flex-1"
              />
              <Button
                type="button"
                onClick={handleAddTag}
                disabled={!newTag.trim()}
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Quick tags:</p>
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
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Add notes about this lead..."
              rows={3}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update Lead"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditLeadModal;
