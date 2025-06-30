// src/services/leadManagementService.ts - Integration with smart WhatsApp messaging

import { SmartWhatsAppService } from "./smartWhatsAppService";

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  source: string;
  status: "new" | "contacted" | "qualified" | "converted";
  isNewLead?: boolean;
  isTrial?: boolean;
  createdAt: Date;
}

export class LeadManagementService {
  /**
   * Create new lead and automatically send welcome message
   */
  static async createNewLead(
    leadData: Omit<Lead, "id" | "createdAt" | "status">
  ): Promise<{
    lead: Lead;
    whatsappResult?: any;
  }> {
    // Create the lead record
    const newLead: Lead = {
      ...leadData,
      id: Date.now().toString(), // Replace with your ID generation logic
      createdAt: new Date(),
      status: "new",
      isNewLead: true,
    };

    console.log("👤 Creating new lead:", newLead.name);

    // Save lead to database (replace with your actual database logic)
    // await saveLead(newLead);

    let whatsappResult;

    // Automatically send welcome message if phone number is provided
    if (newLead.phone && newLead.phone.trim() !== "") {
      try {
        console.log("📱 Sending welcome message to new lead...");
        whatsappResult = await SmartWhatsAppService.sendWelcomeToNewLead(
          newLead.phone,
          newLead.name
        );

        if (whatsappResult.success) {
          console.log("✅ Welcome message sent successfully");
          // Update lead status to 'contacted'
          newLead.status = "contacted";
        } else {
          console.error(
            "❌ Failed to send welcome message:",
            whatsappResult.error
          );
        }
      } catch (error) {
        console.error("❌ Error sending welcome message:", error);
        whatsappResult = {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }

    return {
      lead: newLead,
      whatsappResult,
    };
  }

  /**
   * Create trial user and send trial welcome
   */
  static async createTrialUser(
    leadData: Omit<Lead, "id" | "createdAt" | "status">
  ): Promise<{
    lead: Lead;
    whatsappResult?: any;
  }> {
    const trialLead: Lead = {
      ...leadData,
      id: Date.now().toString(),
      createdAt: new Date(),
      status: "new",
      isTrial: true,
    };

    console.log("🚀 Creating trial user:", trialLead.name);

    // Save to database
    // await saveLead(trialLead);

    let whatsappResult;

    if (trialLead.phone && trialLead.phone.trim() !== "") {
      try {
        console.log("📱 Sending trial welcome message...");
        whatsappResult = await SmartWhatsAppService.sendTrialWelcome(
          trialLead.phone
        );

        if (whatsappResult.success) {
          console.log("✅ Trial welcome sent successfully");
          trialLead.status = "contacted";
        }
      } catch (error) {
        console.error("❌ Error sending trial welcome:", error);
        whatsappResult = {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }

    return {
      lead: trialLead,
      whatsappResult,
    };
  }

  /**
   * Send follow-up message to existing lead
   */
  static async sendLeadFollowUp(
    leadId: string,
    message: string,
    lead?: Lead
  ): Promise<any> {
    // If lead not provided, fetch from database
    if (!lead) {
      // lead = await fetchLead(leadId);
      throw new Error("Lead data required for follow-up");
    }

    if (!lead.phone) {
      throw new Error("Lead phone number is required");
    }

    console.log("📞 Sending follow-up to:", lead.name);

    try {
      const result = await SmartWhatsAppService.sendFollowUp(
        lead.phone,
        message,
        lead.name
      );

      if (result.success) {
        console.log("✅ Follow-up sent successfully");
        // Update lead last contact time
        // await updateLeadLastContact(leadId);
      }

      return result;
    } catch (error) {
      console.error("❌ Error sending follow-up:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Bulk send templates to multiple leads
   */
  static async sendBulkTemplateMessages(
    leads: Lead[],
    templateType: "new_lead" | "trial" = "new_lead"
  ): Promise<{
    successful: number;
    failed: number;
    results: Array<{ leadId: string; success: boolean; error?: string }>;
  }> {
    console.log(
      `📮 Sending bulk ${templateType} messages to ${leads.length} leads`
    );

    const results = [];
    let successful = 0;
    let failed = 0;

    for (const lead of leads) {
      if (!lead.phone) {
        results.push({
          leadId: lead.id,
          success: false,
          error: "No phone number",
        });
        failed++;
        continue;
      }

      try {
        const result = await SmartWhatsAppService.sendTemplateMessage(
          lead.phone,
          lead.name,
          templateType
        );

        if (result.success) {
          successful++;
          results.push({ leadId: lead.id, success: true });
        } else {
          failed++;
          results.push({
            leadId: lead.id,
            success: false,
            error: result.error,
          });
        }

        // Add delay between messages to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        failed++;
        results.push({
          leadId: lead.id,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    console.log(
      `📊 Bulk send complete: ${successful} successful, ${failed} failed`
    );

    return {
      successful,
      failed,
      results,
    };
  }

  /**
   * Check messaging readiness for a lead
   */
  static async getLeadMessagingStatus(lead: Lead): Promise<{
    canMessage: boolean;
    recommendedApproach: "template" | "freeform";
    reason: string;
    inActiveConversation: boolean;
  }> {
    if (!lead.phone) {
      return {
        canMessage: false,
        recommendedApproach: "template",
        reason: "No phone number provided",
        inActiveConversation: false,
      };
    }

    try {
      const approach = await SmartWhatsAppService.getRecommendedApproach(
        lead.phone
      );

      return {
        canMessage: true,
        recommendedApproach: approach.approach,
        reason: approach.reason,
        inActiveConversation: approach.canSendFreeform,
      };
    } catch (error) {
      return {
        canMessage: true,
        recommendedApproach: "template",
        reason: "Error checking status - template recommended for safety",
        inActiveConversation: false,
      };
    }
  }
}

// Example usage functions for your CRM components:

/**
 * Use this when a new lead fills out a form
 */
export const handleNewLeadSubmission = async (formData: {
  name: string;
  phone: string;
  email?: string;
  source: string;
}) => {
  try {
    const { lead, whatsappResult } = await LeadManagementService.createNewLead(
      formData
    );

    // Show success message to user
    if (whatsappResult?.success) {
      console.log("🎉 Lead created and welcome message sent!");
      // toast.success('Lead created and welcome message sent!');
    } else {
      console.log("👤 Lead created, but WhatsApp message failed");
      // toast.warning('Lead created, but WhatsApp message failed');
    }

    return lead;
  } catch (error) {
    console.error("❌ Error creating lead:", error);
    throw error;
  }
};

/**
 * Use this for trial signups
 */
export const handleTrialSignup = async (formData: {
  name: string;
  phone: string;
  email?: string;
}) => {
  try {
    const { lead, whatsappResult } =
      await LeadManagementService.createTrialUser({
        ...formData,
        source: "trial_signup",
      });

    if (whatsappResult?.success) {
      console.log("🚀 Trial user created and welcome sent!");
    }

    return lead;
  } catch (error) {
    console.error("❌ Error creating trial user:", error);
    throw error;
  }
};

/**
 * Use this for follow-up campaigns
 */
export const handleFollowUpCampaign = async (leads: Lead[]) => {
  try {
    const results = await LeadManagementService.sendBulkTemplateMessages(
      leads,
      "new_lead"
    );

    console.log(
      `📊 Campaign results: ${results.successful}/${leads.length} successful`
    );

    return results;
  } catch (error) {
    console.error("❌ Error sending campaign:", error);
    throw error;
  }
};
