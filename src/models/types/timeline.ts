// src/models/types/timeline.ts

export interface TimelineActivity {
  id: string;
  activity_type: string;
  title: string;
  description: string;
  timestamp: string;
  performed_by: string;
  performed_by_name: string;
  lead_id: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface TimelineResponse {
  activities: TimelineActivity[];
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
  has_prev: boolean;
  total_pages: number;
}

export interface TimelineStats {
  total_activities: number;
  activities_by_type: Record<string, number>;
  recent_activity_count: number;
  most_active_day: string;
  activity_trend: Array<{
    date: string;
    count: number;
  }>;
}

export interface TimelineFilters {
  page?: number;
  limit?: number;
  activity_type?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface ActivityType {
  value: string;
  label: string;
  icon?: string;
  color?: string;
}

// Common activity types (based on typical CRM activities)
export const ACTIVITY_TYPES: ActivityType[] = [
  { value: "call", label: "Call", icon: "Phone", color: "blue" },
  { value: "email", label: "Email", icon: "Mail", color: "green" },
  { value: "meeting", label: "Meeting", icon: "Users", color: "purple" },
  { value: "note", label: "Note", icon: "FileText", color: "orange" },
  { value: "task", label: "Task", icon: "CheckSquare", color: "yellow" },
  { value: "document", label: "Document", icon: "Paperclip", color: "red" },
  {
    value: "stage_change",
    label: "Stage Change",
    icon: "ArrowRight",
    color: "indigo",
  },
  { value: "assignment", label: "Assignment", icon: "UserPlus", color: "pink" },
  { value: "system", label: "System", icon: "Settings", color: "gray" },
];

export const getActivityTypeConfig = (type: string): ActivityType => {
  return (
    ACTIVITY_TYPES.find((t) => t.value === type) || {
      value: type,
      label: type.charAt(0).toUpperCase() + type.slice(1),
      icon: "Activity",
      color: "gray",
    }
  );
};
