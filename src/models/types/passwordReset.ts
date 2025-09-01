// src/models/types/passwordReset.ts
// Password Reset Types for LeadG CRM Frontend
// Matches backend API responses and request formats

// ============================================================================
// REQUEST TYPES (Frontend → Backend)
// ============================================================================

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
  confirm_password: string;
}

export interface ValidateTokenRequest {
  token: string;
}

// Admin password reset request
export interface AdminResetPasswordRequest {
  user_email: string;
  reset_method: "email_link" | "admin_temporary";
  temporary_password: string;
  force_change_on_login: boolean;
  notification_message?: string;
}

// ============================================================================
// RESPONSE TYPES (Backend → Frontend)
// ============================================================================

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  email_sent: boolean;
  token_expires_in?: number;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
  user_email?: string;
  requires_login: boolean;
}

export interface ValidateResetTokenResponse {
  valid: boolean;
  token_type?: "user_initiated" | "admin_initiated";
  user_email?: string;
  expires_at?: string;
  expires_in_minutes?: number;
  message: string;
}

export interface AdminResetPasswordResponse {
  success: boolean;
  message: string;
  user_email: string;
  reset_method: "email_link" | "admin_temporary";
  email_sent?: boolean;
  temporary_password?: string;
  force_change_on_login: boolean;
  reset_by: string;
  reset_at: string;
}

// Password reset statistics for admin dashboard
export interface PasswordResetStats {
  total_requests_today: number;
  total_requests_this_week: number;
  total_requests_this_month: number;
  successful_resets_today: number;
  pending_tokens: number;
  expired_tokens: number;
  admin_initiated_resets: number;
  user_initiated_resets: number;
}

// User reset history for admin view
export interface UserResetHistoryItem {
  _id: string;
  user_email: string;
  token_type: "user_initiated" | "admin_initiated";
  status: "active" | "used" | "expired" | "revoked";
  created_at: string;
  expires_at: string;
  used_at?: string;
  created_by?: string;
  ip_address?: string;
  reset_method?: "email_link" | "admin_temporary";
}

export interface UserResetHistoryResponse {
  success: boolean;
  user_email: string;
  total_records: number;
  reset_history: UserResetHistoryItem[];
  requested_by: string;
  timestamp: string;
}

// ============================================================================
// FORM TYPES (Frontend State Management)
// ============================================================================

// Forgot password form state
export interface ForgotPasswordFormData {
  email: string;
}

export interface ForgotPasswordFormErrors {
  email?: string;
  general?: string;
}

// Reset password form state
export interface ResetPasswordFormData {
  token: string;
  new_password: string;
  confirm_password: string;
}

export interface ResetPasswordFormErrors {
  new_password?: string;
  confirm_password?: string;
  token?: string;
  general?: string;
}

// Admin reset form state
export interface AdminResetFormData {
  user_email: string;
  reset_method: "email_link" | "admin_temporary";
  temporary_password: string;
  force_change_on_login: boolean;
  notification_message: string;
}

export interface AdminResetFormErrors {
  user_email?: string;
  temporary_password?: string;
  notification_message?: string;
  general?: string;
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

// Token validation states
export type TokenValidationState =
  | "validating"
  | "valid"
  | "invalid"
  | "expired"
  | "error";

// Password reset flow states
export type PasswordResetFlowState =
  | "email_input" // User entering email
  | "email_sent" // Email sent confirmation
  | "token_validation" // Validating reset token
  | "password_reset" // User entering new password
  | "success" // Password reset successful
  | "error"; // Error state

// Admin reset modal states
export type AdminResetModalState =
  | "closed"
  | "method_selection"
  | "email_link_form"
  | "temporary_password_form"
  | "processing"
  | "success"
  | "error";

// ============================================================================
// COMPONENT PROP TYPES
// ============================================================================

// Forgot password form props
export interface ForgotPasswordFormProps {
  onSuccess?: (response: ForgotPasswordResponse) => void;
  onError?: (error: string) => void;
  className?: string;
}

// Reset password form props
export interface ResetPasswordFormProps {
  token: string;
  onSuccess?: (response: ResetPasswordResponse) => void;
  onError?: (error: string) => void;
  className?: string;
}

// Admin reset password modal props
export interface AdminResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    user_id: string;
    email: string;
    name: string;
    role: string;
  };
  onSuccess?: (response: AdminResetPasswordResponse) => void;
}

