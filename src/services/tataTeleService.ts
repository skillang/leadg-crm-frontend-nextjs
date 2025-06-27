// src/services/tataTeleService.ts

interface TataTeleCallRequest {
  customer_number: string;
  api_key?: string; // May not be needed with JWT
  get_call_id?: number;
}

interface TataTeleCallResponse {
  success: boolean;
  call_id?: string;
  message?: string;
  error?: string;
}

export class TataTeleService {
  // UPDATED: Using the new JWT token
  private static readonly JWT_TOKEN =
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI2MTk3NTAiLCJjciI6ZmFsc2UsImlzcyI6Imh0dHBzOi8vY2xvdWRwaG9uZS50YXRhdGVsZXNlcnZpY2VzLmNvbS90b2tlbi9nZW5lcmF0ZSIsImlhdCI6MTc1MTAxODUxNSwiZXhwIjoyMDUxMDE4NTE1LCJuYmYiOjE3NTEwMTg1MTUsImp0aSI6IjlBajZFMUw2dU9SSHJOM0QifQ.PCktQBjsAiyTFDwiqMQ3dOx74Aj5JO-_afhQO7_pxf4";

  // API URLs - try different endpoints if needed
  private static readonly API_URL =
    "https://api-smartflo.tatateleservices.com/v1/click_to_call_support";
  private static readonly CLOUDPHONE_API_URL =
    "https://cloudphone.tatateleservices.com/api/v1/click_to_call";

  /**
   * Format phone number to include country code if not present
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
   * Validate phone number format
   */
  private static isValidPhoneNumber(phoneNumber: string): boolean {
    const cleanNumber = phoneNumber.replace(/\D/g, "");
    return cleanNumber.length >= 10;
  }

  /**
   * Make call using JWT authentication
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

      // Try with Bearer token authentication
      const requestPayload = {
        customer_number: formattedNumber,
        // Additional fields might be needed based on API requirements
      };

      console.log("🔄 Initiating Tata Tele call to:", formattedNumber);

      // First attempt with smartflo API
      try {
        const response = await fetch(this.API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.JWT_TOKEN}`,
            // Try with additional headers if needed
            Accept: "application/json",
          },
          body: JSON.stringify(requestPayload),
        });

        console.log("📞 Tata Tele API Response Status:", response.status);

        if (response.ok) {
          const responseData = await response.json();
          console.log("✅ Tata Tele API Success:", responseData);

          return {
            success: true,
            call_id: responseData.call_id || responseData.data?.call_id,
            message: responseData.message || "Call initiated successfully",
          };
        }

        // If first API fails, try the cloudphone API
        if (response.status === 404 || response.status === 401) {
          console.log("🔄 Trying alternative API endpoint...");
          return await this.makeCallWithCloudphoneAPI(formattedNumber);
        }

        const errorText = await response.text();
        console.error("❌ Tata Tele API Error:", errorText);

        return {
          success: false,
          error: `API Error: ${response.status} - ${response.statusText}`,
        };
      } catch (fetchError) {
        // If fetch fails (CORS), try alternative approach
        console.log("🔄 Primary API failed, trying alternative...");
        return await this.makeCallWithCloudphoneAPI(formattedNumber);
      }
    } catch (error) {
      console.error("💥 Tata Tele Service Error:", error);

      if (error instanceof TypeError && error.message.includes("fetch")) {
        return {
          success: false,
          error: "Network Error: Unable to connect to call service",
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
   * Alternative API endpoint for cloudphone
   */
  private static async makeCallWithCloudphoneAPI(
    phoneNumber: string
  ): Promise<TataTeleCallResponse> {
    try {
      const response = await fetch(this.CLOUDPHONE_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.JWT_TOKEN}`,
        },
        body: JSON.stringify({
          destination: phoneNumber,
          // Add other required fields based on API documentation
        }),
      });

      if (response.ok) {
        const responseData = await response.json();
        return {
          success: true,
          call_id: responseData.call_id || responseData.data?.call_id,
          message: responseData.message || "Call initiated successfully",
        };
      }

      return {
        success: false,
        error: `Alternative API failed with status: ${response.status}`,
      };
    } catch (error) {
      return {
        success: false,
        error: "Both API endpoints failed. Please contact support.",
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
        ? `📞 Calling ${customerName}...${
            result.call_id ? ` (Call ID: ${result.call_id})` : ""
          }`
        : `📞 Call initiated successfully${
            result.call_id ? ` (Call ID: ${result.call_id})` : ""
          }`;

      // Show success notification (you might want to use a toast library here)
      alert(message);

      // Log for debugging
      console.log("✅ Call Success:", {
        customerName,
        callId: result.call_id,
        message: result.message,
      });
    } else {
      const errorMessage = result.error || "Failed to initiate call";

      // Provide helpful error messages
      let userMessage = "❌ Call Failed: ";

      if (errorMessage.includes("Network Error")) {
        userMessage +=
          "Unable to connect to call service. Please check your internet connection.";
      } else if (errorMessage.includes("401")) {
        userMessage +=
          "Authentication failed. Please contact your administrator.";
      } else if (errorMessage.includes("404")) {
        userMessage += "Call service not found. Please contact support.";
      } else {
        userMessage += errorMessage;
      }

      alert(userMessage);

      // Log detailed error for debugging
      console.error("❌ Call Failed:", {
        error: errorMessage,
        customerName,
      });
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
      // Show loading state (you might want to implement a proper loading UI)
      const loadingMessage = customerName
        ? `📞 Calling ${customerName}...`
        : "📞 Initiating call...";

      console.log(loadingMessage);

      // Make the API call
      const result = await this.makeCall(phoneNumber);

      // Show result notification
      this.showCallNotification(result, customerName);

      // If successful, you might want to log this activity
      if (result.success && result.call_id) {
        // TODO: Log call activity to your backend
        console.log("📝 Log call activity:", {
          phoneNumber,
          customerName,
          callId: result.call_id,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Call initiation error:", error);
      alert("❌ Failed to initiate call. Please try again or contact support.");
    }
  }

  /**
   * Test the API connection (useful for debugging)
   */
  static async testConnection(): Promise<void> {
    console.log("🔧 Testing Tata Tele API connection...");

    try {
      const testNumber = "919999999999"; // Use a test number
      const result = await this.makeCall(testNumber);

      if (result.success) {
        console.log("✅ API connection successful!");
      } else {
        console.error("❌ API connection failed:", result.error);
      }
    } catch (error) {
      console.error("💥 Connection test failed:", error);
    }
  }
}
