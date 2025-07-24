// src/models/types/source.ts
export interface Source {
  id: string;
  name: string;
  display_name: string;
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
  sort_order?: number;
  is_active?: boolean;
  is_default?: boolean;
}

export interface UpdateSourceRequest {
  name?: string;
  display_name?: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
  is_default?: boolean;
}
