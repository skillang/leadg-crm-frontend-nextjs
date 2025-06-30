// src/hooks/useWhatsApp.ts - Custom hook for WhatsApp functionality

import { useState, useCallback } from "react";
import {
  WhatsAppService,
  SendTemplateRequest,
  SendTextRequest,
  SendMediaRequest,
} from "@/services/whatsappService";
import { useNotifications } from "@/components/common/NotificationSystem";

interface WhatsAppContact {
  phone: string;
  name?: string;
  leadId?: string;
}

interface UseWhatsAppReturn {
  // State
  isLoading: boolean;
  isEnabled: boolean;

  // Actions
  openWhatsApp: (contact: WhatsAppContact) => void;
  sendTemplate: (
    templateId: string,
    parameters: string[],
    contact: WhatsAppContact
  ) => Promise<boolean>;
  sendText: (message: string, contact: WhatsAppContact) => Promise<boolean>;
  sendMedia: (
    mediaUrl: string,
    type: "image" | "video" | "document" | "audio",
    contact: WhatsAppContact,
    caption?: string
  ) => Promise<boolean>;
  testConnection: () => Promise<boolean>;

  // Utilities
  formatPhoneNumber: (phone: string) => string;
  validatePhoneNumber: (phone: string) => boolean;
  previewTemplate: (templateId: string, parameters: string[]) => string;
  getAvailableTemplates: () => any[];
}

/**
 * Custom hook for WhatsApp Business API integration
 * Provides easy-to-use methods for sending WhatsApp messages
 */
