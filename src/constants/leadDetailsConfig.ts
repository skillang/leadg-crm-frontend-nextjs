// src/constants/leadDetailsConfig.ts

export interface TabDefinition {
  id: string;
  label: string;
}

// Priority badge colors configuration
export const getPriorityColor = (priority: string): string => {
  switch (priority.toLowerCase()) {
    case "high":
      return "bg-red-100 text-red-800";
    case "medium":
      return "bg-yellow-100 text-yellow-800";
    case "low":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// Tab definitions for lead details page
export const LEAD_DETAIL_TABS: TabDefinition[] = [
  { id: "tasks", label: "Tasks & reminders" },
  { id: "notes", label: "Notes" },
  { id: "timeline", label: "Timeline" },
  { id: "documents", label: "Documents" },
  { id: "activity", label: "Activity log" },
  { id: "contacts", label: "Contacts" },
];

// Priority levels with their display colors
export const PRIORITY_LEVELS = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
} as const;

export type PriorityLevel =
  (typeof PRIORITY_LEVELS)[keyof typeof PRIORITY_LEVELS];

// Alternative approach with more detailed configuration
export const PRIORITY_CONFIG = {
  [PRIORITY_LEVELS.HIGH]: {
    label: "High Priority",
    colorClasses: "bg-red-100 text-red-800",
    badgeVariant: "destructive",
  },
  [PRIORITY_LEVELS.MEDIUM]: {
    label: "Medium Priority",
    colorClasses: "bg-yellow-100 text-yellow-800",
    badgeVariant: "secondary",
  },
  [PRIORITY_LEVELS.LOW]: {
    label: "Low Priority",
    colorClasses: "bg-green-100 text-green-800",
    badgeVariant: "outline",
  },
} as const;

// Helper function to get priority configuration
export const getPriorityConfig = (priority: string) => {
  const normalizedPriority = priority.toLowerCase() as PriorityLevel;
  return (
    PRIORITY_CONFIG[normalizedPriority] || {
      label: "Unknown Priority",
      colorClasses: "bg-gray-100 text-gray-800",
      badgeVariant: "outline",
    }
  );
};
