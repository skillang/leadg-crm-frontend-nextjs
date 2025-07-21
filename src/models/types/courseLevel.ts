export interface CourseLevel {
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

export interface CreateCourseLevelRequest {
  name: string;
  display_name: string;
  description?: string;
  color?: string;
  sort_order?: number;
  is_active?: boolean;
  is_default?: boolean;
}

export interface UpdateCourseLevelRequest {
  name?: string;
  display_name?: string;
  description?: string;
  color?: string;
  sort_order?: number;
  is_active?: boolean;
  is_default?: boolean;
}

export interface CourseLevelsResponse {
  course_levels: CourseLevel[];
  total: number;
  active_count: number;
  inactive_count: number;
}

export interface CreateCourseLevelResponse {
  success: boolean;
  message: string;
  course_level: CourseLevel;
}

export interface UpdateCourseLevelResponse {
  success: boolean;
  message: string;
  course_level: CourseLevel;
}

// For dropdown options
export interface CourseLevelOption {
  value: string;
  label: string;
}
