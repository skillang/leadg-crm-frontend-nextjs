// src/components/leads/BulkLeadCreation.tsx - Enhanced with notes formatting

import React, { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  AlertCircle,
  Download,
  Users,
  RefreshCw,
  File,
} from "lucide-react";
import { useAuth } from "@/redux/hooks/useAuth";
import { useBulkCreateLeadsMutation } from "@/redux/slices/leadsApi";
import { useNotifications } from "@/components/common/NotificationSystem";
import Papa from "papaparse";

// ADD THIS: Notes formatting utility
class BulkUploadNotesFormatter {
  static formatNaukriNurses(row: any): string {
    const notesLines = ["=== NAUKRI NURSES IMPORT ===", ""];

    // Personal Information
    const personalInfo = [];
    if (row["DATE OF BIRTH"]) personalInfo.push(`DOB: ${row["DATE OF BIRTH"]}`);
    if (row["AGE"]) personalInfo.push(`Age: ${row["AGE"]}`);
    if (row["NATIONALITY"])
      personalInfo.push(`Nationality: ${row["NATIONALITY"]}`);
    if (row["CURRENT LOCATION"])
      personalInfo.push(`Location: ${row["CURRENT LOCATION"]}`);

    if (personalInfo.length > 0) {
      notesLines.push("Personal Info:");
      personalInfo.forEach((info) => notesLines.push(`• ${info}`));
      notesLines.push("");
    }

    // Professional Information
    const professionalInfo = [];
    if (row["EXPERIENCE-SPECIALITY"])
      professionalInfo.push(
        `Experience & Speciality: ${row["EXPERIENCE-SPECIALITY"]}`
      );
    if (row["EXPERIENCE"])
      professionalInfo.push(`Experience: ${row["EXPERIENCE"]}`);
    if (row["QUALIFICATION"])
      professionalInfo.push(`Qualification: ${row["QUALIFICATION"]}`);

    if (professionalInfo.length > 0) {
      notesLines.push("Professional Info:");
      professionalInfo.forEach((info) => notesLines.push(`• ${info}`));
      notesLines.push("");
    }

    // Areas of Interest
    if (row["Areas of interest and other details"]) {
      notesLines.push("Areas of Interest:");
      notesLines.push(`• ${row["Areas of interest and other details"]}`);
    }

    return notesLines.join("\n").trim();
  }

  static formatSocialNursing(row: any): string {
    const notesLines = ["=== SOCIAL MEDIA - NURSING ===", ""];

    const fields = [
      {
        key: "What is your current qualification?",
        label: "Current Qualification",
      },
      { key: "Years of experience ?", label: "Years of Experience" },
      { key: "German language status?", label: "German Language Status" },
      { key: "Planning to start?", label: "Planning to Start" },
    ];

    fields.forEach((field) => {
      if (row[field.key]) {
        notesLines.push(`• ${field.label}: ${row[field.key]}`);
      }
    });

    return notesLines.join("\n").trim();
  }

