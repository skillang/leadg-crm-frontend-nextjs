import React, { useMemo, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Edit2, Check, X } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
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
  Users,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import {
  useBulkCreateLeadsFlatMutation,
  useCheckDuplicatesMutation,
  // useGetAssignableUsersWithDetailsQuery,
} from "@/redux/slices/leadsApi";
import { useGetCategoriesQuery } from "@/redux/slices/categoriesApi";
import { useGetStagesQuery } from "@/redux/slices/stagesApi";
import { useGetStatusesQuery } from "@/redux/slices/statusesApi";
import { useNotifications } from "../common/NotificationSystem";
import SourceDropdown from "../common/SourceDropdown";
import LeadAssignmentDropdown from "../common/LeadAssignmentDropdown";
import ImportantNotesCard from "@/sections/leads/create-leads-guidelines/ImportantNotesCard";
import CSVFormatRulesCard from "@/sections/leads/create-leads-guidelines/CSVFormatRules";
import HeaderMappingRulesCard from "@/sections/leads/create-leads-guidelines/HeaderMappingRulesCard";

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
  current_location?: string;
  country_of_interest?: string;
  course_level?: string;
  date_of_birth?: string;
  stage: string;
  status: string;
  lead_score?: number;
  tags?: string[];
  notes?: string;
}

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (result: UploadResult) => void; // Instead of any
}

interface ParsedLead {
  index: number;
  name: string;
  email: string;
  contact_number: string;
  source: string;
  category: string;
  stage: string;
  status: string;
  lead_score: number;
  tags: string[];
  notes: string;
  age?: number;
  experience?: string;
  nationality?: string;
  date_of_birth?: string;
  current_location?: string;
  country_of_interest?: string;
  course_level?: string;
  errors: string[];
  isValid: boolean;
}

// Add these interfaces at the top of the file
interface UploadResult {
  success: boolean;
  created_count: number;
  duplicates_count: number;
  failed_count: number;
  total_attempted: number;
  message?: string;
  results?: unknown[];
  summary?: {
    successful_creates: number;
    duplicates_skipped: number;
    failed_creates: number;
    total_attempted: number;
  };
}

// First, add this interface at the top of your file with other interfaces
interface BulkUploadError {
  data?: {
    detail?: string | Array<{ msg: string }>;
    message?: string;
    summary?: {
      successful_creates: number;
      duplicates_skipped: number;
      failed_creates: number;
    };
  };
  message?: string;
}

// ✅ Enhanced date converter function with support for more formats
const convertToYYYYMMDD = (dateStr: string): string | null => {
  if (!dateStr || !dateStr.trim()) return null;

  const cleaned = dateStr.trim();

  // Check if already in YYYY-MM-DD format
  if (/^(\d{4})-(\d{1,2})-(\d{1,2})$/.test(cleaned)) {
    return cleaned;
  }

  // Handle scientific notation phone numbers that got mixed with dates
  if (cleaned.includes("E+") || cleaned.includes("e+")) {
    return null; // This is likely a phone number, not a date
  }

  // Month name mappings
  const monthMap: Record<string, string> = {
    jan: "01",
    january: "01",
    feb: "02",
    february: "02",
    mar: "03",
    march: "03",
    apr: "04",
    april: "04",
    may: "05",
    jun: "06",
    june: "06",
    jul: "07",
    july: "07",
    aug: "08",
    august: "08",
    sep: "09",
    september: "09",
    sept: "09",
    oct: "10",
    october: "10",
    nov: "11",
    november: "11",
    dec: "12",
    december: "12",
  };

  // Format 1: "20th April 1987" - Descriptive format with ordinals
  const descriptiveMatch = cleaned.match(
    /(\d{1,2})(st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/i
  );
  if (descriptiveMatch) {
    const day = descriptiveMatch[1].padStart(2, "0");
    const monthName = descriptiveMatch[3].toLowerCase();
    const year = descriptiveMatch[4];
    const month = monthMap[monthName];

    if (month) {
      return `${year}-${month}-${day}`;
    }
  }

  // Format 2: "30-Jul-02" - DD-MMM-YY format
  const shortFormatMatch = cleaned.match(/(\d{1,2})-([a-z]{3})-(\d{2})/i);
  if (shortFormatMatch) {
    const day = shortFormatMatch[1].padStart(2, "0");
    const monthName = shortFormatMatch[2].toLowerCase();
    let year = shortFormatMatch[3];

    // Convert 2-digit year to 4-digit (assuming 1900s for ages > 30, 2000s for ages < 30)
    const yearNum = parseInt(year);
    if (yearNum > 30) {
      year = `19${year}`;
    } else {
      year = `20${year}`;
    }

    const month = monthMap[monthName];
    if (month) {
      return `${year}-${month}-${day}`;
    }
  }

  // Format 3: "30/Jul/2002" - DD/MMM/YYYY format
  const slashFormatMatch = cleaned.match(/(\d{1,2})\/([a-z]{3})\/(\d{4})/i);
  if (slashFormatMatch) {
    const day = slashFormatMatch[1].padStart(2, "0");
    const monthName = slashFormatMatch[2].toLowerCase();
    const year = slashFormatMatch[3];
    const month = monthMap[monthName];

    if (month) {
      return `${year}-${month}-${day}`;
    }
  }

  // Format 4: Standard formats from original function
  const formats = [
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY or MM/DD/YYYY
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // DD-MM-YYYY or MM-DD-YYYY
    /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/, // DD.MM.YYYY or MM.DD.YYYY
  ];

  for (const format of formats) {
    const match = cleaned.match(format);
    if (match) {
      const [, first, second, year] = match;

      // Assume DD/MM/YYYY format (more common internationally)
      const day = first.padStart(2, "0");
      const month = second.padStart(2, "0");

      // Basic validation
      const dayNum = parseInt(day);
      const monthNum = parseInt(month);

      if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12) {
        return `${year}-${month}-${day}`;
      }
    }
  }

  return null; // Invalid format
};

