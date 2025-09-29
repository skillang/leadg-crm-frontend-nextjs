// src/components/whatsapp/ContactValidator.tsx
"use client";

import React from "react";
import { useSelector } from "react-redux";
import { useAppDispatch } from "@/redux/hooks";
import { CheckCircle, XCircle, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RootState } from "@/redux/store";
import {
  setContactValidating,
  setContactValid,
  setContactValidationError,
} from "@/redux/slices/whatsappSlice";
import { useValidateContactMutation } from "@/redux/slices/whatsappApi";

interface ApiErrorDetail {
  msg: string;
}

interface ValidationApiError {
  data?: {
    detail?: string | ApiErrorDetail[];
  };
  message?: string;
  status?: number;
}

const ContactValidator: React.FC = () => {
  const dispatch = useAppDispatch();
  const { currentLead, contactValidation } = useSelector(
    (state: RootState) => state.whatsapp
  );
  const [validateContact] = useValidateContactMutation();

  const handleValidateClick = async () => {
    if (!currentLead?.phoneNumber) {
      dispatch(setContactValidationError("No phone number available"));
      return;
    }

    dispatch(setContactValidating());

    try {
      const result = await validateContact(currentLead.phoneNumber).unwrap();

      // Assuming the API returns a success response for valid contacts
      if (result?.success !== false) {
        dispatch(setContactValid(true));
      } else {
        dispatch(setContactValid(false));
      }
    } catch (error) {
      const err = error as ValidationApiError;

      let errorMessage = "Failed to validate contact";

      if (err?.data?.detail) {
        if (typeof err.data.detail === "string") {
          errorMessage = err.data.detail;
        } else if (Array.isArray(err.data.detail)) {
          errorMessage = err.data.detail[0]?.msg || errorMessage;
        }
      } else if (err?.message) {
        errorMessage = err.message;
      }

      dispatch(setContactValidationError(errorMessage));
    }
  };

  const renderValidationStatus = () => {
    if (contactValidation.isValidating) {
      return (
        <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Validating WhatsApp contact...</span>
        </div>
      );
    }

    if (contactValidation.error) {
      return (
        <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
          <XCircle className="h-4 w-4" />
          <span className="text-sm">{contactValidation.error}</span>
        </div>
      );
    }

    if (contactValidation.isValid === true) {
      return (
        <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm">✓ Valid WhatsApp contact</span>
        </div>
      );
    }

    if (contactValidation.isValid === false) {
      return (
        <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
          <XCircle className="h-4 w-4" />
          <span className="text-sm">Contact is not available on WhatsApp</span>
        </div>
      );
    }

    // Default state - not yet validated
    return (
      <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
        <Info className="h-4 w-4" />
        <span className="text-sm">Click to validate WhatsApp contact</span>
      </div>
    );
  };

  const getValidationButtonText = () => {
    if (contactValidation.isValidating) return "Validating...";
    if (contactValidation.isValid === true) return "Re-validate";
    if (contactValidation.isValid === false) return "Try Again";
    return "Validate Contact";
  };

  const getValidationButtonVariant = () => {
    if (contactValidation.isValid === true) return "outline";
    if (contactValidation.isValid === false) return "destructive";
    return "default";
  };

  return (
    <div className="bg-muted/50 p-3 rounded-lg border">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-foreground">Contact Validation</h4>
        <Button
          size="sm"
          variant={getValidationButtonVariant()}
          onClick={handleValidateClick}
          disabled={contactValidation.isValidating || !currentLead?.phoneNumber}
          className="min-w-[120px]"
        >
          {contactValidation.isValidating && (
            <Loader2 className="h-3 w-3 animate-spin mr-2" />
          )}
          {getValidationButtonText()}
        </Button>
      </div>
      {renderValidationStatus()}
    </div>
  );
};

export default ContactValidator;
