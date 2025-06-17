"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Base interface for all button types
interface BaseButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
}

// Icon Button with text
interface IconButtonProps extends BaseButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  variant?:
    | "default"
    | "outline"
    | "ghost"
    | "destructive"
    | "secondary"
    | "link";
}

// Primary Action Button (blue styled)
interface PrimaryActionButtonProps extends BaseButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  variant?: "blue" | "green" | "red" | "purple";
}

// Filter/Action Button
interface FilterButtonProps extends BaseButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive?: boolean;
}

// Custom styled button variants
const buttonVariants = {
  blue: "bg-blue-200 border-blue-500 border-2 text-blue-800 hover:bg-blue-100 hover:text-blue-800",
  green:
    "bg-green-200 border-green-500 border-2 text-green-800 hover:bg-green-100 hover:text-green-800",
  red: "bg-red-200 border-red-500 border-2 text-red-800 hover:bg-red-100 hover:text-red-800",
  purple:
    "bg-purple-200 border-purple-500 border-2 text-purple-800 hover:bg-purple-100 hover:text-purple-800",
};

// 1. Standard Icon Button
export const IconButton: React.FC<IconButtonProps> = ({
  icon: Icon,
  label,
  variant = "outline",
  onClick,
  disabled = false,
  className,
  size = "default",
  children,
}) => {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled}
      className={cn("flex items-center gap-2", className)}
    >
      <Icon className="h-4 w-4" />
      {label}
      {children}
    </Button>
  );
};

// 2. Primary Action Button (colored variants)
export const PrimaryActionButton: React.FC<PrimaryActionButtonProps> = ({
  icon: Icon,
  label,
  variant = "blue",
  onClick,
  disabled = false,
  className,
  size = "default",
  children,
}) => {
  return (
    <Button
      variant="outline"
      size={size}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-2",
        buttonVariants[variant],
        className
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
      {children}
    </Button>
  );
};

// 3. Filter Button (with active state)
export const FilterButton: React.FC<FilterButtonProps> = ({
  icon: Icon,
  label,
  isActive = false,
  onClick,
  disabled = false,
  className,
  size = "default",
  children,
}) => {
  return (
    <Button
      variant="outline"
      size={size}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-2",
        isActive && "bg-blue-50 border-blue-300 text-blue-700",
        className
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
      {children}
    </Button>
  );
};

// 4. Action Button Group (for grouping related buttons)
interface ActionButtonGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const ActionButtonGroup: React.FC<ActionButtonGroupProps> = ({
  children,
  className,
}) => {
  return <div className={cn("flex gap-2", className)}>{children}</div>;
};

// 5. Dropdown Button (for buttons that open dropdowns)
interface DropdownButtonProps extends BaseButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isOpen?: boolean;
  variant?: "default" | "outline" | "ghost";
}

export const DropdownButton: React.FC<DropdownButtonProps> = ({
  icon: Icon,
  label,
  isOpen = false,
  variant = "outline",
  onClick,
  disabled = false,
  className,
  size = "default",
  children,
}) => {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-2",
        isOpen && "bg-gray-100",
        className
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
      {children}
    </Button>
  );
};

// 6. Loading Button (shows loading state)
interface LoadingButtonProps extends BaseButtonProps {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  isLoading?: boolean;
  loadingText?: string;
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary";
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  icon: Icon,
  label,
  isLoading = false,
  loadingText = "Loading...",
  variant = "default",
  onClick,
  disabled = false,
  className,
  size = "default",
  children,
}) => {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn("flex items-center gap-2", className)}
    >
      {isLoading ? (
        <>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          {loadingText}
        </>
      ) : (
        <>
          {Icon && <Icon className="h-4 w-4" />}
          {label}
        </>
      )}
      {children}
    </Button>
  );
};
