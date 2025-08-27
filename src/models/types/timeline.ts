// src/models/types/timeline.ts

import { PaginationMeta } from "@/models/types/pagination";

export interface TimelineActivity {
  id: string;
  activity_type: string;
  title: string;
  description: string;
  timestamp: string;
  performed_by: string;
  performed_by_name: string;
  lead_id: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface TimelineResponse {
  activities?: TimelineActivity[]; // Old structure
  timeline?: TimelineActivity[]; // New structure

  // Old pagination format (keep for backward compatibility)
  total?: number;
  page?: number;
  limit?: number;
  has_next?: boolean;
  has_prev?: boolean;
  total_pages?: number;

  // New nested pagination format
  pagination?: PaginationMeta;

  // Additional fields from API
  success?: boolean;
  lead_id?: string;
  filters?: Record<string, unknown>;
  summary?: Record<string, unknown>;
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

/**
 * Converts activity type strings to proper camel case labels
 * Examples:
 * "lead_reassigned" -> "Lead Reassigned"
 * "task_completed" -> "Task Completed"
 * "document-uploaded" -> "Document Uploaded"
 * "emailSent" -> "Email Sent"
 */
export const formatActivityTypeLabel = (activityType: string): string => {
  if (!activityType) return "";

  return (
    activityType
      // Split by underscores, dashes, or camelCase
      .split(/[_\-]|(?=[A-Z])/)
      // Filter out empty strings
      .filter((word) => word.length > 0)
      // Capitalize first letter of each word and make rest lowercase
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      // Join with spaces
      .join(" ")
  );
};

/**
 * Maps activity types to their corresponding icons
 * Add more mappings as needed for your specific activity types
 */
const getActivityIcon = (activityType: string): string => {
  const iconMap: Record<string, string> = {
    // Lead activities
    lead_reassigned: "UserPlus",
    lead_assigned: "UserPlus",
    lead_created: "UserPlus",
    lead_updated: "User",
    lead_stage_updated: "ArrowRight",

    // Task activities
    task_completed: "CheckSquare",
    task_created: "CheckSquare",
    task_updated: "CheckSquare",
    task_assigned: "CheckSquare",

    // Document activities
    document_uploaded: "Upload",
    document_shared: "Paperclip",
    document_downloaded: "Download",
    file_uploaded: "Upload",

    // Communication activities
    call_logged: "Phone",
    call_completed: "Phone",
    call_scheduled: "Phone",
    email_sent: "Mail",
    email_received: "Mail",
    sms_sent: "MessageSquare",

    // Meeting activities
    meeting_scheduled: "Calendar",
    meeting_completed: "Users",
    meeting_cancelled: "CalendarX",

    // Note activities
    note_added: "StickyNote",
    note_updated: "StickyNote",
    comment_added: "MessageCircle",

    // System activities
    system_update: "Settings",
    system_notification: "Bell",
    user_login: "LogIn",
    user_logout: "LogOut",

    // Contact activities
    contact_added: "UserPlus",
    contact_updated: "User",

    // General fallbacks
    created: "Plus",
    updated: "Edit",
    deleted: "Trash",
    assigned: "UserPlus",
    completed: "CheckCircle",
    cancelled: "XCircle",
  };

  // Direct match
  if (iconMap[activityType]) {
    return iconMap[activityType];
  }

  // Partial matches for common patterns
  if (activityType.includes("call")) return "Phone";
  if (activityType.includes("email")) return "Mail";
  if (activityType.includes("message") || activityType.includes("sms"))
    return "MessageSquare";
  if (activityType.includes("meeting")) return "Calendar";
  if (activityType.includes("task")) return "CheckSquare";
  if (activityType.includes("document") || activityType.includes("file"))
    return "Paperclip";
  if (activityType.includes("note")) return "StickyNote";
  if (activityType.includes("user") || activityType.includes("assign"))
    return "User";
  if (activityType.includes("stage") || activityType.includes("status"))
    return "ArrowRight";
  if (activityType.includes("upload")) return "Upload";
  if (activityType.includes("download")) return "Download";
  if (activityType.includes("system")) return "Settings";
  if (activityType.includes("login")) return "LogIn";
  if (activityType.includes("logout")) return "LogOut";
  if (activityType.includes("create")) return "Plus";
  if (activityType.includes("update")) return "Edit";
  if (activityType.includes("delete")) return "Trash";
  if (activityType.includes("complete")) return "CheckCircle";
  if (activityType.includes("cancel")) return "XCircle";

  // Default fallback
  return "Activity";
};

/**
 * Gets the color theme for an activity type
 * You can customize this based on your design requirements
 */
const getActivityColor = (activityType: string): string => {
  // For consistency with your blue theme, you can return "blue" for all
  // Or customize based on activity type categories

  const colorMap: Record<string, string> = {
    // Lead activities - blue
    lead: "blue",

    // Task activities - green
    task: "green",

    // Communication - blue
    call: "blue",
    email: "blue",
    message: "blue",
    sms: "blue",

    // Document activities - purple
    document: "purple",
    file: "purple",
    upload: "purple",

    // Meeting activities - orange
    meeting: "orange",

    // Note activities - yellow
    note: "yellow",
    comment: "yellow",

    // System activities - gray
    system: "gray",

    // Contact activities - pink
    contact: "pink",
  };

  // Check for category matches
  for (const [category, color] of Object.entries(colorMap)) {
    if (activityType.includes(category)) {
      return color;
    }
  }

  // Default to blue for consistency with your design
  return "blue";
};

/**
 * Creates an ActivityType configuration for any activity type string
 * This replaces the static ACTIVITY_TYPES array with dynamic generation
 */
export const getActivityTypeConfig = (activityType: string): ActivityType => {
  if (!activityType) {
    return {
      value: "",
      label: "Unknown",
      icon: "Activity",
      color: "gray",
    };
  }

  return {
    value: activityType,
    label: formatActivityTypeLabel(activityType),
    icon: getActivityIcon(activityType),
    color: getActivityColor(activityType),
  };
};

/**
 * Get all activity types with their configurations
 * This can be used for filtering dropdowns, etc.
 */
export const getAllActivityTypeConfigs = (
  activityTypes: string[]
): ActivityType[] => {
  return activityTypes.map((type) => getActivityTypeConfig(type));
};
