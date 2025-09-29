// src/components/whatsapp/WhatsAppTemplateMessage.tsx
"use client";

import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useAppDispatch } from "@/redux/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send, Eye, EyeOff, FileText } from "lucide-react";
import type { RootState } from "@/redux/store";
import {
  setSelectedTemplate,
  setTemplateParameter,
  setPreviewMode,
  setSending,
  closeModal,
} from "@/redux/slices/whatsappSlice";
import {
  useGetTemplatesQuery,
  useSendTemplateMutation,
} from "@/redux/slices/whatsappApi";
import TemplatePreview from "./TemplatePreview";
import { useNotifications } from "@/components/common/NotificationSystem";
import {
  processTemplatesResponse,
  // getTemplateIdentifier,
  // getTemplateDisplayName,
  type TemplateMessageRequest,
} from "@/models/types/whatsapp";
import WhatsAppTemplateSelect from "./WhatsAppTemplateSelect";
import { ApiError } from "@/models/types/apiError";

const WhatsAppTemplateMessage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { showSuccess, showError } = useNotifications();

  const {
    selectedTemplate,
    templateParameters,
    isPreviewMode,
    isSending,
    currentLead,
    currentUser,
  } = useSelector((state: RootState) => state.whatsapp);

  // Fetch templates with proper typing
  const {
    data: templatesData,
    isLoading: isLoadingTemplates,
    error: templatesError,
  } = useGetTemplatesQuery();

  // Send template mutation
  const [sendTemplate] = useSendTemplateMutation();

  // Process templates using the utility function - handle undefined case
  const templates = processTemplatesResponse(templatesData || []);

  // Auto-populate parameters when template or lead/user changes
  useEffect(() => {
    if (
      selectedTemplate &&
      currentLead &&
      currentUser &&
      templates.length > 0
    ) {
      // Find template by both name and template_name to handle different formats
      const template = templates.find(
        (t) =>
          t.name === selectedTemplate || t.template_name === selectedTemplate
      );

      if (template && template.parameters) {
        const autoParams: Record<string, string> = {};

        if (template.parameters.includes("lead_name")) {
          autoParams.lead_name = currentLead.name || "";
        }
        if (template.parameters.includes("agent_name")) {
          autoParams.agent_name = `${currentUser.firstName || ""} ${
            currentUser.lastName || ""
          }`.trim();
        }

        // Update only auto-fillable parameters, preserve user input
        Object.keys(autoParams).forEach((key) => {
          if (!templateParameters[key] && autoParams[key]) {
            dispatch(setTemplateParameter({ key, value: autoParams[key] }));
          }
        });
      }
    }
  }, [
    selectedTemplate,
    currentLead,
    currentUser,
    templates,
    templateParameters,
    dispatch,
  ]);

  const handleTemplateSelect = (templateName: string) => {
    dispatch(setSelectedTemplate(templateName));
  };

  const handleParameterChange = (paramName: string, value: string) => {
    dispatch(setTemplateParameter({ key: paramName, value }));
  };

  const togglePreview = () => {
    dispatch(setPreviewMode(!isPreviewMode));
  };

  const handleSend = async () => {
    if (!selectedTemplate || !currentLead?.phoneNumber) return;

    dispatch(setSending(true));
    try {
      const sendRequest: TemplateMessageRequest = {
        template_name: selectedTemplate,
        contact: currentLead.phoneNumber,
        lead_name: templateParameters.lead_name || currentLead.name || "",
      };

      const result = await sendTemplate(sendRequest);

      // 🔥 CHANGED: Check if it's an error response first
      if ("error" in result) {
        // This is an RTK Query network/server error
        const errorData = (result.error as ApiError)?.data;
        const errorMessage =
          errorData?.message ||
          errorData?.error ||
          "Failed to send template message";
        showError(errorMessage, "Failed to send template message");
        return;
      }

      // 🔥 CHANGED: Check the backend's success field
      const responseData = result.data;
      if (responseData?.success === false) {
        // Backend returned success: false
        const errorMessage =
          responseData.message ||
          responseData.error ||
          "Failed to send template message";
        showError(errorMessage);
        return;
      }

      // 🔥 SUCCESS: Only show success if backend returned success: true
      if (responseData?.success === true) {
        showSuccess(
          responseData.message || "WhatsApp template message sent successfully!"
        );
        dispatch(closeModal());
      } else {
        // Fallback for unexpected response format
        showError("Unexpected response format");
      }
    } catch (error: unknown) {
      // This shouldn't happen now since we're not using unwrap()
      console.error("Unexpected error in handleSend:", error);
      showError("An unexpected error occurred");
    } finally {
      dispatch(setSending(false));
    }
  };

  // Find selected template with proper typing
  const selectedTemplateData =
    templates.find(
      (t) => t.name === selectedTemplate || t.template_name === selectedTemplate
    ) || null;

  // Check if all parameters are filled
  const allParametersFilled = selectedTemplateData?.parameters?.length
    ? selectedTemplateData.parameters.every((param) =>
        templateParameters[param]?.trim()
      )
    : true; // If no parameters required, consider it filled

  // Render loading state
  if (isLoadingTemplates) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading templates...</p>
      </div>
    );
  }

  // Render error state
  if (templatesError) {
    return (
      <div className="text-center py-8 text-red-600">
        <FileText className="mx-auto h-12 w-12 mb-4" />
        <p>Error loading templates</p>
        <p className="text-sm mt-2">
          {templatesError &&
          typeof templatesError === "object" &&
          "message" in templatesError
            ? String(templatesError.message)
            : "Please try again later"}
        </p>
      </div>
    );
  }

  // Render no templates state
  if (!templates || templates.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="mx-auto h-12 w-12 mb-4" />
        <p>No templates available</p>
        <p className="text-sm mt-2">
          Templates could not be loaded from the server.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Template Selection */}
      <div className="space-y-2">
        <Label htmlFor="template-select">Select Template:</Label>
        <WhatsAppTemplateSelect
          value={selectedTemplate || ""}
          onValueChange={handleTemplateSelect}
          label="Select Template"
        />
      </div>

      {/* Template Parameters */}
      {selectedTemplateData && selectedTemplateData.parameters && (
        <div className="">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground">
              Fill Template Parameters:
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={togglePreview}
              className="flex items-center"
            >
              {isPreviewMode ? (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Hide Preview
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Show Preview
                </>
              )}
            </Button>
          </div>

          <div className="grid gap-4">
            {selectedTemplateData.parameters.map((param, index) => (
              <div
                key={`param-${selectedTemplate}-${param}-${index}`}
                className="space-y-2"
              >
                <Label
                  htmlFor={`param-input-${selectedTemplate}-${param}-${index}`}
                  className="capitalize"
                >
                  {param.replace(/_/g, " ")}:
                </Label>
                <Input
                  id={`param-input-${selectedTemplate}-${param}-${index}`}
                  value={templateParameters[param] || ""}
                  onChange={(e) => handleParameterChange(param, e.target.value)}
                  placeholder={`Enter ${param.replace(/_/g, " ")}`}
                  className={
                    param === "lead_name" || param === "agent_name"
                      ? "bg-muted/50"
                      : ""
                  }
                />
                {(param === "lead_name" || param === "agent_name") && (
                  <p className="text-xs text-muted-foreground">
                    Auto-filled from lead data
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Template Preview */}
      {selectedTemplateData && isPreviewMode && (
        <TemplatePreview
          template={selectedTemplateData}
          parameters={templateParameters}
        />
      )}

      {/* Send Button */}
      {selectedTemplateData && (
        <div className="flex flex-col gap-4 pt-4 border-t">
          <div className="flex justify-end">
            <Button
              onClick={handleSend}
              disabled={
                !allParametersFilled || isSending || !currentLead?.phoneNumber
              }
              className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
            >
              {isSending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </>
              )}
            </Button>
          </div>

          {/* Helper text */}
          {!currentLead?.phoneNumber && (
            <p className="text-xs text-red-600">
              No phone number available for this lead
            </p>
          )}
          {!allParametersFilled &&
            selectedTemplateData.parameters!.length > 0 && (
              <p className="text-xs text-amber-600">
                Please fill all required parameters
              </p>
            )}
        </div>
      )}
    </div>
  );
};

export default WhatsAppTemplateMessage;
