// src/components/leads/BulkLeadCreation.tsx - UPDATED WITH STAGE EXTRACTION

"use client";

import React, { useState, useRef, useCallback } from "react";
import Papa from "papaparse";
import type { ParseResult } from "papaparse";
import { Upload, Users, AlertCircle, X, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { useAuth } from "@/redux/hooks/useAuth";
import { useBulkCreateLeadsMutation } from "@/redux/slices/leadsApi";
import { useGetCategoriesQuery } from "@/redux/slices/categoriesApi";
import { useNotifications } from "@/components/common/NotificationSystem";
import { BulkLeadData } from "@/models/types/lead";
import { SOURCE_OPTIONS } from "@/constants/sourceConfig";

// ✅ FIXED: Proper type for CSV row data
interface CsvRowData {
  [key: string]: string | number | boolean | null | undefined;
}

// ✅ FIXED: Proper type for normalized row data
interface NormalizedRowData {
  name?: string | number;
  email?: string | number;
  contact_number?: string | number;
  country_of_interest?: string | number;
  course_level?: string | number;
  stage?: string | number; // ✅ NEW: Added stage field
  notes?: string | number;
  [key: string]: string | number | boolean | null | undefined;
}

// ✅ FIXED: Proper error type
interface ApiError {
  message?: string;
  data?: {
    detail?: string | { msg: string }[];
  };
}

// Local interface for component state (flat structure for easier form handling)
interface LocalBulkLeadData {
  name: string;
  email: string;
  contact_number: string;
  source: string;
  category: string; // ✅ ADDED: Category field
  country_of_interest?: string;
  course_level?: string;
  notes?: string;
  lead_score?: number;
  stage?: string; // ✅ NEW: Added stage field
  tags?: string[];
}

interface BulkLeadCreationProps {
  isOpen: boolean;
  onClose: () => void;
}

// ✅ NEW: Valid stage values from the API
const VALID_STAGES = [
  "Initial",
  "Followup",
  "Warm",
  "Prospect",
  "Junk",
  "Enrolled",
  "Yet to call",
  "Counseled",
  "DNP",
  "INVALID",
  "Call Back",
  "Busy",
  "NI",
  "Ringing",
  "Wrong Number",
];

// ✅ NEW: Stage mapping for common variations
const STAGE_MAPPING: Record<string, string> = {
  // Direct mappings (case-insensitive)
  initial: "Initial",
  followup: "Followup",
  "follow up": "Followup",
  "follow-up": "Followup",
  warm: "Warm",
  prospect: "Prospect",
  junk: "Junk",
  enrolled: "Enrolled",
  "yet to call": "Yet to call",
  yettocall: "Yet to call",
  counseled: "Counseled",
  counselled: "Counseled",
  dnp: "DNP",
  invalid: "INVALID",
  "call back": "Call Back",
  callback: "Call Back",
  "call-back": "Call Back",
  busy: "Busy",
  ni: "NI",
  "no interest": "NI",
  "not interested": "NI",
  ringing: "Ringing",
  "wrong number": "Wrong Number",
  wrongnumber: "Wrong Number",
  wrong_number: "Wrong Number",

  // Common alternative names
  new: "Initial",
  fresh: "Initial",
  lead: "Initial",
  open: "Initial",
  contacted: "Followup",
  interested: "Warm",
  hot: "Prospect",
  qualified: "Prospect",
  converted: "Enrolled",
  closed: "Enrolled",
  spam: "Junk",
  duplicate: "Junk",
  dead: "INVALID",
  lost: "INVALID",
};

// Enhanced header mapping
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
  "Which country are you interested in studying abroad?": "country_of_interest",

  // Course level mappings
  course_level: "course_level",
  "course level": "course_level",
  "education level": "course_level",
  "degree level": "course_level",
  "study level": "course_level",

  // ✅ NEW: Stage mappings
  stage: "stage",
  "lead stage": "stage",
  "lead status": "stage",
  status: "stage",
  "current stage": "stage",
  "current status": "stage",
  lead_stage: "stage",
  lead_status: "stage",
  "opportunity stage": "stage",
  "sales stage": "stage",
  "pipeline stage": "stage",
  Stage: "stage",
  Status: "stage",
  STAGE: "stage",
  STATUS: "stage",

  // Notes mappings
  notes: "notes",
  note: "notes",
  comment: "notes",
  comments: "notes",
  remarks: "notes",
  description: "notes",
};

