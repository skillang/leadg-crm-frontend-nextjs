// src/components/ui/StageSelect.tsx
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
import { useNotifications } from "@/components/common/NotificationSystem";

interface Stage {
  id: string;
  name: string;
  display_name: string;
  color: string;
  automation?: boolean;
  automation_config?: {
    template_name: string;
  } | null;
}

interface StageSelectProps {
  value: string;
  onValueChange: (
    value: string,
    options?: { automation_approved?: boolean }
  ) => void;
  stages: Stage[];
  disabled?: boolean;
  isLoading?: boolean;
  required?: boolean;
  error?: string;
  label?: string;
  placeholder?: string;
  className?: string;
  showLabel?: boolean;
}

export const StageSelect = ({
  value,
  onValueChange,
  stages,
  disabled = false,
  isLoading = false,
  required = false,
  error,
  label = "Stage",
  placeholder = "Select stage",
  className = "",
  showLabel = true,
}: StageSelectProps) => {
  const selectedStage = stages.find((stage) => stage.name === value);
  const selectedColors = selectedStage
    ? getColorVariations(selectedStage.color)
    : null;
  const { showConfirm } = useNotifications();

  const handleStageChange = async (newStage: string) => {
    // Find the target stage
    const targetStage = stages.find((stage) => stage.name === newStage);

    // Check if stage has automation enabled
    if (targetStage?.automation) {
      showConfirm({
        title: "Auto-send WhatsApp Message?",
        description: `This stage has WhatsApp automation enabled with template "${targetStage.automation_config?.template_name}". Do you want to send the template message automatically?`,
        confirmText: "Send Message",
        cancelText: "Skip Message",
        variant: "success",
        onConfirm: async () => {
          onValueChange(newStage, { automation_approved: true });
        },
        onCancel: async () => {
          onValueChange(newStage, { automation_approved: false });
        },
      });
    } else {
      onValueChange(newStage);
    }
  };

  return (
    <div className="space-y-2">
      {showLabel && (
        <Label htmlFor="stage">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <Select
        value={value}
        onValueChange={handleStageChange}
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
            placeholder={isLoading ? "Loading stages..." : placeholder}
          />
        </SelectTrigger>
        <SelectContent>
          {stages.map((stage) => {
            const colors = getColorVariations(stage.color);
            return (
              <SelectItem
                key={stage.id}
                value={stage.name}
                className={cn("cursor-pointer font-medium rounded-md mb-1")}
                style={{
                  backgroundColor: colors.bg,
                  color: colors.text,
                }}
              >
                <div className="flex items-center gap-2">
                  {stage.display_name}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};
