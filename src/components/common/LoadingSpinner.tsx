// src/components/common/LoadingSpinner.tsx

"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "primary" | "secondary" | "muted";
  className?: string;
  showMessage?: boolean;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = "Loading...",
  size = "md",
  variant = "default",
  className = "",
  showMessage = true,
  fullScreen = false,
}) => {
  // Size classes for the spinner
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12",
  };

  // Text size classes
  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  };

  // Variant classes for colors
  const variantClasses = {
    default: "text-gray-600",
    primary: "text-blue-600",
    secondary: "text-purple-600",
    muted: "text-gray-400",
  };

  // Container classes
  const containerClasses = fullScreen
    ? "fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50"
    : "flex flex-col items-center justify-center p-4";

  return (
    <div className={cn(containerClasses, className)}>
      <div className="flex flex-col items-center space-y-3">
        {/* Spinner */}
        <Loader2
          className={cn(
            "animate-spin",
            sizeClasses[size],
            variantClasses[variant]
          )}
        />

        {/* Message */}
        {showMessage && message && (
          <p
            className={cn(
              "font-medium text-center",
              textSizeClasses[size],
              variantClasses[variant]
            )}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;
