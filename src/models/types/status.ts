// src/models/types/status.ts

// =============== CORE STATUS TYPES ===============
export interface Status {
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
  updated_at: string | null;
}

// =============== REQUEST TYPES ===============
export interface CreateStatusRequest {
  name: string;
  display_name: string;
  description: string;
  color?: string;
  sort_order?: number;
  is_active?: boolean;
  is_default?: boolean;
}

export interface UpdateStatusRequest {
  display_name?: string;
  description?: string;
  color?: string;
  sort_order?: number;
  is_active?: boolean;
  is_default?: boolean;
}

export interface StatusReorderItem {
  id: string;
  sort_order: number;
}

// =============== RESPONSE TYPES ===============
export interface StatusesResponse {
  statuses: Status[];
  total: number;
  active_count: number;
  inactive_count: number;
}

export interface CreateStatusResponse {
  success: boolean;
  message: string;
  status: Status;
}

export interface UpdateStatusResponse {
  success: boolean;
  message: string;
  status: Status;
}

export interface DeleteStatusResponse {
  success: boolean;
  message: string;
}

export interface StatusActionResponse {
  success: boolean;
  message: string;
}

export interface SetupDefaultStatusesResponse {
  success: boolean;
  message: string;
  statuses_created: Status[];
}

// =============== VALIDATION FUNCTIONS ===============
export const validateStatusData = (status: CreateStatusRequest): string[] => {
  const errors: string[] = [];

  if (!status.name?.trim()) {
    errors.push("Status name is required");
  } else if (status.name.trim().length < 2) {
    errors.push("Status name must be at least 2 characters long");
  }

  if (!status.display_name?.trim()) {
    errors.push("Display name is required");
  } else if (status.display_name.trim().length < 2) {
    errors.push("Display name must be at least 2 characters long");
  }

  if (!status.description?.trim()) {
    errors.push("Description is required");
  }

  if (status.color && !isValidHexColor(status.color)) {
    errors.push("Color must be a valid hex color code");
  }

  if (status.sort_order !== undefined && status.sort_order < 0) {
    errors.push("Sort order must be a positive number");
  }

  return errors;
};

export const isValidHexColor = (color: string): boolean => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
};

// =============== STATUS CONSTANTS ===============
export const DEFAULT_STATUS_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Yellow
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#06B6D4", // Cyan
  "#84CC16", // Lime
  "#F97316", // Orange
  "#EC4899", // Pink
  "#6B7280", // Gray
] as const;

export const STATUS_TYPES = [
  { value: "active", label: "Active", color: "#10B981" },
  { value: "inactive", label: "Inactive", color: "#6B7280" },
  { value: "pending", label: "Pending", color: "#F59E0B" },
  { value: "completed", label: "Completed", color: "#3B82F6" },
  { value: "cancelled", label: "Cancelled", color: "#EF4444" },
] as const;

export const DEFAULT_STATUSES = [
  {
    name: "new",
    display_name: "New",
    description: "Newly created leads",
    color: "#3B82F6",
    sort_order: 1,
    is_default: true,
  },
  {
    name: "contacted",
    display_name: "Contacted",
    description: "Leads that have been contacted",
    color: "#F59E0B",
    sort_order: 2,
  },
  {
    name: "qualified",
    display_name: "Qualified",
    description: "Qualified leads",
    color: "#8B5CF6",
    sort_order: 3,
  },
  {
    name: "converted",
    display_name: "Converted",
    description: "Successfully converted leads",
    color: "#10B981",
    sort_order: 4,
  },
  {
    name: "lost",
    display_name: "Lost",
    description: "Lost leads",
    color: "#EF4444",
    sort_order: 5,
  },
] as const;

// =============== HELPER FUNCTIONS ===============
export const getActiveStatusesOnly = (statuses: Status[]): Status[] => {
  return statuses.filter((status) => status.is_active);
};

export const getInactiveStatusesOnly = (statuses: Status[]): Status[] => {
  return statuses.filter((status) => !status.is_active);
};

export const getDefaultStatus = (statuses: Status[]): Status | null => {
  return statuses.find((status) => status.is_default) || null;
};

export const sortStatusesByOrder = (statuses: Status[]): Status[] => {
  return [...statuses].sort((a, b) => a.sort_order - b.sort_order);
};

export const getStatusByName = (
  statuses: Status[],
  name: string
): Status | null => {
  return statuses.find((status) => status.name === name) || null;
};

export const getStatusById = (
  statuses: Status[],
  id: string
): Status | null => {
  return statuses.find((status) => status.id === id) || null;
};

export const formatStatusForDisplay = (status: Status): string => {
  return `${status.display_name} (${status.lead_count || 0} leads)`;
};

export const getStatusColor = (
  statuses: Status[],
  statusName: string
): string => {
  const status = getStatusByName(statuses, statusName);
  return status?.color || "#6B7280";
};

export const canDeleteStatus = (status: Status): boolean => {
  return !status.is_default && status.lead_count === 0;
};

export const getNextSortOrder = (statuses: Status[]): number => {
  const maxOrder = Math.max(...statuses.map((s) => s.sort_order), 0);
  return maxOrder + 1;
};

// =============== STATUS STATISTICS ===============
export interface StatusStats {
  total_statuses: number;
  active_statuses: number;
  inactive_statuses: number;
  default_status: string | null;
  most_used_status: string | null;
  total_leads_across_statuses: number;
}

export const calculateStatusStats = (statuses: Status[]): StatusStats => {
  const activeStatuses = getActiveStatusesOnly(statuses);
  const inactiveStatuses = getInactiveStatusesOnly(statuses);
  const defaultStatus = getDefaultStatus(statuses);

  // Find most used status
  const mostUsedStatus = statuses.reduce((prev, current) =>
    prev.lead_count > current.lead_count ? prev : current
  );

  const totalLeads = statuses.reduce(
    (sum, status) => sum + status.lead_count,
    0
  );

  return {
    total_statuses: statuses.length,
    active_statuses: activeStatuses.length,
    inactive_statuses: inactiveStatuses.length,
    default_status: defaultStatus?.name || null,
    most_used_status: mostUsedStatus?.name || null,
    total_leads_across_statuses: totalLeads,
  };
};

// =============== STATUS VALIDATION RULES ===============
export const STATUS_VALIDATION_RULES = {
  name: {
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-z_]+$/, // lowercase with underscores only
  },
  display_name: {
    minLength: 2,
    maxLength: 100,
  },
  description: {
    minLength: 5,
    maxLength: 500,
  },
  color: {
    pattern: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  },
} as const;

export const validateStatusName = (name: string): boolean => {
  return (
    STATUS_VALIDATION_RULES.name.pattern.test(name) &&
    name.length >= STATUS_VALIDATION_RULES.name.minLength &&
    name.length <= STATUS_VALIDATION_RULES.name.maxLength
  );
};