const BulkLeadCreation: React.FC<BulkLeadCreationProps> = ({
  isOpen,
  onClose,
}) => {
  const { isAdmin } = useAuth();
  const { showSuccess, showError } = useNotifications();

  // ✅ FIXED: Added category state
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSource, setSelectedSource] = useState("bulk upload");
  const [parsedLeads, setParsedLeads] = useState<LocalBulkLeadData[]>([]);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // RTK Query hooks
  const [bulkCreateLeads, { isLoading: isCreatingLeads }] =
    useBulkCreateLeadsMutation();

  // ✅ FIXED: Fetch categories from API
  const {
    data: categoriesData,
    isLoading: isCategoriesLoading,
    error: categoriesError,
  } = useGetCategoriesQuery({ include_inactive: false });

  // ✅ FIXED: Memoize category options to prevent infinite loop
  const categoryOptions = React.useMemo(
    () =>
      categoriesData?.categories?.map((category) => ({
        value: category.name,
        label: `${category.name} (${category.short_form})`,
      })) || [],
    [categoriesData?.categories]
  );

  // Reset form when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setSelectedCategory("");
      setSelectedSource("bulk upload");
      setParsedLeads([]);
      setIsProcessingFile(false);
      setDragActive(false);
    }
  }, [isOpen]);

  // ✅ FIXED: Separate effect for auto-selecting category
  React.useEffect(() => {
    if (isOpen && categoryOptions.length > 0 && !selectedCategory) {
      setSelectedCategory(categoryOptions[0].value);
    }
  }, [isOpen, categoryOptions, selectedCategory]);

  const normalizeHeader = (header: string): string => {
    const trimmed = header.trim();
    return (
      HEADER_MAPPING[trimmed] ||
      HEADER_MAPPING[trimmed.toLowerCase()] ||
      trimmed.toLowerCase().replace(/\s+/g, "_")
    );
  };

  // ✅ FIXED: Helper function to validate and sanitize email
  const sanitizeEmail = (
    rawEmail: string | number | null | undefined
  ): string => {
    // Convert to string and handle various invalid values
    const emailStr = String(rawEmail || "").trim();

    // List of invalid values that should be converted to fallback email
    const invalidValues = [
      "",
      "not clearly visible",
      "nan",
      "null",
      "undefined",
      "n/a",
      "na",
      "not available",
      "no email",
      "-",
      ".",
    ];

    const lowerEmail = emailStr.toLowerCase();

    // Check if email is invalid or matches invalid patterns
    if (
      invalidValues.includes(lowerEmail) ||
      emailStr.length === 0 ||
      emailStr === "0" ||
      !emailStr.includes("@") ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)
    ) {
      console.log(
        `📧 Converting invalid email "${emailStr}" to "not-available@example.com"`
      );
      return "not-available@example.com";
    }

    console.log(`📧 Valid email found: "${emailStr}"`);
    return emailStr;
  };

  // ✅ NEW: Helper function to validate and sanitize phone number
  const sanitizePhone = (
    rawPhone: string | number | null | undefined
  ): string => {
    // Convert to string and handle various invalid values
    const phoneStr = String(rawPhone || "")
      .replace(/\.0$/, "") // Remove .0 from float numbers
      .replace(/[^\d\+\-\(\)\s]/g, "") // Keep only valid phone characters
      .trim();

    // List of invalid values that should be converted to fallback phone
    const invalidValues = [
      "",
      "not clearly visible",
      "nan",
      "null",
      "undefined",
      "n/a",
      "na",
      "not available",
      "no phone",
      "-",
      ".",
    ];

    const lowerPhone = phoneStr.toLowerCase();

    // Check if phone is invalid or matches invalid patterns
    if (
      invalidValues.includes(lowerPhone) ||
      phoneStr.length === 0 ||
      phoneStr === "0" ||
      !/[\d]/.test(phoneStr) // Must contain at least one digit
    ) {
      console.log(`📞 Converting invalid phone "${phoneStr}" to "1000000000"`);
      return "1000000000";
    }

    console.log(`📞 Valid phone found: "${phoneStr}"`);
    return phoneStr;
  };

  // ✅ NEW: Helper function to validate and normalize stage
  const normalizeStage = (
    rawStage: string | number | null | undefined
  ): string => {
    // Convert to string and handle various invalid values
    const stageStr = String(rawStage || "").trim();

    // If empty or invalid, return default
    if (!stageStr || stageStr.length === 0) {
      console.log(`🎯 Empty stage, defaulting to "Initial"`);
      return "Initial";
    }

    // Check if already a valid stage (case-sensitive)
    if (VALID_STAGES.includes(stageStr)) {
      console.log(`🎯 Valid stage found: "${stageStr}"`);
      return stageStr;
    }

    // Try to map using case-insensitive mapping
    const lowerStage = stageStr.toLowerCase();
    const mappedStage = STAGE_MAPPING[lowerStage];

    if (mappedStage) {
      console.log(`🎯 Mapped stage "${stageStr}" → "${mappedStage}"`);
      return mappedStage;
    }

    // If no mapping found, default to Initial
    console.log(`🎯 Unknown stage "${stageStr}", defaulting to "Initial"`);
    return "Initial";
  };

  // ✅ FIXED: Proper typing for generateNotesFromRow
  const generateNotesFromRow = (row: CsvRowData): string => {
    const notesLines: string[] = [];

    // ✅ UPDATED: Fields specific to user's CSV format
    const fields: Array<{ key: string; label: string }> = [
      { key: "DATE OF BIRTH", label: "Date of Birth" },
      { key: "AGE", label: "Age" },
      { key: "EXPERIENCE", label: "Experience" },
      { key: "SPECIALITY EXPERIENCE", label: "Speciality Experience" },
      { key: "QUALIFICATION", label: "Qualification" },
      {
        key: "Areas of interest and other details",
        label: "Areas of Interest",
      },
      { key: "NATIONALITY", label: "Nationality" },
      { key: "CURRENT LOCATION", label: "Current Location" },
      // Legacy fields for other CSV formats
      {
        key: "What is your current qualification?",
        label: "Current Qualification",
      },
      { key: "Years of experience ?", label: "Years of Experience" },
      { key: "German language status?", label: "German Language Status" },
      { key: "Planning to start?", label: "Planning to Start" },
      { key: "Current Status", label: "Current Status" },
      { key: "Program", label: "Program" },
      {
        key: "When do you plan to start your studies abroad?",
        label: "Study Start Date",
      },
      {
        key: "What level of study are you planning to pursue?",
        label: "Study Level",
      },
      { key: "Which intake are you planning to join?", label: "Intake" },
    ];

    fields.forEach(({ key, label }) => {
      const value = row[key];
      if (
        value &&
        value.toString().trim() &&
        value.toString().trim() !== "Not clearly visible" &&
        value.toString().trim() !== "nan"
      ) {
        notesLines.push(`${label}: ${value.toString().trim()}`);
      }
    });

    return notesLines.join("\n");
  };

  const parseCsvFile = useCallback(
    (file: File) => {
      if (!selectedCategory) {
        showError(
          "Category Required",
          "Please select a category before parsing the file"
        );
        return;
      }

      setIsProcessingFile(true);

      // ✅ FIXED: Proper typing for Papa Parse
      Papa.parse<CsvRowData>(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        delimitersToGuess: [",", "\t", "|", ";"],
        complete: (results: ParseResult<CsvRowData>) => {
          try {
            console.log("📄 Raw CSV parsing results:", results);
            console.log(
              "📊 Sample row data types:",
              results.data.length > 0
                ? Object.keys(results.data[0] as CsvRowData).map(
                    (key) =>
                      `${key}: ${typeof (results.data[0] as CsvRowData)[
                        key
                      ]} = "${(results.data[0] as CsvRowData)[key]}"`
                  )
                : "No data"
            );
            console.log("📋 CSV Headers detected:", results.meta.fields);

            if (results.errors.length > 0) {
              console.warn("⚠️ CSV parsing warnings:", results.errors);
            }

            const transformedLeads: LocalBulkLeadData[] = results.data
              .map((row: CsvRowData, index: number) => {
                try {
                  // ✅ FIXED: Normalize headers and extract values with proper typing
                  const normalizedRow: NormalizedRowData = {};
                  Object.keys(row).forEach((key) => {
                    const normalizedKey = normalizeHeader(key);
                    normalizedRow[normalizedKey] = row[key];
                  });

                  // Generate comprehensive notes from all unmapped fields
                  const notes = generateNotesFromRow(row);

                  // ✅ UPDATED: Create lead with category, stage extraction, and proper email/phone handling
                  const lead: LocalBulkLeadData = {
                    name: String(normalizedRow.name || "").trim(),
                    email: sanitizeEmail(normalizedRow.email), // ✅ NEW: Use sanitizeEmail function
                    contact_number: sanitizePhone(normalizedRow.contact_number), // ✅ NEW: Use sanitizePhone function
                    source: selectedSource || "bulk upload",
                    category: selectedCategory || "General", // ✅ ADDED: Use selected category with fallback
                    country_of_interest: String(
                      normalizedRow.country_of_interest || ""
                    ).trim(),
                    course_level: String(
                      normalizedRow.course_level || ""
                    ).trim(),
                    notes: notes || String(normalizedRow.notes || "").trim(),
                    lead_score: 50, // Default score
                    stage: normalizeStage(normalizedRow.stage), // ✅ NEW: Extract and normalize stage
                    tags: [], // Default empty tags
                  };

                  console.log(`📝 Processed lead ${index}:`, {
                    name: lead.name,
                    contact: lead.contact_number,
                    email: lead.email,
                    category: lead.category,
                    stage: lead.stage, // ✅ NEW: Log stage
                  });

                  return lead;
                } catch (error) {
                  console.error(`❌ Error processing row ${index}:`, error);
                  return null;
                }
              })
              .filter((lead): lead is LocalBulkLeadData => {
                // ✅ IMPROVED: Simplified validation - email and phone are now always valid with fallbacks
                const hasValidName = lead !== null && lead.name.length > 0;
                // ✅ NOTE: No need to validate email/phone since sanitization ensures they're always valid

                if (!hasValidName) {
                  console.warn(`❌ Skipping - Invalid name "${lead!.name}"`);
                  return false;
                }

                console.log(
                  `✅ Valid lead - ${lead.name} (${lead.contact_number}) - Email: ${lead.email} - Stage: ${lead.stage}`
                );
                return true;
              });

            console.log(
              `✅ Successfully parsed ${transformedLeads.length} valid leads`
            );
            setParsedLeads(transformedLeads);
          } catch (error) {
            // ✅ FIXED: Proper error typing
            const typedError = error as Error;
            console.error("❌ Error in CSV processing:", typedError);
            showError("Parse Error", "Failed to process CSV file");
          } finally {
            setIsProcessingFile(false);
          }
        },
      });
    },
    [selectedSource, selectedCategory, showError]
  );

  const handleFileUpload = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      if (!selectedCategory) {
        showError(
          "Category Required",
          "Please select a category before uploading the file"
        );
        return;
      }

      const file = files[0];
      if (!file.name.toLowerCase().endsWith(".csv")) {
        showError("Invalid File", "Please upload a CSV file");
        return;
      }

      parseCsvFile(file);
    },
    [parseCsvFile, selectedCategory, showError]
  );

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      handleFileUpload(e.dataTransfer.files);
    },
    [handleFileUpload]
  );

  const handleBulkCreate = async () => {
    if (parsedLeads.length === 0) {
      showError("No Data", "No leads to create");
      return;
    }

    if (!selectedCategory) {
      showError("Category Required", "Please select a category");
      return;
    }

    try {
      console.log("🚀 Starting bulk lead creation...");
      console.log(`📊 Total leads to create: ${parsedLeads.length}`);
      console.log(`📂 Selected category: ${selectedCategory}`);
      console.log(`📋 Selected source: ${selectedSource}`);

      // ✅ UPDATED: Transform to API format with category and stage
      const bulkLeadData: BulkLeadData[] = parsedLeads.map((lead) => ({
        basic_info: {
          name: lead.name,
          email: lead.email, // ✅ Now guaranteed to be valid email or "not-available@example.com"
          contact_number: lead.contact_number,
          source: lead.source,
          category: lead.category, // ✅ IMPORTANT: Include category
        },
        status_and_tags: {
          stage: lead.stage || "Initial", // ✅ NEW: Include extracted stage with fallback
          lead_score: lead.lead_score || 50,
          tags: lead.tags || [],
        },
        additional_info: {
          notes: lead.notes || "",
        },
      }));

      console.log(
        "📦 API Payload sample:",
        JSON.stringify(bulkLeadData[0], null, 2)
      );

      const result = await bulkCreateLeads({
        leads: bulkLeadData,
        force_create: false,
      }).unwrap();

      console.log("✅ Bulk create result:", result);

      if (result.success) {
        showSuccess(
          "Bulk Upload Complete",
          `Successfully created ${result.summary.successful_creates} leads. ` +
            `${result.summary.duplicates_skipped} duplicates skipped. ` +
            `${result.summary.failed_creates} failed.`
        );

        // Log successful lead IDs
        const successfulResults = result.results.filter(
          (r) => r.status === "created"
        );
        console.log(
          "🆔 Created lead IDs:",
          successfulResults.map((r) => r.lead_id)
        );

        onClose();
      } else {
        showError("Upload Failed", result.message);
      }
    } catch (error) {
      // ✅ FIXED: Proper error typing
      const typedError = error as ApiError;
      console.error("❌ Bulk create failed:", typedError);
      const errorMessage =
        typedError?.data?.detail ||
        typedError?.message ||
        "Failed to create leads";
      showError("Upload Failed", String(errorMessage));
    }
  };

  const downloadTemplate = () => {
    const csvContent = `name,email,contact_number,country_of_interest,course_level,stage,notes
John Doe,john@example.com,+1234567890,Canada,Masters,Initial,Interested in engineering programs
Jane Smith,,9876543210,UK,Bachelors,Warm,Looking for business programs
Mike Johnson,mike@email.com,,Australia,PhD,Prospect,Research focused student`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "bulk_leads_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const removeLead = (index: number) => {
    setParsedLeads((prev) => prev.filter((_, i) => i !== index));
  };

  // Don't render for non-admin users
  if (!isAdmin) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Access Denied
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-gray-600">
              Only administrators can perform bulk lead uploads.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-7xl"
        style={{ maxHeight: "90vh", minWidth: "80%" }}
      >
        <DialogHeader>
          <DialogTitle className="flex gap-2 items-center">
            <Users className="w-5 h-5" />
            Bulk Lead Upload
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file to add multiple leads. The system automatically
            detects standard columns (name, email, phone, etc.) and stores
            unmapped columns as "Extra Info" in lead notes. Missing data gets
            intelligent fallbacks.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Configuration & Upload */}
          <div className="space-y-4">
            {/* Category and Source Selection */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-4">
              <div>
                <h3 className="font-semibold text-blue-900">
                  Lead Configuration
                </h3>
                <p className="text-sm text-blue-700">
                  Applied to all leads in this batch
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-blue-900">
                    Lead Category
                  </Label>
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                    disabled={isCategoriesLoading}
                  >
                    <SelectTrigger
                      className={!selectedCategory ? "border-red-300" : ""}
                    >
                      <SelectValue
                        placeholder={
                          isCategoriesLoading
                            ? "Loading categories..."
                            : "Select lead category"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!selectedCategory && (
                    <p className="text-xs text-red-500">Category is required</p>
                  )}
                  {categoriesError && (
                    <p className="text-xs text-red-500">
                      Failed to load categories
                    </p>
                  )}
                </div>

                {/* Source Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-blue-900">
                    Source
                  </Label>
                  <Select
                    value={selectedSource}
                    onValueChange={setSelectedSource}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
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
              </div>
            </div>

            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed p-8 rounded-lg text-center transition-colors ${
                dragActive
                  ? "border-blue-400 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {isProcessingFile ? (
                <div className="flex flex-col items-center space-y-2">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <p className="text-sm text-gray-600">
                    Processing CSV file...
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="w-16 h-16 mx-auto text-gray-400" />
                  <div>
                    <p className="text-lg font-medium">Upload CSV File</p>
                    <p className="text-sm text-gray-500">
                      Drag and drop your CSV file here, or click to browse
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!selectedCategory}
                    className="px-6"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Preview & Guidelines */}
          <div className="space-y-4">
            {/* Tab-like Header */}
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                {parsedLeads.length > 0
                  ? `Preview (${parsedLeads.length} leads)`
                  : "CSV Guidelines & Preview"}
              </h3>
              {parsedLeads.length > 0 && (
                <Button
                  onClick={handleBulkCreate}
                  disabled={isCreatingLeads || !selectedCategory}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isCreatingLeads && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create {parsedLeads.length} Leads
                </Button>
              )}
            </div>

            {/* Content Area */}
            <div className="border rounded-lg max-h-96 overflow-y-auto">
              {parsedLeads.length === 0 ? (
                // Show CSV Guidelines when no leads
                <div className="p-4 space-y-4">
                  <div className="flex flex-row text-gray-500 mb-4">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <div>
                      <p className="font-medium">CSV Column Guidelines</p>
                      <p className="text-sm">
                        Upload a CSV file to see the preview
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    {/* Required Columns */}
                    <div className="bg-red-50 p-3 rounded border-l-4 border-red-200">
                      <p className="font-medium text-red-800 mb-1">
                        📋 Required Columns:
                      </p>
                      <p className="text-red-700">
                        • <strong>Name:</strong> name, full name, student name,
                        candidate name
                      </p>
                      <p>
                        • <strong>Email:</strong> email, email address, e-mail,
                        mail id
                      </p>
                      <p>
                        • <strong>Phone:</strong> phone, contact number, mobile,
                        telephone
                      </p>
                    </div>

                    {/* Optional Columns */}
                    <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-200">
                      <p className="font-medium text-blue-800 mb-1">
                        🔧 Auto-Detected Columns:
                      </p>
                      <div className="text-blue-700 space-y-1">
                        <p>
                          • <strong>Country:</strong> country of interest,
                          preferred country
                        </p>
                        <p>
                          • <strong>Course Level:</strong> course level,
                          education level
                        </p>
                        <p>
                          • <strong>Stage:</strong> stage, status, lead stage,
                          current status
                        </p>
                        <p>
                          • <strong>Notes:</strong> notes, comments, remarks,
                          description
                        </p>
                      </div>
                    </div>

                    {/* Stage Mapping */}
                    <div className="bg-green-50 p-3 rounded border-l-4 border-green-200">
                      <p className="font-medium text-green-800 mb-1">
                        🎯 Stage Auto-Mapping:
                      </p>
                      <div className="text-green-700 text-xs space-y-1">
                        <p>
                          • "new", "fresh" → Initial • "interested" → Warm •
                          "hot" → Prospect
                        </p>
                        <p>
                          • "follow up" → Followup • "converted" → Enrolled •
                          "no interest" → NI
                        </p>
                      </div>
                    </div>

                    {/* Extra Info */}
                    <div className="bg-purple-50 p-3 rounded border-l-4 border-purple-200">
                      <p className="font-medium text-purple-800 mb-1">
                        📝 Extra Information:
                      </p>
                      <div className="text-purple-700 space-y-1">
                        <p>• All unmapped columns → stored in lead notes</p>
                        <p>
                          • Examples: Age, Experience, Qualification,
                          Nationality
                        </p>
                        <p>• Format: "Field Name: Value" in notes section</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Show Lead Preview when leads are loaded
                <div className="space-y-2 p-4">
                  {parsedLeads.slice(0, 10).map((lead, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded border"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{lead.name}</div>
                        <div className="text-sm text-gray-600">
                          {lead.email} • {lead.contact_number}
                        </div>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {lead.category}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {lead.source}
                          </Badge>
                          <Badge
                            variant={
                              lead.stage === "Initial" ? "default" : "outline"
                            }
                            className="text-xs"
                          >
                            {lead.stage}
                          </Badge>
                          {lead.email === "not-available@example.com" && (
                            <Badge variant="destructive" className="text-xs">
                              No Email
                            </Badge>
                          )}
                          {lead.contact_number === "1000000000" && (
                            <Badge variant="destructive" className="text-xs">
                              No Phone
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLead(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {parsedLeads.length > 10 && (
                    <div className="text-center text-sm text-gray-500 py-2">
                      ... and {parsedLeads.length - 10} more leads
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkLeadCreation;
