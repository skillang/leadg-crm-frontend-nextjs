// src/components/common/CountryMultiSelect.tsx
"use client";

import React, { useState } from "react";
import { X, ChevronsUpDown } from "lucide-react";
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

export const STUDY_DESTINATIONS = [
  { value: "USA", label: "United States", flag: "🇺🇸" },
  { value: "Canada", label: "Canada", flag: "🇨🇦" },
  { value: "UK", label: "United Kingdom", flag: "🇬🇧" },
  { value: "Australia", label: "Australia", flag: "🇦🇺" },
  { value: "Germany", label: "Germany", flag: "🇩🇪" },
  { value: "New Zealand", label: "New Zealand", flag: "🇳🇿" },
  { value: "Ireland", label: "Ireland", flag: "🇮🇪" },
  { value: "France", label: "France", flag: "🇫🇷" },
  { value: "Netherlands", label: "Netherlands", flag: "🇳🇱" },
  { value: "Sweden", label: "Sweden", flag: "🇸🇪" },
  { value: "Norway", label: "Norway", flag: "🇳🇴" },
  { value: "Denmark", label: "Denmark", flag: "🇩🇰" },
  { value: "Switzerland", label: "Switzerland", flag: "🇨🇭" },
  { value: "Italy", label: "Italy", flag: "🇮🇹" },
  { value: "Spain", label: "Spain", flag: "🇪🇸" },
  { value: "Japan", label: "Japan", flag: "🇯🇵" },
  { value: "South Korea", label: "South Korea", flag: "🇰🇷" },
  { value: "Singapore", label: "Singapore", flag: "🇸🇬" },
];

interface CountryMultiSelectProps {
  value: string[]; // Array of country values
  onChange: (countries: string[]) => void;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
  className?: string;
}

// ✅ Helper function to parse comma-separated string to array
export const parseCountriesFromString = (countryString: string): string[] => {
  if (!countryString || countryString.trim() === "") return [];
  return countryString
    .split(",")
    .map((country) => country.trim())
    .filter((country) => country.length > 0);
};

// ✅ Helper function to convert array to comma-separated string for backend
export const formatCountriesForBackend = (countries: string[]): string => {
  return countries.join(", ");
};

// ✅ Helper function to get country label by value
export const getCountryLabel = (value: string): string => {
  const country = STUDY_DESTINATIONS.find((c) => c.value === value);
  return country?.label || value;
};

const CountryMultiSelect: React.FC<CountryMultiSelectProps> = ({
  value,
  onChange,
  disabled = false,
  error,
  placeholder = "Select countries...",
  className = "",
}) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (country: string) => {
    if (value.includes(country)) {
      onChange(value.filter((c) => c !== country));
    } else {
      onChange([...value, country]);
    }
  };

  const handleRemove = (country: string) => {
    onChange(value.filter((c) => c !== country));
  };

  const getTriggerText = () => {
    if (value.length === 0) return placeholder;
    if (value.length === 1) {
      const country = STUDY_DESTINATIONS.find((c) => c.value === value[0]);
      return country?.label || value[0];
    }
    return `${value.length} countries selected`;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={`w-full justify-between ${
              error ? "border-red-500" : ""
            }`}
            disabled={disabled}
          >
            <span className="truncate text-left">{getTriggerText()}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search countries..." />
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {STUDY_DESTINATIONS.map((country) => (
                <CommandItem
                  key={country.value}
                  value={`${country.value} ${country.label}`} // Include both for better search
                  onSelect={() => handleSelect(country.value)}
                  className="flex items-center space-x-2 cursor-pointer py-2"
                >
                  <Checkbox
                    checked={value.includes(country.value)}
                    onCheckedChange={() => handleSelect(country.value)}
                    onClick={(e) => e.stopPropagation()} // Prevent double triggering
                  />
                  <span className="text-lg">{country.flag}</span>
                  <span className="flex-1">{country.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Countries Display */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((countryValue) => {
            const country = STUDY_DESTINATIONS.find(
              (c) => c.value === countryValue
            );
            return (
              <Badge
                key={countryValue}
                variant="secondary"
                className="text-xs flex items-center gap-1"
              >
                <span>{country?.flag}</span>
                <span>{country?.label || countryValue}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(countryValue)}
                  disabled={disabled}
                  className="ml-1 text-gray-500 hover:text-red-500 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Show selected count */}
      {value.length > 0 && (
        <p className="text-xs text-gray-500">
          {value.length} {value.length === 1 ? "country" : "countries"} selected
        </p>
      )}
    </div>
  );
};

export default CountryMultiSelect;
