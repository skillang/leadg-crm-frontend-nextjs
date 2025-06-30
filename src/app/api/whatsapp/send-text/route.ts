// app/api/whatsapp/send-text/route.ts
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
    const { contact, message } = await request.json();

    if (!contact || !message) {
      return NextResponse.json(
        {
          success: false,
          error: "Contact and message are required",
        },
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
    const url = new URL(`${config.baseUrl}/sendtextmessage.php`);

    url.searchParams.append("LicenseNumber", config.licenseNumber);
    url.searchParams.append("APIKey", config.apiKey);
    url.searchParams.append("Contact", formattedContact);
    url.searchParams.append("Message", message);

    const response = await fetch(url.toString());
    const data = await response.text();

    return NextResponse.json({
      success: response.ok && !data.toLowerCase().includes("error"),
      message: data,
      data: data,
    });
  } catch (error) {
    console.error("Text send failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
