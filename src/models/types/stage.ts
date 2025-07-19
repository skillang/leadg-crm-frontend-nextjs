// src/models/types/stage.ts

export interface Stage {
  id: string;
  name: string;
  display_name: string;
  description: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  is_default: boolean;
  lead_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateStageRequest {
  name: string;
  display_name: string;
  description?: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  is_default: boolean;
}

export interface UpdateStageRequest {
  display_name?: string;
  description?: string;
  color?: string;
  sort_order?: number;
  is_active?: boolean;
  is_default?: boolean;
}

export interface StagesResponse {
  stages: Stage[];
  total: number;
  active_count: number;
  inactive_count: number;
}

export interface CreateStageResponse {
  success: boolean;
  message: string;
  stage: Stage;
}

export interface StageReorderRequest {
  id: string;
  sort_order: number;
}

// Common stage types and colors
export const STAGE_COLORS = [
  { value: "#6B7280", label: "Gray" },
  { value: "#3B82F6", label: "Blue" },
  { value: "#10B981", label: "Green" },
  { value: "#F59E0B", label: "Yellow" },
  { value: "#EF4444", label: "Red" },
  { value: "#8B5CF6", label: "Purple" },
  { value: "#F97316", label: "Orange" },
  { value: "#06B6D4", label: "Cyan" },
  { value: "#84CC16", label: "Lime" },
  { value: "#EC4899", label: "Pink" },
];

export const validateStageData = (data: CreateStageRequest): string[] => {
  const errors: string[] = [];

  if (!data.name?.trim()) errors.push("Name is required");
  if (!data.display_name?.trim()) errors.push("Display name is required");
  if (!data.color?.trim()) errors.push("Color is required");
  if (data.sort_order === undefined || data.sort_order < 0) {
    errors.push("Sort order must be a positive number");
  }

  return errors;
};