// ✅ Enhanced phone number cleaning function
const cleanPhoneNumber = (phoneStr: string): string | null => {
  if (!phoneStr || !phoneStr.trim()) return null;

  const cleaned = phoneStr.trim();

  // Handle scientific notation (Excel issue)
  if (
    cleaned.includes("E+") ||
    cleaned.includes("e+") ||
    cleaned.includes("E-") ||
    cleaned.includes("e-")
  ) {
    // Convert scientific notation back to number
    const number = parseFloat(cleaned);
    if (!isNaN(number)) {
      // Convert to string and remove decimal if it's a whole number
      let phoneNumber = number.toString();
      if (phoneNumber.includes(".")) {
        phoneNumber = Math.round(number).toString();
      }

      // Handle negative numbers (remove minus sign)
      phoneNumber = phoneNumber.replace("-", "");

      // Validate length (should be 10-15 digits)
      if (phoneNumber.length >= 10 && phoneNumber.length <= 15) {
        return phoneNumber;
      }
    }
  }

  // Standard phone number cleaning
  const cleanedPhone = cleaned.replace(/[\s\-\(\)\+]/g, "");
  if (/^\d{10,15}$/.test(cleanedPhone)) {
    return cleanedPhone;
  }

  return null;
};

// ✅ Enhanced age extraction function
const extractAge = (ageStr: string): number | null => {
  if (!ageStr || !ageStr.trim()) return null;

  const cleaned = ageStr.trim().toLowerCase();

  // Extract first number from string like "26 (as per document date)" or "22 years"
  const ageMatch = cleaned.match(/(\d+)/);
  if (ageMatch) {
    const age = parseInt(ageMatch[1]);
    if (age > 0 && age <= 120) {
      return age;
    }
  }

  return null;
};

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
  qualification: "course_level", // Added for your CSV
  QUALIFICATION: "course_level", // Added for your CSV

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
  EXPERIENCE: "experience", // Added for your CSV
  "SPECIALITY EXPERIENCE": "specialty_experience", // Added for your CSV
  "specialty experience": "specialty_experience",

  "speciality experience": "specialty_experience",
  "SPECIALTY EXPERIENCE": "specialty_experience",

  // Age mappings
  age: "age",
  Age: "age",
  AGE: "age",

  // ✅ FIXED: Date of Birth mappings
  "date of birth": "date_of_birth",
  "Date of Birth": "date_of_birth",
  "DATE OF BIRTH": "date_of_birth",
  dob: "date_of_birth",
  DOB: "date_of_birth",

  // ✅ FIXED: Nationality mappings (Added missing variations)
  nationality: "nationality",
  Nationality: "nationality",
  NATIONALITY: "nationality",
  "nationality country": "nationality",
  "country of nationality": "nationality",

  // ✅ FIXED: Current location mappings (Added missing variations)
  current_location: "current_location",
  "current location": "current_location",
  "CURRENT LOCATION": "current_location",
  "current address": "current_location",
  "current city": "current_location",
  location: "current_location",
  address: "current_location",
  city: "current_location",

  // Notes mappings
  notes: "notes",
  note: "notes",
  comment: "notes",
  comments: "notes",
  remarks: "notes",
  description: "notes",
  "areas of interest": "notes",
  "Areas of interest and other details": "notes", // Added for your CSV
  "other details": "notes",

  // Status indicators (added for your CSV)
  contacted: "contact_status",
  communicated: "contact_status",
  "CONTACTED/ COMMUNICATED": "contact_status",
  interested: "status_indicator",
  "not interested": "status_indicator",
  submitted: "status_indicator",
  "not qualified": "status_indicator",
  "INTERESTED/NOT INTERESTED/SUBMITTED/ NOT QUALIFIED": "status_indicator",

  // Date fields (added for your CSV)
  date: "date",
  DATE: "date",
  "lasted update date": "last_update",
  "Lasted update date": "last_update",
  "updated by": "updated_by",
  "Updated by": "updated_by",

  // Serial number (added for your CSV)
  "si.no": "serial_number",
  "SI.NO": "serial_number",
  "serial number": "serial_number",
  "sr no": "serial_number",
};

const REQUIRED_COLUMNS = ["name", "email", "contact_number"];

// Editable Field Component for inline editing
interface EditableFieldProps {
  value: string;
  placeholder?: string;
  hasError: boolean;
  onSave: (value: string) => void;
  type?: "text" | "email" | "tel" | "number";
}

const EditableField: React.FC<EditableFieldProps> = ({
  value,
  placeholder = "",
  hasError,
  onSave,
  type = "text",
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          type={type}
          className="h-7 text-xs"
          autoFocus
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSave}
          className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
        >
          <Check className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`group flex items-center gap-1 cursor-pointer p-1 rounded ${
        hasError ? "bg-red-50 border border-red-200" : "hover:bg-gray-50"
      }`}
      onClick={() => setIsEditing(true)}
      title="Click to edit"
    >
      <span className={`text-sm truncate ${hasError ? "text-red-700" : ""}`}>
        {value || (
          <span className="text-red-500 italic">
            {hasError ? `Missing ${placeholder.toLowerCase()}` : placeholder}
          </span>
        )}
      </span>
      <Edit2 className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};

