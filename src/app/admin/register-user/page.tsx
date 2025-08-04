"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useAdminRegisterUserMutation,
  useGetDepartmentsQuery,
} from "@/redux/slices/authApi";
import { useNotifications } from "@/components/common/NotificationSystem";
import { useAdminAccess } from "@/hooks/useAdminAccess";
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, UserPlus, Shield, Users2 } from "lucide-react";

// Form validation types
interface FormData {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
  role: "admin" | "user";
  phone: string;
  departments: string[];
}

interface FormErrors {
  [key: string]: string;
}

// RTK Query error type interface
interface RTKQueryError {
  data?: {
    detail?: string;
    message?: string;
  };
  message?: string;
  status?: number;
}

const AdminRegisterUserPage = () => {
  const router = useRouter();

  // 🔥 ALL HOOKS MUST BE CALLED FIRST - before any conditionals
  const { showSuccess, showError, showWarning } = useNotifications();
  const { hasAccess, AccessDeniedComponent, user } = useAdminAccess({
    title: "Admin Access Required",
    description: "You need admin privileges to register new users.",
  });

  // RTK Query mutation and queries
  const [adminRegisterUser, { isLoading }] = useAdminRegisterUserMutation();

  const {
    data: departmentsData,
    isLoading: isDepartmentsLoading,
    error: departmentsError,
    refetch: refetchDepartments,
  } = useGetDepartmentsQuery({
    include_user_count: true,
  });

  // Form state
  const [formData, setFormData] = useState<FormData>({
    email: "",
    username: "",
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
    role: "user",
    phone: "",
    departments: [],
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Show error notification for departments loading error
  React.useEffect(() => {
    if (departmentsError) {
      showWarning(
        "Failed to load departments. Using fallback options.",
        "Departments Error"
      );
    }
  }, [departmentsError, showWarning]);

  // 🔥 CONDITIONAL ACCESS CHECK AFTER ALL HOOKS
  if (!hasAccess) {
    return AccessDeniedComponent;
  }

  // GET DEPARTMENTS FROM API (with fallback)
  const availableDepartments = departmentsData?.departments?.all || [
    // Fallback in case API fails
    {
      name: "sales",
      display_name: "Sales",
      description: "Sales department",
      is_predefined: true,
      is_active: true,
      user_count: 0,
    },
    {
      name: "pre-sales",
      display_name: "Pre-Sales",
      description: "Pre-sales department",
      is_predefined: true,
      is_active: true,
      user_count: 0,
    },
    {
      name: "admin",
      display_name: "Admin",
      description: "Administration department",
      is_predefined: true,
      is_active: true,
      user_count: 0,
    },
  ];

  // Helper function to extract error message with proper typing
  const getErrorMessage = (error: unknown): string => {
    if (!error) return "An error occurred while creating the user";

    const rtkError = error as RTKQueryError;

    // Try to get error message from various possible locations
    if (rtkError.data?.detail) {
      return rtkError.data.detail;
    }
    if (rtkError.data?.message) {
      return rtkError.data.message;
    }
    if (rtkError.message) {
      return rtkError.message;
    }

    return "An error occurred while creating the user";
  };

  // Validation functions
  const validateField = (
    name: string,
    value: string | string[],
    forceValidate = false
  ): string => {
    // Only validate if field is touched or we're forcing validation (on submit)
    if (!touched[name] && !forceValidate) {
      return "";
    }

    switch (name) {
      case "email":
        if (!value) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value as string)) {
          return "Please enter a valid email address";
        }
        return "";

      case "username":
        if (!value) return "Username is required";
        if (!/^[a-zA-Z0-9_]{3,20}$/.test(value as string)) {
          return "Username must be 3-20 characters, alphanumeric and underscore only";
        }
        return "";

      case "firstName":
      case "lastName":
        if (!value)
          return `${name === "firstName" ? "First" : "Last"} name is required`;
        if (!/^[a-zA-Z\s\-']{2,30}$/.test(value as string)) {
          return `${
            name === "firstName" ? "First" : "Last"
          } name must be 2-30 characters, letters only`;
        }
        return "";

      case "password":
        if (!value) return "Password is required";
        if ((value as string).length < 8)
          return "Password must be at least 8 characters";
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value as string)) {
          return "Password must contain uppercase, lowercase, and number";
        }
        return "";

      case "confirmPassword":
        if (!value) return "Please confirm password";
        if (value !== formData.password) return "Passwords do not match";
        return "";

      case "phone":
        if (!value) return "Phone number is required";
        if (
          !/^[\+]?[1-9][\d]{0,15}$/.test(
            (value as string).replace(/[\s\-\(\)]/g, "")
          )
        ) {
          return "Please enter a valid phone number";
        }
        return "";

      case "departments":
        if (!Array.isArray(value) || value.length === 0) {
          return "At least one department must be selected";
        }
        return "";

      default:
        return "";
    }
  };

  // Handle input changes
  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error immediately when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Handle department checkbox changes
  const handleDepartmentChange = (dept: string, checked: boolean) => {
    const updatedDepartments = checked
      ? [...formData.departments, dept]
      : formData.departments.filter((d) => d !== dept);

    setFormData((prev) => ({ ...prev, departments: updatedDepartments }));

    if (touched.departments) {
      const error = validateField("departments", updatedDepartments);
      setErrors((prev) => ({ ...prev, departments: error }));
    }
  };

  // Handle field blur
  const handleBlur = (name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));

    const error = validateField(name, formData[name as keyof FormData]);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  // Validate entire form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Force validate ALL fields on form submission
    Object.keys(formData).forEach((field) => {
      if (field !== "confirmPassword") {
        const error = validateField(
          field,
          formData[field as keyof FormData],
          true
        );
        if (error) newErrors[field] = error;
      }
    });

    // Validate confirm password
    const confirmPasswordError = validateField(
      "confirmPassword",
      formData.confirmPassword,
      true
    );
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission - Updated to use notifications
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // console.log("🔥 Form submission started");
    // console.log("Current form data:", formData);

    // Mark all fields as touched
    setTouched(
      Object.keys(formData).reduce(
        (acc, key) => ({
          ...acc,
          [key]: true,
        }),
        { confirmPassword: true }
      )
    );

    // Validate form
    if (!validateForm()) {
      // console.log("❌ Form validation failed:", errors);
      showError(
        "Please fix the form errors before submitting.",
        "Validation Error"
      );
      return;
    }

    // console.log("✅ Form validation passed");

    try {
      const result = await adminRegisterUser({
        email: formData.email.trim().toLowerCase(),
        username: formData.username.trim().toLowerCase(),
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        password: formData.password,
        role: formData.role,
        phone: formData.phone.trim(),
        departments: formData.departments,
      }).unwrap();

      // console.log("✅ User created successfully:", result);

      // Refetch departments to include the new user
      refetchDepartments();

      // Use notification system instead of local state
      showSuccess(
        `User "${formData.firstName} ${formData.lastName}" has been successfully created!`,
        "User Created"
      );

      // Reset form
      setFormData({
        email: "",
        username: "",
        firstName: "",
        lastName: "",
        password: "",
        confirmPassword: "",
        role: "user",
        phone: "",
        departments: [],
      });
      setErrors({});
      setTouched({});
    } catch (err) {
      console.error("❌ Registration failed:", err);
      showError(getErrorMessage(err), "Registration Failed");
    }
  };

  // Better form validation check
  const isFormValid = () => {
    // Check if all required fields have values
    const requiredFieldsComplete = {
      email: formData.email.trim(),
      username: formData.username.trim(),
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      phone: formData.phone.trim(),
      role: formData.role,
      departments: formData.departments.length > 0,
    };

    const allFieldsFilled = Object.values(requiredFieldsComplete).every(
      (field) => (typeof field === "boolean" ? field : field !== "")
    );

    // Only check for errors on touched fields (not all fields)
    const touchedFieldErrors = Object.keys(touched).filter((fieldName) => {
      const error = validateField(
        fieldName,
        formData[fieldName as keyof FormData],
        false
      );
      return error !== "";
    });

    return allFieldsFilled && touchedFieldErrors.length === 0;
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto  space-y-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <UserPlus className="w-6 h-6 text-primary" />
                <h1 className="text-3xl font-bold tracking-tight">
                  Register New User
                </h1>
              </div>
              <p className="text-muted-foreground">
                Create new user accounts for the LeadG CRM system
              </p>
            </div>
            {/* <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/admin/departments")}
              >
                <Settings2 className="w-4 h-4 mr-2" />
                Manage Departments
              </Button>
            </div> */}
          </div>
        </div>

        {/* Admin Badge */}
        <div className="mb-4">
          <Badge variant="secondary" className="gap-1">
            <Shield className="w-3 h-3" />
            Admin Access Required
          </Badge>
        </div>

        {/* Current Admin Info */}
        <Card className="mb-4 border-blue-200 bg-blue-50/50">
          <CardContent className="">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-blue-900">Creating user as:</h3>
                <p className="text-sm text-blue-700 mt-1">
                  {user?.first_name} {user?.last_name} ({user?.email}) -{" "}
                  {user?.role?.toUpperCase()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>
              Fill in the details below to create a new user account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Information */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Personal Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* First Name */}
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) =>
                        handleInputChange("firstName", e.target.value)
                      }
                      onBlur={() => handleBlur("firstName")}
                      placeholder="Enter first name"
                      className={
                        errors.firstName && touched.firstName
                          ? "border-destructive"
                          : ""
                      }
                    />
                    {errors.firstName && touched.firstName && (
                      <p className="text-sm text-destructive">
                        {errors.firstName}
                      </p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) =>
                        handleInputChange("lastName", e.target.value)
                      }
                      onBlur={() => handleBlur("lastName")}
                      placeholder="Enter last name"
                      className={
                        errors.lastName && touched.lastName
                          ? "border-destructive"
                          : ""
                      }
                    />
                    {errors.lastName && touched.lastName && (
                      <p className="text-sm text-destructive">
                        {errors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    onBlur={() => handleBlur("email")}
                    placeholder="Enter email address"
                    className={
                      errors.email && touched.email ? "border-destructive" : ""
                    }
                  />
                  {errors.email && touched.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    onBlur={() => handleBlur("phone")}
                    placeholder="+1-555-123-4567"
                    className={
                      errors.phone && touched.phone ? "border-destructive" : ""
                    }
                  />
                  {errors.phone && touched.phone && (
                    <p className="text-sm text-destructive">{errors.phone}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Include country code (e.g., +1 for US)
                  </p>
                </div>
              </div>

              <Separator />

              {/* Account Information */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Account Information
                  </h3>
                </div>

                {/* Username */}
                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) =>
                      handleInputChange("username", e.target.value)
                    }
                    onBlur={() => handleBlur("username")}
                    placeholder="Enter username"
                    className={
                      errors.username && touched.username
                        ? "border-destructive"
                        : ""
                    }
                  />
                  {errors.username && touched.username && (
                    <p className="text-sm text-destructive">
                      {errors.username}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    3-20 characters, letters, numbers, and underscore only
                  </p>
                </div>

                {/* Password & Confirm Password */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) =>
                          handleInputChange("password", e.target.value)
                        }
                        onBlur={() => handleBlur("password")}
                        placeholder="Enter password"
                        className={
                          errors.password && touched.password
                            ? "border-destructive pr-10"
                            : "pr-10"
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {errors.password && touched.password && (
                      <p className="text-sm text-destructive">
                        {errors.password}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          handleInputChange("confirmPassword", e.target.value)
                        }
                        onBlur={() => handleBlur("confirmPassword")}
                        placeholder="Confirm password"
                        className={
                          errors.confirmPassword && touched.confirmPassword
                            ? "border-destructive pr-10"
                            : "pr-10"
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {errors.confirmPassword && touched.confirmPassword && (
                      <p className="text-sm text-destructive">
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>

                {/* Password Requirements */}
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <h4 className="text-sm font-medium mb-2">
                      Password Requirements:
                    </h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• At least 8 characters long</li>
                      <li>• Contains uppercase and lowercase letters</li>
                      <li>• Contains at least one number</li>
                      <li>• No spaces allowed</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              {/* Role & Departments */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Role and Departments
                  </h3>
                </div>

                {/* Role */}
                <div className="space-y-2">
                  <Label htmlFor="role">User Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: "admin" | "user") =>
                      handleInputChange("role", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select user role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">
                        User - Limited access to assigned leads
                      </SelectItem>
                      <SelectItem value="admin">
                        Admin - Full system access
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Departments */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Departments * (Select at least one)</Label>
                    {isDepartmentsLoading && (
                      <span className="text-sm text-gray-500">
                        Loading departments...
                      </span>
                    )}
                    {departmentsData && (
                      <span className="text-sm text-gray-500">
                        {departmentsData.total_count} available
                      </span>
                    )}
                  </div>

                  {availableDepartments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border rounded-md p-3">
                      {availableDepartments.map((dept) => (
                        <div
                          key={dept.name}
                          className="flex items-start space-x-2 p-2 hover:bg-gray-50 rounded"
                        >
                          <Checkbox
                            id={dept.name}
                            checked={formData.departments.includes(dept.name)}
                            onCheckedChange={(checked) =>
                              handleDepartmentChange(
                                dept.name,
                                checked as boolean
                              )
                            }
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Label
                                htmlFor={dept.name}
                                className="text-sm font-medium cursor-pointer"
                              >
                                {dept.display_name}
                              </Label>
                              {dept.is_predefined ? (
                                <Badge variant="secondary" className="text-xs">
                                  Predefined
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  Custom
                                </Badge>
                              )}
                            </div>
                            {dept.description && (
                              <p className="text-xs text-gray-500 mt-1">
                                {dept.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <Users2 className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {dept.user_count} users
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500 border rounded-md">
                      {isDepartmentsLoading
                        ? "Loading departments..."
                        : "No departments available"}
                    </div>
                  )}

                  {errors.departments && (
                    <p className="text-sm text-destructive">
                      {errors.departments}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Submit Actions */}
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!isFormValid() || isLoading || isDepartmentsLoading}
                  className="min-w-[120px]"
                >
                  {isLoading ? "Creating..." : "Create User"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>User Registration Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <h4 className="font-medium mb-2">User Roles</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>
                    <strong>Admin:</strong> Full system access, can manage users
                    and all leads
                  </div>
                  <div>
                    <strong>User:</strong> Limited access to assigned leads only
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Available Departments</h4>
                <div className="text-sm text-muted-foreground">
                  {availableDepartments.length} departments loaded from API
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Phone Format</h4>
                <div className="text-sm text-muted-foreground">
                  Include country code (e.g., +1-555-123-4567)
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Security</h4>
                <div className="text-sm text-muted-foreground">
                  Strong passwords required with mixed case, numbers, and
                  minimum 8 characters
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminRegisterUserPage;