  static formatStudyAbroad(row: any): string {
    const notesLines = ["=== STUDY ABROAD - SOCIAL MEDIA ===", ""];

    const fields = [
      { key: "Current Status", label: "Current Status" },
      { key: "Program", label: "Program" },
      {
        key: "When do you plan to start your studies abroad?",
        label: "Study Start Date",
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
  }
}

// Types
interface BulkLeadData {
  name: string;
  email: string;
  contact_number: string;
  country_of_interest: string;
  course_level: string;
  notes?: string; // ADD THIS
}

interface BulkLeadCreationProps {
  isOpen: boolean;
  onClose: () => void;
}

// Department options
const DEPARTMENT_OPTIONS = [
  { value: "nursing", label: "Nursing" },
  { value: "study_abroad", label: "Study Abroad" },
];

// Source options (based on backend LeadSource enum) - ADD THESE NEW OPTIONS
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
  // ADD THESE NEW SOURCE TYPES FOR BULK UPLOADS
  { value: "naukri_nurses", label: "Naukri Nurses" },
  { value: "social_nursing", label: "Social Media - Nursing" },
  { value: "study_abroad", label: "Study Abroad - Social Media" },
];

// MODIFY THIS: Enhanced header mapping
const HEADER_MAPPING: Record<string, string> = {
  // Existing mappings
  name: "name",
  "full name": "name",
  fullname: "name",
  "lead name": "name",
  "customer name": "name",
  "student name": "name",

  // ADD THESE FOR BULK UPLOAD FORMATS
  "CANDIDATE NAME": "name",
  Name: "name",

  email: "email",
  "email address": "email",
  "e-mail": "email",
  mail: "email",
  "email id": "email",
  // ADD THESE
  "Mail ID": "email",
  "Mail id": "email",

  contact_number: "contact_number",
  "contact number": "contact_number",
  phone: "contact_number",
  "phone number": "contact_number",
  mobile: "contact_number",
  "mobile number": "contact_number",
  telephone: "contact_number",
  tel: "contact_number",
  // ADD THESE
  "PHONE NUMBER": "contact_number",
  "Phone Number": "contact_number",

  country_of_interest: "country_of_interest",
  "country of interest": "country_of_interest",
  "preferred country": "country_of_interest",
  "destination country": "country_of_interest",
  "target country": "country_of_interest",
  country: "country_of_interest",
  // ADD THESE
  "Interested Country": "country_of_interest",
  "Which country are you interested in studying abroad?": "country_of_interest",

  course_level: "course_level",
  "course level": "course_level",
  "education level": "course_level",
  "degree level": "course_level",
  "program level": "course_level",
  "qualification level": "course_level",
  // ADD THESE
  "What level of study are you planning to pursue?": "course_level",
};

const BulkLeadCreation: React.FC<BulkLeadCreationProps> = ({
  isOpen,
  onClose,
}) => {
  const { isAdmin } = useAuth();
  const [parsedLeads, setParsedLeads] = useState<BulkLeadData[]>([]);
  const [selectedSource, setSelectedSource] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [bulkCreateLeads] = useBulkCreateLeadsMutation();
  const { showSuccess, showError } = useNotifications();

  // ADD THIS: Enhanced file processing with notes formatting
  const processLeadData = (
    mappedLead: Record<string, string>,
    rawRow: any
  ): BulkLeadData => {
    let notes = "";

    // Format notes based on source type
    if (selectedSource === "naukri_nurses") {
      notes = BulkUploadNotesFormatter.formatNaukriNurses(rawRow);
    } else if (selectedSource === "social_nursing") {
      notes = BulkUploadNotesFormatter.formatSocialNursing(rawRow);
    } else if (selectedSource === "study_abroad") {
      notes = BulkUploadNotesFormatter.formatStudyAbroad(rawRow);
    } else {
      // For other sources, format remaining fields as notes
      const usedFields = new Set(Object.values(HEADER_MAPPING));
      const extraFields = Object.entries(rawRow)
        .filter(
          ([key, value]) =>
            !usedFields.has(key.toLowerCase()) &&
            value &&
            value.toString().trim()
        )
        .map(([key, value]) => `• ${key}: ${value}`)
        .join("\n");

      if (extraFields) {
        notes = `=== BULK IMPORT ===\n\n${extraFields}`;
      }
    }

    return {
      name: mappedLead.name || "",
      email: mappedLead.email || "",
      contact_number: mappedLead.contact_number || "",
      country_of_interest: mappedLead.country_of_interest || "",
      course_level: mappedLead.course_level || "",
      notes: notes || `Imported via bulk upload from ${selectedSource}`, // Always have some notes
    };
  };

  // MODIFY THIS: Enhanced file processing function
  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith(".csv")) {
        showError("Please select a CSV file.", "Invalid File Type");
        return;
      }

      setIsProcessingFile(true);

