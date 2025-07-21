// src/components/leads/BulkUploadModal.tsx
import React, { useState, useCallback, useRef } from "react";
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  FileText,
  Download,
  Users,
  AlertCircle,
  CheckCircle,
  XCircle,
  User,
  Loader2,
} from "lucide-react";
import {
  useBulkCreateLeadsFlatMutation,
  useGetAssignableUsersWithDetailsQuery,
} from "@/redux/slices/leadsApi";
import { useGetCategoriesQuery } from "@/redux/slices/categoriesApi";
import { useGetStagesQuery } from "@/redux/slices/stagesApi";
import { useGetStatusesQuery } from "@/redux/slices/statusesApi"; // Add this import
import MultiSelect, {
  transformUsersToOptions,
} from "@/components/common/MultiSelect";
import { useNotifications } from "../common/NotificationSystem";
import { ApiError } from "next/dist/server/api-utils";
import { SOURCE_OPTIONS } from "@/constants/sourceConfig";

// Interface for the flat bulk lead data structure as required by backend
interface FlatBulkLeadData {
  name: string;
  email: string;
  contact_number: string;
  source: string;
  category: string;
  age?: number;
  experience?: string;
  nationality?: string;
  country_of_interest?: string;
  course_level?: string;
  stage: string;
  status: string;
  lead_score?: number;
  tags?: string[];
  notes?: string;
}

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (result: any) => void;
}

interface ParsedLead {
  index: number;
  name: string;
  email: string;
  contact_number: string;
  source: string;
  category: string;
  stage: string;
  status: string; // Add status field
  lead_score: number;
  tags: string[];
  notes: string;
  age?: number;
  experience?: string;
  nationality?: string;
  country_of_interest?: string;
  course_level?: string;
  errors: string[];
  isValid: boolean;
}

const HEADER_MAPPING: Record<string, string> = {
  // Name mappings
  name: "name",
  "full name": "name",
  fullname: "name",
  "lead name": "name",
  "customer name": "name",
  "student name": "name",
  "CANDIDATE NAME": "name",
  Name: "name",
  // Email mappings
  email: "email",
  "email address": "email",
  "e-mail": "email",
  mail: "email",
  "email id": "email",
  "Mail ID": "email",
  "Mail id": "email",
  // Phone mappings
  contact_number: "contact_number",
  "contact number": "contact_number",
  phone: "contact_number",
  "phone number": "contact_number",
  mobile: "contact_number",
  "mobile number": "contact_number",
  telephone: "contact_number",
  tel: "contact_number",
  "PHONE NUMBER": "contact_number",
  "Phone Number": "contact_number",
  // Country mappings
  country_of_interest: "country_of_interest",
  "country of interest": "country_of_interest",
  "preferred country": "country_of_interest",
  "destination country": "country_of_interest",
  "target country": "country_of_interest",
  country: "country_of_interest",
  "Interested Country": "country_of_interest",
  // Course level mappings
  course_level: "course_level",
  "course level": "course_level",
  "education level": "course_level",
  "degree level": "course_level",
  "study level": "course_level",
  // Status mappings
  status: "status",
  "lead status": "status",
  "current status": "status",
  Status: "status",
  STATUS: "status",
  // Stage mappings
  stage: "stage",
  "lead stage": "stage",
  "current stage": "stage",
  lead_stage: "stage",
  lead_status: "stage",
  "opportunity stage": "stage",
  "sales stage": "stage",
  "pipeline stage": "stage",
  Stage: "stage",
  STAGE: "stage",
  // Experience mappings
  experience: "experience",
  "years of experience": "experience",
  "total experience": "experience",
  // Age mappings
  age: "age",
  Age: "age",
  "date of birth": "age",
  "Date of Birth": "age",
  // Nationality mappings
  nationality: "nationality",
  Nationality: "nationality",
  // Notes mappings
  notes: "notes",
  note: "notes",
  comment: "notes",
  comments: "notes",
  remarks: "remarks",
  description: "description",
  // Additional details
  "areas of interest": "notes",
  "other details": "notes",
};

const REQUIRED_COLUMNS = ["name", "email", "contact_number"];

