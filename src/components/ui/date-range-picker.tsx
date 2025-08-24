// src/components/ui/date-range-picker.tsx
// DateRangePicker component for Tata Tele Call Dashboard
// Based on johnpolacek/date-range-picker-for-shadcn

"use client";

import * as React from "react";
import {
  // addDays,
  format,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subWeeks,
  subMonths,
} from "date-fns";
import { CalendarIcon, ChevronDownIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Helper function to convert string dates to Date objects
function getDateAdjustedForTimezone(dateInput: Date | string): Date {
  if (typeof dateInput === "string") {
    const parts = dateInput.split("-").map((part) => parseInt(part, 10));
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    return date;
  } else {
    return dateInput;
  }
}

interface DateRangeType {
  from: Date;
  to: Date | undefined;
}

interface Preset {
  name: string;
  label: string;
  getValue: () => DateRangeType;
}

// Define presets specifically for call analytics
const CALL_ANALYTICS_PRESETS: Preset[] = [
  {
    name: "today",
    label: "Today",
    getValue: () => ({
      from: new Date(),
      to: new Date(),
    }),
  },
  {
    name: "yesterday",
    label: "Yesterday",
    getValue: () => ({
      from: subDays(new Date(), 1),
      to: subDays(new Date(), 1),
    }),
  },
  {
    name: "last7",
    label: "Last 7 days",
    getValue: () => ({
      from: subDays(new Date(), 6),
      to: new Date(),
    }),
  },
  {
    name: "last14",
    label: "Last 14 days",
    getValue: () => ({
      from: subDays(new Date(), 13),
      to: new Date(),
    }),
  },
  {
    name: "last30",
    label: "Last 30 days",
    getValue: () => ({
      from: subDays(new Date(), 29),
      to: new Date(),
    }),
  },
  {
    name: "thisWeek",
    label: "This Week",
    getValue: () => ({
      from: startOfWeek(new Date(), { weekStartsOn: 1 }),
      to: endOfWeek(new Date(), { weekStartsOn: 1 }),
    }),
  },
  {
    name: "lastWeek",
    label: "Last Week",
    getValue: () => {
      const lastWeek = subWeeks(new Date(), 1);
      return {
        from: startOfWeek(lastWeek, { weekStartsOn: 1 }),
        to: endOfWeek(lastWeek, { weekStartsOn: 1 }),
      };
    },
  },
  {
    name: "thisMonth",
    label: "This Month",
    getValue: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
  {
    name: "lastMonth",
    label: "Last Month",
    getValue: () => {
      const lastMonth = subMonths(new Date(), 1);
      return {
        from: startOfMonth(lastMonth),
        to: endOfMonth(lastMonth),
      };
    },
  },
];

interface DateRangePickerProps {
  onUpdate?: (values: {
    range: DateRangeType;
    rangeCompare?: DateRangeType;
  }) => void;
  initialDateFrom?: Date | string;
  initialDateTo?: Date | string;
  initialCompareFrom?: Date | string;
  initialCompareTo?: Date | string;
  align?: "start" | "center" | "end";
  locale?: string;
  showCompare?: boolean;
  className?: string;
  placeholder?: string;
}

export function DateRangePicker({
  onUpdate,
  initialDateFrom = new Date(),
  initialDateTo,
  initialCompareFrom,
  initialCompareTo,
  align = "end",
  // locale = "en-US",
  // showCompare = false, // Disabled by default for call analytics
  className,
  placeholder = "Select date range",
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const [range, setRange] = React.useState<DateRangeType>({
    from: getDateAdjustedForTimezone(initialDateFrom),
    to: initialDateTo
      ? getDateAdjustedForTimezone(initialDateTo)
      : getDateAdjustedForTimezone(initialDateFrom),
  });

  const [rangeCompare, setRangeCompare] = React.useState<
    DateRangeType | undefined
  >(
    initialCompareFrom
      ? {
          from: new Date(new Date(initialCompareFrom).setHours(0, 0, 0, 0)),
          to: initialCompareTo
            ? new Date(new Date(initialCompareTo).setHours(0, 0, 0, 0))
            : new Date(new Date(initialCompareFrom).setHours(0, 0, 0, 0)),
        }
      : undefined
  );

  const openedRangeRef = React.useRef<DateRangeType | undefined>(undefined);
  const openedRangeCompareRef = React.useRef<DateRangeType | undefined>(
    undefined
  );

  const [selectedPreset, setSelectedPreset] = React.useState<
    string | undefined
  >(undefined);

  const resetValues = () => {
    setRange(
      openedRangeRef.current || {
        from: getDateAdjustedForTimezone(initialDateFrom),
        to: initialDateTo
          ? getDateAdjustedForTimezone(initialDateTo)
          : getDateAdjustedForTimezone(initialDateFrom),
      }
    );
    setRangeCompare(openedRangeCompareRef.current);
  };

  const formatDateRange = (range: DateRangeType) => {
    if (range.from && range.to) {
      if (range.from.getTime() === range.to.getTime()) {
        return format(range.from, "MMM dd, yyyy");
      }
      return `${format(range.from, "MMM dd")} - ${format(
        range.to,
        "MMM dd, yyyy"
      )}`;
    }
    if (range.from) {
      return format(range.from, "MMM dd, yyyy");
    }
    return placeholder;
  };

  const handlePresetSelect = (preset: Preset) => {
    const newRange = preset.getValue();
    setRange(newRange);
    setSelectedPreset(preset.name);
  };

  const areRangesEqual = (
    a: DateRangeType | undefined,
    b: DateRangeType | undefined
  ) => {
    if (!a || !b) return a === b;
    return (
      a.from.getTime() === b.from.getTime() &&
      a.to?.getTime() === b.to?.getTime()
    );
  };

  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (open) {
          openedRangeRef.current = range;
          openedRangeCompareRef.current = rangeCompare;
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[300px] justify-start text-left font-normal",
            !range && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDateRange(range)}
          <ChevronDownIcon className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align}>
        <div className="flex">
          {/* Presets Sidebar */}
          <div className="w-40 shrink-0 border-r border-border">
            <div className="p-3">
              <Label className="text-sm font-medium">Quick Select</Label>
            </div>
            <div className="px-3 pb-3">
              <div className="space-y-1">
                {CALL_ANALYTICS_PRESETS.map((preset) => (
                  <Button
                    key={preset.name}
                    variant={
                      selectedPreset === preset.name ? "secondary" : "ghost"
                    }
                    className="w-full justify-start h-8 px-2 text-sm"
                    onClick={() => handlePresetSelect(preset)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Calendar */}
          <div className="p-3 flex-1">
            <Calendar
              mode="range"
              defaultMonth={range?.from}
              selected={range as DateRange}
              onSelect={(newRange) => {
                if (newRange) {
                  setRange({
                    from: newRange.from!,
                    to: newRange.to,
                  });
                  setSelectedPreset(undefined);
                }
              }}
              numberOfMonths={2}
              className="rounded-md"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 p-3 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsOpen(false);
              resetValues();
            }}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setIsOpen(false);
              if (
                !areRangesEqual(range, openedRangeRef.current) ||
                !areRangesEqual(rangeCompare, openedRangeCompareRef.current)
              ) {
                console.log(
                  "DateRangePicker: Calling onUpdate with range:",
                  range
                ); // Debug log
                onUpdate?.({ range, rangeCompare });
              }
            }}
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Export types for use in other components
export type { DateRangeType as DateRange };

// Helper hook for using with the DateRangePicker
export function useDateRange(
  initialFrom?: Date | string,
  initialTo?: Date | string
) {
  const [range, setRange] = React.useState<DateRangeType>({
    from: initialFrom ? getDateAdjustedForTimezone(initialFrom) : new Date(),
    to: initialTo ? getDateAdjustedForTimezone(initialTo) : new Date(),
  });

  const updateRange = React.useCallback(
    (newRange: { range: DateRangeType }) => {
      setRange(newRange.range);
    },
    []
  );

  return {
    range,
    setRange: updateRange,
  };
}
