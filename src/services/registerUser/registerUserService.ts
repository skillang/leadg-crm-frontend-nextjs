// src/services/registerUser/registerUserService.ts

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

// Helper function to extract error messages from RTK Query errors
export const extractRegisterUserErrorMessage = (error: unknown): string => {
  if (!error) return "An error occurred while creating the user";

  const rtkError = error as any;

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

// Service function for registering a new user
export const registerUserService = async (
  formData: FormData,
  {
    registerMutation,
    showSuccess,
    showError,
    router,
    onSuccess,
    onError,
  }: {
    registerMutation: any;
    showSuccess: (message: string, title?: string) => void;
    showError: (message: string, title?: string) => void;
    router: any;
    onSuccess: () => void;
    onError?: () => void;
  }
): Promise<void> => {
  try {
    const registerData = {
      email: formData.email.toLowerCase().trim(),
      username: formData.username.toLowerCase().trim(),
      first_name: formData.firstName.trim(),
      last_name: formData.lastName.trim(),
      password: formData.password,
      role: formData.role,
      phone: formData.phone.trim(),
      departments: formData.departments,
    };

    const response = await registerMutation(registerData).unwrap();

    // Success handling
    showSuccess(
      `User "${formData.firstName} ${formData.lastName}" has been successfully registered!`,
      "User Registration Successful"
    );

    // Redirect to users page
    router.push("/admin/users");
    onSuccess();
  } catch (error: unknown) {
    console.error("Registration failed:", error);

    const errorMessage = extractRegisterUserErrorMessage(error);
    showError(errorMessage, "Registration Failed");
    onError?.();
  }
};

// Utility function to get available departments with fallback
export const getAvailableDepartments = (departmentsData: any) => {
  return (
    departmentsData?.departments?.all || [
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
    ]
  );
};

// Form validation utility (keeping validation in component as you requested)
export const validateAllFields = (
  formData: FormData,
  validateField: (
    name: string,
    value: string | string[],
    forceValidate?: boolean
  ) => string
): Record<string, string> => {
  const newErrors: Record<string, string> = {};

  // Validate all fields
  Object.keys(formData).forEach((key) => {
    const error = validateField(key, formData[key as keyof FormData], true);
    if (error) {
      newErrors[key] = error;
    }
  });

  return newErrors;
};

// Form validation checker
export const isFormValid = (
  formData: FormData,
  validateField: (
    name: string,
    value: string | string[],
    forceValidate?: boolean
  ) => string
): boolean => {
  const errors = validateAllFields(formData, validateField);
  return Object.keys(errors).length === 0;
};
