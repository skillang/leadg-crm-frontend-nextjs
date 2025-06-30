// src/hooks/useNotificationHelpers.ts

import { useNotifications } from "@/components/common/NotificationSystem";

/**
 * Hook for common CRUD operation notifications
 */
export function useCrudNotifications() {
  const notifications = useNotifications();

  return {
    // Success notifications
    created: (itemName: string, itemType: string = "item") => {
      notifications.success(
        `"${itemName}" has been created.`,
        `${itemType} created successfully`
      );
    },

    updated: (itemName: string, itemType: string = "item") => {
      notifications.success(
        `"${itemName}" has been updated.`,
        `${itemType} updated successfully`
      );
    },

    deleted: (itemName: string, itemType: string = "item") => {
      notifications.success(
        `"${itemName}" has been deleted.`,
        `${itemType} deleted successfully`
      );
    },

    uploaded: (itemName: string) => {
      notifications.success(
        `"${itemName}" has been uploaded successfully.`,
        "Upload successful"
      );
    },

    downloaded: (itemName: string) => {
      notifications.success(
        `"${itemName}" has been downloaded.`,
        "Download successful"
      );
    },

    approved: (itemName: string) => {
      notifications.success(`"${itemName}" has been approved.`, "Approved");
    },

    rejected: (itemName: string) => {
      notifications.success(`"${itemName}" has been rejected.`, "Rejected");
    },

    // Direct access to notification methods
    success: notifications.success,
    error: notifications.error,
    info: notifications.info,
    warning: notifications.warning,
    showConfirm: notifications.showConfirm,
    showPrompt: notifications.showPrompt,

    // Error notifications
    createError: (itemType: string = "item") => {
      notifications.error(
        "Please try again or contact support.",
        `Failed to create ${itemType}`
      );
    },

    updateError: (itemType: string = "item") => {
      notifications.error(
        "Please try again or contact support.",
        `Failed to update ${itemType}`
      );
    },

    deleteError: (itemType: string = "item") => {
      notifications.error(
        "Please try again or contact support.",
        `Failed to delete ${itemType}`
      );
    },

    uploadError: () => {
      notifications.error(
        "Please try again or contact support.",
        "Upload failed"
      );
    },

    downloadError: () => {
      notifications.error(
        "Please try again or contact support.",
        "Download failed"
      );
    },

    networkError: () => {
      notifications.error(
        "Please check your connection and try again.",
        "Network error"
      );
    },

    validationError: (message?: string) => {
      notifications.error(
        message || "Please correct the errors and try again.",
        "Validation error"
      );
    },

    // Confirmation dialogs
    confirmDelete: (
      itemName: string,
      onConfirm: () => void | Promise<void>,
      itemType: string = "item"
    ) => {
      notifications.showConfirm({
        title: `Delete ${itemType}`,
        description: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
        confirmText: "Delete",
        variant: "destructive",
        onConfirm,
      });
    },

    confirmAction: (
      title: string,
      description: string,
      onConfirm: () => void | Promise<void>,
      confirmText: string = "Confirm"
    ) => {
      notifications.showConfirm({
        title,
        description,
        confirmText,
        onConfirm,
      });
    },

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
    ) => {
      notifications.showPrompt({
        title,
        description,
        placeholder: options?.placeholder,
        defaultValue: options?.defaultValue,
        required: options?.required,
        multiline: options?.multiline,
        onConfirm,
      });
    },
  };
}

/**
 * Hook for API operation notifications with loading states
 */
