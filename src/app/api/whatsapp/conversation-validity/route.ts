// app/api/whatsapp/conversation-validity/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getWhatsAppConfig } from "@/config/whatsappConfig";

function formatPhoneNumber(phoneNumber: string): string {
  const cleanNumber = phoneNumber.replace(/\D/g, "");

  if (!cleanNumber.startsWith("91") && cleanNumber.length === 10) {
    return `91${cleanNumber}`;
  }

  if (cleanNumber.startsWith("91")) {
    return cleanNumber;
  }

  if (phoneNumber.startsWith("+")) {
    return phoneNumber.substring(1).replace(/\D/g, "");
  }

  return cleanNumber;
}

export async function POST(request: NextRequest) {
  try {
    const { contact } = await request.json();

    if (!contact) {
      return NextResponse.json(
        { success: false, error: "Contact number is required" },
        { status: 400 }
      );
    }

    const config = getWhatsAppConfig();

    if (!config.enabled) {
      return NextResponse.json(
        { success: false, error: "WhatsApp integration is disabled" },
        { status: 400 }
      );
    }

    const formattedContact = formatPhoneNumber(contact);
    const url = new URL(`${config.baseUrl}/conversationvalidity.php`);
    url.searchParams.append("LicenseNumber", config.licenseNumber);
    url.searchParams.append("APIKey", config.apiKey);
    url.searchParams.append("Contact", formattedContact);

    const response = await fetch(url.toString());
    const data = await response.text();

    return NextResponse.json({
      success: response.ok && !data.toLowerCase().includes("error"),
      message: data,
      data: data,
    });
  } catch (error) {
    console.error("Conversation validity check failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
