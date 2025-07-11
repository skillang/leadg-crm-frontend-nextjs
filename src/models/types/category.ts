// src/models/types/category.ts

export interface Category {
  id: string;
  name: string;
  short_form: string;
  description: string;
  is_active: boolean;
  lead_count: number;
  next_lead_number: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryRequest {
  name: string;
  short_form: string;
  description?: string;
  is_active: boolean;
}

export interface UpdateCategoryRequest {
  name: string;
  description?: string;
  is_active: boolean;
}

export interface CategoriesResponse {
  success: boolean;
  categories: Category[];
  summary: {
    total: number;
    active: number;
    inactive: number;
  };
}

export interface ApiCategoryResponse {
  name: string;
  short_form: string;
  description: string;
  is_active: boolean;
  lead_count: number;
  next_lead_number: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  id: string;
}

export interface CreateCategoryResponse {
  success: boolean;
  message: string;
  category: ApiCategoryResponse;
}

export interface UpdateCategoryResponse {
  success: boolean;
  message: string;
  category: ApiCategoryResponse;
}