export function useApiNotifications() {
  const notifications = useCrudNotifications();

  return {
    ...notifications,

    // Handle API responses automatically
    handleApiResponse: async <T>(
      apiCall: () => Promise<T>,
      successMessage: string,
      errorMessage?: string
    ): Promise<T | null> => {
      try {
        const result = await apiCall();
        notifications.success(successMessage);
        return result;
      } catch (error: any) {
        const message =
          error?.data?.detail ||
          error?.message ||
          errorMessage ||
          "Operation failed";
        notifications.error(message);
        return null;
      }
    },

    // Handle API operations with confirmation
    handleApiWithConfirmation: async <T>(
      title: string,
      description: string,
      apiCall: () => Promise<T>,
      successMessage: string,
      errorMessage?: string
    ): Promise<T | null> => {
      return new Promise((resolve) => {
        notifications.showConfirm({
          title,
          description,
          variant: "destructive",
          onConfirm: async () => {
            try {
              const result = await apiCall();
              notifications.success(successMessage);
              resolve(result);
            } catch (error: any) {
              const message =
                error?.data?.detail ||
                error?.message ||
                errorMessage ||
                "Operation failed";
              notifications.error(message);
              resolve(null);
            }
          },
          onCancel: () => resolve(null),
        });
      });
    },
  };
}

/**
 * Hook for document-specific operations
 */
export function useDocumentNotifications() {
  const notifications = useCrudNotifications();

  return {
    ...notifications,

    documentUploaded: (filename: string) => {
      notifications.uploaded(filename);
    },

    documentApproved: (filename: string) => {
      notifications.approved(filename);
    },

    documentRejected: (filename: string) => {
      notifications.rejected(filename);
    },

    confirmDocumentDelete: (
      filename: string,
      onConfirm: () => void | Promise<void>
    ) => {
      notifications.confirmDelete(filename, onConfirm, "document");
    },

    promptForApproval: (
      filename: string,
      onConfirm: (notes: string) => void | Promise<void>
    ) => {
      notifications.promptForInput(
        "Approve Document",
        `You are about to approve "${filename}". You can add optional approval notes below.`,
        onConfirm,
        {
          placeholder: "Optional approval notes...",
          multiline: true,
        }
      );
    },

    promptForRejection: (
      filename: string,
      onConfirm: (reason: string) => void | Promise<void>
    ) => {
      notifications.promptForInput(
        "Reject Document",
        `Please provide a reason for rejecting "${filename}".`,
        onConfirm,
        {
          placeholder: "Reason for rejection (required)...",
          required: true,
          multiline: true,
        }
      );
    },
  };
}

/**
 * Hook for task-specific operations
 */
export function useTaskNotifications() {
  const notifications = useCrudNotifications();

  return {
    ...notifications,

    taskCreated: (taskTitle: string) => {
      notifications.created(taskTitle, "Task");
    },

    taskUpdated: (taskTitle: string) => {
      notifications.updated(taskTitle, "Task");
    },

    taskCompleted: (taskTitle: string) => {
      notifications.success(
        `"${taskTitle}" has been marked as complete.`,
        "Task completed"
      );
    },

    confirmTaskDelete: (
      taskTitle: string,
      onConfirm: () => void | Promise<void>
    ) => {
      notifications.confirmDelete(taskTitle, onConfirm, "task");
    },
  };
}

/**
 * Hook for note-specific operations
 */
export function useNoteNotifications() {
  const notifications = useCrudNotifications();

  return {
    ...notifications,

    noteCreated: (noteTitle: string) => {
      notifications.created(noteTitle, "Note");
    },

    noteUpdated: (noteTitle: string) => {
      notifications.updated(noteTitle, "Note");
    },

    confirmNoteDelete: (
      noteTitle: string,
      onConfirm: () => void | Promise<void>
    ) => {
      notifications.confirmDelete(noteTitle, onConfirm, "note");
    },
  };
}

/**
 * Hook for lead-specific operations
 */
export function useLeadNotifications() {
  const notifications = useCrudNotifications();

  return {
    ...notifications,

    leadCreated: (leadName: string) => {
      notifications.created(leadName, "Lead");
    },

    leadUpdated: (leadName: string) => {
      notifications.updated(leadName, "Lead");
    },

    stageUpdated: (leadName: string, newStage: string) => {
      notifications.success(
        `"${leadName}" moved to ${newStage}.`,
        "Stage updated"
      );
    },

    confirmLeadDelete: (
      leadName: string,
      onConfirm: () => void | Promise<void>
    ) => {
      notifications.confirmDelete(leadName, onConfirm, "lead");
    },
  };
}

