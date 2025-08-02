// src/components/ui/StatusSelect.tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getColorVariations } from "@/utils/colorUtils";

interface Status {
  id: string;
  name: string;
  display_name: string;
  color: string;
}

interface StatusSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  statuses: Status[];
  disabled?: boolean;
  isLoading?: boolean;
  required?: boolean;
  error?: string;
  label?: string;
  placeholder?: string;
  className?: string;
  showLabel?: boolean;
}

export const StatusSelect = ({
  value,
  onValueChange,
  statuses,
  disabled = false,
  isLoading = false,
  required = false,
  error,
  label = "Status",
  placeholder = "Select status",
  className = "",
  showLabel = true,
}: StatusSelectProps) => {
  const selectedStatus = statuses.find((status) => status.name === value);
  const selectedColors = selectedStatus
    ? getColorVariations(selectedStatus.color)
    : null;

  return (
    <div className="space-y-2">
      {showLabel && (
        <Label htmlFor="status">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <Select
        value={value}
        onValueChange={onValueChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger
          className={cn(
            "font-medium",
            error ? "border-red-500" : "",
            className
          )}
          style={
            selectedColors
              ? {
                  backgroundColor: selectedColors.bg,
                  color: selectedColors.text,
                }
              : {}
          }
        >
          <SelectValue
            placeholder={isLoading ? "Loading statuses..." : placeholder}
          />
        </SelectTrigger>
        <SelectContent>
          {statuses.map((status) => {
            const colors = getColorVariations(status.color);
            return (
              <SelectItem
                key={status.id}
                value={status.name}
                className={cn("cursor-pointer font-medium rounded-md mb-1")}
                style={{
                  backgroundColor: colors.bg,
                  color: colors.text,
                }}
              >
                <div className="flex items-center">{status.display_name}</div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};
