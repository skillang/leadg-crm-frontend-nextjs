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
  X,
  Upload,
  FileText,
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

// Types
interface BulkLeadData {
  name: string;
  email: string;
  contact_number: string;
  country_of_interest: string;
  course_level: string;
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

// Source options (based on backend LeadSource enum)
const SOURCE_OPTIONS = [
  { value: "advertisement", label: "Advertisement" },
  { value: "bulk_upload", label: "Bulk Upload" },
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

// Header mapping (removed source and department since they're set globally)
const HEADER_MAPPING: Record<string, string> = {
  name: "name",
  "full name": "name",
  fullname: "name",
  "lead name": "name",
  "customer name": "name",
  "student name": "name",

  email: "email",
  "email address": "email",
  "e-mail": "email",
  mail: "email",
  "email id": "email",

  contact_number: "contact_number",
  "contact number": "contact_number",
  phone: "contact_number",
  "phone number": "contact_number",
  mobile: "contact_number",
  "mobile number": "contact_number",
  telephone: "contact_number",
  tel: "contact_number",

  country_of_interest: "country_of_interest",
  "country of interest": "country_of_interest",
  "preferred country": "country_of_interest",
  "destination country": "country_of_interest",
  "target country": "country_of_interest",
  country: "country_of_interest",

  course_level: "course_level",
  "course level": "course_level",
  "education level": "course_level",
  "degree level": "course_level",
  "program level": "course_level",
  "qualification level": "course_level",
};

const BulkLeadCreation: React.FC<BulkLeadCreationProps> = ({
  isOpen,
  onClose,
}) => {
  const { isAdmin } = useAuth();
  const [bulkCreateLeads, { isLoading }] = useBulkCreateLeadsMutation();
  const { showError, showWarning, showSuccess } = useNotifications();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [parsedLeads, setParsedLeads] = useState<BulkLeadData[]>([]);
  const [selectedDepartment, setSelectedDepartment] =
    useState<string>("study_abroad");
  const [selectedSource, setSelectedSource] = useState<string>("website");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (file: File) => {
      const err = validateFile(file);
      if (err) return showError(err, "Invalid File");
      setSelectedFile(file);
      setParsedLeads([]);
    },
    [showError]
  );

  const handleDragEvents = {
    enter: useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(true);
    }, []),
    leave: useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
    }, []),
    over: useCallback((e: React.DragEvent) => e.preventDefault(), []),
    drop: useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFileSelect(file);
      },
      [handleFileSelect]
    ),
  };

  const normalizeHeader = (header: string): string | null => {
    const normalizedHeader = header.toLowerCase().trim();
    return HEADER_MAPPING[normalizedHeader] || null;
  };

  const validateFile = (file: File): string | null => {
    const maxSize = 10 * 1024 * 1024;
    const fileExtension = file.name
      .toLowerCase()
      .slice(file.name.lastIndexOf("."));
    if (file.size > maxSize) {
      return `File must be less than 10MB. Got ${(
        file.size /
        1024 /
        1024
      ).toFixed(2)}MB`;
    }
    if (fileExtension !== ".csv") {
      return "Only .csv files are allowed.";
    }
    return null;
  };

  const validateLead = (lead: Partial<BulkLeadData>): BulkLeadData | null => {
    if (
      !lead.name?.trim() ||
      !lead.email?.trim() ||
      !lead.contact_number?.trim()
    )
      return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(lead.email)) return null;
    const phoneRegex = /[\d\s\-\(\)]{10,}/;
    if (!phoneRegex.test(lead.contact_number)) return null;

    return {
      name: lead.name.trim(),
      email: lead.email.trim().toLowerCase(),
      contact_number: lead.contact_number.trim(),
      country_of_interest: lead.country_of_interest?.trim() || "",
      course_level: lead.course_level?.trim() || "bachelor's_degree",
    };
  };

  const processCsvFile = (file: File): Promise<BulkLeadData[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const validLeads: BulkLeadData[] = [];
            const headers = results.meta.fields || [];
            const required = ["name", "email", "contact_number"];
            const mappedHeaders = headers.map(normalizeHeader).filter(Boolean);
            if (!required.every((field) => mappedHeaders.includes(field))) {
              const missing = required.filter(
                (f) => !mappedHeaders.includes(f)
              );
              reject(
                new Error(`Missing required fields: ${missing.join(", ")}`)
              );
              return;
            }

            results.data.forEach((row) => {
              const lead: Partial<BulkLeadData> = {};
              Object.keys(row).forEach((key) => {
                const field = normalizeHeader(key);
                if (field && row[key]) {
                  (lead as Partial<BulkLeadData>)[field as keyof BulkLeadData] =
                    String(row[key]).trim();
                }
              });

              const validated = validateLead(lead);
              if (validated) validLeads.push(validated);
            });

            resolve(validLeads);
          } catch (e) {
            reject(e);
          }
        },
        error: (error) => {
          reject(new Error(`CSV parse error: ${error.message}`));
        },
      });
    });
  };

  const processUploadedFile = async () => {
    if (!selectedFile) return;
    setIsProcessingFile(true);

    try {
      const leads = await processCsvFile(selectedFile);
      if (!leads.length) {
        showError("No valid leads found", "Empty File");
        return;
      }

      const unique = leads.filter(
        (lead, i, arr) => arr.findIndex((l) => l.email === lead.email) === i
      );

      if (unique.length < leads.length) {
        showWarning(
          `${leads.length - unique.length} duplicates removed.`,
          "Deduplication"
        );
      }

      setParsedLeads(unique);
      showSuccess(`Parsed ${unique.length} leads.`, "Success");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      showError(message, "Processing Error");
    } finally {
      setIsProcessingFile(false);
    }
  };

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

  const downloadTemplate = () => {
    const content =
      "Name,Email,Contact Number,Country of Interest,Course Level\n" +
      "John Doe,john@example.com,1234567890,USA,bachelor's_degree\n" +
      "Jane Smith,jane@example.com,9876543210,Canada,master's_degree";
    const blob = new Blob([content], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "bulk_leads_template.csv";
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
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
      // style={{ overflowY: "hidden" }}
    >
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
          {/* Global Department and Source Selection */}

          <div
            className={`border-2 border-dashed p-6 rounded-lg text-center ${
              dragActive ? "bg-primary/10" : "bg-muted/10"
            }`}
            onDragEnter={handleDragEvents.enter}
            onDragLeave={handleDragEvents.leave}
            onDragOver={handleDragEvents.over}
            onDrop={handleDragEvents.drop}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".csv"
              onChange={handleFileInputChange}
            />

            {selectedFile ? (
              <>
                <FileText className="w-10 h-10 mx-auto text-green-600" />
                <p className="mt-2 font-medium text-green-700">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <div className="mt-4 flex justify-center gap-3">
                  <Button
                    onClick={processUploadedFile}
                    disabled={isProcessingFile}
                  >
                    {isProcessingFile ? (
                      <>
                        <RefreshCw className="animate-spin w-4 h-4 mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Process File
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedFile(null)}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Upload className="w-10 h-10 mx-auto text-muted-foreground" />
                <p className="mt-2 font-medium">Drop your CSV file here</p>
                <p className="text-sm text-muted-foreground">
                  or click to browse files
                </p>
                <div className="mt-4">
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <File className="w-4 h-4 mr-2" />
                    Browse
                  </Button>
                  <Button
                    variant="outline"
                    onClick={downloadTemplate}
                    className="ml-2"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Template
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        {parsedLeads.length > 0 && (
          <div className="mt-6">
            <h4 className="text-lg font-semibold mb-3">
              Parsed Leads ({parsedLeads.length})
            </h4>

            <div className="max-h-96 overflow-y-auto space-y-3">
              {parsedLeads.map((lead, i) => (
                <div key={i} className="p-4 bg-muted/30 rounded-lg border">
                  {/* Row 1: Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Name *
                      </label>
                      <input
                        className="w-full border px-3 py-2 rounded text-sm"
                        value={lead.name}
                        onChange={(e) =>
                          updateLeadField(i, "name", e.target.value)
                        }
                        placeholder="Full name"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Email *
                      </label>
                      <input
                        className="w-full border px-3 py-2 rounded text-sm"
                        value={lead.email}
                        onChange={(e) =>
                          updateLeadField(i, "email", e.target.value)
                        }
                        placeholder="email@example.com"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Contact Number *
                      </label>
                      <input
                        className="w-full border px-3 py-2 rounded text-sm"
                        value={lead.contact_number}
                        onChange={(e) =>
                          updateLeadField(i, "contact_number", e.target.value)
                        }
                        placeholder="Phone number"
                      />
                    </div>
                  </div>

                  {/* Row 2: Country and Course Level */}
                  <div className="flex flex-col md:flex-row gap-3 items-end">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Country of Interest
                      </label>
                      <input
                        className="w-full border px-3 py-2 rounded text-sm"
                        value={lead.country_of_interest}
                        onChange={(e) =>
                          updateLeadField(
                            i,
                            "country_of_interest",
                            e.target.value
                          )
                        }
                        placeholder="Country"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Course Level
                      </label>
                      <input
                        className="w-full border px-3 py-2 rounded text-sm"
                        value={lead.course_level}
                        onChange={(e) =>
                          updateLeadField(i, "course_level", e.target.value)
                        }
                        placeholder="Course level"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const updated = parsedLeads.filter(
                          (_, index) => index !== i
                        );
                        setParsedLeads(updated);
                      }}
                      className="shrink-0"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Ready to create {parsedLeads.length} leads</strong>
                  <br />
                  Department:{" "}
                  <span className="font-medium">
                    {
                      DEPARTMENT_OPTIONS.find(
                        (d) => d.value === selectedDepartment
                      )?.label
                    }
                  </span>
                  <br />
                  Source:{" "}
                  <span className="font-medium">
                    {
                      SOURCE_OPTIONS.find((s) => s.value === selectedSource)
                        ?.label
                    }
                  </span>
                </p>
              </div>
              <Button
                onClick={handleBulkCreate}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="animate-spin w-4 h-4 mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4 mr-2" />
                    Create {parsedLeads.length} Leads
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BulkLeadCreation;