// Password reset history modal props
export interface PasswordResetHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  userName: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

// API error handling
export interface PasswordResetAPIError {
  status: number;
  data: {
    detail?: string;
    message?: string;
    error?: string;
  };
}

// Success notification data
export interface PasswordResetSuccessNotification {
  title: string;
  message: string;
  type: "forgot_password" | "reset_password" | "admin_reset";
  user_email?: string;
}

// Error notification data
export interface PasswordResetErrorNotification {
  title: string;
  message: string;
  type: "validation" | "network" | "server" | "token";
  details?: string;
}

// ============================================================================
// CONSTANTS/ENUMS
// ============================================================================

// Password validation rules
export const PASSWORD_VALIDATION_RULES = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
  REQUIRE_LETTERS: true,
  REQUIRE_NUMBERS: true,
  REQUIRE_SPECIAL_CHARS: false, // Optional based on backend validation
} as const;

// Token expiration times (in minutes)
export const TOKEN_EXPIRATION = {
  USER_RESET: 30, // User-initiated reset tokens
  ADMIN_RESET: 1440, // Admin-initiated tokens (24 hours)
} as const;

// Reset methods
export const RESET_METHODS = {
  EMAIL_LINK: "email_link" as const,
  ADMIN_TEMPORARY: "admin_temporary" as const,
};

// Form field names (for form validation)
export const FORM_FIELDS = {
  FORGOT_PASSWORD: {
    EMAIL: "email",
  },
  RESET_PASSWORD: {
    TOKEN: "token",
    NEW_PASSWORD: "new_password",
    CONFIRM_PASSWORD: "confirm_password",
  },
  ADMIN_RESET: {
    USER_EMAIL: "user_email",
    RESET_METHOD: "reset_method",
    TEMPORARY_PASSWORD: "temporary_password",
    FORCE_CHANGE: "force_change_on_login",
    NOTIFICATION_MESSAGE: "notification_message",
  },
} as const;

// Success message templates
export const SUCCESS_MESSAGES = {
  EMAIL_SENT:
    "If your email is registered, you will receive a password reset link shortly.",
  PASSWORD_RESET:
    "Password reset successfully. Please login with your new password.",
  ADMIN_EMAIL_SENT: "Password reset email sent successfully to user.",
  ADMIN_TEMP_SET: "Temporary password set successfully for user.",
} as const;

// Error message templates
export const ERROR_MESSAGES = {
  INVALID_EMAIL: "Please enter a valid email address.",
  PASSWORD_TOO_SHORT: `Password must be at least ${PASSWORD_VALIDATION_RULES.MIN_LENGTH} characters long.`,
  PASSWORDS_NO_MATCH: "Passwords do not match.",
  INVALID_TOKEN:
    "Invalid or expired reset token. Please request a new password reset.",
  NETWORK_ERROR: "Network error. Please check your connection and try again.",
  GENERIC_ERROR: "An unexpected error occurred. Please try again.",
} as const;

// ============================================================================
// TYPE GUARDS
// ============================================================================

// Type guard for API errors
// export const isPasswordResetAPIError = (
//   error: any
// ): error is PasswordResetAPIError => {
//   return (
//     error &&
//     typeof error === "object" &&
//     typeof error.status === "number" &&
//     error.data &&
//     typeof error.data === "object"
//   );
// };

// Type guard for successful responses
// export const isSuccessResponse = (
//   response: any
// ): response is { success: true } => {
//   return response && response.success === true;
// };
