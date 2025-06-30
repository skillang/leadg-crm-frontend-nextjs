// src/services/whatsappService.ts - Updated to use Next.js API routes

import {
  WHATSAPP_TEMPLATES,
  type WhatsAppTemplate,
} from "@/config/whatsappConfig";

export interface WhatsAppContact {
  number: string;
  name?: string;
}

export interface SendTemplateRequest {
  contact: string;
  template: string;
  params?: string[];
  fileUrl?: string;
  urlParam?: string;
  headUrl?: string;
  headParam?: string;
  name?: string;
  pdfName?: string;
}

export interface SendTextRequest {
  contact: string;
  message: string;
}

export interface SendMediaRequest {
  contact: string;
  type: "audio" | "video" | "image" | "document";
  fileUrl: string;
  caption?: string;
}

export interface WhatsAppResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

export class WhatsAppService {
  // Check if WhatsApp integration is enabled
  static isEnabled(): boolean {
    return process.env.NEXT_PUBLIC_WHATSAPP_ENABLED === "true" || true;
  }

  // Validate configuration
  static validateConfiguration(): { isValid: boolean; errors: string[] } {
    if (!this.isEnabled()) {
      return { isValid: false, errors: ["WhatsApp integration is disabled"] };
    }
    // Server-side validation will be done in API routes
    return { isValid: true, errors: [] };
  }

  /**
   * Format phone number for WhatsApp API (ensure it has country code)
   */
  private static formatPhoneNumber(phoneNumber: string): string {
    const cleanNumber = phoneNumber.replace(/\D/g, "");

    // For Indian numbers, add 91 if not present
    if (!cleanNumber.startsWith("91") && cleanNumber.length === 10) {
      return `91${cleanNumber}`;
    }

    if (cleanNumber.startsWith("91")) {
      return cleanNumber;
    }

    // For numbers with +, remove it
    if (phoneNumber.startsWith("+")) {
      return phoneNumber.substring(1).replace(/\D/g, "");
    }

    return cleanNumber;
  }

