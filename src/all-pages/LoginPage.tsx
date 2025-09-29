// pages/LoginPage.tsx (TypeScript with Zod validation + shadcn/ui + Light Blue Theme)
"use client";

import React, { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { useLoginMutation } from "@/redux/slices/authApi";
import { setAuthState, clearError, setError } from "@/redux/slices/authSlice";
import { z } from "zod";
import { Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import Image from "next/image";
import { ApiErrorData } from "@/models/types/apiError";
// 🔥 shadcn/ui imports
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

// Type for RTK Query errors with proper API error data
type RTKQueryError = FetchBaseQueryError & {
  status?: number;
  data?: ApiErrorData;
};

// Zod validation schema
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters long"),
  remember_me: z.boolean().optional().default(false),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ✅ CORRECT: Error messages are always strings, even for boolean fields
interface LoginFormErrors {
  email?: string;
  password?: string;
  remember_me?: string; // ✅ Keep as string - error messages are strings
  general?: string;
}

const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { error } = useAppSelector((state) => state.auth);

  // RTK Query mutation hook
  const [login, { isLoading: loginLoading }] = useLoginMutation();

  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
    remember_me: false, // ✅ Boolean value for form data
  });

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<LoginFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      if (error) {
        dispatch(clearError());
      }
    };
  }, [dispatch, error]);

  // Validate single field
  const validateField = (
    name: keyof LoginFormData,
    value: string | boolean
  ): string | null => {
    try {
      if (name === "email") {
        loginSchema.shape.email.parse(value);
      } else if (name === "password") {
        loginSchema.shape.password.parse(value);
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
    const { name, value, type, checked } = e.target;
    const fieldName = name as keyof LoginFormData;
    const fieldValue = type === "checkbox" ? checked : value;

    // Clear error when user starts typing
    if (error) {
      dispatch(clearError());
    }

    // Clear validation error for this field
    if (validationErrors[fieldName as keyof LoginFormErrors]) {
      setValidationErrors((prev) => ({
        ...prev,
        [fieldName]: undefined,
      }));
    }

    setFormData((prev) => ({
      ...prev,
      [fieldName]: fieldValue,
    }));

    // Real-time validation for non-checkbox fields
    if (type !== "checkbox" && fieldValue && typeof fieldValue === "string") {
      const fieldError = validateField(fieldName, fieldValue);
      if (fieldError) {
        setValidationErrors((prev) => ({
          ...prev,
          [fieldName]: fieldError,
        }));
      }
    }
  };

  // Handle shadcn checkbox change (different API)
  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      remember_me: checked,
    }));

    // Clear error
    if (error) {
      dispatch(clearError());
    }

    // Clear validation error for checkbox
    if (validationErrors.remember_me) {
      setValidationErrors((prev) => ({
        ...prev,
        remember_me: undefined,
      }));
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
          return "Please check your email and password format.";
        } else if (typeof errorData.detail === "string") {
          return errorData.detail;
        }
      }

      // Handle authentication errors (401)
      if (rtkError.status === 401) {
        return "Wrong email or password. Please try again.";
      }

      // Handle specific error messages from your FastAPI backend
      if (errorData?.detail) {
        const detail = errorData.detail;

        if (
          detail.includes("Invalid credentials") ||
          detail.includes("email or password") ||
          detail.includes("authentication failed")
        ) {
          return "Wrong email or password. Please try again.";
        }

        if (
          detail.includes("User not found") ||
          detail.includes("does not exist")
        ) {
          return "No account found with this email address.";
        }

        if (detail.includes("Account locked") || detail.includes("locked")) {
          return "Account temporarily locked. Please try again later.";
        }

        if (
          detail.includes("Account disabled") ||
          detail.includes("inactive") ||
          detail.includes("not active")
        ) {
          return "Account is disabled. Please contact administrator.";
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
          return "Invalid request. Please check your input.";
        case 401:
          return "Wrong email or password. Please try again.";
        case 403:
          return "Access denied. Please contact administrator.";
        case 404:
          return "Service not found. Please try again later.";
        case 422:
          return "Please check your email and password format.";
        case 429:
          return "Too many login attempts. Please wait a few minutes.";
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
    return "Login failed. Please try again.";
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate form data with Zod
      const validatedData = loginSchema.parse(formData);

      // Clear any existing validation errors
      setValidationErrors({});

      // console.log("Attempting login with:", { email: validatedData.email }); // Debug log

      // Use RTK Query mutation
      const result = await login(validatedData).unwrap();

      // console.log("Login successful:", result); // Debug log

      // 🔥 UPDATED: Store both access and refresh tokens in localStorage for persistence
      localStorage.setItem("access_token", result.access_token);
      localStorage.setItem("refresh_token", result.refresh_token);
      localStorage.setItem("user_data", JSON.stringify(result.user));

      // Update Redux state with the API response
      dispatch(setAuthState(result));

      // Success feedback could be added here if needed
      // console.log("Login completed successfully");
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        // Handle Zod validation errors
        const errors: LoginFormErrors = {};
        err.issues.forEach((issue) => {
          const field = issue.path[0] as keyof LoginFormData;
          if (
            field === "email" ||
            field === "password" ||
            field === "remember_me"
          ) {
            errors[field] = issue.message;
          }
        });
        setValidationErrors(errors);
      } else {
        // Handle API errors - RTK Query errors
        const errorMessage = getErrorMessage(err);
        dispatch(setError(errorMessage));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormDisabled = loginLoading || isSubmitting;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-xl">
        {/* Login Card */}
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
                Welcome to LeadG!
              </h1>
              <p className="text-blue-700">Log in to your LeadG CRM account</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* API Error Display */}
              {error && (
                <Alert
                  variant="destructive"
                  className="bg-red-50 border-red-300 text-red-700"
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium">Login Failed</div>
                    <div className="text-sm">{getErrorMessage(error)}</div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-blue-900 font-medium">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email"
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

                {/* Password Field */}
                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-blue-900 font-medium"
                  >
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleInputChange}
                      disabled={isFormDisabled}
                      className={`bg-blue-50 border-blue-300 text-blue-900 placeholder:text-blue-500 focus:border-blue-500 focus:ring-blue-500 pr-10 ${
                        validationErrors.password
                          ? "border-red-400 focus:border-red-500 focus:ring-red-500 bg-red-50"
                          : ""
                      }`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-blue-100 text-blue-600 hover:text-blue-800"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isFormDisabled}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {validationErrors.password && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {validationErrors.password}
                    </p>
                  )}
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="remember_me"
                    checked={formData.remember_me}
                    onCheckedChange={handleCheckboxChange}
                    disabled={isFormDisabled}
                    className="border-blue-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <Label
                    htmlFor="remember_me"
                    className="text-blue-700 text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Remember me for 30 days
                  </Label>
                </div>
                {validationErrors.remember_me && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {validationErrors.remember_me}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full font-medium py-3 shadow-md"
                disabled={isFormDisabled}
                size="lg"
              >
                {isFormDisabled ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isSubmitting ? "Signing in..." : "Please wait..."}
                  </>
                ) : (
                  "Login"
                )}
              </Button>

              <div className="text-center">
                <Link
                  href="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
