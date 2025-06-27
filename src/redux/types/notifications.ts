// src/types/notifications.ts
// Optional: Export types from your NotificationSystem for better type safety

export type NotificationType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  title?: string;
  description: string;
  type: NotificationType;
  duration?: number;
}

export interface ConfirmDialogOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

export interface PromptDialogOptions {
  title: string;
  description: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  required?: boolean;
  multiline?: boolean;
  onConfirm: (value: string) => void | Promise<void>;
  onCancel?: () => void;
}

export interface NotificationContextType {
  // Toast notifications
  toasts: Toast[];
  showToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;

  // Confirmation dialogs
  showConfirm: (options: ConfirmDialogOptions) => void;

  // Prompt dialogs
  showPrompt: (options: PromptDialogOptions) => void;

  // Convenience methods
  success: (description: string, title?: string) => void;
  error: (description: string, title?: string) => void;
  warning: (description: string, title?: string) => void;
  info: (description: string, title?: string) => void;
}

// Common notification patterns
export interface CrudNotificationMethods {
  created: (itemName: string, itemType?: string) => void;
  updated: (itemName: string, itemType?: string) => void;
  deleted: (itemName: string, itemType?: string) => void;
  uploaded: (itemName: string) => void;
  downloaded: (itemName: string) => void;
  approved: (itemName: string) => void;
  rejected: (itemName: string) => void;

  // Error handling
  createError: (itemType?: string) => void;
  updateError: (itemType?: string) => void;
  deleteError: (itemType?: string) => void;
  uploadError: () => void;
  downloadError: () => void;
  networkError: () => void;
  validationError: (message?: string) => void;

  // Confirmation dialogs
  confirmDelete: (
    itemName: string,
    onConfirm: () => void | Promise<void>,
    itemType?: string
  ) => void;
  confirmAction: (
    title: string,
    description: string,
    onConfirm: () => void | Promise<void>,
    confirmText?: string
  ) => void;

  // Prompt dialogs
  promptForInput: (
    title: string,
    description: string,
    onConfirm: (value: string) => void | Promise<void>,
    options?: {
      placeholder?: string;
      defaultValue?: string;
      required?: boolean;
      multiline?: boolean;
    }
  ) => void;
}

// API operation helpers
export interface ApiNotificationMethods extends CrudNotificationMethods {
  handleApiResponse: <T>(
    apiCall: () => Promise<T>,
    successMessage: string,
    errorMessage?: string
  ) => Promise<T | null>;

  handleApiWithConfirmation: <T>(
    title: string,
    description: string,
    apiCall: () => Promise<T>,
    successMessage: string,
    errorMessage?: string
  ) => Promise<T | null>;
}
