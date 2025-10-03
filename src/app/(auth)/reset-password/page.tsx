// src/app/reset-password/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import {
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  AlertCircle,
  Shield,
  ArrowLeft,
} from "lucide-react";
// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

// Redux
import {
  useValidateResetTokenQuery,
  useResetPasswordMutation,
} from "@/redux/slices/passwordResetApi";

// Types
import {
  ResetPasswordFormData,
  ResetPasswordFormErrors,
  // TokenValidationState,
} from "@/models/types/passwordReset";
import { ApiError } from "@/models/types/apiError";

// Zod validation schema
const resetPasswordSchema = z
  .object({
    new_password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(
        /^(?=.*[A-Za-z])(?=.*\d)/,
        "Password must contain at least one letter and one number"
      ),
    confirm_password: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

const ResetPasswordPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  // Redux hooks
  const {
    data: tokenValidation,
    error: tokenError,
    isLoading: isValidating,
  } = useValidateResetTokenQuery({ token: token || "" }, { skip: !token });

  const [resetPassword, { isLoading: isResetting }] =
    useResetPasswordMutation();

  // State
  const [formData, setFormData] = useState<ResetPasswordFormData>({
    token: token || "",
    new_password: "",
    confirm_password: "",
  });

  const [errors, setErrors] = useState<ResetPasswordFormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Update token in form data when it changes
  useEffect(() => {
    if (token) {
      setFormData((prev) => ({ ...prev, token }));
    }
  }, [token]);

  // Calculate password strength
  useEffect(() => {
    const password = formData.new_password;
    let strength = 0;

    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 25;

    setPasswordStrength(strength);
  }, [formData.new_password]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear field error when user starts typing
    if (errors[name as keyof ResetPasswordFormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }

    // Clear general error
    if (errors.general) {
      setErrors((prev) => ({
        ...prev,
        general: undefined,
      }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    try {
      resetPasswordSchema.parse({
        new_password: formData.new_password,
        confirm_password: formData.confirm_password,
      });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: ResetPasswordFormErrors = {};
        error.issues.forEach((issue) => {
          if (issue.path[0]) {
            fieldErrors[issue.path[0] as keyof ResetPasswordFormErrors] =
              issue.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      const result = await resetPassword(formData).unwrap();

      if (result.success) {
        setResetComplete(true);
        setErrors({});
      } else {
        setErrors({
          general: result.message || "Password reset failed. Please try again.",
        });
      }
    } catch (error) {
      console.error("Reset password error:", error);

      // Handle API errors
      let errorMessage = "An unexpected error occurred. Please try again.";

      // Type-safe error handling using your ApiError interface
      const apiError = error as ApiError;

      if (apiError.status === 400 || apiError.status === 422) {
        errorMessage =
          "Invalid or expired reset token. Please request a new password reset.";
      } else if (apiError.data) {
        errorMessage =
          apiError.data.detail || apiError.data.message || errorMessage;
      } else if (apiError.message) {
        errorMessage = apiError.message;
      }

      setErrors({
        general: errorMessage,
      });
    }
  };

  // Get password strength color and text
  const getPasswordStrengthInfo = () => {
    if (passwordStrength === 0) return { color: "bg-gray-200", text: "" };
    if (passwordStrength <= 25) return { color: "bg-red-500", text: "Weak" };
    if (passwordStrength <= 50) return { color: "bg-orange-500", text: "Fair" };
    if (passwordStrength <= 75) return { color: "bg-yellow-500", text: "Good" };
    return { color: "bg-green-500", text: "Strong" };
  };

  // No token provided
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-xl">Invalid Reset Link</CardTitle>
            <CardDescription>
              This password reset link is invalid or missing a token
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Button
              onClick={() => router.push("/forgot-password")}
              className="w-full"
            >
              Request New Reset Link
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Token validation in progress
  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
            <CardTitle className="text-xl">Validating Reset Link</CardTitle>
            <CardDescription>
              Please wait while we verify your password reset token
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Token validation failed
  if (tokenError || !tokenValidation?.valid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-xl">Reset Link Expired</CardTitle>
            <CardDescription>
              This password reset link has expired or is no longer valid
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {tokenValidation?.message ||
                  "The reset token is invalid or has expired"}
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <Button
                onClick={() => router.push("/forgot-password")}
                className="w-full"
              >
                Request New Reset Link
              </Button>

              <Button
                onClick={() => router.push("/login")}
                variant="outline"
                className="w-full"
              >
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Password reset completed successfully
  if (resetComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-xl">Password Reset Successful</CardTitle>
            <CardDescription>
              Your password has been successfully updated
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Your account is now secure with your new password. You can now
                login with your new credentials.
              </AlertDescription>
            </Alert>

            <Button onClick={() => router.push("/login")} className="w-full">
              Continue to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main reset password form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
          <CardDescription>
            Enter your new password below
            {tokenValidation?.user_email && (
              <span className="block mt-1 text-sm font-medium">
                for {tokenValidation.user_email}
              </span>
            )}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* General Error Alert */}
            {errors.general && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.general}</AlertDescription>
              </Alert>
            )}

            {/* Token expires warning */}
            {tokenValidation?.expires_in_minutes &&
              tokenValidation.expires_in_minutes <= 10 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This reset link expires in{" "}
                    {tokenValidation.expires_in_minutes} minutes
                  </AlertDescription>
                </Alert>
              )}

            {/* New Password Input */}
            <div className="space-y-2">
              <Label htmlFor="new_password">New Password</Label>
              <div className="relative">
                <Input
                  id="new_password"
                  name="new_password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your new password"
                  value={formData.new_password}
                  onChange={handleInputChange}
                  disabled={isResetting}
                  className={
                    errors.new_password
                      ? "border-red-500 focus:border-red-500"
                      : ""
                  }
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isResetting}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>

              {/* Password Strength Indicator */}
              {formData.new_password && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Password strength</span>
                    <span
                      className={
                        passwordStrength >= 75
                          ? "text-green-600"
                          : passwordStrength >= 50
                          ? "text-yellow-600"
                          : "text-red-600"
                      }
                    >
                      {getPasswordStrengthInfo().text}
                    </span>
                  </div>
                  <Progress value={passwordStrength} className="h-1" />
                </div>
              )}

              {errors.new_password && (
                <p className="text-sm text-red-600">{errors.new_password}</p>
              )}

              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters with letters and numbers
              </p>
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirm_password"
                  name="confirm_password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your new password"
                  value={formData.confirm_password}
                  onChange={handleInputChange}
                  disabled={isResetting}
                  className={
                    errors.confirm_password
                      ? "border-red-500 focus:border-red-500"
                      : ""
                  }
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isResetting}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
              {errors.confirm_password && (
                <p className="text-sm text-red-600">
                  {errors.confirm_password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={
                isResetting ||
                !formData.new_password ||
                !formData.confirm_password ||
                passwordStrength < 50
              }
            >
              {isResetting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating Password...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Update Password
                </>
              )}
            </Button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;
