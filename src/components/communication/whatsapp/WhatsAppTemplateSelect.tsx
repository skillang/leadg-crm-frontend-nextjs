// src/components/common/WhatsAppTemplateSelect.tsx
"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGetTemplatesQuery } from "@/redux/slices/whatsappApi";
import {
  processTemplatesResponse,
  getTemplateIdentifier,
  getTemplateDisplayName,
} from "@/models/types/whatsapp";

interface WhatsAppTemplateSelectProps {
  value?: string;
  onValueChange: (templateName: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  showLabel?: boolean;
  required?: boolean;
  error?: string;
}

export const WhatsAppTemplateSelect: React.FC<WhatsAppTemplateSelectProps> = ({
  value = "",
  onValueChange,
  placeholder = "Select WhatsApp template",
  disabled = false,
  className = "",
  label = "WhatsApp Template",
  showLabel = true,
  required = false,
  error,
}) => {
  // Fetch templates with proper typing
  const {
    data: templatesData,
    isLoading: isLoadingTemplates,
    error: templatesError,
  } = useGetTemplatesQuery();

  // Process templates using the utility function
  const templates = processTemplatesResponse(templatesData || []);

  // Render loading state
  if (isLoadingTemplates) {
    return (
      <div className="space-y-2">
        {showLabel && (
          <Label htmlFor="whatsapp-template-select">
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
          <Label htmlFor="whatsapp-template-select">
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
  if (!templates || templates.length === 0) {
    return (
      <div className="space-y-2">
        {showLabel && (
          <Label htmlFor="whatsapp-template-select">
            {label} {required && <span className="text-red-500">*</span>}
          </Label>
        )}
        <Select disabled>
          <SelectTrigger className={cn("w-full", className)}>
            <SelectValue placeholder="No templates available" />
          </SelectTrigger>
        </Select>
        <p className="text-sm text-gray-500">
          No WhatsApp templates found. Please configure templates first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {showLabel && (
        <Label htmlFor="whatsapp-template-select">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger
          id="whatsapp-template-select"
          className={cn("w-full", error ? "border-red-500" : "", className)}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {templates.map((template) => {
            const key = getTemplateIdentifier(template);
            const label = getTemplateDisplayName(template);
            const value = template.template_name || template.name || "";

            return (
              <SelectItem key={key} value={value} className="cursor-pointer">
                <div className="flex items-center space-x-2">
                  <div className="flex flex-col">
                    <span className="font-medium">{label}</span>
                    {template.body && (
                      <span className="text-xs text-gray-500 truncate max-w-[200px]">
                        {template.body.substring(0, 50)}...
                      </span>
                    )}
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default WhatsAppTemplateSelect;