const BulkUploadModal: React.FC<BulkUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedLeads, setParsedLeads] = useState<ParsedLead[]>([]);
  const [validLeads, setValidLeads] = useState<ParsedLead[]>([]);
  const [invalidLeads, setInvalidLeads] = useState<ParsedLead[]>([]);
  const [checkDuplicates, { isLoading: isCheckingDuplicates }] =
    useCheckDuplicatesMutation();
  const [duplicateLeads, setDuplicateLeads] = useState<ParsedLead[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_uploadResults, setUploadResults] = useState<UploadResult | null>(
    null
  );
  const [uploadType, setUploadType] = useState<"csv" | "cv">("csv");
  const [activeTab, setActiveTab] = useState("valid");

  // Form configuration
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSource, setSelectedSource] = useState("bulk_import");

  // Assignment configuration
  const [assignmentConfig, setAssignmentConfig] = useState<{
    type: "unassigned" | "selective_round_robin" | "manual";
    assigned_to?: string;
    assigned_users?: string[];
  }>({
    type: "unassigned",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  // API hooks
  // const { data: assignableUsersResponse } =
  //   useGetAssignableUsersWithDetailsQuery();
  const {
    data: categoriesResponse,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useGetCategoriesQuery({ include_inactive: false });

  const { data: stagesResponse, isLoading: stagesLoading } = useGetStagesQuery({
    active_only: true,
  });

  const { data: statusesResponse, isLoading: statusesLoading } =
    useGetStatusesQuery({
      active_only: true,
    });

  const [bulkCreateLeads] = useBulkCreateLeadsFlatMutation();

  // const assignableUsers = assignableUsersResponse?.users || [];
  const categories = useMemo(() => {
    return categoriesResponse?.categories || [];
  }, [categoriesResponse]);
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

  const defaultCategory = useMemo(() => {
    if (!categories || categories.length === 0) return "";
    return categories[0].name;
  }, [categories]);

  // Update the useEffect
  React.useEffect(() => {
    if (defaultCategory && !selectedCategory) {
      setSelectedCategory(defaultCategory);
    }
  }, [defaultCategory, selectedCategory]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "text/csv") {
      setCsvFile(file);
      parseCSV(file);
    } else {
      setErrors({ file: "Please select a valid CSV file" });
    }
  };

  const normalizeHeader = (header: string): string => {
    const trimmed = header.trim();
    return (
      HEADER_MAPPING[trimmed] ||
      HEADER_MAPPING[trimmed.toLowerCase()] ||
      trimmed.toLowerCase().replace(/\s+/g, "_")
    );
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  };

  const parseCSV = async (file: File) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const csvData = e.target?.result as string;
        const lines = csvData.split("\n").filter((line) => line.trim() !== "");

        if (lines.length < 2) {
          setErrors({
            file: "CSV file must contain at least a header row and one data row",
          });
          return;
        }

        // Parse headers
        const rawHeaders = parseCSVLine(lines[0]).map((h) =>
          h.replace(/"/g, "").trim()
        );
        const headers = rawHeaders.map(normalizeHeader);

        // Check for required columns
        const missingColumns = REQUIRED_COLUMNS.filter(
          (required) => !headers.includes(required)
        );
        if (missingColumns.length > 0) {
          setErrors({
            file: `Missing required columns: ${missingColumns.join(
              ", "
            )}.\nRequired: ${REQUIRED_COLUMNS.join(", ")}`,
          });
          return;
        }

        // Parse data rows
        const leads: ParsedLead[] = [];
        const baseTimestamp = Date.now();

        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]).map((v) =>
            v.trim().replace(/"/g, "")
          );

          const errors: string[] = [];
          const notesData: string[] = [];
          const rowTimestamp = baseTimestamp + i;
          const uniqueId = `${rowTimestamp}${i.toString().padStart(3, "0")}`;

          const lead: ParsedLead = {
            index: i,
            name: "",
            email: "",
            contact_number: "",
            source: selectedSource,
            category: selectedCategory,
            stage: defaultStage,
            status: defaultStatus,
            lead_score: 0,
            tags: [],
            notes: "",
            errors: [],
            isValid: false,
          };

          // Map CSV values to lead properties (keep all your existing mapping logic)
          headers.forEach((key: string, index: number) => {
            const value = values[index]?.trim().replace(/"/g, "") || "";

            switch (key) {
              case "name":
                lead.name = value;
                if (!value) {
                  errors.push("Name is required");
                } else {
                  lead.name = value.trim();
                }
                break;

              case "email":
                if (!value) {
                  lead.email = `notvalid${uniqueId}@gmail.com`;
                  notesData.push("Original Email: Missing - Auto-generated");
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                  lead.email = `notvalid${uniqueId}@gmail.com`;
                  notesData.push(
                    `Original Email: ${value} (Invalid format) - Auto-generated`
                  );
                } else {
                  lead.email = value.toLowerCase().trim();
                }
                break;

              case "contact_number":
                if (!value) {
                  const generatedPhone = generateUniquePhoneNumber(
                    rowTimestamp,
                    i
                  );
                  lead.contact_number = generatedPhone;
                  notesData.push("Original Phone: Missing - Auto-generated");
                } else {
                  const cleanedPhone = cleanPhoneNumber(value);
                  if (cleanedPhone) {
                    lead.contact_number = cleanedPhone;
                  } else {
                    const generatedPhone = generateUniquePhoneNumber(
                      rowTimestamp,
                      i
                    );
                    lead.contact_number = generatedPhone;
                    notesData.push(
                      `Original Phone: ${value} (Invalid format/Scientific notation) - Auto-generated`
                    );
                  }
                }
                break;

              case "age":
                if (value && value.trim()) {
                  const normalizedAge = value.toLowerCase().trim();
                  if (
                    normalizedAge === "not defined" ||
                    normalizedAge === "undefined" ||
                    normalizedAge === "n/a" ||
                    normalizedAge === "not mentioned"
                  ) {
                    break;
                  }
                  const extractedAge = extractAge(value);
                  if (extractedAge) {
                    lead.age = extractedAge;
                  } else {
                    notesData.push(
                      `Age: ${value} (could not extract valid age)`
                    );
                  }
                }
                break;

              case "date_of_birth":
                if (value && value.trim()) {
                  const normalizedDob = value.toLowerCase().trim();
                  if (
                    normalizedDob === "not defined" ||
                    normalizedDob === "undefined" ||
                    normalizedDob === "n/a" ||
                    normalizedDob === "not mentioned"
                  ) {
                    break;
                  }
                  const convertedDate = convertToYYYYMMDD(value.trim());
                  if (convertedDate) {
                    lead.date_of_birth = convertedDate;
                    console.log(
                      `Date converted: "${value}" → "${convertedDate}"`
                    );
                  } else {
                    notesData.push(
                      `Date of Birth: ${value} (unsupported format)`
                    );
                    console.warn(`Date conversion failed for: "${value}"`);
                  }
                }
                break;

              case "experience":
                if (value && value.trim()) {
                  const normalizedExp = value.toLowerCase().trim();
                  if (
                    normalizedExp === "not defined" ||
                    normalizedExp === "undefined" ||
                    normalizedExp === "n/a" ||
                    normalizedExp === "not mentioned"
                  ) {
                    break;
                  }

                  const validExperience = [
                    "fresher",
                    "less_than_1_year",
                    "1_to_3_years",
                    "3_to_5_years",
                    "5_to_10_years",
                    "more_than_10_years",
                  ];

                  let mappedExp = normalizedExp;

                  if (
                    normalizedExp.includes("fresher") ||
                    normalizedExp.includes("fresh")
                  ) {
                    mappedExp = "fresher";
                  } else if (
                    normalizedExp.includes("1 year") &&
                    !normalizedExp.includes("2") &&
                    !normalizedExp.includes("3")
                  ) {
                    mappedExp = "less_than_1_year";
                  } else if (
                    (normalizedExp.includes("1") &&
                      normalizedExp.includes("year")) ||
                    (normalizedExp.includes("2") &&
                      normalizedExp.includes("year")) ||
                    (normalizedExp.includes("3") &&
                      normalizedExp.includes("year"))
                  ) {
                    const yearMatch = normalizedExp.match(/(\d+)\s*year/);
                    if (yearMatch) {
                      const years = parseInt(yearMatch[1]);
                      if (years >= 1 && years <= 3) {
                        mappedExp = "1_to_3_years";
                      } else if (years > 3 && years <= 5) {
                        mappedExp = "3_to_5_years";
                      } else if (years > 5 && years <= 10) {
                        mappedExp = "5_to_10_years";
                      } else if (years > 10) {
                        mappedExp = "more_than_10_years";
                      }
                    }
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
                    mappedExp = "more_than_10_years";
                  }

                  if (validExperience.includes(mappedExp)) {
                    lead.experience = mappedExp;
                  } else {
                    notesData.push(`Experience: ${value}`);
                  }
                }
                break;

              case "specialty_experience":
                if (value && value.trim()) {
                  notesData.push(`Specialty Experience: ${value}`);
                }
                break;

              case "nationality":
                if (value && value.trim()) {
                  const normalizedNationality = value.toLowerCase().trim();
                  if (
                    normalizedNationality === "not defined" ||
                    normalizedNationality === "undefined" ||
                    normalizedNationality === "n/a" ||
                    normalizedNationality === "not mentioned"
                  ) {
                    break;
                  }
                  const cleanedNationality = value.trim();
                  const validNationalities = [
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
                  const matchedNationality = validNationalities.find(
                    (nat) =>
                      nat.toLowerCase() === cleanedNationality.toLowerCase()
                  );
                  if (matchedNationality) {
                    lead.nationality = matchedNationality;
                  } else {
                    lead.nationality = cleanedNationality;
                  }
                }
                break;

              case "current_location":
                if (value && value.trim()) {
                  const normalizedLocation = value.toLowerCase().trim();
                  if (
                    normalizedLocation === "not defined" ||
                    normalizedLocation === "undefined" ||
                    normalizedLocation === "n/a" ||
                    normalizedLocation === "not mentioned"
                  ) {
                    break;
                  }
                  lead.current_location = value.trim();
                }
                break;

              // Add all your other existing cases here (notes, contact_status, etc.)
              case "notes":
                if (value && value.trim()) {
                  notesData.push(value.trim());
                }
                break;

              case "contact_status":
                if (value && value.trim()) {
                  notesData.push(`Contact Status: ${value}`);
                }
                break;

              case "status_indicator":
                if (value && value.trim()) {
                  notesData.push(`Status: ${value}`);
                }
                break;

              case "last_update":
                if (value && value.trim()) {
                  notesData.push(`Last Updated: ${value}`);
                }
                break;

              case "updated_by":
                if (value && value.trim()) {
                  notesData.push(`Updated By: ${value}`);
                }
                break;

              case "serial_number":
                if (value && value.trim()) {
                  notesData.push(`Serial No: ${value}`);
                }
                break;

              case "date":
                if (value && value.trim()) {
                  notesData.push(`Date: ${value}`);
                }
                break;

              case "tags":
                if (value && value.trim()) {
                  lead.tags = value
                    .split(";")
                    .map((tag: string) => tag.trim())
                    .filter((tag: string) => tag);
                }
                break;

              case "lead_score":
                if (value && value.trim()) {
                  const score = parseInt(value);
                  if (isNaN(score) || score < 0 || score > 100) {
                    errors.push("Invalid lead score (must be 0-100)");
                  } else {
                    lead.lead_score = score;
                  }
                }
                break;

              case "stage":
                if (value && value.trim()) {
                  const stageExists = stages.some(
                    (stage) => stage.name.toLowerCase() === value.toLowerCase()
                  );
                  if (stageExists) {
                    const foundStage = stages.find(
                      (stage) =>
                        stage.name.toLowerCase() === value.toLowerCase()
                    );
                    lead.stage = foundStage?.name || defaultStage;
                  } else {
                    console.warn(
                      `Stage "${value}" not found, using default: ${defaultStage}`
                    );
                    lead.stage = defaultStage;
                  }
                }
                break;

              case "status":
                if (value && value.trim()) {
                  const statusExists = statuses.some(
                    (status) =>
                      status.name.toLowerCase() === value.toLowerCase()
                  );
                  if (statusExists) {
                    const foundStatus = statuses.find(
                      (status) =>
                        status.name.toLowerCase() === value.toLowerCase()
                    );
                    lead.status = foundStatus?.name || defaultStatus;
                  } else {
                    console.warn(
                      `Status "${value}" not found, using default: ${defaultStatus}`
                    );
                    lead.status = defaultStatus;
                  }
                }
                break;

              default:
                if (value && value.trim() && key !== "") {
                  const originalHeader = rawHeaders[headers.indexOf(key)];
                  notesData.push(`${originalHeader}: ${value}`);
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
          lead.isValid = errors.length === 0 && lead.name.trim() !== "";

          leads.push(lead);
        }

        // Separate valid and invalid leads initially
        const initialValidLeads = leads.filter((lead) => lead.isValid);
        const initialInvalidLeads = leads.filter((lead) => !lead.isValid);

        console.log(
          `Parsed ${leads.length} leads: ${initialValidLeads.length} valid, ${initialInvalidLeads.length} invalid`
        );

        // Real-time duplicate checking for valid leads
        if (initialValidLeads.length > 0) {
          try {
            console.log("Checking for duplicates against database...");

            // Prepare data for duplicate check
            const duplicateCheckData = initialValidLeads.map((lead) => ({
              email: lead.email,
              contact_number: lead.contact_number,
            }));

            // Call the duplicate check API
            const duplicateResults = await checkDuplicates(
              duplicateCheckData
            ).unwrap();

            console.log("Duplicate check results:", duplicateResults);

            // Process duplicate results
            const finalValidLeads: ParsedLead[] = [];
            const finalDuplicateLeads: ParsedLead[] = [];

            initialValidLeads.forEach((lead, index) => {
              // Find if this lead is a duplicate
              const duplicateInfo = duplicateResults.duplicates?.find(
                (dup) =>
                  (dup.email &&
                    dup.email.toLowerCase() === lead.email.toLowerCase()) ||
                  (dup.contact_number &&
                    dup.contact_number === lead.contact_number)
              );

              if (duplicateInfo) {
                // Mark as duplicate
                const duplicateReason =
                  duplicateInfo.duplicate_field === "email"
                    ? `Email '${duplicateInfo.duplicate_value}' already exists (Lead ID: ${duplicateInfo.existing_lead_id})`
                    : `Phone '${duplicateInfo.duplicate_value}' already exists (Lead ID: ${duplicateInfo.existing_lead_id})`;

                lead.notes = `DUPLICATE: ${duplicateReason} | ${
                  lead.notes || ""
                }`.trim();
                lead.errors = [
                  ...lead.errors,
                  `Duplicate ${duplicateInfo.duplicate_field} detected`,
                ];
                lead.isValid = false;

                finalDuplicateLeads.push(lead);
              } else {
                finalValidLeads.push(lead);
              }
            });

            console.log(
              `Final results: ${finalValidLeads.length} valid, ${finalDuplicateLeads.length} duplicates`
            );

            // Update state with all categorized leads
            setParsedLeads(leads);
            setValidLeads(finalValidLeads);
            setInvalidLeads(initialInvalidLeads);
            setDuplicateLeads(finalDuplicateLeads);
            setErrors({});

            // Set active tab and show notifications
            if (finalValidLeads.length > 0) {
              setActiveTab("valid");
              showSuccess(
                `${finalValidLeads.length} valid leads ready for upload. ${finalDuplicateLeads.length} duplicates detected.`,
                "CSV Parsed Successfully"
              );
            } else if (finalDuplicateLeads.length > 0) {
              setActiveTab("duplicates");
              showError(
                `${finalDuplicateLeads.length} leads are duplicates. Check the Duplicates tab.`,
                "Duplicates Detected"
              );
            } else {
              setActiveTab("invalid");
              showError("No valid leads found.", "No Valid Leads");
            }
          } catch (duplicateCheckError) {
            console.error("Duplicate check failed:", duplicateCheckError);

            // Fallback: treat all initially valid leads as valid
            setValidLeads(initialValidLeads);
            setDuplicateLeads([]);
            setInvalidLeads(initialInvalidLeads);

            showError(
              `${initialValidLeads.length} leads ready. Could not check duplicates - they will be detected during upload.`,
              "Duplicate Check Failed"
            );

            setActiveTab(initialValidLeads.length > 0 ? "valid" : "invalid");
          }
        } else {
          // No valid leads to check
          setValidLeads([]);
          setDuplicateLeads([]);
          setInvalidLeads(initialInvalidLeads);
          setActiveTab("invalid");

          showError("No valid leads found.", "No Valid Leads");
        }
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

  // Helper function to generate unique phone numbers based on timestamp
  const generateUniquePhoneNumber = (
    timestamp: number,
    rowIndex: number
  ): string => {
    // Convert timestamp to string and extract digits
    const timestampStr = timestamp.toString();
    const rowStr = rowIndex.toString().padStart(3, "0");

    // Create a 10-digit number using timestamp and row index
    // Format: 9XXXXXXXXX (starting with 9 to make it look like a mobile number)
    const lastDigits = timestampStr.slice(-6); // Get last 6 digits of timestamp
    const phoneNumber = `9${lastDigits}${rowStr}`.slice(0, 10);

    return phoneNumber;
  };

  const getAssignmentValue = (config: any): string => {
    switch (config.type) {
      case "unassigned":
        return "unassigned";
      case "manual":
        return config.assigned_to || "unassigned";
      case "selective_round_robin":
        // Let backend handle round-robin logic
        return ""; // Empty string triggers round-robin
      default:
        return "unassigned";
    }
  };

  const handleUpload = async () => {
    if (validLeads.length === 0) {
      setErrors({ upload: "No valid leads to upload" });
      return;
    }

    if (
      assignmentConfig.type === "selective_round_robin" &&
      (!assignmentConfig.assigned_users ||
        assignmentConfig.assigned_users.length === 0)
    ) {
      setErrors({
        upload:
          "Please select at least one counselor for round robin assignment",
      });
      return;
    }
    const leadsToUploadCount = validLeads.length;
    console.log(`🚀 Starting upload of ${leadsToUploadCount} leads`);
    setIsUploading(true);
    setUploadProgress(0);
    setUploadResults(null);

    try {
      const leadsToCreate: FlatBulkLeadData[] = validLeads.map((lead) => ({
        name: lead.name,
        email: lead.email,
        contact_number: lead.contact_number,
        source: selectedSource,
        category: selectedCategory,
        age: lead.age,
        date_of_birth: lead.date_of_birth,
        experience: lead.experience,
        nationality: lead.nationality,
        current_location: lead.current_location,
        country_of_interest: lead.country_of_interest,
        course_level: lead.course_level,
        stage: lead.stage,
        status: defaultStatus,
        lead_score: lead.lead_score || 0,
        tags: lead.tags || [],
        notes: lead.notes || "",
        assigned_to: getAssignmentValue(assignmentConfig),
      }));

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      // Determine assignment method and emails based on new config
      let assignment_method: string | undefined;
      let selected_user_emails: string | undefined;

      if (assignmentConfig.type === "selective_round_robin") {
        assignment_method = "selected_users";
        selected_user_emails = assignmentConfig.assigned_users?.join(",");
      } else if (assignmentConfig.type === "manual") {
        assignment_method = "selected_users";
        selected_user_emails = assignmentConfig.assigned_to;
      } else {
        // unassigned - no assignment
        assignment_method = undefined;
        selected_user_emails = undefined;
      }

      const result = await bulkCreateLeads({
        leads: leadsToCreate,
        force_create: false,
        assignment_method,
        selected_user_emails,
      }).unwrap();

      clearInterval(progressInterval);
      setUploadProgress(100);

      // ✅ DEBUG: Log the actual API response structure
      console.log("🔍 API Response:", result);

      const processedResult = {
        ...result,
        created_count: result?.successful_creates || 0,
        duplicates_count: result?.duplicates_skipped || 0,
        failed_count: result?.failed_creates || 0,
        total_attempted: result?.total_attempted || leadsToUploadCount,
      };

      setUploadResults(processedResult);

      // ✅ USE CAPTURED COUNT for notification (reliable fallback)
      const actualCreatedCount =
        processedResult.created_count || leadsToUploadCount;

      console.log(
        `✅ Upload complete: API says ${processedResult.created_count}, we attempted ${leadsToUploadCount}`
      );

      // Show simple success notification with reliable count
      showSuccess(
        `${actualCreatedCount} ${
          actualCreatedCount === 1 ? "lead" : "leads"
        } uploaded successfully`,
        "Upload Complete"
      );

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess({
          success: true,
          created_count: actualCreatedCount, // ✅ Use reliable count
          duplicates_count: processedResult.duplicates_count,
          failed_count: processedResult.failed_count,
          total_attempted: leadsToUploadCount, // ✅ Use captured count
          message: result?.message || "Leads processed successfully",
        });
      }

      // Close modal immediately
      setTimeout(() => {
        handleModalClose();
      }, 500);
    } catch (error: unknown) {
      setUploadProgress(0);

      console.error("Bulk upload error:", error);

      let errorMessage = "Failed to upload leads";
      let duplicateInfo = "";

      // ✅ FIXED: Type the error properly and use consistent variable naming
      const typedError = error as BulkUploadError;

      // Enhanced error handling for different error types
      if (typedError?.data) {
        // Handle RTK Query errors
        if (typedError.data?.detail) {
          if (Array.isArray(typedError.data.detail)) {
            // ✅ FIXED: Use typedError consistently and proper typing
            errorMessage = typedError.data.detail
              .map((e: { msg: string }) => e.msg)
              .join(", ");
          } else if (typeof typedError.data.detail === "string") {
            // ✅ FIXED: Use typedError consistently
            errorMessage = typedError.data.detail;
          }
        } else if (typedError.data?.message) {
          // ✅ FIXED: Use typedError consistently
          errorMessage = typedError.data.message;
        }

        // Check for bulk operation results in error response
        if (typedError.data?.summary) {
          // ✅ FIXED: Use typedError consistently
          const summary = typedError.data.summary;
          duplicateInfo = `Created: ${
            summary.successful_creates || 0
          }, Duplicates: ${summary.duplicates_skipped || 0}, Failed: ${
            summary.failed_creates || 0
          }`;
        }
      } else if (typedError?.message) {
        // ✅ FIXED: Use typedError consistently
        errorMessage = typedError.message;
      }

      // Show appropriate error message
      const fullErrorMessage = duplicateInfo
        ? `${errorMessage}. ${duplicateInfo}`
        : errorMessage;

      setErrors({ upload: fullErrorMessage });

      showError(fullErrorMessage, "Upload Error");
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setCsvFile(null);
    setParsedLeads([]);
    setValidLeads([]);
    setInvalidLeads([]);
    setDuplicateLeads([]);
    setUploadProgress(0);
    setUploadResults(null);
    setErrors({});
    setIsUploading(false);
    setAssignmentConfig({ type: "unassigned" });
    setActiveTab("valid");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Reset everything when modal closes
  const handleModalClose = () => {
    resetUpload(); // Clear all data
    onClose(); // Call the original close handler
  };

  // Handle field editing for invalid leads
  const handleFieldEdit = (
    leadIndex: number,
    fieldName: string,
    newValue: string | number
  ) => {
    const updatedInvalidLeads = [...invalidLeads];
    const lead = updatedInvalidLeads[leadIndex];

    // Update the field value
    if (fieldName === "name") {
      lead.name = newValue.toString().trim();
    } else if (fieldName === "email") {
      lead.email = newValue.toString().toLowerCase().trim();
    } else if (fieldName === "contact_number") {
      // Clean phone number
      const cleanedPhone = newValue.toString().replace(/[\s\-\(\)\+]/g, "");
      lead.contact_number = cleanedPhone;
    } else if (fieldName === "lead_score") {
      const score = 0;
      lead.lead_score = Math.max(0, Math.min(100, score)); // Clamp between 0-100
    }

    // Re-validate the lead
    const errors: string[] = [];

    // Validate name
    if (!lead.name || lead.name.trim() === "") {
      errors.push("Name is required");
    }

    // Validate email
    if (!lead.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
      errors.push("Valid email is required");
    }

    // Validate contact number
    if (!lead.contact_number || !/^\d{10,15}$/.test(lead.contact_number)) {
      errors.push("Valid phone number (10-15 digits) is required");
    }

    // Validate lead score
    if (lead.lead_score < 0 || lead.lead_score > 100) {
      errors.push("Lead score must be between 0-100");
    }

    // Update validation status
    lead.errors = errors;
    lead.isValid = errors.length === 0;

    // Check if lead is now valid
    if (lead.isValid) {
      // Move to valid leads
      const updatedValidLeads = [...validLeads, lead];
      const filteredInvalidLeads = updatedInvalidLeads.filter(
        (_, index) => index !== leadIndex
      );

      setValidLeads(updatedValidLeads);
      setInvalidLeads(filteredInvalidLeads);

      // Show success notification
      showSuccess(
        `Lead "${lead.name}" has been fixed and moved to Valid leads!`,
        "Lead Fixed"
      );

      // Switch to valid tab if this was the last invalid lead
      if (filteredInvalidLeads.length === 0) {
        setActiveTab("valid");
      }
    } else {
      // Update invalid leads array
      setInvalidLeads(updatedInvalidLeads);
    }

    // Update parsed leads as well
    const updatedParsedLeads = parsedLeads.map((parsedLead) => {
      if (parsedLead.index === lead.index) {
        return lead;
      }
      return parsedLead;
    });
    setParsedLeads(updatedParsedLeads);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent
        className="max-w-7xl w-[95vw] max-h-[95vh] h-[95vh] flex flex-col overflow-y-auto"
        style={{ maxHeight: "95vh", minWidth: "85%" }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Lead Upload
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Upload a CSV file to add multiple leads. Configure settings and
            review uploaded data before processing.
          </p>
        </DialogHeader>

        <div className="grid md:grid-cols-3 grid-cols-1 gap-6">
          {/* Left Side - Configuration */}
          <div className="space-y-4">
            {/* Lead Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Lead Configuration</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Applied to all leads in this batch
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>
                    Lead Category <span className="text-red-500">*</span>
                  </Label>
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
                  <Label htmlFor="source" className="text-sm font-medium">
                    Source <span className="text-red-500">*</span>
                  </Label>
                  <SourceDropdown
                    value={selectedSource}
                    onValueChange={setSelectedSource}
                    placeholder="Select source for all leads"
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Important Notes */}
            <ImportantNotesCard />
          </div>

          {/* Middle - File Upload & Preview */}
          <div className="space-y-4">
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
                <LeadAssignmentDropdown
                  mode="create"
                  currentAssignment="unassigned"
                  onAssignmentChange={setAssignmentConfig}
                  disabled={isUploading}
                  showLabel={false}
                  className="w-full"
                />

                {/* Assignment Summary */}
                {assignmentConfig.type !== "unassigned" && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm font-medium text-blue-900">
                      Assignment Summary:
                    </div>
                    <div className="text-sm text-blue-700 mt-1">
                      {assignmentConfig.type === "selective_round_robin" &&
                        assignmentConfig.assigned_users?.length &&
                        `Round robin among ${assignmentConfig.assigned_users.length} selected counselors`}
                      {assignmentConfig.type === "manual" &&
                        assignmentConfig.assigned_to &&
                        `All leads will be assigned to ${assignmentConfig.assigned_to}`}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            {/* File Upload */}
            <Card>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      Upload CSV File
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Click to choose your CSV file
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
                    {csvFile && (
                      <div className="text-xs mt-2 text-muted-foreground">
                        Look Below for details of the uploded leads
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

            {/* Stage & Status Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Default Values
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
          </div>

          {/* Right Side - Rules & Guidelines */}
          <div className="space-y-4">
            {/* CSV Format Rules */}
            <CSVFormatRulesCard />

            {/* Header Mapping Rules */}
            <HeaderMappingRulesCard />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 w-full ">
          {/* Summary Cards */}
          {parsedLeads.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold">
                Leads CSV Upload Summary:
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-green-50 rounded-lg border">
                  <div className="text-2xl font-bold text-green-600">
                    {validLeads.length}
                  </div>
                  <div className="text-sm text-green-800">Valid</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg border">
                  <div className="text-2xl font-bold text-yellow-600">
                    {duplicateLeads.length}
                  </div>
                  <div className="text-sm text-yellow-800">Duplicates</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg border">
                  <div className="text-2xl font-bold text-red-600">
                    {invalidLeads.length}
                  </div>
                  <div className="text-sm text-red-800">Invalid</div>
                </div>
              </div>
            </div>
          )}

          {/* Tabbed Preview Section */}
          <div className="space-y-4 border rounded-lg p-4 flex-1">
            <div>
              <h3 className="text-lg font-semibold">
                Review Leads ({parsedLeads.length} total)
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
                <>
                  {/* Tab Navigation */}
                  <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger
                        value="valid"
                        className="flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Valid ({validLeads.length})
                      </TabsTrigger>
                      <TabsTrigger
                        value="duplicates"
                        className="flex items-center gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        Duplicates ({duplicateLeads.length})
                      </TabsTrigger>
                      <TabsTrigger
                        value="invalid"
                        className="flex items-center gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        Invalid ({invalidLeads.length})
                      </TabsTrigger>
                    </TabsList>

                    {/* Valid Leads Tab */}
                    <TabsContent value="valid" className="mt-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-green-600">
                            Ready for Upload ({validLeads.length} leads)
                          </h4>
                          {validLeads.length > 0 && (
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700"
                            >
                              All requirements met
                            </Badge>
                          )}
                        </div>

                        {validLeads.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <CheckCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                            <p>No valid leads found</p>
                            <p className="text-sm">
                              Check other tabs for issues
                            </p>
                          </div>
                        ) : (
                          <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                            <Table>
                              <TableHeader className="sticky top-0 bg-background">
                                <TableRow>
                                  <TableHead className="w-8">Actions</TableHead>
                                  <TableHead className="w-8">#</TableHead>
                                  <TableHead className="min-w-32">
                                    Name
                                  </TableHead>
                                  <TableHead className="min-w-40">
                                    Email
                                  </TableHead>
                                  <TableHead className="min-w-32">
                                    Contact
                                  </TableHead>
                                  <TableHead className="min-w-24">
                                    Stage
                                  </TableHead>
                                  <TableHead className="min-w-24">
                                    Status
                                  </TableHead>
                                  <TableHead className="min-w-20">
                                    Score
                                  </TableHead>
                                  <TableHead className="min-w-40">
                                    Notes
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {validLeads.map((lead, leadIndex) => (
                                  <TableRow
                                    key={`valid-${lead.index}-${leadIndex}`}
                                    className="hover:bg-green-50"
                                  >
                                    <TableCell className="p-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          // Remove from valid leads completely (poof!)
                                          const updatedValid =
                                            validLeads.filter(
                                              (_, index) => index !== leadIndex
                                            );
                                          setValidLeads(updatedValid);

                                          // Also remove from parsedLeads
                                          const updatedParsed =
                                            parsedLeads.filter(
                                              (parsedLead) =>
                                                parsedLead.index !== lead.index
                                            );
                                          setParsedLeads(updatedParsed);
                                        }}
                                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
                                        title="Remove this lead completely"
                                      >
                                        <XCircle className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                    <TableCell className="text-xs font-mono">
                                      {lead.index}
                                    </TableCell>
                                    <TableCell className="font-medium text-sm">
                                      {lead.name}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                      {lead.email}
                                    </TableCell>
                                    <TableCell className="text-sm font-mono">
                                      {lead.contact_number}
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant="outline"
                                        className="text-xs bg-blue-50 text-blue-700"
                                      >
                                        {lead.stage}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant="outline"
                                        className="text-xs bg-green-50 text-green-700"
                                      >
                                        {lead.status}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {lead.lead_score}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm max-w-40">
                                      {lead.notes ? (
                                        <div
                                          className="truncate"
                                          title={lead.notes}
                                        >
                                          {lead.notes}
                                        </div>
                                      ) : (
                                        <span className="text-gray-400">
                                          None
                                        </span>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    {/* Duplicates Tab */}
                    <TabsContent value="duplicates" className="mt-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-yellow-600">
                            Duplicate Leads ({duplicateLeads.length} leads)
                          </h4>
                          {duplicateLeads.length > 0 && (
                            <Badge
                              variant="outline"
                              className="bg-yellow-50 text-yellow-700"
                            >
                              Will be skipped
                            </Badge>
                          )}
                        </div>

                        {duplicateLeads.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Copy className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                            <p>No duplicate leads found</p>
                            <p className="text-sm">
                              Great! All leads are unique
                            </p>
                          </div>
                        ) : (
                          <>
                            <Alert>
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>
                                These leads already exist in the database and
                                will be skipped during upload.
                              </AlertDescription>
                            </Alert>

                            <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                              <Table>
                                <TableHeader className="sticky top-0 bg-background">
                                  <TableRow>
                                    <TableHead className="w-8">#</TableHead>
                                    <TableHead className="min-w-32">
                                      Name
                                    </TableHead>
                                    <TableHead className="min-w-40">
                                      Email
                                    </TableHead>
                                    <TableHead className="min-w-32">
                                      Contact
                                    </TableHead>
                                    <TableHead className="min-w-32">
                                      Duplicate Reason
                                    </TableHead>
                                    <TableHead className="min-w-40">
                                      Notes
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {duplicateLeads.map((lead, leadIndex) => (
                                    <TableRow
                                      key={`duplicate-${lead.index}-${leadIndex}`}
                                      className="hover:bg-yellow-50"
                                    >
                                      <TableCell className="text-xs font-mono">
                                        {lead.index}
                                      </TableCell>
                                      <TableCell className="font-medium text-sm">
                                        {lead.name}
                                      </TableCell>
                                      <TableCell className="text-sm">
                                        {lead.email}
                                      </TableCell>
                                      <TableCell className="text-sm font-mono">
                                        {lead.contact_number}
                                      </TableCell>
                                      <TableCell>
                                        <Badge
                                          variant="destructive"
                                          className="text-xs"
                                        >
                                          {lead.errors[
                                            lead.errors.length - 1
                                          ] || "Duplicate detected"}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-sm max-w-40">
                                        {lead.notes ? (
                                          <div
                                            className="truncate"
                                            title={lead.notes}
                                          >
                                            {lead.notes}
                                          </div>
                                        ) : (
                                          <span className="text-gray-400">
                                            None
                                          </span>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </>
                        )}
                      </div>
                    </TabsContent>

                    {/* Invalid Leads Tab */}
                    <TabsContent value="invalid" className="mt-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-red-600">
                            Invalid Leads ({invalidLeads.length} leads)
                          </h4>
                          {invalidLeads.length > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              Click cells to edit
                            </Badge>
                          )}
                        </div>

                        {invalidLeads.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <XCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                            <p>No invalid leads found</p>
                            <p className="text-sm">
                              All data meets requirements
                            </p>
                          </div>
                        ) : (
                          <>
                            <Alert>
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>
                                <div className="font-medium text-orange-800 mb-1">
                                  Edit Invalid Fields
                                </div>
                                <div className="text-orange-700 text-sm">
                                  Click on red fields to edit them. Fixed leads
                                  will automatically move to the Valid tab.
                                </div>
                              </AlertDescription>
                            </Alert>

                            <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                              <Table>
                                <TableHeader className="sticky top-0 bg-background">
                                  <TableRow>
                                    <TableHead className="w-8">
                                      Actions
                                    </TableHead>
                                    <TableHead className="w-8">#</TableHead>
                                    <TableHead className="min-w-32">
                                      Name *
                                    </TableHead>
                                    <TableHead className="min-w-40">
                                      Email *
                                    </TableHead>
                                    <TableHead className="min-w-32">
                                      Contact *
                                    </TableHead>
                                    <TableHead className="min-w-20">
                                      Lead Score
                                    </TableHead>
                                    <TableHead className="min-w-32">
                                      Errors
                                    </TableHead>
                                    <TableHead className="min-w-40">
                                      Notes
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {invalidLeads.map((lead, leadIndex) => (
                                    <TableRow
                                      key={`invalid-${lead.index}-${leadIndex}`}
                                      className="hover:bg-red-50"
                                    >
                                      <TableCell className="p-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            // Remove from invalid leads completely (poof!)
                                            const updatedInvalid =
                                              invalidLeads.filter(
                                                (_, index) =>
                                                  index !== leadIndex
                                              );
                                            setInvalidLeads(updatedInvalid);

                                            // Also remove from parsedLeads
                                            const updatedParsed =
                                              parsedLeads.filter(
                                                (parsedLead) =>
                                                  parsedLead.index !==
                                                  lead.index
                                              );
                                            setParsedLeads(updatedParsed);
                                          }}
                                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
                                          title="Remove this lead completely"
                                        >
                                          <XCircle className="h-4 w-4" />
                                        </Button>
                                      </TableCell>
                                      <TableCell className="text-xs font-mono">
                                        {lead.index}
                                      </TableCell>

                                      {/* Editable Name Field */}
                                      <TableCell className="p-1">
                                        <EditableField
                                          value={lead.name}
                                          placeholder="Enter name"
                                          hasError={
                                            !lead.name ||
                                            lead.name.trim() === ""
                                          }
                                          onSave={(newValue) =>
                                            handleFieldEdit(
                                              leadIndex,
                                              "name",
                                              newValue
                                            )
                                          }
                                          type="text"
                                        />
                                      </TableCell>

                                      {/* Editable Email Field */}
                                      <TableCell className="p-1">
                                        <EditableField
                                          value={lead.email}
                                          placeholder="Enter email"
                                          hasError={
                                            !lead.email ||
                                            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                                              lead.email
                                            )
                                          }
                                          onSave={(newValue) =>
                                            handleFieldEdit(
                                              leadIndex,
                                              "email",
                                              newValue
                                            )
                                          }
                                          type="email"
                                        />
                                      </TableCell>

                                      {/* Editable Contact Field */}
                                      <TableCell className="p-1">
                                        <EditableField
                                          value={lead.contact_number}
                                          placeholder="Enter phone"
                                          hasError={
                                            !lead.contact_number ||
                                            !/^\d{10,15}$/.test(
                                              lead.contact_number.replace(
                                                /[\s\-\(\)\+]/g,
                                                ""
                                              )
                                            )
                                          }
                                          onSave={(newValue) =>
                                            handleFieldEdit(
                                              leadIndex,
                                              "contact_number",
                                              newValue
                                            )
                                          }
                                          type="tel"
                                        />
                                      </TableCell>

                                      {/* Editable Lead Score Field */}
                                      <TableCell className="p-1">
                                        <EditableField
                                          value={
                                            lead.lead_score?.toString() || "0"
                                          }
                                          placeholder="0-100"
                                          hasError={lead.errors.some((error) =>
                                            error.includes("lead score")
                                          )}
                                          onSave={(newValue) =>
                                            handleFieldEdit(
                                              leadIndex,
                                              "lead_score",
                                              parseInt(newValue) || 0
                                            )
                                          }
                                          type="number"
                                        />
                                      </TableCell>

                                      <TableCell>
                                        <div className="space-y-1">
                                          {lead.errors
                                            .slice(0, 2)
                                            .map((error, idx) => (
                                              <Badge
                                                key={idx}
                                                variant="destructive"
                                                className="text-xs block"
                                              >
                                                {error}
                                              </Badge>
                                            ))}
                                          {lead.errors.length > 2 && (
                                            <Badge
                                              variant="outline"
                                              className="text-xs"
                                              title={lead.errors
                                                .slice(2)
                                                .join(", ")}
                                            >
                                              +{lead.errors.length - 2} more
                                            </Badge>
                                          )}
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-sm max-w-40">
                                        {lead.notes ? (
                                          <div
                                            className="truncate"
                                            title={lead.notes}
                                          >
                                            {lead.notes}
                                          </div>
                                        ) : (
                                          <span className="text-gray-400">
                                            None
                                          </span>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>

                  {/* Upload Progress */}
                  {isUploading && (
                    <div className="space-y-2 mt-4">
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
                    className="w-full mt-4"
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
                    <Alert variant="destructive" className="mt-4">
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