      try {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            try {
              const leads: BulkLeadData[] = [];
              let processedCount = 0;
              let skippedCount = 0;

              results.data.forEach((row: any, index: number) => {
                try {
                  const mappedLead: Record<string, string> = {};
                  let hasRequiredField = false;

                  // Map headers to our lead fields
                  Object.entries(row).forEach(([header, value]) => {
                    const normalizedHeader = header.trim().toLowerCase();
                    const mappedField =
                      HEADER_MAPPING[normalizedHeader] ||
                      HEADER_MAPPING[header.trim()];

                    if (mappedField && value) {
                      mappedLead[mappedField] = String(value).trim();
                      if (
                        mappedField === "name" ||
                        mappedField === "email" ||
                        mappedField === "contact_number"
                      ) {
                        hasRequiredField = true;
                      }
                    }
                  });

                  // Only process if we have at least name or contact info
                  if (
                    hasRequiredField &&
                    (mappedLead.name ||
                      mappedLead.email ||
                      mappedLead.contact_number)
                  ) {
                    const processedLead = processLeadData(mappedLead, row);
                    leads.push(processedLead);
                    processedCount++;
                  } else {
                    skippedCount++;
                    console.warn(
                      `Row ${index + 1} skipped - missing required fields:`,
                      row
                    );
                  }
                } catch (error) {
                  console.error(`Error processing row ${index + 1}:`, error);
                  skippedCount++;
                }
              });

              setParsedLeads(leads);

              if (leads.length > 0) {
                showSuccess(
                  `Successfully parsed ${processedCount} leads${
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
    [showError, showSuccess, selectedSource]
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleBulkCreate = async () => {
    if (!parsedLeads.length) return showError("No leads to create.");

    // Add department and source to all leads
    const leadsWithMetadata = parsedLeads.map((lead) => ({
      ...lead,
      source: selectedSource,
      department: selectedDepartment,
    }));

    try {
      const res = await bulkCreateLeads({
        leads: leadsWithMetadata,
        force_create: false,
      }).unwrap();

      if (res.success) showSuccess(res.message, "Leads Created");
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

  // MODIFY THIS: Enhanced template download with different formats
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

  const updateLeadField = (
    index: number,
    field: keyof BulkLeadData,
    value: string
  ) => {
    const updated = [...parsedLeads];
    updated[index][field] = value;
    setParsedLeads(updated);
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
            Upload a CSV file to add multiple leads. Department and source will
            be applied to all leads.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 md:grid-cols-2 gap-4 rounded-lg ">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div>
              <label className="text-sm font-medium text-blue-900 mb-2 block">
                Department (Applied to all leads)
              </label>
              <Select
                value={selectedDepartment}
                onValueChange={setSelectedDepartment}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENT_OPTIONS.map((dept) => (
                    <SelectItem key={dept.value} value={dept.value}>
                      {dept.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

          <div
            className={`border-2 border-dashed p-6 rounded-lg text-center ${
              dragActive ? "border-blue-400 bg-blue-50" : "border-gray-300"
            }`}
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
                {isProcessingFile ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <File className="w-4 h-4 mr-2" />
                    Choose CSV File
                  </>
                )}
              </Button>

              {/* ADD THIS: Show template download based on selected source */}
              {selectedSource && (
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={downloadTemplate}
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download {selectedSource
                      .replace("_", " ")
                      .toUpperCase()}{" "}
                    Template
                  </Button>
                </div>
              )}

              <p className="text-sm text-gray-500">
                Drag and drop a CSV file here, or click to select
              </p>
            </div>
          </div>
        </div>

        {/* ADD THIS: Enhanced preview with notes */}
        {parsedLeads.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Preview ({parsedLeads.length} leads)
              </h3>
              <p className="text-sm text-gray-500">
                First 5 leads shown. All extra information will be saved in
                notes.
              </p>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left p-3 border-b">Name</th>
                      <th className="text-left p-3 border-b">Email</th>
                      <th className="text-left p-3 border-b">Phone</th>
                      <th className="text-left p-3 border-b">Country</th>
                      <th className="text-left p-3 border-b">Notes Preview</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedLeads.slice(0, 5).map((lead, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-3">{lead.name}</td>
                        <td className="p-3">{lead.email}</td>
                        <td className="p-3">{lead.contact_number}</td>
                        <td className="p-3">{lead.country_of_interest}</td>
                        <td className="p-3">
                          <details className="max-w-xs">
                            <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                              {lead.notes?.split("\n")[0] || "No notes"}...
                            </summary>
                            <pre className="mt-2 text-xs whitespace-pre-wrap bg-gray-100 p-2 rounded max-h-32 overflow-y-auto">
                              {lead.notes}
                            </pre>
                          </details>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleBulkCreate}
            disabled={
              !parsedLeads.length || !selectedDepartment || !selectedSource
            }
          >
            Create {parsedLeads.length} Leads
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkLeadCreation;