const BulkUploadModal: React.FC<BulkUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedLeads, setParsedLeads] = useState<ParsedLead[]>([]);
  const [validLeads, setValidLeads] = useState<ParsedLead[]>([]);
  const [invalidLeads, setInvalidLeads] = useState<ParsedLead[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState<any>(null);

  // Form configuration
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSource, setSelectedSource] = useState("bulk_import");

  // Assignment configuration
  const [autoAssign, setAutoAssign] = useState(true);
  const [assignmentMethod, setAssignmentMethod] = useState<
    "all_users" | "selected_users"
  >("all_users");
  const [selectedCounselors, setSelectedCounselors] = useState<string[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // API hooks
  const { data: assignableUsersResponse } =
    useGetAssignableUsersWithDetailsQuery();
  const {
    data: categoriesResponse,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useGetCategoriesQuery({ include_inactive: false });

  // Add stages query
  const { data: stagesResponse, isLoading: stagesLoading } = useGetStagesQuery({
    active_only: true,
  });

  // Add statuses query
  const { data: statusesResponse, isLoading: statusesLoading } =
    useGetStatusesQuery({
      active_only: true,
    });

  const [bulkCreateLeads, { isLoading: isCreatingLeads }] =
    useBulkCreateLeadsFlatMutation();

  const assignableUsers = assignableUsersResponse?.users || [];
  const categories = categoriesResponse?.categories || [];
  const stages = stagesResponse?.stages || [];
  const statuses = statusesResponse?.statuses || [];
  const defaultStage =
    stages.find((stage) => stage.is_default)?.name ||
    stages[0]?.name ||
    "initial";
  const defaultStatus =
    statuses.find((status) => status.is_default)?.name ||
    statuses[0]?.name ||
    "demo";

  const { showSuccess, showError } = useNotifications();

  // Set default category when categories are loaded
  React.useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].name);
    }
  }, [categories, selectedCategory]);

  // Transform users to MultiSelect options
  const counselorOptions = transformUsersToOptions(
    assignableUsers.filter((user) => user.is_active)
  );

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && file.type === "text/csv") {
        setCsvFile(file);
        parseCSV(file);
      } else {
        setErrors({ file: "Please select a valid CSV file" });
      }
    },
    []
  );

  const normalizeHeader = (header: string): string => {
    const trimmed = header.trim();
    return (
      HEADER_MAPPING[trimmed] ||
      HEADER_MAPPING[trimmed.toLowerCase()] ||
      trimmed.toLowerCase().replace(/\s+/g, "_")
    );
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const csvData = e.target?.result as string;
        const lines = csvData.split("\n").filter((line) => line.trim() !== "");

        if (lines.length < 2) {
          setErrors({
            file: "CSV file must contain at least a header row and one data row",
          });
          return;
        }

        // Parse header row
        const rawHeaders = lines[0]
          .split(",")
          .map((h) => h.replace(/"/g, "").trim());
        const headers = rawHeaders.map(normalizeHeader);

        // Check for required columns
        const missingColumns = REQUIRED_COLUMNS.filter(
          (required) => !headers.includes(required)
        );
        if (missingColumns.length > 0) {
          setErrors({
            file: `Missing required columns: ${missingColumns.join(
              ", "
            )}. Required: ${REQUIRED_COLUMNS.join(", ")}`,
          });
          return;
        }

        // Parse data rows
        const leads: ParsedLead[] = [];
        const valid: ParsedLead[] = [];
        const invalid: ParsedLead[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i]
            .split(",")
            .map((v) => v.trim().replace(/"/g, ""));
          const errors: string[] = [];
          const notesData: string[] = []; // Collect additional info for notes

          // Create lead object with defaults assigned upfront
          const lead: ParsedLead = {
            index: i,
            name: "",
            email: "",
            contact_number: "",
            source: selectedSource,
            category: selectedCategory,
            stage: defaultStage, // Auto-assign default stage
            status: defaultStatus, // Auto-assign default status
            lead_score: 0,
            tags: [],
            notes: "",
            errors: [],
            isValid: false,
          };

          // Map CSV values to lead properties
          headers.forEach((key, index) => {
            const value = values[index]?.trim().replace(/"/g, "") || "";

            switch (key) {
              case "name":
                lead.name = value;
                if (!value) errors.push("Name is required");
                break;

              case "email":
                lead.email = value;
                if (!value) {
                  errors.push("Email is required");
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                  errors.push("Invalid email format");
                }
                break;

              case "contact_number":
                lead.contact_number = value;
                if (!value) errors.push("Contact number is required");
                break;

              case "age":
                if (
                  value &&
                  value.toLowerCase() !== "not defined" &&
                  value.toLowerCase() !== "undefined" &&
                  value.toLowerCase() !== "n/a"
                ) {
                  const age = parseInt(value);
                  if (!isNaN(age) && age > 0 && age <= 120) {
                    lead.age = age;
                  } else {
                    // Add to notes instead of marking as error
                    notesData.push(`Age: ${value}`);
                  }
                }
                // Don't add error for missing or invalid age
                break;

              case "date_of_birth":
                if (value && value.toLowerCase() !== "not defined") {
                  notesData.push(`Date of Birth: ${value}`);
                }
                break;

              case "experience":
                if (value) {
                  const normalizedExp = value.toLowerCase().trim();
                  const validExperience = [
                    "fresher",
                    "1_to_3_years",
                    "3_to_5_years",
                    "5_to_10_years",
                    "10+_years",
                  ];

                  // Try to map common experience formats
                  let mappedExp = normalizedExp;
                  if (
                    normalizedExp.includes("fresher") ||
                    normalizedExp.includes("fresh")
                  ) {
                    mappedExp = "fresher";
                  } else if (
                    normalizedExp.includes("1") &&
                    (normalizedExp.includes("2") || normalizedExp.includes("3"))
                  ) {
                    mappedExp = "1_to_3_years";
                  } else if (
                    normalizedExp.includes("3") &&
                    normalizedExp.includes("5")
                  ) {
                    mappedExp = "3_to_5_years";
                  } else if (
                    normalizedExp.includes("5") &&
                    normalizedExp.includes("10")
                  ) {
                    mappedExp = "5_to_10_years";
                  } else if (
                    normalizedExp.includes("10") ||
                    normalizedExp.includes("above") ||
                    normalizedExp.includes("more")
                  ) {
                    mappedExp = "10+_years";
                  }

                  if (validExperience.includes(mappedExp)) {
                    lead.experience = mappedExp;
                  } else {
                    // Add to notes instead of marking as error
                    notesData.push(`Experience: ${value}`);
                  }
                }
                break;

              case "specialty_experience":
                if (value) {
                  notesData.push(`Specialty Experience: ${value}`);
                }
                break;

              case "nationality":
                lead.nationality = value;
                break;

              case "country_of_interest":
                lead.country_of_interest = value;
                break;

              case "course_level":
                lead.course_level = value;
                break;

              case "notes":
                if (value) {
                  notesData.push(value);
                }
                break;

              // Additional fields that should go to notes
              case "status_indicator":
                if (value) {
                  notesData.push(`Status: ${value}`);
                }
                break;

              case "contact_status":
                if (value) {
                  notesData.push(`Contact Status: ${value}`);
                }
                break;

              case "last_update":
                if (value) {
                  notesData.push(`Last Updated: ${value}`);
                }
                break;

              case "updated_by":
                if (value) {
                  notesData.push(`Updated By: ${value}`);
                }
                break;

              case "serial_number":
                if (value) {
                  notesData.push(`Serial No: ${value}`);
                }
                break;

              case "tags":
                if (value) {
                  lead.tags = value
                    .split(";")
                    .map((tag) => tag.trim())
                    .filter((tag) => tag);
                }
                break;

              case "lead_score":
                if (value) {
                  const score = parseInt(value);
                  if (isNaN(score) || score < 0 || score > 100) {
                    errors.push("Invalid lead score (must be 0-100)");
                  } else {
                    lead.lead_score = score;
                  }
                }
                break;

              case "stage":
                // If stage is provided, validate it against available stages
                if (value) {
                  const stageExists = stages.some(
                    (stage) => stage.name.toLowerCase() === value.toLowerCase()
                  );
                  if (stageExists) {
                    // Find the exact stage name with correct casing
                    const foundStage = stages.find(
                      (stage) =>
                        stage.name.toLowerCase() === value.toLowerCase()
                    );
                    lead.stage = foundStage?.name || defaultStage;
                  } else {
                    // Don't mark as invalid, just use default stage
                    console.warn(
                      `Stage "${value}" not found, using default: ${defaultStage}`
                    );
                    lead.stage = defaultStage;
                  }
                }
                // If no value provided, defaultStage is already assigned
                break;

              case "status":
                // If status is provided, validate it against available statuses
                if (value) {
                  const statusExists = statuses.some(
                    (status) =>
                      status.name.toLowerCase() === value.toLowerCase()
                  );
                  if (statusExists) {
                    // Find the exact status name with correct casing
                    const foundStatus = statuses.find(
                      (status) =>
                        status.name.toLowerCase() === value.toLowerCase()
                    );
                    lead.status = foundStatus?.name || defaultStatus;
                  } else {
                    // Don't mark as invalid, just use default status
                    console.warn(
                      `Status "${value}" not found, using default: ${defaultStatus}`
                    );
                    lead.status = defaultStatus;
                  }
                }
                // If no value provided, defaultStatus is already assigned
                break;

              default:
                // Collect unmapped fields as additional notes
                if (value && value.trim() && key !== "") {
                  notesData.push(
                    `${rawHeaders[headers.indexOf(key)]}: ${value}`
                  );
                }
                break;
            }
          });

          // Combine all notes data
          if (notesData.length > 0) {
            lead.notes = notesData.join(" | ");
          }

          // Set validation status
          lead.errors = errors;
          lead.isValid = errors.length === 0;

          // Debug logging for invalid leads
          if (!lead.isValid) {
            console.log(`Lead ${i} is invalid:`, {
              name: lead.name,
              email: lead.email,
              contact_number: lead.contact_number,
              errors: errors,
            });
          }

          leads.push(lead);

          if (lead.isValid) {
            valid.push(lead);
          } else {
            invalid.push(lead);
          }
        }

        // Update state
        setParsedLeads(leads);
        setValidLeads(valid);
        setInvalidLeads(invalid);
        setErrors({}); // Clear any previous errors
      } catch (error) {
        console.error("Error parsing CSV:", error);
        setErrors({ file: "Error parsing CSV file. Please check the format." });
      }
    };

    reader.onerror = () => {
      setErrors({ file: "Error reading file" });
    };

    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (validLeads.length === 0) {
      setErrors({ upload: "No valid leads to upload" });
      return;
    }

    // Validate assignment configuration
    if (
      autoAssign &&
      assignmentMethod === "selected_users" &&
      selectedCounselors.length === 0
    ) {
      setErrors({
        upload:
          "Please select at least one counselor for assignment or disable auto-assignment",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Convert parsed leads to API format - Flat structure as required by backend
      const leadsToCreate: FlatBulkLeadData[] = validLeads.map((lead) => ({
        name: lead.name,
        email: lead.email,
        contact_number: lead.contact_number,
        source: selectedSource,
        category: selectedCategory,
        age: lead.age,
        experience: lead.experience,
        nationality: lead.nationality,
        country_of_interest: lead.country_of_interest,
        course_level: lead.course_level,
        stage: lead.stage, // Will use default stage or parsed stage
        status: defaultStatus, // Use default status from API
        lead_score: lead.lead_score || 0,
        tags: lead.tags || [],
        notes: lead.notes || "",
      }));

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      // Use the Redux mutation for flat data
      const result = await bulkCreateLeads({
        leads: leadsToCreate,
        force_create: false,
        assignment_method: autoAssign ? assignmentMethod : undefined,
        selected_user_emails:
          autoAssign && assignmentMethod === "selected_users"
            ? selectedCounselors.join(",")
            : undefined,
      }).unwrap();

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadResults(result);

      // Call success callback
      if (onSuccess) {
        setTimeout(() => {
          onSuccess({
            success: true,
            created_count:
              result?.summary?.successful_creates || validLeads.length,
            message: "Leads uploaded successfully",
          });
        }, 100);
      }
    } catch (error: any) {
      setUploadProgress(0);

      let errorMessage = "Failed to upload leads";
      if (error?.data?.detail) {
        if (Array.isArray(error.data.detail)) {
          errorMessage = error.data.detail.map((e: any) => e.msg).join(", ");
        } else if (typeof error.data.detail === "string") {
          errorMessage = error.data.detail;
        }
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      setErrors({ upload: errorMessage });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      "name",
      "email",
      "contact_number",
      "age",
      "experience",
      "nationality",
      "country_of_interest",
      "course_level",
      "notes",
      "tags",
      "lead_score",
      "stage",
      "status",
    ];

    const sampleData = [
      "John Doe",
      "john.doe@example.com",
      "+1234567890",
      "25",
      "3_to_5_years",
      "US",
      "Canada",
      "Bachelor",
      "Interested in nursing program",
      "urgent;qualified",
      "85",
      defaultStage, // Use the actual default stage
      defaultStatus, // Use the actual default status
    ];

    const csvContent = [headers.join(","), sampleData.join(",")].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "lead_upload_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const resetUpload = () => {
    setCsvFile(null);
    setParsedLeads([]);
    setValidLeads([]);
    setInvalidLeads([]);
    setUploadProgress(0);
    setUploadResults(null);
    setErrors({});
    setIsUploading(false);
    setAutoAssign(true);
    setAssignmentMethod("all_users");
    setSelectedCounselors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-6xl w-[95wh] max-h-[90vh] overflow-y-auto"
        style={{ maxHeight: "90vh", minWidth: "80%" }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Lead Upload
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Upload a CSV file to add multiple leads. Category and source will be
            applied to all leads. Stage and status will be auto-assigned if not
            provided in CSV.
          </p>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 h-[600px]">
          {/* Left Side - Configuration */}
          <div className="space-y-6">
            {/* Lead Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Lead Configuration</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Applied to all leads in this batch
                </p>
              </CardHeader>
              <CardContent className="space-y-4 flex gap-5">
                <div className="space-y-2">
                  <Label>Lead Category</Label>
                  {categoriesLoading ? (
                    <div className="flex items-center gap-2 p-2 border rounded">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Loading categories...</span>
                    </div>
                  ) : categoriesError ? (
                    <div className="p-2 border border-red-200 rounded bg-red-50">
                      <span className="text-sm text-red-600">
                        Error loading categories
                      </span>
                    </div>
                  ) : (
                    <Select
                      value={selectedCategory}
                      onValueChange={setSelectedCategory}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories
                          .filter((category) => category.is_active)
                          .map((category) => (
                            <SelectItem key={category.id} value={category.name}>
                              <div className="flex items-center gap-2">
                                <span>{category.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {category.short_form}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Source</Label>
                  <Select
                    value={selectedSource}
                    onValueChange={setSelectedSource}
                  >
                    <SelectTrigger>
                      <SelectValue />
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
              </CardContent>
            </Card>

            {/* Stage Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Auto-Assignment Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                    <span className="text-sm font-medium">Default Stage:</span>
                    <Badge variant="outline">{defaultStage}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                    <span className="text-sm font-medium">Default Status:</span>
                    <Badge variant="outline">{defaultStatus}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    If stage/status is not provided in CSV or is invalid, leads
                    will be automatically assigned these default values.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Assignment Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Assignment Configuration
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure how leads will be assigned to counselors
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Auto Assignment Toggle */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-assign leads</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically assign leads to counselors
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant={autoAssign ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAutoAssign(!autoAssign)}
                  >
                    {autoAssign ? "Enabled" : "Disabled"}
                  </Button>
                </div>

                {/* Assignment Method */}
                {autoAssign && (
                  <div className="space-y-3 pl-4 border-l-2 border-gray-200">
                    <div className="space-y-2">
                      <Label>Assignment Method</Label>
                      <Select
                        value={assignmentMethod}
                        onValueChange={(value) =>
                          setAssignmentMethod(
                            value as "all_users" | "selected_users"
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all_users">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              All Active Counselors
                            </div>
                          </SelectItem>
                          <SelectItem value="selected_users">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Selected Counselors Only
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Counselor Selection */}
                    {assignmentMethod === "selected_users" && (
                      <div className="space-y-2">
                        <Label>Select Counselors</Label>
                        <MultiSelect
                          options={counselorOptions}
                          value={selectedCounselors}
                          onChange={setSelectedCounselors}
                          placeholder="Select counselors..."
                          searchPlaceholder="Search counselors..."
                          emptyMessage="No counselors found."
                          showCheckbox={true}
                          error={errors.counselorSelection}
                        />

                        {/* Assignment Preview */}
                        {selectedCounselors.length > 0 && (
                          <div className="text-xs text-muted-foreground p-2 bg-blue-50 rounded">
                            Leads will be distributed among{" "}
                            {selectedCounselors.length} selected counselors
                            using round-robin
                          </div>
                        )}
                      </div>
                    )}

                    {/* Assignment Preview for All Users */}
                    {assignmentMethod === "all_users" && (
                      <div className="text-xs text-muted-foreground p-2 bg-blue-50 rounded">
                        Leads will be distributed among all{" "}
                        {assignableUsers.filter((u) => u.is_active).length}{" "}
                        active counselors using round-robin
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Template Download */}
            <Card>
              <CardContent className="p-4">
                <Button
                  onClick={downloadTemplate}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download CSV Template
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Download a sample CSV file with the correct format
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - File Upload & Preview */}
          <div className="space-y-4">
            {/* File Upload */}
            <Card className="flex-1">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="text-center">
                    <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      Upload CSV File
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Drag and drop your CSV file here, or click to browse
                    </p>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="w-full mb-4"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Choose File
                    </Button>

                    {csvFile && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-center gap-2">
                          <FileText className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            {csvFile.name}
                          </span>
                          <Badge variant="outline" className="text-green-700">
                            {(csvFile.size / 1024).toFixed(1)} KB
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                  {errors.file && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{errors.file}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Preview Section */}
            <div className="space-y-4 border rounded-lg p-4 h-full flex flex-col">
              <div>
                <h3 className="text-lg font-semibold">
                  Preview ({parsedLeads.length} leads)
                </h3>
                {parsedLeads.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                    <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">
                      No leads uploaded yet
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Upload a CSV file to see the preview
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Review your leads before uploading. Stage and status
                    auto-assigned where needed.
                  </p>
                )}
              </div>

              {parsedLeads.length > 0 && (
                <>
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg border">
                      <div className="text-2xl font-bold text-green-600">
                        {validLeads.length}
                      </div>
                      <div className="text-sm text-green-800">Valid</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg border">
                      <div className="text-2xl font-bold text-red-600">
                        {invalidLeads.length}
                      </div>
                      <div className="text-sm text-red-800">Invalid</div>
                    </div>
                  </div>

                  {/* Preview Table */}
                  <div className="flex-1 border rounded-lg overflow-hidden">
                    <div className="h-full overflow-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-background">
                          <TableRow>
                            <TableHead className="w-8">#</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Stage</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Validity</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {parsedLeads.map((lead) => (
                            <TableRow
                              key={lead.index}
                              className={!lead.isValid ? "bg-red-50" : ""}
                            >
                              <TableCell className="text-xs">
                                {lead.index}
                              </TableCell>
                              <TableCell className="font-medium text-sm">
                                {lead.name}
                              </TableCell>
                              <TableCell className="text-sm">
                                {lead.email}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {lead.stage}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {lead.isValid ? (
                                  <Badge
                                    variant="outline"
                                    className="text-green-700 border-green-300"
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Valid
                                  </Badge>
                                ) : (
                                  <div className="space-y-1">
                                    <Badge variant="destructive">
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Invalid
                                    </Badge>
                                    {lead.errors.length > 0 && (
                                      <div className="text-xs text-red-600">
                                        {lead.errors
                                          .slice(0, 2)
                                          .map((error, idx) => (
                                            <div key={idx}>• {error}</div>
                                          ))}
                                        {lead.errors.length > 2 && (
                                          <div>
                                            • +{lead.errors.length - 2} more
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Upload Progress */}
                  {isUploading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Uploading leads...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} />
                    </div>
                  )}

                  {/* Upload Button */}
                  <Button
                    onClick={handleUpload}
                    disabled={
                      validLeads.length === 0 ||
                      isUploading ||
                      !selectedCategory ||
                      stagesLoading ||
                      statusesLoading
                    }
                    className="w-full"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading {validLeads.length} leads...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload {validLeads.length} Valid Leads
                      </>
                    )}
                  </Button>

                  {errors.upload && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{errors.upload}</AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Upload Results - Show on successful upload */}
        {uploadResults && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-green-800">
                Upload Successful!
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Successfully created:</span>{" "}
                {uploadResults.created_count || validLeads.length} leads
              </div>
              <div>
                <span className="font-medium">Assignment method:</span>{" "}
                {autoAssign ? assignmentMethod : "Manual assignment"}
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={resetUpload} variant="outline" size="sm">
                Upload More
              </Button>
              <Button onClick={onClose} size="sm">
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BulkUploadModal;