export const useWhatsApp = (): UseWhatsAppReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const notifications = useNotifications();

  // Check if WhatsApp is enabled
  const isEnabled = WhatsAppService.isEnabled();

  /**
   * Open WhatsApp with a phone number (fallback to wa.me)
   */
  const openWhatsApp = useCallback(
    (contact: WhatsAppContact) => {
      if (!contact.phone) {
        notifications.error("No phone number available");
        return;
      }

      const cleanNumber = contact.phone.replace(/\D/g, "");
      const whatsappUrl = `https://wa.me/${cleanNumber}`;

      window.open(whatsappUrl, "_blank");
    },
    [notifications]
  );

  /**
   * Send a template message
   */
  const sendTemplate = useCallback(
    async (
      templateId: string,
      parameters: string[],
      contact: WhatsAppContact
    ): Promise<boolean> => {
      if (!isEnabled) {
        notifications.error("WhatsApp integration is disabled");
        return false;
      }

      if (!contact.phone) {
        notifications.error("No phone number provided");
        return false;
      }

      setIsLoading(true);
      try {
        const request: SendTemplateRequest = {
          contact: contact.phone,
          template: templateId,
          params: parameters,
          name: contact.name,
        };

        const result = await WhatsAppService.sendTemplateMessage(request);

        // Log activity
        WhatsAppService.logActivity({
          type: "template",
          contact: contact.phone,
          leadId: contact.leadId,
          templateId: templateId,
          success: result.success,
          response: result.message,
        });

        if (result.success) {
          notifications.success(
            `Template message sent successfully to ${
              contact.name || contact.phone
            }`,
            "WhatsApp Message Sent"
          );
          return true;
        } else {
          notifications.error(
            result.error || "Failed to send template message",
            "WhatsApp Error"
          );
          return false;
        }
      } catch (error) {
        console.error("Template send error:", error);
        notifications.error("Network error occurred. Please try again.");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [isEnabled, notifications]
  );

  /**
   * Send a text message
   */
  const sendText = useCallback(
    async (message: string, contact: WhatsAppContact): Promise<boolean> => {
      if (!isEnabled) {
        notifications.error("WhatsApp integration is disabled");
        return false;
      }

      if (!contact.phone) {
        notifications.error("No phone number provided");
        return false;
      }

      if (!message.trim()) {
        notifications.error("Message cannot be empty");
        return false;
      }

      setIsLoading(true);
      try {
        const request: SendTextRequest = {
          contact: contact.phone,
          message: message.trim(),
        };

        const result = await WhatsAppService.sendTextMessage(request);

        // Log activity
        WhatsAppService.logActivity({
          type: "text",
          contact: contact.phone,
          leadId: contact.leadId,
          message: message.trim(),
          success: result.success,
          response: result.message,
        });

        if (result.success) {
          notifications.success(
            `Text message sent successfully to ${
              contact.name || contact.phone
            }`,
            "WhatsApp Message Sent"
          );
          return true;
        } else {
          notifications.error(
            result.error || "Failed to send text message",
            "WhatsApp Error"
          );
          return false;
        }
      } catch (error) {
        console.error("Text send error:", error);
        notifications.error("Network error occurred. Please try again.");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [isEnabled, notifications]
  );

  /**
   * Send a media message
   */
  const sendMedia = useCallback(
    async (
      mediaUrl: string,
      type: "image" | "video" | "document" | "audio",
      contact: WhatsAppContact,
      caption?: string
    ): Promise<boolean> => {
      if (!isEnabled) {
        notifications.error("WhatsApp integration is disabled");
        return false;
      }

      if (!contact.phone) {
        notifications.error("No phone number provided");
        return false;
      }

      if (!mediaUrl.trim()) {
        notifications.error("Media URL cannot be empty");
        return false;
      }

      // Validate URL format
      try {
        new URL(mediaUrl.trim());
      } catch {
        notifications.error("Please provide a valid URL for the media file");
        return false;
      }

      setIsLoading(true);
      try {
        const request: SendMediaRequest = {
          contact: contact.phone,
          type: type,
          fileUrl: mediaUrl.trim(),
          caption: caption?.trim(),
        };

        const result = await WhatsAppService.sendMediaMessage(request);

        // Log activity
        WhatsAppService.logActivity({
          type: "media",
          contact: contact.phone,
          leadId: contact.leadId,
          message: `${type}: ${mediaUrl}`,
          success: result.success,
          response: result.message,
        });

        if (result.success) {
          notifications.success(
            `${
              type.charAt(0).toUpperCase() + type.slice(1)
            } message sent successfully to ${contact.name || contact.phone}`,
            "WhatsApp Message Sent"
          );
          return true;
        } else {
          notifications.error(
            result.error || "Failed to send media message",
            "WhatsApp Error"
          );
          return false;
        }
      } catch (error) {
        console.error("Media send error:", error);
        notifications.error("Network error occurred. Please try again.");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [isEnabled, notifications]
  );

  /**
   * Test WhatsApp API connection
   */
  const testConnection = useCallback(async (): Promise<boolean> => {
    if (!isEnabled) {
      notifications.error("WhatsApp integration is disabled");
      return false;
    }

    setIsLoading(true);
    try {
      const result = await WhatsAppService.testConnection();

      if (result.success) {
        notifications.success(
          "WhatsApp API connection successful",
          "Connection Test"
        );
        return true;
      } else {
        notifications.error(
          result.error || "Connection test failed",
          "Connection Test Failed"
        );
        return false;
      }
    } catch (error) {
      console.error("Connection test error:", error);
      notifications.error(
        "Connection test failed. Please check your configuration."
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isEnabled, notifications]);

  /**
   * Format phone number for WhatsApp
   */
  const formatPhoneNumber = useCallback((phone: string): string => {
    const cleanNumber = phone.replace(/\D/g, "");

    // For Indian numbers, add 91 if not present
    if (!cleanNumber.startsWith("91") && cleanNumber.length === 10) {
      return `+91 ${cleanNumber}`;
    }

    if (cleanNumber.startsWith("91")) {
      return `+${cleanNumber}`;
    }

    return phone;
  }, []);

  /**
   * Validate phone number format
   */
  const validatePhoneNumber = useCallback((phone: string): boolean => {
    return WhatsAppService.isValidPhoneNumber(phone);
  }, []);

  /**
   * Preview template with parameters
   */
  const previewTemplate = useCallback(
    (templateId: string, parameters: string[]): string => {
      return WhatsAppService.previewTemplate(templateId, parameters);
    },
    []
  );

  /**
   * Get available templates
   */
  const getAvailableTemplates = useCallback(() => {
    return WhatsAppService.getAvailableTemplates();
  }, []);

  return {
    // State
    isLoading,
    isEnabled,

    // Actions
    openWhatsApp,
    sendTemplate,
    sendText,
    sendMedia,
    testConnection,

    // Utilities
    formatPhoneNumber,
    validatePhoneNumber,
    previewTemplate,
    getAvailableTemplates,
  };
};

// Additional utility functions that can be used outside of the hook

/**
 * Quick send template message (for use in event handlers)
 */
export const quickSendTemplate = async (
  templateId: string,
  parameters: string[],
  phone: string,
  leadName?: string,
  leadId?: string
): Promise<void> => {
  if (!WhatsAppService.isEnabled()) {
    alert("WhatsApp integration is disabled");
    return;
  }

  try {
    const result = await WhatsAppService.sendTemplateMessage({
      contact: phone,
      template: templateId,
      params: parameters,
      name: leadName,
    });

    WhatsAppService.logActivity({
      type: "template",
      contact: phone,
      leadId: leadId,
      templateId: templateId,
      success: result.success,
      response: result.message,
    });

    if (result.success) {
      alert(`Template message sent successfully to ${leadName || phone}`);
    } else {
      alert(`Failed to send message: ${result.error || result.message}`);
    }
  } catch (error) {
    console.error("Quick send error:", error);
    alert("Failed to send message. Please try again.");
  }
};

/**
 * Quick send text message (for use in event handlers)
 */
export const quickSendText = async (
  message: string,
  phone: string,
  leadName?: string,
  leadId?: string
): Promise<void> => {
  if (!WhatsAppService.isEnabled()) {
    alert("WhatsApp integration is disabled");
    return;
  }

  try {
    const result = await WhatsAppService.sendTextMessage({
      contact: phone,
      message: message,
    });

    WhatsAppService.logActivity({
      type: "text",
      contact: phone,
      leadId: leadId,
      message: message,
      success: result.success,
      response: result.message,
    });

    if (result.success) {
      alert(`Text message sent successfully to ${leadName || phone}`);
    } else {
      alert(`Failed to send message: ${result.error || result.message}`);
    }
  } catch (error) {
    console.error("Quick send error:", error);
    alert("Failed to send message. Please try again.");
  }
};
