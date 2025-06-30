// app/api/whatsapp/account-validity/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getWhatsAppConfig } from "@/config/whatsappConfig";

export async function GET() {
  try {
    const config = getWhatsAppConfig();

    if (!config.enabled) {
      return NextResponse.json(
        { success: false, error: "WhatsApp integration is disabled" },
        { status: 400 }
      );
    }

    const url = new URL(`${config.baseUrl}/accountvalidity.php`);
    url.searchParams.append("LicenseNumber", config.licenseNumber);
    url.searchParams.append("APIKey", config.apiKey);

    const response = await fetch(url.toString());
    const data = await response.text();

    return NextResponse.json({
      success: response.ok && !data.toLowerCase().includes("error"),
      message: data,
      data: data,
    });
  } catch (error) {
    console.error("Account validity check failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
