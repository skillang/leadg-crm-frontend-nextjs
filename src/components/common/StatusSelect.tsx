// src/components/ui/StatusSelect.tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

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
          className={`${error ? "border-red-500" : ""} ${className}`}
        >
          <SelectValue
            placeholder={isLoading ? "Loading statuses..." : placeholder}
          />
        </SelectTrigger>
        <SelectContent>
          {statuses.map((status) => (
            <SelectItem key={status.id} value={status.name}>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: status.color }}
                />
                {status.display_name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};
