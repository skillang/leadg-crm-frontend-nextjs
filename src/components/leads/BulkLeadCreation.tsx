import React, { useMemo, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Edit2, Check, X } from "lucide-react";
import { useGetLeadsQuery } from "@/redux/slices/leadsApi";
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
  User,
  Loader2,
  Info,
  FileType,
} from "lucide-react";
import {
  useBulkCreateLeadsFlatMutation,
  useGetAssignableUsersWithDetailsQuery,
} from "@/redux/slices/leadsApi";
import { useGetCategoriesQuery } from "@/redux/slices/categoriesApi";
import { useGetStagesQuery } from "@/redux/slices/stagesApi";
import { useGetStatusesQuery } from "@/redux/slices/statusesApi";
import MultiSelect, {
  transformUsersToOptions,
} from "@/components/common/MultiSelect";
import { useNotifications } from "../common/NotificationSystem";
import SourceDropdown from "../common/SourceDropdown";

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

interface ExistingLead {
  id: string;
  email?: string;
  contact?: string;
  contact_number?: string;
  phoneNumber?: string;
  basic_info?: {
    email?: string;
    contact_number?: string;
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
  const [duplicateLeads, setDuplicateLeads] = useState<ParsedLead[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_uploadResults, setUploadResults] = useState<UploadResult | null>(
    null
  );
  const [activeTab, setActiveTab] = useState("valid");

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

  const { data: stagesResponse, isLoading: stagesLoading } = useGetStagesQuery({
    active_only: true,
  });

  const { data: statusesResponse, isLoading: statusesLoading } =
    useGetStatusesQuery({
      active_only: true,
    });

  // Get existing leads for duplicate checking
  const { data: existingLeadsResponse } = useGetLeadsQuery({});

  const [bulkCreateLeads] = useBulkCreateLeadsFlatMutation();

  const assignableUsers = assignableUsersResponse?.users || [];
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

  // Transform users to MultiSelect options
  const counselorOptions = transformUsersToOptions(
    assignableUsers.filter((user) => user.is_active)
  );

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

  const parseCSV = (file: File) => {
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

        // ✅ FIXED: Use proper CSV parsing for headers
        const rawHeaders = parseCSVLine(lines[0]).map((h) =>
          h.replace(/"/g, "").trim()
        );
        const headers = rawHeaders.map(normalizeHeader);

        console.log("🔍 DEBUG - Raw Headers:", rawHeaders);
        console.log("🔍 DEBUG - Normalized Headers:", headers);

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
        const duplicateChecks: Array<{
          email: string;
          contact_number: string;
        }> = [];
        const baseTimestamp = Date.now();

        for (let i = 1; i < lines.length; i++) {
          // ✅ FIXED: Use proper CSV parsing for data rows
          const values = parseCSVLine(lines[i]).map((v) =>
            v.trim().replace(/"/g, "")
          );

          const errors: string[] = [];
          const notesData: string[] = [];

          // Debug the first few rows
          if (i <= 3) {
            console.log(`🔍 Row ${i} Raw Values:`, values);
            console.log(`🔍 Row ${i} Headers Length:`, headers.length);
            console.log(`🔍 Row ${i} Values Length:`, values.length);
          }

          // Create unique identifier for this row
          const rowTimestamp = baseTimestamp + i;
          const uniqueId = `${rowTimestamp}${i.toString().padStart(3, "0")}`;

          // Create lead object with defaults assigned upfront
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

          // Map CSV values to lead properties
          headers.forEach((key, index) => {
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
                  // ✅ NEW: Use enhanced phone cleaning that handles scientific notation
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

                  // ✅ Skip invalid/undefined values
                  if (
                    normalizedAge === "not defined" ||
                    normalizedAge === "undefined" ||
                    normalizedAge === "n/a" ||
                    normalizedAge === "not mentioned"
                  ) {
                    break; // Skip processing
                  }

                  // ✅ NEW: Use enhanced age extraction
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

                  // ✅ Skip invalid/undefined values
                  if (
                    normalizedDob === "not defined" ||
                    normalizedDob === "undefined" ||
                    normalizedDob === "n/a" ||
                    normalizedDob === "not mentioned"
                  ) {
                    break; // Skip processing
                  }

                  // ✅ NEW: Use enhanced date conversion that handles more formats
                  const convertedDate = convertToYYYYMMDD(value.trim());
                  if (convertedDate) {
                    lead.date_of_birth = convertedDate;
                    console.log(
                      `✅ Date converted: "${value}" → "${convertedDate}"`
                    );
                  } else {
                    // Invalid date - add to notes instead
                    notesData.push(
                      `Date of Birth: ${value} (unsupported format)`
                    );
                    console.warn(`❌ Date conversion failed for: "${value}"`);
                  }
                }
                break;
              case "experience":
                if (value && value.trim()) {
                  const normalizedExp = value.toLowerCase().trim();

                  // ✅ Skip invalid/undefined values
                  if (
                    normalizedExp === "not defined" ||
                    normalizedExp === "undefined" ||
                    normalizedExp === "n/a" ||
                    normalizedExp === "not mentioned"
                  ) {
                    break; // Skip processing
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

                  // ✅ Enhanced pattern matching for your CSV format
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
                    // Handle formats like "2 years 0 months", "1 year 6 months"
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
                    // ✅ Put full experience details in notes for complex descriptions
                    notesData.push(`Experience: ${value}`);
                  }
                }
                break;

              case "specialty_experience":
                if (value && value.trim()) {
                  notesData.push(`Specialty Experience: ${value}`);
                }
                break;

              // ✅ FIXED: Nationality processing
              case "nationality":
                if (value && value.trim()) {
                  const normalizedNationality = value.toLowerCase().trim();

                  // ✅ Skip invalid/undefined values
                  if (
                    normalizedNationality === "not defined" ||
                    normalizedNationality === "undefined" ||
                    normalizedNationality === "n/a" ||
                    normalizedNationality === "not mentioned"
                  ) {
                    break; // Skip processing
                  }

                  // Clean and validate nationality
                  const cleanedNationality = value.trim();

                  // List of valid nationalities - you can expand this
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

                  // Try to find a match (case insensitive)
                  const matchedNationality = validNationalities.find(
                    (nat) =>
                      nat.toLowerCase() === cleanedNationality.toLowerCase()
                  );

                  if (matchedNationality) {
                    lead.nationality = matchedNationality;
                  } else {
                    // If not in predefined list, use the cleaned value
                    lead.nationality = cleanedNationality;
                  }
                }
                break;

              // ✅ FIXED: Current location processing (was missing break statement)
              case "current_location":
                if (value && value.trim()) {
                  const normalizedLocation = value.toLowerCase().trim();
                  if (
                    normalizedLocation === "not defined" ||
                    normalizedLocation === "undefined" ||
                    normalizedLocation === "n/a" ||
                    normalizedLocation === "not mentioned"
                  ) {
                    break; // Skip processing
                  }

                  lead.current_location = value.trim();
                }
                break;

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
                    .map((tag) => tag.trim())
                    .filter((tag) => tag);
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
                // Handle any unmapped columns by adding to notes
                if (value && value.trim() && key !== "") {
                  const originalHeader = rawHeaders[headers.indexOf(key)];
                  notesData.push(`${originalHeader}: ${value}`);
                }
                break;
            }
          });

          console.log(`🔍 Row ${i} Debug:`, {
            rawValues: values.slice(0, 15), // First 15 columns
            extractedData: {
              name: lead.name,
              email: lead.email,
              age: lead.age,
              date_of_birth: lead.date_of_birth,
              nationality: lead.nationality,
              current_location: lead.current_location,
              notes: lead.notes,
            },
          });

          // Combine all notes data
          if (notesData.length > 0) {
            lead.notes = notesData.join(" | ");
          }

          // Set validation status - now only check for name since email/phone are auto-generated
          lead.errors = errors;
          lead.isValid = errors.length === 0 && lead.name.trim() !== "";

          if (!lead.isValid) {
            console.log(`Lead ${i} is invalid:`, {
              name: lead.name,
              email: lead.email,
              contact_number: lead.contact_number,
              errors: errors,
            });
          }

          leads.push(lead);

          // Add to duplicate check list (only for valid leads)
          if (lead.isValid) {
            duplicateChecks.push({
              email: lead.email,
              contact_number: lead.contact_number,
            });
          }
        }

        // Check for duplicates against database before showing in modal
        console.log("🔍 Checking for duplicates against database...");
        const duplicateResults = checkForDuplicates(duplicateChecks);

        // Filter out duplicates from valid leads
        const finalValidLeads: ParsedLead[] = [];
        const finalDuplicateLeads: ParsedLead[] = [];
        const finalInvalidLeads: ParsedLead[] = [];

        leads.forEach((lead) => {
          if (!lead.isValid) {
            finalInvalidLeads.push(lead);
            return;
          }

          // Check if this lead is a duplicate
          const duplicateInfo = duplicateResults.find(
            (dup) =>
              dup.email === lead.email ||
              dup.contact_number === lead.contact_number
          );

          if (duplicateInfo) {
            // Mark as duplicate and add note
            lead.notes = `DUPLICATE: ${duplicateInfo.reason} | ${
              lead.notes || ""
            }`.trim();
            lead.errors = [...lead.errors, duplicateInfo.reason];
            lead.isValid = false;
            finalDuplicateLeads.push(lead);
          } else {
            finalValidLeads.push(lead);
          }
        });

        console.log(
          `🔍 Duplicate check complete: ${finalDuplicateLeads.length} duplicates found`
        );

        // Update state with separate duplicate tracking
        setParsedLeads(leads);
        setValidLeads(finalValidLeads);
        setInvalidLeads(finalInvalidLeads);
        setDuplicateLeads(finalDuplicateLeads);
        setErrors({});

        // Set active tab based on results
        if (finalValidLeads.length > 0) {
          setActiveTab("valid");
        } else if (finalDuplicateLeads.length > 0) {
          setActiveTab("duplicates");
        } else {
          setActiveTab("invalid");
        }

        // Show summary notification
        if (finalDuplicateLeads.length > 0) {
          showError(
            `${finalDuplicateLeads.length} leads already exist in the database and have been separated into the Duplicates tab.`,
            "Duplicates Detected"
          );
        } else if (finalValidLeads.length > 0) {
          showSuccess(
            `${finalValidLeads.length} valid leads ready for upload. No duplicates detected.`,
            "CSV Parsed Successfully"
          );
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

  // Helper function to check duplicates against existing leads
  const checkForDuplicates = (
    leads: Array<{ email: string; contact_number: string }>
  ) => {
    let existingLeads: ExistingLead[] = [];

    if (existingLeadsResponse) {
      if (Array.isArray(existingLeadsResponse)) {
        // Direct array format
        existingLeads = existingLeadsResponse;
      } else if (
        existingLeadsResponse.leads &&
        Array.isArray(existingLeadsResponse.leads)
      ) {
        // Paginated response format
        existingLeads = existingLeadsResponse.leads;
      }
    }

    if (existingLeads.length === 0) {
      console.log("No existing leads data available for duplicate check");
      return [];
    }

    const duplicates: Array<{
      email: string;
      contact_number: string;
      reason: string;
    }> = [];

    for (const lead of leads) {
      // Check for email duplicates (case insensitive)
      const isDuplicateEmail = existingLeads.some((existing: ExistingLead) => {
        const existingEmail = existing.email || existing.basic_info?.email;
        return (
          existingEmail &&
          existingEmail.toLowerCase() === lead.email.toLowerCase()
        );
      });

      // Check for phone number duplicates
      const isDuplicatePhone = existingLeads.some((existing: ExistingLead) => {
        const existingPhone =
          existing.contact ||
          existing.contact_number ||
          existing.phoneNumber ||
          existing.basic_info?.contact_number;
        return existingPhone && existingPhone === lead.contact_number;
      });

      if (isDuplicateEmail || isDuplicatePhone) {
        duplicates.push({
          email: lead.email,
          contact_number: lead.contact_number,
          reason: isDuplicateEmail
            ? "Email already exists"
            : "Phone number already exists",
        });
      }
    }

    console.log(
      `🔍 Duplicate check complete: ${duplicates.length} duplicates found out of ${leads.length} leads`
    );
    console.log(`📊 Checked against ${existingLeads.length} existing leads`);
    return duplicates;
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

  const handleUpload = async () => {
    if (validLeads.length === 0) {
      setErrors({ upload: "No valid leads to upload" });
      return;
    }

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
      }));

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

      const processedResult = {
        ...result,
        created_count: result?.successful_creates || 0,
        duplicates_count: result?.duplicates_skipped || 0,
        failed_count: result?.failed_creates || 0,
        total_attempted: result?.total_attempted || validLeads.length,
      };

      setUploadResults(processedResult);

      // Show simple success notification and close modal immediately
      const createdCount = processedResult.created_count;
      showSuccess(
        `${createdCount} ${
          createdCount === 1 ? "lead" : "leads"
        } uploaded successfully`,
        "Upload Complete"
      );

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess({
          success: true,
          created_count: processedResult.created_count,
          duplicates_count: processedResult.duplicates_count,
          failed_count: processedResult.failed_count,
          total_attempted: processedResult.total_attempted, // ✅ This was missing
          message: result?.message || "Leads processed successfully",
          // results: result?.results || [],
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
    setAutoAssign(true);
    setAssignmentMethod("all_users");
    setSelectedCounselors([]);
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
        className="max-w-7xl w-[95vw] max-h-[95vh] overflow-y-auto"
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

        <div className="grid grid-cols-3 gap-6 h-[700px]">
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

                        {selectedCounselors.length > 0 && (
                          <div className="text-xs text-muted-foreground p-2 bg-blue-50 rounded">
                            Leads will be distributed among{" "}
                            {selectedCounselors.length} selected counselors
                            using round-robin
                          </div>
                        )}
                      </div>
                    )}

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

          {/* Middle - File Upload & Preview */}
          <div className="space-y-4">
            {/* File Upload */}
            <Card>
              <CardContent className="p-6">
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

            {/* Summary Cards */}
            {parsedLeads.length > 0 && (
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
                                    <TableHead className="w-8">
                                      Actions
                                    </TableHead>
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
                                                (_, index) =>
                                                  index !== leadIndex
                                              );
                                            setValidLeads(updatedValid);

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
                                    Click on red fields to edit them. Fixed
                                    leads will automatically move to the Valid
                                    tab.
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
                                            hasError={lead.errors.some(
                                              (error) =>
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

          {/* Right Side - Rules & Guidelines */}
          <div className="space-y-4">
            {/* CSV Format Rules */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  CSV Upload Rules
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Required Columns */}
                <div>
                  <h4 className="font-semibold text-sm text-red-600 mb-2">
                    🔴 Required Columns (Must Include):
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex flex-wrap items-center gap-1">
                      <Badge variant="destructive" className="text-xs">
                        name
                      </Badge>
                      <Badge variant="destructive" className="text-xs">
                        email
                      </Badge>
                      <Badge variant="destructive" className="text-xs">
                        contact_number
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Optional Columns */}
                <div>
                  <h4 className="font-semibold text-sm text-green-600 mb-2">
                    🟢 Optional Columns:
                  </h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex flex-wrap items-center gap-1">
                      <Badge variant="outline" className="text-xs">
                        age
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        nationality
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        current_location
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        experience
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        country_of_interest
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        course_level
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        stage
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        status
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        notes
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        tags
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        lead_score
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Header Mapping Rules */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileType className="h-4 w-4 text-purple-500" />
                  Header Mapping Guide
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  System automatically maps these column names
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Name Mappings */}
                <div>
                  <h5 className="font-medium text-xs mb-1">📝 Name Field:</h5>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <div>✓ name, full name, fullname</div>
                    <div>✓ lead name, customer name, student name</div>
                    <div>✓ CANDIDATE NAME, Name</div>
                  </div>
                </div>

                {/* Email Mappings */}
                <div>
                  <h5 className="font-medium text-xs mb-1">📧 Email Field:</h5>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <div>✓ email, email address, e-mail</div>
                    <div>✓ mail, email id, Mail ID, Mail id</div>
                  </div>
                </div>

                {/* Phone Mappings */}
                <div>
                  <h5 className="font-medium text-xs mb-1">
                    📞 Contact Field:
                  </h5>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <div>✓ contact_number, contact number</div>
                    <div>✓ phone, phone number, mobile</div>
                    <div>✓ mobile number, telephone, tel</div>
                    <div>✓ PHONE NUMBER, Phone Number</div>
                  </div>
                </div>

                {/* Country Mappings */}
                <div>
                  <h5 className="font-medium text-xs mb-1">
                    🌍 Country Field:
                  </h5>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <div>✓ country_of_interest, country of interest</div>
                    <div>✓ preferred country, destination country</div>
                    <div>✓ target country, country, Interested Country</div>
                  </div>
                </div>

                {/* Course Level Mappings */}
                <div>
                  <h5 className="font-medium text-xs mb-1">🎓 Course Level:</h5>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <div>✓ course_level, course level</div>
                    <div>✓ education level, degree level, study level</div>
                  </div>
                </div>

                {/* Stage & Status Mappings */}
                <div>
                  <h5 className="font-medium text-xs mb-1">
                    📊 Stage & Status:
                  </h5>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <div>✓ stage, lead stage, current stage</div>
                    <div>✓ opportunity stage, sales stage, pipeline stage</div>
                    <div>✓ status, lead status, current status</div>
                    <div>✓ Status, STATUS</div>
                  </div>
                </div>

                {/* Experience Mappings */}
                <div>
                  <h5 className="font-medium text-xs mb-1">💼 Experience:</h5>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <div>✓ experience, years of experience</div>
                    <div>✓ total experience</div>
                    <div className="text-blue-600 font-medium">
                      Valid values: fresher, 1_to_3_years, 3_to_5_years,
                      5_to_10_years, 10+_years
                    </div>
                  </div>
                </div>

                {/* Notes Mappings */}
                <div>
                  <h5 className="font-medium text-xs mb-1">📝 Notes Field:</h5>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <div>✓ notes, note, comment, comments</div>
                    <div>✓ remarks, description, areas of interest</div>
                    <div>✓ other details</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Important Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  Auto-Generation Rules
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="p-2 bg-green-50 border border-green-200 rounded">
                  <div className="font-medium text-green-800">
                    ✅ Smart Email Generation:
                  </div>
                  <div className="text-green-700">
                    Missing or invalid emails will be auto-generated as
                    notvalidxx123@gmail.com to prevent validation errors.
                    Original values are saved in notes.
                  </div>
                </div>

                <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                  <div className="font-medium text-blue-800">
                    📱 Smart Phone Generation:
                  </div>
                  <div className="text-blue-700">
                    Missing or invalid phone numbers will be auto-generated as
                    unique 10-digit numbers starting with 9. Original values are
                    preserved in notes.
                  </div>
                </div>

                <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <div className="font-medium text-yellow-800">
                    ⚠️ Auto-Assignment:
                  </div>
                  <div className="text-yellow-700">
                    If stage/status columns are missing or contain invalid
                    values, default values will be automatically assigned.
                  </div>
                </div>

                <div className="p-2 bg-purple-50 border border-purple-200 rounded">
                  <div className="font-medium text-purple-800">
                    💡 Data Processing:
                  </div>
                  <div className="text-purple-700">
                    Unmapped columns will be added to the notes field for
                    reference. Invalid age/experience values are moved to notes
                    instead of causing errors.
                  </div>
                </div>

                <div className="p-2 bg-indigo-50 border border-indigo-200 rounded">
                  <div className="font-medium text-indigo-800">
                    ✅ Tags Format:
                  </div>
                  <div className="text-indigo-700">
                    Separate multiple tags with semicolons (;). Example:
                    urgent;qualified;follow-up
                  </div>
                </div>

                <div className="p-2 bg-pink-50 border border-pink-200 rounded">
                  <div className="font-medium text-pink-800">
                    📊 Lead Score:
                  </div>
                  <div className="text-pink-700">
                    Must be a number between 0-100. Invalid scores will cause
                    validation errors.
                  </div>
                </div>

                <div className="p-2 bg-gray-50 border border-gray-200 rounded">
                  <div className="font-medium text-gray-800">
                    🔍 Duplicate Detection:
                  </div>
                  <div className="text-gray-700">
                    Backend detects duplicates based on email and phone number.
                    Auto-generated values ensure unique entries while preserving
                    original data.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Remove the Upload Results section completely since we're closing immediately */}
      </DialogContent>
    </Dialog>
  );
};

export default BulkUploadModal;
