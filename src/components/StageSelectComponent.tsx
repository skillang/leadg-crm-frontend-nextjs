"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Types for better type safety
export interface StageOption {
  value: string;
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  className?: string;
}

export interface StageSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: StageOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

// Default stage configurations - can be overridden via props
export const defaultStageOptions: StageOption[] = [
  {
    value: "contacted",
    label: "Contacted",
    variant: "secondary",
    className:
      "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200",
  },
  {
    value: "first-call",
    label: "First Call",
    variant: "secondary",
    className:
      "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200",
  },
  {
    value: "closed",
    label: "Closed",
    variant: "secondary",
    className:
      "bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
  },
  {
    value: "badge",
    label: "Badge",
    variant: "secondary",
    className: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200",
  },
  {
    value: "default",
    label: "Default",
    variant: "secondary",
    className: "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200",
  },
];

export const StageSelect: React.FC<StageSelectProps> = ({
  value,
  onValueChange,
  options = defaultStageOptions,
  placeholder = "Select stage...",
  disabled = false,
  className,
}) => {
  // Find the current selected option
  const currentOption = options.find((option) => option.value === value);

  if (!currentOption) {
    console.warn(`StageSelect: No option found for value "${value}"`);
  }

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        className={cn(
          "w-auto h-auto p-0 rounded-lg focus:ring-0 focus:ring-offset-0 transition-all duration-200",
          // Apply the current option's styling to the entire trigger
          currentOption?.className ||
            "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200",
          // Override default border styling
          "border-2",
          className
        )}
      >
        <div className="flex items-center gap-1 px-2 ">
          {currentOption ? (
            <span className="text-sm font-medium">{currentOption.label}</span>
          ) : (
            <span className="text-gray-500 text-sm">{placeholder}</span>
          )}
        </div>
      </SelectTrigger>

      <SelectContent className="">
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className={cn("cursor-pointer rounded-md mb-1", option.className)}
          >
            <span className="text-sm font-medium">{option.label}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

// Hook for stage management (optional - for better state management)
export const useStageSelect = (initialValue?: string) => {
  const [selectedStage, setSelectedStage] = React.useState(initialValue || "");

  const handleStageChange = React.useCallback((newStage: string) => {
    setSelectedStage(newStage);
    // You can add additional logic here like API calls
  }, []);

  return {
    selectedStage,
    handleStageChange,
    setSelectedStage,
  };
};
