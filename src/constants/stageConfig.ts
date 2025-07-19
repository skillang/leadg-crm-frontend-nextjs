// constants/stageConfig.ts

import { StageOption } from "@/components/StageSelectComponent";

export const LEAD_STAGES: StageOption[] = [
  {
    value: "Initial",
    label: "Initial",
    variant: "secondary",
    className: "bg-pink-100 text-pink-800 border-pink-200 hover:bg-pink-200",
  },
  {
    value: "followup",
    label: "Followup",
    variant: "secondary",
    className: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200",
  },
  {
    value: "warm",
    label: "Warm",
    variant: "secondary",
    className:
      "bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
  },
  {
    value: "prospect",
    label: "Prospect",
    variant: "secondary",
    className:
      "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200",
  },
  {
    value: "junk",
    label: "Junk",
    variant: "secondary",
    className: "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200",
  },
  {
    value: "enrolled",
    label: "Enrolled",
    variant: "secondary",
    className:
      "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200",
  },
  {
    value: "yet-to-call",
    label: "Yet to call",
    variant: "secondary",
    className:
      "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200",
  },
  {
    value: "counseled",
    label: "Counseled",
    variant: "secondary",
    className: "bg-teal-100 text-teal-800 border-teal-200 hover:bg-teal-200",
  },
  {
    value: "dnp",
    label: "DNP",
    variant: "secondary",
    className: "bg-red-100 text-red-800 border-red-200 hover:bg-red-200",
  },
  {
    value: "invalid",
    label: "INVALID",
    variant: "secondary",
    className: "bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-200",
  },
  {
    value: "call-back",
    label: "Call Back",
    variant: "secondary",
    className:
      "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200",
  },
  {
    value: "busy",
    label: "Busy",
    variant: "secondary",
    className:
      "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200",
  },
  {
    value: "ni",
    label: "NI",
    variant: "secondary",
    className:
      "bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200",
  },
  {
    value: "ringing",
    label: "Ringing",
    variant: "secondary",
    className: "bg-cyan-100 text-cyan-800 border-cyan-200 hover:bg-cyan-200",
  },
  {
    value: "wrong-number",
    label: "Wrong Number",
    variant: "secondary",
    className: "bg-pink-100 text-pink-800 border-pink-200 hover:bg-pink-200",
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
