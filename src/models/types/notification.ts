// Admin notification overview types
export interface HealthIndicators {
  realtime_connections_healthy: boolean;
  database_responsive: boolean;
  notification_backlog_normal: boolean;
  recent_activity_normal: boolean;
}

export interface NotificationStats {
  total_unread_messages: number;
  leads_with_unread: number;
  recent_messages_24h: number;
}

export interface RealtimeStats {
  total_connections: number;
  total_users: number;
  total_unread_leads: number;
  average_connections_per_user: number;
  top_connected_users: string[];
  last_updated: string;
}

export interface UserActivity {
  _id: string; // email
  unread_leads: number;
}

export interface AdminOverviewData {
  system_health: "healthy" | "warning" | "critical";
  health_indicators: HealthIndicators;
  notification_stats: NotificationStats;
  realtime_stats: RealtimeStats;
  user_activity: UserActivity[];
}

export interface AdminNotificationOverviewResponse {
  success: boolean;
  overview: AdminOverviewData;
  generated_at: string;
  generated_by: string;
}
