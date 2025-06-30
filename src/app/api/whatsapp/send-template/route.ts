// app/api/whatsapp/send-template/route.ts
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
    const {
      contact,
      template,
      params,
      fileUrl,
      urlParam,
      headUrl,
      headParam,
      name,
      pdfName,
    } = await request.json();

    if (!contact || !template) {
      return NextResponse.json(
        {
          success: false,
          error: "Contact and template are required",
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
    const url = new URL(`${config.baseUrl}/sendtemplate.php`);

    url.searchParams.append("LicenseNumber", config.licenseNumber);
    url.searchParams.append("APIKey", config.apiKey);
    url.searchParams.append("Contact", formattedContact);
    url.searchParams.append("Template", template);

    if (params && params.length > 0) {
      url.searchParams.append("Param", params.join(","));
    }

    if (fileUrl) url.searchParams.append("Fileurl", fileUrl);
    if (urlParam) url.searchParams.append("URLParam", urlParam);
    if (headUrl) url.searchParams.append("HeadURL", headUrl);
    if (headParam) url.searchParams.append("HeadParam", headParam);
    if (name) url.searchParams.append("Name", name);
    if (pdfName) url.searchParams.append("PDFName", pdfName);

    const response = await fetch(url.toString());
    const data = await response.text();

    return NextResponse.json({
      success: response.ok && !data.toLowerCase().includes("error"),
      message: data,
      data: data,
    });
  } catch (error) {
    console.error("Template send failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