  /**
   * Check if account is valid - Now uses Next.js API route
   */
  static async checkAccountValidity(): Promise<WhatsAppResponse> {
    if (!this.isEnabled()) {
      return { success: false, error: "WhatsApp integration is disabled" };
    }

    try {
      console.log("🔍 Checking WhatsApp account validity via API route...");

      const response = await fetch("/api/whatsapp/account-validity", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      console.log("📞 Account validity response:", data);

      return data;
    } catch (error) {
      console.error("❌ Account validity check failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Check conversation validity for a contact - Now uses Next.js API route
   */
  static async checkConversationValidity(
    contact: string
  ): Promise<WhatsAppResponse> {
    if (!this.isEnabled()) {
      return { success: false, error: "WhatsApp integration is disabled" };
    }

    try {
      const formattedContact = this.formatPhoneNumber(contact);
      console.log("🔍 Checking conversation validity for:", formattedContact);

      const response = await fetch("/api/whatsapp/conversation-validity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contact: formattedContact }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      console.log("📞 Conversation validity response:", data);

      return data;
    } catch (error) {
      console.error("❌ Conversation validity check failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Send template message - Now uses Next.js API route
   */
  static async sendTemplateMessage(
    request: SendTemplateRequest
  ): Promise<WhatsAppResponse> {
    if (!this.isEnabled()) {
      return { success: false, error: "WhatsApp integration is disabled" };
    }

    try {
      const formattedContact = this.formatPhoneNumber(request.contact);
      console.log("📱 Sending WhatsApp template to:", formattedContact);

      const response = await fetch("/api/whatsapp/send-template", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...request,
          contact: formattedContact,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      console.log("✅ Template response:", data);

      return data;
    } catch (error) {
      console.error("❌ Template send failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Send text message - Now uses Next.js API route
   */
  static async sendTextMessage(
    request: SendTextRequest
  ): Promise<WhatsAppResponse> {
    if (!this.isEnabled()) {
      return { success: false, error: "WhatsApp integration is disabled" };
    }

    try {
      const formattedContact = this.formatPhoneNumber(request.contact);
      console.log("📱 Sending WhatsApp text to:", formattedContact);
      console.log("📱 Message:", request.message);

      const response = await fetch("/api/whatsapp/send-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contact: formattedContact,
          message: request.message,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      console.log("✅ Text response:", data);

      return data;
    } catch (error) {
      console.error("❌ Text send failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Send media message - Now uses Next.js API route
   */
  static async sendMediaMessage(
    request: SendMediaRequest
  ): Promise<WhatsAppResponse> {
    if (!this.isEnabled()) {
      return { success: false, error: "WhatsApp integration is disabled" };
    }

    try {
      const formattedContact = this.formatPhoneNumber(request.contact);
      console.log("📱 Sending WhatsApp media to:", formattedContact);
      console.log("📱 Media type:", request.type, "URL:", request.fileUrl);

      const response = await fetch("/api/whatsapp/send-media", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contact: formattedContact,
          type: request.type,
          fileUrl: request.fileUrl,
          caption: request.caption,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      console.log("✅ Media response:", data);

      return data;
    } catch (error) {
      console.error("❌ Media send failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get available templates
   */
  static getAvailableTemplates(): WhatsAppTemplate[] {
    return WHATSAPP_TEMPLATES.filter(
      (template) => template.status === "APPROVED"
    );
  }

  /**
   * Get template by ID
   */
  static getTemplateById(templateId: string): WhatsAppTemplate | undefined {
    return WHATSAPP_TEMPLATES.find((template) => template.id === templateId);
  }

  /**
   * Validate phone number
   */
  static isValidPhoneNumber(phoneNumber: string): boolean {
    const cleanNumber = phoneNumber.replace(/\D/g, "");
    return cleanNumber.length >= 10;
  }

  /**
   * Preview template with parameters
   */
  static previewTemplate(templateId: string, parameters: string[]): string {
    const template = this.getTemplateById(templateId);
    if (!template) return "";

    let preview = template.preview;

    // Replace parameters ({{1}}, {{2}}, etc.)
    parameters.forEach((param, index) => {
      preview = preview.replace(
        new RegExp(`\\{\\{${index + 1}\\}\\}`, "g"),
        param
      );
    });

    return preview;
  }

  /**
   * Get parameter names for a template
   */
  static getTemplateParameters(templateId: string): string[] {
    const template = this.getTemplateById(templateId);
    if (!template) return [];

    return template.parameters || [];
  }

  /**
   * Test WhatsApp service connection - Now uses Next.js API route
   */
  static async testConnection(): Promise<WhatsAppResponse> {
    if (!this.isEnabled()) {
      return { success: false, error: "WhatsApp integration is disabled" };
    }

    console.log("🔧 Testing WhatsApp API connection...");

    try {
      const validationResult = await this.checkAccountValidity();

      if (validationResult.success) {
        console.log("✅ WhatsApp API connection successful!");
        return {
          success: true,
          message: "Connection successful",
          data: validationResult.data,
        };
      } else {
        console.error(
          "❌ WhatsApp API connection failed:",
          validationResult.error
        );
        return validationResult;
      }
    } catch (error) {
      console.error("💥 Connection test failed:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Connection test failed",
      };
    }
  }

  /**
   * Log WhatsApp activity (you can integrate this with your backend logging)
   */
  static logActivity(activity: {
    type: "template" | "text" | "media";
    contact: string;
    leadId?: string;
    templateId?: string;
    message?: string;
    success: boolean;
    response?: string;
  }): void {
    console.log("📝 WhatsApp Activity:", {
      timestamp: new Date().toISOString(),
      ...activity,
    });

    // TODO: You can send this to your backend API for logging
    // Example:
    // fetch('/api/v1/whatsapp/log-activity', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(activity)
    // });
  }
}
