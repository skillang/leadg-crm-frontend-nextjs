// app/(auth)/layout.tsx
"use client";

import React from "react";

/**
 * Auth Layout - For public authentication pages
 * - Login
 * - Forgot Password
 * - Reset Password
 *
 * Features:
 * - Simple centered container
 * - No sidebar or topbar
 * - Clean, focused UI for auth flows
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log("🟢 AUTH LAYOUT IS RENDERING");
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {children}
    </div>
  );
}
