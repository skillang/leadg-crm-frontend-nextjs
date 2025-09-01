// src/app/page.tsx - LeadG CRM Landing Page
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/redux/hooks/useAuth";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Navigation Bar */}
      <nav className="w-full px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-2">
            {/* <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div> */}

            <Image
              src="/logo.png"
              alt="LeadG CRM Logo"
              className=" logo-sidebar-img"
              width={95}
              height={15}
            />
            <span className="text-2xl font-bold text-blue-900 ">CRM</span>
          </div>

          {/* Navigation Links */}
          {/* <div className="hidden md:flex items-center space-x-8">
            <Link
              href="#features"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="#about"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              About
            </Link>
            <Link
              href="#contact"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Contact
            </Link>
          </div> */}

          {/* Login Button */}
          <Link
            href="/login"
            className="inline-flex justify-center py-3 px-6 rounded-xl shadow-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Log In
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Left Column */}
          <div className="space-y-6">
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900">
              Close More Deals with Less Time on our LeadG CRM
            </h1>
            <p className="text-md text-gray-600">
              Your lightweight customer relationship management solution.
            </p>
            <div className="flex gap-4">
              <Button size={"lg"} className="shadow-lg cursor-pointer">
                Start Free Trail
              </Button>
              <Button
                size={"lg"}
                variant={"secondary"}
                className="shadow-lg cursor-pointer"
              >
                Watch Demo
              </Button>
            </div>

            <div className="pt-6 text-sm text-gray-500">
              <p>LeadG CRM • Track • Manage • Convert</p>
            </div>
          </div>

          {/* Right Column (Image) */}
          <div className="flex justify-end">
            <Image
              src="/assets/images/landing-hero-img.png"
              alt="LeadG CRM Illustration"
              width={500}
              height={400}
              className="rounded-2xl shadow-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
