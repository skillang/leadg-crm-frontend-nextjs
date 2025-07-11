// src/components/leads/BulkLeadCreation.tsx - FIXED VERSION

"use client";

import React, { useState, useRef, useCallback } from "react";
import Papa from "papaparse";
import {
  Upload,
  Download,
  Users,
  AlertCircle,
  X,
  FileText,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useAuth } from "@/redux/hooks/useAuth";
import { useBulkCreateLeadsMutation } from "@/redux/slices/leadsApi";
import { useGetCategoriesQuery } from "@/redux/slices/categoriesApi";
import { useNotifications } from "@/components/common/NotificationSystem";
import { BulkLeadData } from "@/models/types/lead";

// Local interface for component state (flat structure for easier form handling)
interface LocalBulkLeadData {
  name: string;
  email: string;
  contact_number: string;
  source: string;
  category: string;
  country_of_interest?: string;
  course_level?: string;
  notes?: string;
}

interface BulkLeadCreationProps {
  isOpen: boolean;
  onClose: () => void;
}

// Source options remain the same
const SOURCE_OPTIONS = [
  { value: "advertisement", label: "Advertisement" },
  { value: "bulk upload", label: "Bulk Upload" },
  { value: "cold_call", label: "Cold Call" },
  { value: "email_campaign", label: "Email Campaign" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "naukri", label: "Naukri" },
  { value: "reddit", label: "Reddit" },
  { value: "referral", label: "Referral" },
  { value: "social_media", label: "Social Media" },
  { value: "walk_in", label: "Walk In" },
  { value: "website", label: "Website" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "youtube", label: "YouTube" },
];

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
};

