import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import SideNavBarComp from "@/components/navs/SideNavBar/SideNavBar";
import TopBarComp from "@/components/navs/TopBar/TopBar";
import { ReduxProvider } from "@/components/providers/redux-providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LeadG CRM",
  description: "LeadG is a CRM application for Track and Manage Leads",
  icons: "leadg-menu-icon.png",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ReduxProvider>
          <SidebarProvider>
            <SideNavBarComp />
            <main className="w-full h-screen">
              <SidebarTrigger />
              <TopBarComp />
              <div className="px-8">{children}</div>
            </main>
          </SidebarProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
