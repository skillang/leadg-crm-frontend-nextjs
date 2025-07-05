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
  source: string;
  country_of_interest: string;
  course_level: string;
}

interface BulkLeadCreationProps {
  isOpen: boolean;
  onClose: () => void;
}

// Header mapping
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

  source: "source",
  "lead source": "source",
  "referral source": "source",
  "how did you hear": "source",

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
      source: lead.source?.trim() || "website",
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
    try {
      const res = await bulkCreateLeads({
        leads: parsedLeads,
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
      "Name,Email,Contact Number,Source,Country of Interest,Course Level\n" +
      "John Doe,john@example.com,1234567890,website,USA,bachelor's_degree";
    const blob = new Blob([content], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "bulk_leads_template.csv";
    a.click();
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
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex gap-2 items-center">
            <Users className="w-5 h-5" />
            Bulk Lead Upload
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file to add multiple leads.
          </DialogDescription>
        </DialogHeader>

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
                <Button variant="outline" onClick={() => setSelectedFile(null)}>
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

        {parsedLeads.length > 0 && (
          <div className="mt-6">
            <h4 className="text-lg font-semibold mb-3">
              Parsed Leads ({parsedLeads.length})
            </h4>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {parsedLeads.slice(0, 10).map((lead, i) => (
                <div
                  key={i}
                  className="p-2 bg-muted/30 rounded flex justify-between"
                >
                  <div>
                    <div className="font-medium">{lead.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {lead.email}
                    </div>
                  </div>
                  <div className="text-sm">{lead.contact_number}</div>
                </div>
              ))}
              {parsedLeads.length > 10 && (
                <div className="text-sm text-center text-muted-foreground">
                  ... and {parsedLeads.length - 10} more leads
                </div>
              )}
            </div>
            <div className="mt-4">
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
                    Create Leads
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
