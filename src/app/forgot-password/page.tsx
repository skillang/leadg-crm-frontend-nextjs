// pages/ForgotPasswordPage.tsx (TypeScript with Zod validation + shadcn/ui + Light Blue Theme)
"use client";

import React, { useState } from "react";
import { z } from "zod";
import { AlertCircle, Loader2, ArrowLeft, Mail } from "lucide-react";
import Image from "next/image";
import { useForgotPasswordMutation } from "@/redux/slices/passwordResetApi";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

// Zod validation schema
const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// Define proper error types based on your API structure
interface ApiErrorData {
  detail?: string;
  message?: string;
  error?: string;
}

// Type for RTK Query errors with proper API error data
type RTKQueryError = FetchBaseQueryError & {
  status?: number;
  data?: ApiErrorData;
};

// Error interface
interface ForgotPasswordFormErrors {
  email?: string;
  general?: string;
}

const ForgotPasswordPage: React.FC = () => {
  // RTK Query mutation hook
  const [forgotPassword, { isLoading: forgotPasswordLoading }] =
    useForgotPasswordMutation();

  const [formData, setFormData] = useState<ForgotPasswordFormData>({
    email: "",
  });

  const [validationErrors, setValidationErrors] =
    useState<ForgotPasswordFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Validate single field
  const validateField = (
    name: keyof ForgotPasswordFormData,
    value: string
  ): string | null => {
    try {
      if (name === "email") {
        forgotPasswordSchema.shape.email.parse(value);
      }
      return null;
    } catch (err) {
      if (err instanceof z.ZodError) {
        return err.issues[0]?.message || "Invalid input";
      }
      return "Invalid input";
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const fieldName = name as keyof ForgotPasswordFormData;

    // Clear API error when user starts typing
    if (apiError) {
      setApiError(null);
    }

    // Clear validation error for this field
    if (validationErrors[fieldName as keyof ForgotPasswordFormErrors]) {
      setValidationErrors((prev) => ({
        ...prev,
        [fieldName]: undefined,
      }));
    }

    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));

    // Real-time validation
    if (value) {
      const fieldError = validateField(fieldName, value);
      if (fieldError) {
        setValidationErrors((prev) => ({
          ...prev,
          [fieldName]: fieldError,
        }));
      }
    }
  };

  const getErrorMessage = (error: RTKQueryError | unknown): string => {
    // Handle different error types
    if (typeof error === "string") {
      return error;
    }

    // Type guard to check if error has RTK Query structure
    const hasRTKQueryStructure = (err: unknown): err is FetchBaseQueryError => {
      return typeof err === "object" && err !== null && "status" in err;
    };

    if (!hasRTKQueryStructure(error)) {
      return "An unexpected error occurred. Please try again.";
    }

    const rtkError = error as RTKQueryError;

    // Handle RTK Query error structure with status as number
    if (typeof rtkError.status === "number" && rtkError.data) {
      const errorData = rtkError.data as ApiErrorData;

      // Handle FastAPI validation errors (422)
      if (rtkError.status === 422 && errorData?.detail) {
        if (Array.isArray(errorData.detail)) {
          // Field validation errors
          return "Please check your email format.";
        } else if (typeof errorData.detail === "string") {
          return errorData.detail;
        }
      }

      // Handle specific error messages from your FastAPI backend
      if (errorData?.detail) {
        const detail = errorData.detail;

        if (
          detail.includes("User not found") ||
          detail.includes("does not exist") ||
          detail.includes("No account found")
        ) {
          return "No account found with this email address.";
        }

        if (
          detail.includes("Too many requests") ||
          detail.includes("rate limit") ||
          detail.includes("try again later")
        ) {
          return "Too many reset attempts. Please wait before trying again.";
        }

        if (
          detail.includes("Email service") ||
          detail.includes("failed to send")
        ) {
          return "Failed to send reset email. Please try again later.";
        }

        return detail;
      }

      // Handle other error message formats
      if (errorData?.message) {
        return errorData.message;
      }
    }

    // Handle different HTTP status codes
    if (typeof rtkError.status === "number") {
      switch (rtkError.status) {
        case 400:
          return "Invalid email format. Please check your input.";
        case 404:
          return "No account found with this email address.";
        case 422:
          return "Please enter a valid email address.";
        case 429:
          return "Too many reset attempts. Please wait before trying again.";
        case 500:
          return "Server error. Please try again later.";
        case 502:
        case 503:
        case 504:
          return "Service temporarily unavailable. Please try again.";
        default:
          return "Connection error. Please check your internet and try again.";
      }
    }

    // Handle non-numeric status codes (like "FETCH_ERROR", "TIMEOUT_ERROR")
    if (typeof rtkError.status === "string") {
      switch (rtkError.status) {
        case "FETCH_ERROR":
          return "Connection error. Please check your internet connection.";
        case "TIMEOUT_ERROR":
          return "Request timed out. Please try again.";
        case "PARSING_ERROR":
          return "Server response error. Please try again.";
        default:
          return "Network error. Please try again.";
      }
    }

    // Fallback for unknown errors
    return "Password reset request failed. Please try again.";
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setApiError(null);

    try {
      // Validate form data with Zod
      const validatedData = forgotPasswordSchema.parse(formData);

      // Clear any existing validation errors
      setValidationErrors({});

      console.log("Requesting password reset for:", validatedData.email);

      // Use RTK Query mutation
      const result = await forgotPassword(validatedData).unwrap();

      console.log("Password reset request successful:", result);
      setIsSubmitted(true);
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        // Handle Zod validation errors
        const errors: ForgotPasswordFormErrors = {};
        err.issues.forEach((issue) => {
          const field = issue.path[0] as keyof ForgotPasswordFormData;
          if (field === "email") {
            errors[field] = issue.message;
          }
        });
        setValidationErrors(errors);
      } else {
        // Handle API errors - RTK Query errors
        const errorMessage = getErrorMessage(err);
        setApiError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToLogin = () => {
    // This would typically use router.push('/login') or similar
    console.log("Navigate back to login");
  };

  const handleTryAgain = () => {
    setIsSubmitted(false);
    setFormData({ email: "" });
    setValidationErrors({});
    setApiError(null);
  };

  const isFormDisabled = forgotPasswordLoading || isSubmitting;

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="w-full max-w-xl">
          <Card className="bg-white border-blue-200 shadow-xl">
            <CardContent className="p-8">
              {/* Success State */}
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  <div className="bg-blue-100 rounded-full p-4">
                    <Mail className="h-12 w-12 text-blue-600" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-blue-900 mb-4">
                  Check Your Email
                </h1>
                <p className="text-blue-700 mb-6 leading-relaxed">
                  We've sent password reset instructions to{" "}
                  <span className="font-semibold">{formData.email}</span>
                </p>
                <p className="text-blue-600 text-sm mb-8">
                  If you don't see the email, check your spam folder or try
                  again.
                </p>

                <div className="space-y-4">
                  <Button
                    onClick={handleTryAgain}
                    variant="outline"
                    className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400"
                  >
                    Try Different Email
                  </Button>

                  <Button
                    onClick={handleBackToLogin}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-xl">
        {/* Forgot Password Card */}
        <Card className="bg-white border-blue-200 shadow-xl">
          <CardContent className="p-8">
            {/* Logo Section */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <div className="bg-white rounded-lg p-4 shadow-lg border border-blue-100">
                  <Image
                    src="/logo.png"
                    alt="LeadG CRM"
                    width={200}
                    height={60}
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-blue-900 mb-2">
                Forgot Password?
              </h1>
              <p className="text-blue-700">
                No worries! Enter your email and we'll send you reset
                instructions.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* API Error Display */}
              {apiError && (
                <Alert
                  variant="destructive"
                  className="bg-red-50 border-red-300 text-red-700"
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium">Request Failed</div>
                    <div className="text-sm">{apiError}</div>
                  </AlertDescription>
                </Alert>
              )}

              {/* General Error Display */}
              {validationErrors.general && (
                <Alert
                  variant="destructive"
                  className="bg-red-50 border-red-300 text-red-700"
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium">Error</div>
                    <div className="text-sm">{validationErrors.general}</div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-blue-900 font-medium">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={isFormDisabled}
                    className={`bg-blue-50 border-blue-300 text-blue-900 placeholder:text-blue-500 focus:border-blue-500 focus:ring-blue-500 ${
                      validationErrors.email
                        ? "border-red-400 focus:border-red-500 focus:ring-red-500 bg-red-50"
                        : ""
                    }`}
                  />
                  {validationErrors.email && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {validationErrors.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white font-medium py-3 mt-6 shadow-md"
                disabled={isFormDisabled}
                size="lg"
              >
                {isFormDisabled ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isSubmitting ? "Sending Reset Link..." : "Please wait..."}
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>

              {/* Back to Login Link */}
              <div className="text-center pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleBackToLogin}
                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                  disabled={isFormDisabled}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
