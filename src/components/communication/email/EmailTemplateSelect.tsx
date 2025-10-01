// src/components/communication/email/EmailTemplateSelect.tsx
import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useGetEmailTemplatesQuery } from "@/redux/slices/emailApi";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmailTemplateSelectProps {
  value?: string;
  onValueChange: (value: string) => void; // ✅ Changed from onChange
  showLabel?: boolean;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string; // Added for consistency
}

const EmailTemplateSelect: React.FC<EmailTemplateSelectProps> = ({
  value = "", // ✅ Added default value
  onValueChange, // ✅ Changed from onChange
  showLabel = true,
  label = "Email Template",
  placeholder = "Select email template",
  required = false,
  disabled = false,
  className = "",
  error,
}) => {
  const {
    data: templates,
    isLoading: templatesLoading,
    error: templatesError,
  } = useGetEmailTemplatesQuery();

  // Render loading state
  if (templatesLoading) {
    return (
      <div className="space-y-2">
        {showLabel && (
          <Label htmlFor="email-template-select">
            {label} {required && <span className="text-red-500">*</span>}
          </Label>
        )}
        <Select disabled>
          <SelectTrigger className={cn("w-full", className)}>
            <div className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Loading templates...</span>
            </div>
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  // Render error state
  if (templatesError) {
    return (
      <div className="space-y-2">
        {showLabel && (
          <Label htmlFor="email-template-select">
            {label} {required && <span className="text-red-500">*</span>}
          </Label>
        )}
        <Select disabled>
          <SelectTrigger className={cn("w-full border-red-300", className)}>
            <SelectValue placeholder="Failed to load templates" />
          </SelectTrigger>
        </Select>
        <p className="text-sm text-red-600">
          Error loading templates. Please try again.
        </p>
      </div>
    );
  }

  // Render no templates state
  if (!templates?.templates || templates.templates.length === 0) {
    return (
      <div className="space-y-2">
        {showLabel && (
          <Label htmlFor="email-template-select">
            {label} {required && <span className="text-red-500">*</span>}
          </Label>
        )}
        <Select disabled>
          <SelectTrigger className={cn("w-full", className)}>
            <SelectValue placeholder="No templates available" />
          </SelectTrigger>
        </Select>
        <p className="text-sm text-gray-500">
          No email templates found. Please configure templates first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {showLabel && (
        <Label htmlFor="email-template-select">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger
          id="email-template-select"
          className={cn("w-full", error ? "border-red-500" : "", className)}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {templates.templates.map((template) => (
            <SelectItem
              key={template.key}
              value={template.key}
              className="cursor-pointer"
            >
              <div className="flex flex-col">
                <span className="font-medium">{template.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default EmailTemplateSelect;
