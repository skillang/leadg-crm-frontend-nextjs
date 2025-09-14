// src/services/tataTeliMapping/tataTeliMappingService.ts

export interface CreateMappingForm {
  crm_user_id: string;
  tata_email: string;
  auto_create_agent: boolean;
}

// Helper function to extract error messages
export const extractErrorMessage = (
  error: unknown,
  defaultMessage: string
): string => {
  if (error && typeof error === "object" && "data" in error) {
    return (
      (error as { data?: { detail?: string } }).data?.detail || defaultMessage
    );
  } else if (error && typeof error === "object" && "message" in error) {
    return (error as { message: string }).message;
  }
  return defaultMessage;
};

// Form validation utility - returns errors for form fields
export const validateMappingForm = (
  formData: CreateMappingForm
): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!formData.crm_user_id) {
    errors.crm_user_id = "Please select a user";
  }

  if (!formData.tata_email) {
    errors.tata_email = "Tata email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.tata_email)) {
    errors.tata_email = "Please enter a valid email address";
  }

  return errors;
};

// Service function for creating user mappings
export const createMappingService = async (
  formData: CreateMappingForm,
  {
    createMutation,
    showSuccess,
    showError,
    onSuccess,
    onValidationError,
  }: {
    createMutation: any;
    showSuccess: (message: string, title?: string) => void;
    showError: (message: string) => void;
    onSuccess: () => void;
    onValidationError: (errors: Record<string, string>) => void;
  }
): Promise<void> => {
  // Validate form and return errors to component for inline display
  const validationErrors = validateMappingForm(formData);
  if (Object.keys(validationErrors).length > 0) {
    onValidationError(validationErrors);
    return;
  }

  try {
    await createMutation(formData).unwrap();

    showSuccess("User mapping created successfully!", "");
    onSuccess();
  } catch (error: unknown) {
    const errorMessage = extractErrorMessage(error, "Failed to create mapping");
    showError(errorMessage);
  }
};
