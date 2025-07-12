// src/components/common/AccessDeniedCard.tsx

"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, AlertCircle, Shield } from "lucide-react";

interface AccessDeniedCardProps {
  title?: string;
  description?: string;
  backButtonText?: string;
  redirectPath?: string;
  requiredRole?: string;
  icon?: React.ReactNode;
  variant?: "default" | "admin" | "destructive";
  className?: string;
}

const AccessDeniedCard: React.FC<AccessDeniedCardProps> = ({
  title = "Access Denied",
  description = "You don't have permission to access this page.",
  backButtonText = "Back to Dashboard",
  redirectPath = "/dashboard",
  requiredRole,
  icon,
  variant = "default",
  className = "",
}) => {
  const router = useRouter();

  // Icon logic based on variant
  const getIcon = () => {
    if (icon) return icon;

    switch (variant) {
      case "admin":
        return <Shield className="w-12 h-12 text-blue-500 mx-auto mb-4" />;
      case "destructive":
        return <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />;
      default:
        return (
          <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
        );
    }
  };

  // Title color logic based on variant
  const getTitleColor = () => {
    switch (variant) {
      case "admin":
        return "text-blue-600";
      case "destructive":
        return "text-red-600";
      default:
        return "text-orange-600";
    }
  };

  // Container background based on variant
  const getContainerClass = () => {
    switch (variant) {
      case "admin":
        return "min-h-screen flex items-center justify-center bg-blue-50/30";
      case "destructive":
        return "min-h-screen flex items-center justify-center bg-red-50/30";
      default:
        return "min-h-screen flex items-center justify-center bg-background";
    }
  };

  const handleRedirect = () => {
    router.push(redirectPath);
  };

  return (
    <div className={getContainerClass()}>
      <Card className={`w-full max-w-md shadow-lg ${className}`}>
        <CardHeader className="text-center">
          {getIcon()}
          <CardTitle className={getTitleColor()}>{title}</CardTitle>
          <CardDescription className="mt-2">
            {description}
            {requiredRole && (
              <span className="block mt-1 text-sm font-medium">
                Required role: {requiredRole}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleRedirect} className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {backButtonText}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessDeniedCard;
