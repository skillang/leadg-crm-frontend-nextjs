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
} from "lucide-react";
import {
  BulkLeadData,
  useBulkCreateLeadsMutation,
  useGetAssignableUsersWithDetailsQuery,
} from "@/redux/slices/leadsApi";
import MultiSelect, {
  transformUsersToOptions,
} from "@/components/common/MultiSelect";
import { useNotifications } from "../common/NotificationSystem";

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

const LEAD_CATEGORIES = [
  "Nursing (NS)",
  "Sales Associate (SA)",
  "Web Analysis (WA)",
];

const LEAD_SOURCES = [
  "Bulk Upload",
  "Website",
  "Referral",
  "Social Media",
  "Email Campaign",
  "Cold Call",
  "Trade Show",
];

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
  const [selectedCategory, setSelectedCategory] = useState("Nursing (NS)");
  const [selectedSource, setSelectedSource] = useState("Bulk Upload");

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
  const [bulkCreateLeads] = useBulkCreateLeadsMutation();

  const assignableUsers = assignableUsersResponse?.users || [];

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

  // Replace this comment: // ... [Keep existing parseCSV implementation] ...
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
        const headers = lines[0]
          .split(",")
          .map((h) => h.trim().toLowerCase().replace(/"/g, ""));

        // Check for required columns
        const missingColumns = REQUIRED_COLUMNS.filter(
          (col) => !headers.includes(col)
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

          // Create lead object
          const lead: ParsedLead = {
            index: i,
            name: "",
            email: "",
            contact_number: "",
            source: selectedSource,
            category: selectedCategory,
            stage: "",
            lead_score: 0,
            tags: [],
            notes: "",
            errors: [],
            isValid: false,
          };

          // Map CSV values to lead properties
          headers.forEach((header, index) => {
            const value = values[index] || "";

            switch (header) {
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
                if (value) {
                  const age = parseInt(value);
                  if (isNaN(age) || age < 0 || age > 120) {
                    errors.push("Invalid age");
                  } else {
                    lead.age = age;
                  }
                }
                break;
              case "experience":
                lead.experience = value;
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
                lead.notes = value;
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
                if (value) {
                  const validStages = [
                    "New",
                    "Contacted",
                    "Qualified",
                    "Proposal",
                    "Negotiation",
                    "Closed Won",
                    "Closed Lost",
                  ];
                  if (validStages.includes(value)) {
                    lead.stage = value;
                  } else {
                    errors.push(
                      `Invalid stage. Valid options: ${validStages.join(", ")}`
                    );
                  }
                }
                break;
              default:
                // Ignore unknown columns
                break;
            }
          });

          // Set validation status
          lead.errors = errors;
          lead.isValid = errors.length === 0;

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

  // Replace this comment: // ... [Keep existing downloadTemplate implementation] ...
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
    ];

    const sampleData = [
      "John Doe",
      "john.doe@example.com",
      "+1234567890",
      "25",
      "2 years",
      "US",
      "Canada",
      "Bachelor",
      "Interested in nursing program",
      "urgent;qualified",
      "85",
      "New",
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

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

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
      // Convert parsed leads to API format
      const leadsToCreate: BulkLeadData[] = validLeads.map((lead) => ({
        basic_info: {
          name: lead.name,
          email: lead.email,
          contact_number: lead.contact_number,
          source: selectedSource,
          category: selectedCategory,
          age: lead.age,
          experience: lead.experience,
          nationality: lead.nationality,
        },
        status_and_tags: {
          stage: lead.stage,
          lead_score: lead.lead_score,
          tags: lead.tags,
        },
        additional_info: {
          notes: lead.notes,
        },
      }));

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

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

      if (onSuccess) {
        onSuccess(result);
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
      }
      setErrors({ upload: errorMessage });
    } finally {
      setIsUploading(false);
    }
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

  // ... [Keep the upload results display logic] ...

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
            applied to all leads.
          </p>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 h-[600px]">
          {/* Left Side - Configuration */}
          <div className="space-y-6">
            {/* Lead Configuration - Keep existing */}
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
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      {LEAD_SOURCES.map((source) => (
                        <SelectItem key={source} value={source}>
                          {source}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Assignment Configuration - UPDATED */}
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

                    {/* UPDATED: Use MultiSelect for Counselor Selection */}
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
          </div>

          {/* Right Side - Preview */}
          <div className="space-y-4">
            {/* File Upload */}
            <Card className="flex-1">
              <CardContent className="p">
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
            <div className="space-y-4 border-1 rounded-lg p-4 h-full flex flex-col">
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
                    Upload a CSV file to see the preview
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
                            <TableHead>Status</TableHead>
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
                                {lead.isValid ? (
                                  <Badge
                                    variant="outline"
                                    className="text-green-700 border-green-300"
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Valid
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Invalid
                                  </Badge>
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
                    disabled={validLeads.length === 0 || isUploading}
                    className="w-full"
                  >
                    {isUploading ? (
                      <>Uploading {validLeads.length} leads...</>
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
      </DialogContent>
    </Dialog>
  );
};

export default BulkUploadModal;
function setDragActive(arg0: boolean) {
  throw new Error("Function not implemented.");
}

function showError(arg0: string, arg1: string) {
  throw new Error("Function not implemented.");
}
