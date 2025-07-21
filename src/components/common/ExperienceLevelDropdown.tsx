// src/components/common/ExperienceLevelDropdown.tsx

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useGetExperienceLevelsQuery } from "@/redux/slices/experienceLevelsApi";

interface ExperienceLevelDropdownProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
}

const ExperienceLevelDropdown: React.FC<ExperienceLevelDropdownProps> = ({
  value,
  onValueChange,
  placeholder = "Select experience level",
  label,
  required = false,
  disabled = false,
  className = "",
  error,
}) => {
  const {
    data: experienceLevelsData,
    isLoading,
    error: apiError,
  } = useGetExperienceLevelsQuery();

  const experienceLevels = experienceLevelsData?.data || [];

  if (isLoading) {
    return (
      <div className={`space-y-2 ${className}`}>
        {label && (
          <Label>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        <div className="flex items-center justify-center p-3 border rounded-md">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="ml-2 text-sm text-muted-foreground">
            Loading experience levels...
          </span>
        </div>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className={`space-y-2 ${className}`}>
        {label && (
          <Label>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        <div className="p-3 border rounded-md text-red-500 text-sm">
          Failed to load experience levels
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className={error ? "border-red-500" : ""}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {experienceLevels.map((level) => (
            <SelectItem key={level.value} value={level.value}>
              {level.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default ExperienceLevelDropdown;
