import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useGetActiveCourseLevelsQuery } from "@/redux/slices/courseLevelsApi";
import { Loader2 } from "lucide-react";

interface CourseLevelDropdownProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
}

const CourseLevelDropdown: React.FC<CourseLevelDropdownProps> = ({
  value,
  onValueChange,
  placeholder = "Select course level",
  label,
  required = false,
  disabled = false,
  className = "",
  error,
}) => {
  const {
    data: courseLevelsData,
    isLoading,
    error: apiError,
  } = useGetActiveCourseLevelsQuery({});

  const courseLevels = courseLevelsData?.course_levels || [];

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
            Loading course levels...
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
          Failed to load course levels
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
          {courseLevels.map((level) => (
            <SelectItem key={level.id} value={level.name}>
              {level.display_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default CourseLevelDropdown;
