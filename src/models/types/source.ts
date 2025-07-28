// src/models/types/source.ts
export interface Source {
  id: string;
  name: string;
  display_name: string;
  short_form: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  is_default: boolean;
  lead_count?: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SourcesResponse {
  sources: Source[];
  total: number;
  active_count: number;
  inactive_count: number;
}

export interface CreateSourceRequest {
  name: string;
  display_name: string;
  description?: string;
  short_form: string;
  sort_order?: number;
  is_active?: boolean;
  is_default?: boolean;
}

export interface UpdateSourceRequest {
  name?: string;
  display_name?: string;
  description?: string;
  sort_order?: number;
  short_form?: string;
  is_active?: boolean;
  is_default?: boolean;
}

// =============== API RESPONSE TYPES ===============
export interface SourceMutationResponse {
  additionalProp1: unknown;
}

// =============== VALIDATION FUNCTIONS ===============
export const validateSourceData = (source: CreateSourceRequest): string[] => {
  const errors: string[] = [];

  if (!source.name?.trim()) {
    errors.push("Source name is required");
  } else if (source.name.trim().length < 2) {
    errors.push("Source name must be at least 2 characters long");
  }

  if (!source.display_name?.trim()) {
    errors.push("Display name is required");
  } else if (source.display_name.trim().length < 2) {
    errors.push("Display name must be at least 2 characters long");
  }

  if (source.sort_order !== undefined && source.sort_order < 0) {
    errors.push("Sort order must be a positive number");
  }

  return errors;
};

// =============== SOURCE CONSTANTS ===============
export const DEFAULT_SOURCES = [
  { name: "website", display_name: "Website", short_form: "WEB" },
  { name: "referral", display_name: "Referral", short_form: "REF" },
  { name: "social_media", display_name: "Social Media", short_form: "SM" },
  {
    name: "email_campaign",
    display_name: "Email Campaign",
    short_form: "EMAIL",
  },
  { name: "cold_call", display_name: "Cold Call", short_form: "CALL" },
  { name: "trade_show", display_name: "Trade Show", short_form: "TRADE" },
] as const;

// =============== HELPER FUNCTIONS ===============
export const getActiveSourcesOnly = (sources: Source[]): Source[] => {
  return sources.filter((source) => source.is_active);
};

export const getDefaultSource = (sources: Source[]): Source | null => {
  return sources.find((source) => source.is_default) || null;
};

export const sortSourcesByOrder = (sources: Source[]): Source[] => {
  return [...sources].sort((a, b) => a.sort_order - b.sort_order);
};

export const getSourceByName = (
  sources: Source[],
  name: string
): Source | null => {
  return sources.find((source) => source.name === name) || null;
};

export const formatSourceForDisplay = (source: Source): string => {
  return `${source.display_name} (${source.short_form})`;
};
