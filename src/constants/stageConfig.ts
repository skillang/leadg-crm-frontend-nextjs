// constants/stageConfig.ts

import { StageOption } from "@/components/ui/stage-select";

// Lead stage configurations
export const LEAD_STAGES: StageOption[] = [
  {
    value: "contacted",
    label: "Contacted",
    variant: "secondary",
    className:
      "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200",
  },
  {
    value: "first-call",
    label: "First Call",
    variant: "secondary",
    className:
      "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200",
  },
  {
    value: "qualified",
    label: "Qualified",
    variant: "secondary",
    className:
      "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200",
  },
  {
    value: "proposal",
    label: "Proposal",
    variant: "secondary",
    className:
      "bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-200",
  },
  {
    value: "closed-won",
    label: "Closed Won",
    variant: "secondary",
    className:
      "bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
  },
  {
    value: "closed-lost",
    label: "Closed Lost",
    variant: "secondary",
    className: "bg-red-100 text-red-800 border-red-200 hover:bg-red-200",
  },
];

// Different configurations for different use cases
export const TASK_STAGES: StageOption[] = [
  {
    value: "todo",
    label: "To Do",
    variant: "secondary",
    className: "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200",
  },
  {
    value: "in-progress",
    label: "In Progress",
    variant: "secondary",
    className: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200",
  },
  {
    value: "review",
    label: "Review",
    variant: "secondary",
    className:
      "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200",
  },
  {
    value: "completed",
    label: "Completed",
    variant: "secondary",
    className:
      "bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
  },
];

// Priority configurations
export const PRIORITY_LEVELS: StageOption[] = [
  {
    value: "low",
    label: "Low",
    variant: "secondary",
    className: "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200",
  },
  {
    value: "medium",
    label: "Medium",
    variant: "secondary",
    className:
      "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200",
  },
  {
    value: "high",
    label: "High",
    variant: "secondary",
    className:
      "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200",
  },
  {
    value: "urgent",
    label: "Urgent",
    variant: "secondary",
    className: "bg-red-100 text-red-700 border-red-200 hover:bg-red-200",
  },
];

// Helper function to get stage config by value
export const getStageConfig = (
  stages: StageOption[],
  value: string
): StageOption | undefined => {
  return stages.find((stage) => stage.value === value);
};

// Helper function to get stage label by value
export const getStageLabel = (stages: StageOption[], value: string): string => {
  const stage = getStageConfig(stages, value);
  return stage?.label || value;
};
