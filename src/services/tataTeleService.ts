// src/services/tataTeleService.ts

interface TataTeleCallRequest {
  customer_number: string;
  api_key: string;
  get_call_id: number;
}

interface TataTeleCallResponse {
  success: boolean;
  call_id?: string;
  message?: string;
  error?: string;
}

export class TataTeleService {
  private static readonly API_URL =
    "https://api-smartflo.tatateleservices.com/v1/click_to_call_support";
  private static readonly API_KEY = "8a83c135-d251-49fe-bb83-0d2ab2bd2326";

  /**
   * Format phone number to include country code if not present
   */
  private static formatPhoneNumber(phoneNumber: string): string {
    const cleanNumber = phoneNumber.replace(/\D/g, "");

    if (!cleanNumber.startsWith("91") && cleanNumber.length === 10) {
      return `91${cleanNumber}`;
    }

    if (cleanNumber.startsWith("91")) {
      return cleanNumber;
    }

    return cleanNumber;
  }

  /**
   * Validate phone number format
   */
  private static isValidPhoneNumber(phoneNumber: string): boolean {
    const cleanNumber = phoneNumber.replace(/\D/g, "");
    return cleanNumber.length >= 10;
  }

  /**
   * SOLUTION 1: Make call with minimal headers (Try this first)
   */
  static async makeCall(phoneNumber: string): Promise<TataTeleCallResponse> {
    try {
      if (!this.isValidPhoneNumber(phoneNumber)) {
        return {
          success: false,
          error: "Invalid phone number format",
        };
      }

      const formattedNumber = this.formatPhoneNumber(phoneNumber);

      const requestPayload: TataTeleCallRequest = {
        customer_number: formattedNumber,
        api_key: this.API_KEY,
        get_call_id: 1,
      };

      console.log(
        "🔄 Attempting Tata Tele call with minimal headers for:",
        formattedNumber
      );

      // UPDATED: Use only essential headers to avoid CORS issues
      const response = await fetch(this.API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Removed: Cache-Control, User-Agent (these cause CORS issues)
        },
        body: JSON.stringify(requestPayload),
      });

      console.log("📞 Tata Tele API Response Status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Tata Tele API Error:", errorText);

        return {
          success: false,
          error: `API Error: ${response.status} - ${response.statusText}`,
        };
      }

      const responseData = await response.json();
      console.log("✅ Tata Tele API Success:", responseData);

      return {
        success: true,
        call_id: responseData.call_id,
        message: responseData.message || "Call initiated successfully",
      };
    } catch (error) {
      console.error("💥 Tata Tele Service Error:", error);

      // Check if it's a CORS error
      if (error instanceof TypeError && error.message.includes("fetch")) {
        return {
          success: false,
          error: "CORS Error: Please contact support to enable API access",
        };
      }

      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Show user notification for call result
   */
  static showCallNotification(
    result: TataTeleCallResponse,
    customerName?: string
  ): void {
    if (result.success) {
      const message = customerName
        ? `Call initiated to ${customerName}${
            result.call_id ? ` (Call ID: ${result.call_id})` : ""
          }`
        : `Call initiated successfully${
            result.call_id ? ` (Call ID: ${result.call_id})` : ""
          }`;

      alert(`✅ ${message}`);
    } else {
      const errorMessage = result.error || "Failed to initiate call";

      // Provide helpful error messages for common issues
      if (errorMessage.includes("CORS")) {
        alert(
          `❌ Call Failed: The call service is not accessible from this browser. Please contact your administrator.`
        );
      } else {
        alert(`❌ Call Failed: ${errorMessage}`);
      }
    }
  }

  /**
   * Enhanced call function with user feedback
   */
  static async initiateCallWithFeedback(
    phoneNumber: string,
    customerName?: string
  ): Promise<void> {
    if (!phoneNumber) {
      alert("❌ No phone number available for this contact");
      return;
    }

    try {
      const loadingMessage = customerName
        ? `Initiating call to ${customerName}...`
        : "Initiating call...";

      console.log(loadingMessage);

      const result = await this.makeCall(phoneNumber);
      this.showCallNotification(result, customerName);
    } catch (error) {
      console.error("Call initiation error:", error);
      alert("❌ Failed to initiate call. Please contact support.");
    }
  }
}
