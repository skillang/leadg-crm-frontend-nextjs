// pages/LoginPage.tsx (TypeScript with Zod validation)
"use client";

import React, { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { useLoginMutation } from "@/redux/slices/authApi";
import { setAuthState, clearError, setError } from "@/redux/slices/authSlice";
import { z } from "zod";
import { Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";

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

interface LoginFormErrors {
  email?: string;
  password?: string;
  remember_me?: string;
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
    remember_me: false,
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

  const getErrorMessage = (error: any): string => {
    // Handle different error types
    if (typeof error === "string") {
      return error;
    }

    // Handle RTK Query error structure
    if (error?.data) {
      const errorData = error.data;

      // Handle FastAPI validation errors (422)
      if (error.status === 422 && errorData?.detail) {
        if (Array.isArray(errorData.detail)) {
          // Field validation errors
          return "Please check your email and password format.";
        } else if (typeof errorData.detail === "string") {
          return errorData.detail;
        }
      }

      // Handle authentication errors (401)
      if (error.status === 401) {
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
    if (error?.status) {
      switch (error.status) {
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

    // Handle network errors
    if (error?.message) {
      if (error.message.includes("fetch")) {
        return "Connection error. Please check your internet connection.";
      }
      return error.message;
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

      console.log("Attempting login with:", { email: validatedData.email }); // Debug log

      // Use RTK Query mutation
      const result = await login(validatedData).unwrap();

      console.log("Login successful:", result); // Debug log

      // Store in localStorage for persistence
      localStorage.setItem("access_token", result.access_token);
      localStorage.setItem("user_data", JSON.stringify(result.user));

      // Update Redux state with the API response
      dispatch(setAuthState(result));

      // Success feedback could be added here if needed
      console.log("Login completed successfully");
    } catch (err: any) {
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

  const hasValidationErrors = Object.keys(validationErrors).length > 0;
  const isFormDisabled = loginLoading || isSubmitting;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
          <p className="mt-2 text-gray-600">
            Sign in to your LeadG CRM account
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* API Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">Login Failed</p>
                <p className="text-sm">{getErrorMessage(error)}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className={`mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                  validationErrors.email
                    ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                }`}
                placeholder="Enter your email"
                disabled={isFormDisabled}
                aria-describedby={
                  validationErrors.email ? "email-error" : undefined
                }
              />
              {validationErrors.email && (
                <p
                  id="email-error"
                  className="mt-1 text-sm text-red-600 flex items-center"
                >
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {validationErrors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`mt-1 w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                    validationErrors.password
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  }`}
                  placeholder="Enter your password"
                  disabled={isFormDisabled}
                  aria-describedby={
                    validationErrors.password ? "password-error" : undefined
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  disabled={isFormDisabled}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {validationErrors.password && (
                <p
                  id="password-error"
                  className="mt-1 text-sm text-red-600 flex items-center"
                >
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {validationErrors.password}
                </p>
              )}
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center">
              <input
                id="remember_me"
                name="remember_me"
                type="checkbox"
                checked={formData.remember_me}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={isFormDisabled}
              />
              <label
                htmlFor="remember_me"
                className="ml-2 block text-sm text-gray-700"
              >
                Remember me for 30 days
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isFormDisabled}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isFormDisabled ? (
              <div className="flex items-center">
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                {isSubmitting ? "Signing in..." : "Please wait..."}
              </div>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