const BulkLeadCreation: React.FC<BulkLeadCreationProps> = ({
  isOpen,
  onClose,
}) => {
  const { isAdmin } = useAuth();
  const { showSuccess, showError } = useNotifications();

  // State variables - FIXED: Use LocalBulkLeadData for easier state management
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSource, setSelectedSource] = useState("");
  const [parsedLeads, setParsedLeads] = useState<LocalBulkLeadData[]>([]); // FIXED: Use flat structure
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // RTK Query hooks
  const [bulkCreateLeads] = useBulkCreateLeadsMutation();

  // Fetch categories from API
  const {
    data: categoriesData,
    isLoading: isCategoriesLoading,
    error: categoriesError,
  } = useGetCategoriesQuery({ include_inactive: false });

  // Get available categories for dropdown
  const categoryOptions =
    categoriesData?.categories?.map((category) => ({
      value: category.name,
      label: category.name,
    })) || [];

  const normalizeHeader = (header: string): string => {
    const trimmed = header.trim();
    return (
      HEADER_MAPPING[trimmed] ||
      HEADER_MAPPING[trimmed.toLowerCase()] ||
      trimmed.toLowerCase().replace(/\s+/g, "_")
    );
  };

  const generateNotesFromRow = (row: Record<string, any>): string => {
    const notesLines: string[] = [];
    const fields = [
      { key: "DATE OF BIRTH", label: "Date of Birth" },
      { key: "AGE", label: "Age" },
      { key: "EXPERIENCE-SPECIALITY", label: "Experience & Speciality" },
      { key: "EXPERIENCE", label: "Experience" },
      { key: "QUALIFICATION", label: "Qualification" },
      {
        key: "What is your current qualification?",
        label: "Current Qualification",
      },
      { key: "Years of experience ?", label: "Years of Experience" },
      { key: "German language status?", label: "German Language Status" },
      { key: "Planning to start?", label: "Planning to Start" },
      {
        key: "Areas of interest and other details",
        label: "Areas of Interest",
      },
      { key: "NATIONALITY", label: "Nationality" },
      { key: "CURRENT LOCATION", label: "Current Location" },
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
      {
        key: "Which intake are you planning to join?",
        label: "Intake Planning",
      },
    ];

    fields.forEach((field) => {
      if (row[field.key]) {
        notesLines.push(`• ${field.label}: ${row[field.key]}`);
      }
    });

    return notesLines.join("\n").trim();
  };

  const handleFileSelect = useCallback(
    (file: File) => {
      if (!file.name.toLowerCase().endsWith(".csv")) {
        showError("Please select a CSV file.", "Invalid File Type");
        return;
      }

      if (!selectedSource) {
        showError(
          "Please select a source before uploading the file.",
          "Source Required"
        );
        return;
      }

      if (!selectedCategory) {
        showError(
          "Please select a lead category before uploading the file.",
          "Category Required"
        );
        return;
      }

      setIsProcessingFile(true);

      try {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          transformHeader: normalizeHeader,
          complete: (results) => {
            try {
              const validLeads: LocalBulkLeadData[] = []; // FIXED: Use LocalBulkLeadData
              let skippedCount = 0;

              results.data.forEach((row: any, index) => {
                const name = row.name?.trim();
                const email = row.email?.trim();
                const contact_number = row.contact_number?.trim();

                if (name && (email || contact_number)) {
                  const notes = generateNotesFromRow(row);

                  // FIXED: Push flat structure instead of nested
                  validLeads.push({
                    name: name,
                    email: email || "",
                    contact_number: contact_number || "",
                    source: selectedSource,
                    category: selectedCategory,
                    country_of_interest: row.country_of_interest?.trim() || "",
                    course_level: row.course_level?.trim() || "",
                    notes: notes || "",
                  });
                } else {
                  skippedCount++;
                }
              });

              setParsedLeads(validLeads);

              if (validLeads.length > 0) {
                showSuccess(
                  `Processed ${validLeads.length} valid leads${
                    skippedCount > 0
                      ? `, skipped ${skippedCount} invalid rows`
                      : ""
                  }.`,
                  "File Processed"
                );
              } else {
                showError(
                  "No valid leads found in the CSV file. Please check the format and try again.",
                  "No Valid Data"
                );
              }
            } catch (error) {
              console.error("Error processing CSV:", error);
              showError(
                "Failed to process CSV file. Please check the format.",
                "Processing Error"
              );
            } finally {
              setIsProcessingFile(false);
            }
          },
          error: (error) => {
            console.error("Papa Parse error:", error);
            showError(
              "Failed to parse CSV file. Please check the format.",
              "Parse Error"
            );
            setIsProcessingFile(false);
          },
        });
      } catch (error: any) {
        const message = error?.message || "Unknown error";
        showError(message, "Processing Error");
        setIsProcessingFile(false);
      }
    },
    [showError, showSuccess, selectedSource, selectedCategory]
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  // FIXED: Transform from flat LocalBulkLeadData to nested BulkLeadData for API
  const handleBulkCreate = async () => {
    if (!parsedLeads.length) return showError("No leads to create.");

    // Transform from flat to nested structure for API
    const transformedLeads: BulkLeadData[] = parsedLeads.map((lead) => ({
      basic_info: {
        name: lead.name,
        email: lead.email,
        contact_number: lead.contact_number,
        source: lead.source,
        category: lead.category,
      },
      status_and_tags: {
        stage: "initial", // Default stage
        lead_score: 50, // Default score
        tags: [], // Empty tags by default
      },
      additional_info: {
        notes: lead.notes || "",
      },
    }));

    try {
      const res = await bulkCreateLeads({
        leads: transformedLeads,
        force_create: false,
      }).unwrap();

      if (res.success) {
        showSuccess(res.message, "Leads Created");
        onClose(); // Close modal on success
        setParsedLeads([]); // Clear parsed leads
      }
    } catch (err: unknown) {
      const message =
        typeof err === "object" &&
        err !== null &&
        "data" in err &&
        typeof (err as { data?: { detail?: string } }).data?.detail === "string"
          ? (err as { data?: { detail?: string } }).data!.detail
          : "Bulk creation failed";
      showError(message!, "Error");
    }
  };

  const downloadTemplate = () => {
    let content = "";
    let filename = "bulk_leads_template.csv";

    switch (selectedSource) {
      case "naukri_nurses":
        content =
          "CANDIDATE NAME,Mail ID,PHONE NUMBER,DATE OF BIRTH,AGE,EXPERIENCE-SPECIALITY,EXPERIENCE,QUALIFICATION,Areas of interest and other details,NATIONALITY,CURRENT LOCATION\n" +
          "John Doe,john@example.com,1234567890,1995-05-15,28,ICU Nursing,5 years,B.Sc. Nursing,Critical care nursing,Indian,Mumbai Maharashtra";
        filename = "naukri_nurses_template.csv";
        break;
      case "social_nursing":
        content =
          "Name,Mail id,Phone Number,What is your current qualification?,Years of experience ?,German language status?,Planning to start?\n" +
          "Jane Smith,jane@example.com,9876543210,B.Sc. Nursing,3,A2 Level,January 2025";
        filename = "social_nursing_template.csv";
        break;
      case "study_abroad":
        content =
          "Name,Mail id,Phone Number,Current Status,Interested Country,Program,When do you plan to start your studies abroad?,What level of study are you planning to pursue?,Which intake are you planning to join?\n" +
          "Alex Johnson,alex@example.com,5555555555,Final year student,Canada,Computer Science,Fall 2025,Master's degree,September 2025";
        filename = "study_abroad_template.csv";
        break;
      default:
        content =
          "Name,Email,Contact Number,Country of Interest,Course Level\n" +
          "John Doe,john@example.com,1234567890,USA,bachelor's_degree\n" +
          "Jane Smith,jane@example.com,9876543210,Canada,master's_degree";
        filename = "bulk_leads_template.csv";
    }

    const blob = new Blob([content], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  };

  // FIXED: Use correct interface for updateLeadField
  const updateLeadField = (
    index: number,
    field: keyof LocalBulkLeadData,
    value: string
  ) => {
    const updated = [...parsedLeads];
    updated[index][field] = value;
    setParsedLeads(updated);
  };

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  if (!isAdmin) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Access Denied
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-muted-foreground">
              Only administrators can access the bulk lead creation feature.
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
            Upload a CSV file to add multiple leads. Lead category and source
            will be applied to all leads.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 md:grid-cols-2 gap-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            {/* Lead Category dropdown */}
            <div>
              <label className="text-sm font-medium text-blue-900 mb-2 block">
                Lead Category (Applied to all leads)
              </label>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
                disabled={isCategoriesLoading}
              >
                <SelectTrigger>
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
              {categoriesError && (
                <p className="text-xs text-red-500 mt-1">
                  Failed to load categories
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-blue-900 mb-2 block">
                Source (Applied to all leads)
              </label>
              <Select value={selectedSource} onValueChange={setSelectedSource}>
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

          {/* File upload area */}
          <div
            className={`border-2 border-dashed p-6 rounded-lg text-center ${
              dragActive ? "border-blue-400 bg-blue-50" : "border-gray-300"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingFile}
                className="mb-2"
              >
                {isProcessingFile ? "Processing..." : "Choose CSV File"}
              </Button>
              <p className="text-sm text-muted-foreground">
                Or drag and drop a CSV file here
              </p>
            </div>
          </div>
        </div>

        {/* Template download */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium">Download Template</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadTemplate}
            disabled={!selectedSource}
          >
            <Download className="w-4 h-4 mr-2" />
            Download CSV Template
          </Button>
        </div>

        {/* Parsed leads preview */}
        {parsedLeads.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Parsed Leads ({parsedLeads.length})
              </h3>
              <Button
                onClick={handleBulkCreate}
                disabled={!selectedCategory || !selectedSource}
                className="flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Create {parsedLeads.length} Leads
              </Button>
            </div>

            <div className="max-h-60 overflow-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left p-2 border-b">Name</th>
                    <th className="text-left p-2 border-b">Email</th>
                    <th className="text-left p-2 border-b">Contact</th>
                    <th className="text-left p-2 border-b">Category</th>
                    <th className="text-left p-2 border-b">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedLeads.slice(0, 50).map((lead, index) => (
                    <tr key={index} className="border-b">
                      {/* FIXED: Use flat structure properties */}
                      <td className="p-2">{lead.name}</td>
                      <td className="p-2">{lead.email}</td>
                      <td className="p-2">{lead.contact_number}</td>
                      <td className="p-2">{lead.category}</td>
                      <td className="p-2">{lead.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedLeads.length > 50 && (
                <div className="p-2 text-center text-sm text-muted-foreground bg-gray-50">
                  ... and {parsedLeads.length - 50} more leads
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BulkLeadCreation;
