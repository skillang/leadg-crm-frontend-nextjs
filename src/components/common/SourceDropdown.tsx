// src/components/common/SourceDropdown.tsx
"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetActiveSourcesQuery } from "@/redux/slices/sourcesApi";
import { Loader2 } from "lucide-react";

interface SourceDropdownProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

const SourceDropdown: React.FC<SourceDropdownProps> = ({
  value,
  onValueChange,
  disabled = false,
  placeholder = "Select source",
  // required = false,
  className,
}) => {
  const {
    data: sourcesResponse,
    isLoading,
    error,
  } = useGetActiveSourcesQuery({
    include_lead_count: false,
  });

  const sources = sourcesResponse?.sources || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="ml-2 text-sm text-gray-500">Loading sources...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-500 p-2">Failed to load sources</div>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {sources.map((source) => (
          <SelectItem key={source.id} value={source.name}>
            {source.display_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default SourceDropdown;