/**
 * Hook for contact-specific operations
 */
export function useContactNotifications() {
  const notifications = useCrudNotifications();

  return {
    ...notifications,

    contactCreated: (contactName: string) => {
      notifications.created(contactName, "Contact");
    },

    contactUpdated: (contactName: string) => {
      notifications.updated(contactName, "Contact");
    },

    contactDeleted: (contactName: string) => {
      notifications.deleted(contactName, "Contact");
    },

    primaryContactSet: (contactName: string) => {
      notifications.success(
        `"${contactName}" has been set as the primary contact.`,
        "Primary contact updated"
      );
    },

    contactAdded: (contactName: string, leadName?: string) => {
      const message = leadName
        ? `"${contactName}" has been added to ${leadName}.`
        : `"${contactName}" has been added.`;
      notifications.success(message, "Contact added");
    },

    confirmContactDelete: (
      contactName: string,
      onConfirm: () => void | Promise<void>
    ) => {
      notifications.confirmDelete(contactName, onConfirm, "contact");
    },

    confirmSetPrimary: (
      contactName: string,
      onConfirm: () => void | Promise<void>
    ) => {
      notifications.confirmAction(
        "Set Primary Contact",
        `Are you sure you want to set "${contactName}" as the primary contact? This will remove the primary status from the current primary contact.`,
        onConfirm,
        "Set as Primary"
      );
    },

    promptForContactNotes: (
      contactName: string,
      onConfirm: (notes: string) => void | Promise<void>
    ) => {
      notifications.promptForInput(
        "Add Contact Notes",
        `Add notes for "${contactName}".`,
        onConfirm,
        {
          placeholder: "Enter contact notes...",
          multiline: true,
        }
      );
    },

    // Contact-specific error messages
    contactCreateError: () => {
      notifications.createError("contact");
    },

    contactUpdateError: () => {
      notifications.updateError("contact");
    },

    contactDeleteError: () => {
      notifications.deleteError("contact");
    },

    primaryContactError: () => {
      notifications.error(
        "Please try again or contact support.",
        "Failed to set primary contact"
      );
    },

    duplicateContactError: () => {
      notifications.error(
        "A contact with this email already exists for this lead.",
        "Duplicate contact"
      );
    },

    invalidContactError: () => {
      notifications.error(
        "Please check the contact information and try again.",
        "Invalid contact data"
      );
    },

    // Contact validation messages
    contactValidationError: (field: string) => {
      notifications.validationError(`Please provide a valid ${field}.`);
    },

    emailValidationError: () => {
      notifications.validationError("Please provide a valid email address.");
    },

    phoneValidationError: () => {
      notifications.validationError("Please provide a valid phone number.");
    },

    // Bulk operations
    confirmBulkContactDelete: (
      contactCount: number,
      onConfirm: () => void | Promise<void>
    ) => {
      notifications.confirmAction(
        "Delete Multiple Contacts",
        `Are you sure you want to delete ${contactCount} contact(s)? This action cannot be undone.`,
        onConfirm,
        "Delete All"
      );
    },

    bulkContactsDeleted: (count: number) => {
      notifications.success(
        `${count} contact(s) have been deleted successfully.`,
        "Contacts deleted"
      );
    },

    // Import/Export operations
    contactsImported: (count: number) => {
      notifications.success(
        `${count} contact(s) have been imported successfully.`,
        "Contacts imported"
      );
    },

    contactsExported: (count: number) => {
      notifications.success(
        `${count} contact(s) have been exported successfully.`,
        "Contacts exported"
      );
    },

    importError: () => {
      notifications.error(
        "Please check the file format and try again.",
        "Import failed"
      );
    },

    exportError: () => {
      notifications.error(
        "Please try again or contact support.",
        "Export failed"
      );
    },
  };
}
