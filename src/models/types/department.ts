// src/models/department.ts

export interface Department {
  id?: string;
  name: string;
  display_name: string;
  description: string;
  is_predefined: boolean;
  is_active: boolean;
  created_at?: string;
  created_by?: string;
  user_count: number;
}

export interface DepartmentsResponse {
  success: boolean;
  departments: {
    predefined: Department[];
    custom: Department[];
    all: Department[];
  };
  total_count: number;
  predefined_count: number;
  custom_count: number;
}

export interface CreateDepartmentRequest {
  name: string;
  description: string;
  is_active: boolean;
}

export interface CreateDepartmentResponse {
  success: boolean;
  message: string;
  department: Department;
}
