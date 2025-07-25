// src/components/common/MultiSelect.tsx
"use client";

import React, { useState } from "react";
import { X, ChevronsUpDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";

export interface SelectOption {
  value: string;
  label: string;
  subtitle?: string; // For additional info like lead count, flag, etc.
  icon?: string; // For flags, avatars, or icons
  disabled?: boolean;
}

interface MultiSelectProps {
  options: SelectOption[];
  value: string[]; // Array of selected values
  onChange: (values: string[]) => void;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
  className?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  maxDisplayItems?: number; // How many items to show before "X more"
  showCheckbox?: boolean; // Whether to show checkboxes
  allowSingleSelect?: boolean; // If true, acts as single select
  showSelectedBadges?: boolean;
  alwaysShowPlaceholder?: boolean; // New prop
  showIcon?: boolean;
  icon?: React.ReactNode;
  buttonVariant?: "outline" | "default" | "ghost";
  buttonSize?: "sm" | "default" | "lg";
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value,
  onChange,
  disabled = false,
  error,
  placeholder = "Select options...",
  className = "",
  searchPlaceholder = "Search...",
  emptyMessage = "No options found.",
  maxDisplayItems = 3,
  showCheckbox = true,
  allowSingleSelect = false,
  showSelectedBadges = true,
  alwaysShowPlaceholder = false,
  showIcon = false,
  icon = null,
  buttonVariant = "outline",
  buttonSize = "default",
}) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (optionValue: string) => {
    if (allowSingleSelect) {
      onChange([optionValue]);
      setOpen(false);
      return;
    }

    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const handleRemove = (optionValue: string) => {
    onChange(value.filter((v) => v !== optionValue));
  };

  const getSelectedOptions = () => {
    return options.filter((option) => value.includes(option.value));
  };

  const getTriggerText = () => {
    const selectedOptions = getSelectedOptions();

    if (alwaysShowPlaceholder) {
      return placeholder;
    }

    if (selectedOptions.length === 0) return placeholder;

    if (selectedOptions.length === 1) {
      return selectedOptions[0].label;
    }

    if (selectedOptions.length <= maxDisplayItems) {
      return selectedOptions.map((opt) => opt.label).join(", ");
    }

    return `${selectedOptions.length} ${
      allowSingleSelect ? "option" : "options"
    } selected`;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={buttonVariant}
            size={buttonSize}
            role="combobox"
            aria-expanded={open}
            className={`justify-between ${error ? "border-red-500" : ""} ${
              showIcon ? "gap-2" : ""
            }`}
            disabled={disabled}
          >
            <div className="flex items-center gap-2">
              {showIcon && icon && <span>{icon}</span>}
              <span className="truncate text-left">{getTriggerText()}</span>
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={`${option.value} ${option.label} ${
                    option.subtitle || ""
                  }`}
                  onSelect={() => handleSelect(option.value)}
                  disabled={option.disabled}
                  className="flex items-center space-x-2 cursor-pointer py-2"
                >
                  {showCheckbox && !allowSingleSelect && (
                    <Checkbox
                      checked={value.includes(option.value)}
                      onCheckedChange={() => handleSelect(option.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}

                  {allowSingleSelect && (
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        value.includes(option.value)
                          ? "opacity-100"
                          : "opacity-0"
                      }`}
                    />
                  )}

                  {option.icon && (
                    <span className="text-lg">{option.icon}</span>
                  )}

                  <div className="flex-1 flex flex-col">
                    <span>{option.label}</span>
                    {option.subtitle && (
                      <span className="text-xs text-gray-500">
                        {option.subtitle}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Error Display */}
      {error && <p className="text-xs text-red-500">{error}</p>}

      {showSelectedBadges && !allowSingleSelect && value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {getSelectedOptions().map((option) => (
            <Badge
              key={option.value}
              variant="secondary"
              className="text-xs flex items-center gap-1"
            >
              {option.icon && <span>{option.icon}</span>}
              <span>{option.label}</span>
              <button
                type="button"
                onClick={() => handleRemove(option.value)}
                disabled={disabled}
                className="ml-1 text-gray-500 hover:text-red-500 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Show selected count - 🔥 ALSO MAKE THIS CONDITIONAL */}
      {showSelectedBadges && !allowSingleSelect && value.length > 0 && (
        <p className="text-xs text-gray-500">
          {value.length} {value.length === 1 ? "item" : "items"} selected
        </p>
      )}
    </div>
  );
};

export default MultiSelect;

// ============================================================================
// HELPER FUNCTIONS FOR SPECIFIC USE CASES
// ============================================================================

// For Country Selection
export const STUDY_DESTINATIONS = [
  { value: "USA", label: "United States", icon: "🇺🇸" },
  { value: "Canada", label: "Canada", icon: "🇨🇦" },
  { value: "UK", label: "United Kingdom", icon: "🇬🇧" },
  { value: "Australia", label: "Australia", icon: "🇦🇺" },
  { value: "Germany", label: "Germany", icon: "🇩🇪" },
  { value: "New Zealand", label: "New Zealand", icon: "🇳🇿" },
  { value: "Ireland", label: "Ireland", icon: "🇮🇪" },
  { value: "France", label: "France", icon: "🇫🇷" },
  { value: "Netherlands", label: "Netherlands", icon: "🇳🇱" },
  { value: "Sweden", label: "Sweden", icon: "🇸🇪" },
  { value: "Norway", label: "Norway", icon: "🇳🇴" },
  { value: "Denmark", label: "Denmark", icon: "🇩🇰" },
  { value: "Switzerland", label: "Switzerland", icon: "🇨🇭" },
  { value: "Italy", label: "Italy", icon: "🇮🇹" },
  { value: "Spain", label: "Spain", icon: "🇪🇸" },
  { value: "Japan", label: "Japan", icon: "🇯🇵" },
  { value: "South Korea", label: "South Korea", icon: "🇰🇷" },
  { value: "Singapore", label: "Singapore", icon: "🇸🇬" },
];

// Helper functions for countries
export const parseCountriesFromString = (countryString: string): string[] => {
  if (!countryString || countryString.trim() === "") return [];
  return countryString
    .split(",")
    .map((country) => country.trim())
    .filter((country) => country.length > 0);
};

export const formatCountriesForBackend = (countries: string[]): string => {
  if (!countries || countries.length === 0) return "";
  return countries.join(", ");
};

export const getCountryLabel = (value: string): string => {
  const country = STUDY_DESTINATIONS.find((c) => c.value === value);
  return country?.label || value;
};

// ============================================================================
// TYPE DEFINITIONS FOR USER TRANSFORMATION
// ============================================================================

// Define the User interface based on the project knowledge
interface User {
  email: string;
  name: string;
  current_lead_count?: number;
  is_active: boolean;
  departments?: string[];
}

// Transform user data to MultiSelect options
export const transformUsersToOptions = (users: User[]): SelectOption[] => {
  return users.map((user) => ({
    value: user.email,
    label: user.name,
    subtitle: `${user.current_lead_count || 0} leads`,
    disabled: !user.is_active,
  }));
};

// Transform categories to options
export const transformCategoriesToOptions = (
  categories: string[]
): SelectOption[] => {
  return categories.map((category) => ({
    value: category,
    label: category,
  }));
};
