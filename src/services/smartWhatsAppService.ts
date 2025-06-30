// src/services/smartWhatsAppService.ts - Intelligent messaging with templates

import {
  WhatsAppService,
  type SendTextRequest,
  type SendTemplateRequest,
  type WhatsAppResponse,
} from "./whatsappService";

export interface SmartMessageRequest {
  contact: string;
  message?: string;
  customerName?: string;
  leadType?: "new_lead" | "trial" | "follow_up";
  preferTemplate?: boolean;
}

export interface SmartMessageOptions {
  fallbackToTemplate: boolean;
  templateMapping: {
    new_lead: string;
    trial: string;
    follow_up: string;
  };
}

export class SmartWhatsAppService {
  private static options: SmartMessageOptions = {
    fallbackToTemplate: true,
    templateMapping: {
      new_lead: "lead_new",
      trial: "trial",
      follow_up: "lead_new", // Fallback to lead_new for follow-ups
    },
  };

  /**
   * Intelligent message sending - automatically chooses best approach
   */
  static async sendSmartMessage(
    request: SmartMessageRequest
  ): Promise<WhatsAppResponse> {
    const {
      contact,
      message,
      customerName,
      leadType = "new_lead",
      preferTemplate = false,
    } = request;

    console.log("📱 Smart messaging for:", contact, "Type:", leadType);

    // For new leads or when template is preferred, use templates directly
    if (leadType === "new_lead" || leadType === "trial" || preferTemplate) {
      return this.sendTemplateForLead(
        contact,
        customerName || "Valued Customer",
        leadType
      );
    }

    // For follow-ups, try conversation validity first
    try {
      const conversationValid = await WhatsAppService.checkConversationValidity(
        contact
      );

      if (conversationValid.success && message) {
        // Customer is in 24-hour window - send free-form message
        console.log(
          "✅ Customer in 24-hour window - sending free-form message"
        );
        return await WhatsAppService.sendTextMessage({
          contact,
          message,
        });
      } else {
        // Outside 24-hour window - fallback to template
        console.log("⚠️ Outside 24-hour window - using template instead");
        return this.sendTemplateForLead(
          contact,
          customerName || "Valued Customer",
          "follow_up"
        );
      }
    } catch (error) {
      console.error(
        "❌ Error checking conversation validity, falling back to template:",
        error
      );
      // Fallback to template on error
      return this.sendTemplateForLead(
        contact,
        customerName || "Valued Customer",
        leadType
      );
    }
  }

  /**
   * Send appropriate template based on lead type
   */
  private static async sendTemplateForLead(
    contact: string,
    customerName: string,
    leadType: "new_lead" | "trial" | "follow_up"
  ): Promise<WhatsAppResponse> {
    const templateId = this.options.templateMapping[leadType];

    const templateRequest: SendTemplateRequest = {
      contact,
      template: templateId,
      params: templateId === "lead_new" ? [customerName] : [], // lead_new needs name parameter
    };

    console.log(`📋 Sending ${templateId} template to ${customerName}`);

    const result = await WhatsAppService.sendTemplateMessage(templateRequest);

    // Log the activity with template info
    WhatsAppService.logActivity({
      type: "template",
      contact,
      templateId,
      success: result.success,
      response: result.message,
    });

    return result;
  }

  /**
   * Send welcome message to new leads (always uses template)
   */
  static async sendWelcomeToNewLead(
    contact: string,
    customerName: string
  ): Promise<WhatsAppResponse> {
    return this.sendSmartMessage({
      contact,
      customerName,
      leadType: "new_lead",
      preferTemplate: true,
    });
  }

  /**
   * Send trial welcome message (always uses template)
   */
  static async sendTrialWelcome(contact: string): Promise<WhatsAppResponse> {
    return this.sendSmartMessage({
      contact,
      leadType: "trial",
      preferTemplate: true,
    });
  }

  /**
   * Send follow-up message (smart detection)
   */
  static async sendFollowUp(
    contact: string,
    message: string,
    customerName?: string
  ): Promise<WhatsAppResponse> {
    return this.sendSmartMessage({
      contact,
      message,
      customerName,
      leadType: "follow_up",
    });
  }

  /**
   * Force template message (for guaranteed delivery)
   */
  static async sendTemplateMessage(
    contact: string,
    customerName: string,
    templateType: "new_lead" | "trial" = "new_lead"
  ): Promise<WhatsAppResponse> {
    return this.sendSmartMessage({
      contact,
      customerName,
      leadType: templateType,
      preferTemplate: true,
    });
  }

  /**
   * Check if customer is in active conversation window
   */
  static async isInActiveConversation(contact: string): Promise<boolean> {
    try {
      const result = await WhatsAppService.checkConversationValidity(contact);
      return result.success;
    } catch {
      return false;
    }
  }

  /**
   * Get recommended messaging approach for a contact
   */
  static async getRecommendedApproach(contact: string): Promise<{
    approach: "template" | "freeform";
    reason: string;
    canSendFreeform: boolean;
  }> {
    const inActiveConversation = await this.isInActiveConversation(contact);

    if (inActiveConversation) {
      return {
        approach: "freeform",
        reason: "Customer is in 24-hour conversation window",
        canSendFreeform: true,
      };
    } else {
      return {
        approach: "template",
        reason: "Customer outside 24-hour window - template required",
        canSendFreeform: false,
      };
    }
  }
}
