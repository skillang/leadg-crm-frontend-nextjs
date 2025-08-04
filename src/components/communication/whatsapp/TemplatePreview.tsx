// src/components/whatsapp/TemplatePreview.tsx
"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import type {
  WhatsAppTemplate,
  TemplateParameters,
} from "@/models/types/whatsapp";

interface TemplatePreviewProps {
  template: WhatsAppTemplate;
  parameters: TemplateParameters;
}

const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  template,
  parameters,
}) => {
  // Replace template placeholders with actual parameters
  const getPreviewText = (): string => {
    let previewText = template.template || "";

    // Get parameters array, fallback to empty array if undefined
    const templateParams = template.parameters || [];

    // Replace all {{parameter}} placeholders with actual values
    templateParams.forEach((param) => {
      const value = parameters[param] || `[${param.replace(/_/g, " ")}]`;
      const placeholder = `{{${param}}}`;
      previewText = previewText.replace(new RegExp(placeholder, "g"), value);
    });

    return previewText;
  };

  const previewText = getPreviewText();

  // Check for empty parameters, handle undefined parameters array
  const templateParams = template.parameters || [];
  const hasEmptyParameters = templateParams.some(
    (param) => !parameters[param]?.trim()
  );

  // Handle case where template might not have a template string
  if (!template.template) {
    return (
      <div className="space-y-2">
        <Label>Preview:</Label>
        <div className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 p-4 rounded-lg">
          <div className="bg-background rounded-lg p-3 shadow-sm border-l-4 border-gray-500">
            <p className="text-sm text-muted-foreground italic">
              No template content available for preview
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>Preview:</Label>
      <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-4 rounded-lg">
        <div className="bg-background rounded-lg p-3 shadow-sm border-l-4 border-green-500">
          <p className="text-sm whitespace-pre-wrap">{previewText}</p>
        </div>
        <div className="mt-2 space-y-1">
          <p className="text-xs text-muted-foreground">
            This is how your template message will appear in WhatsApp
          </p>
          {hasEmptyParameters && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              ⚠ Some parameters are empty and will show as placeholders
            </p>
          )}
          {templateParams.length === 0 && (
            <p className="text-xs text-blue-600 dark:text-blue-400">
              ℹ This template has no parameters to fill
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplatePreview;
