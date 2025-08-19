// src/types/callDashboard.ts
// TypeScript interfaces for Tata Tele Admin Call Dashboard API

// ============================================================================
// BASE TYPES & ENUMS
// ============================================================================

export type PerformancePeriod = "daily" | "weekly" | "monthly";
export type CallStatus = "all" | "answered" | "missed";
export type CallDirection = "all" | "inbound" | "outbound";
export type CallTrend = "up" | "down" | "stable";

// ============================================================================
// USER & AGENT TYPES
// ============================================================================

export interface UserInfo {
  user_id: string;
  user_name: string;
  agent_number: string;
}

export interface AvailableUser {
  user_id: string;
  user_name: string;
}

// ============================================================================
// CALL RECORD TYPES
// ============================================================================

export interface CallRecord {
  call_id: string;
  uuid: string;
  id: string | null;
  direction: CallDirection;
  status: CallStatus;
  description: string | null;
  detailed_description: string | null;
  service: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM:SS
  end_stamp: string;
  call_duration: number;
  answered_seconds: number;
  agent_number: string;
  agent_number_with_prefix: string | null;
  agent_name: string;
  client_number: string;
  did_number: string;
  caller_id_num: string | null;
  recording_url: string | null;
  reason: string | null;
  hangup_cause: string;
  notes: string | null;
  circle: {
    operator: string;
    circle: string;
  };
  lead_id: string | null;
  support_api_call: boolean;
  blocked_number_id: string | null;
  broadcast_id: string | null;
  dtmf_input: string | null;
  minutes_consumed: number;
  charges: number;
  department_name: string | null;
  contact_details: string | null;
  missed_agents: any[];
  call_flow: any[];
  accountid: string | null;
  agent_ring_time: string | null;
  agent_hangup_data: string | null;
  transfer_missed_agent: any[];
  call_hint: string | null;
  sid: string | null;
  sname: string | null;
  is_incoming_from_broadcast: boolean;
  sip_agent_ids: string | null;
  dialer_call_details: string | null;
  custom_status: string | null;
  is_whatsapp: number;
  lead_data: any[];
  voicemail_recording: boolean;
  aws_call_recording_identifier: string | null;
  user_id: string;
  user_name: string;
}

// ============================================================================
// PERFORMANCE STATISTICS
// ============================================================================

export interface UserCallStats {
  user_id: string;
  user_name: string;
  agent_number: string;
  daily_calls: number | null;
  daily_answered: number | null;
  daily_missed: number | null;
  daily_duration: number | null;
  daily_recordings: number | null;
  weekly_calls: number | null;
  weekly_answered: number | null;
  weekly_missed: number | null;
  weekly_duration: number | null;
  weekly_recordings: number | null;
  monthly_calls: number | null;
  monthly_answered: number | null;
  monthly_missed: number | null;
  monthly_duration: number | null;
  monthly_recordings: number | null;
  success_rate: number;
  avg_call_duration: number;
}

export interface DayComparisonStats {
  date: string; // YYYY-MM-DD
  total_calls: number;
  answered_calls: number;
  missed_calls: number;
  total_duration: number;
  success_rate: number;
  recordings_count: number;
  calls_change: number;
  calls_change_percent: number;
  trend: CallTrend;
}

export interface PerformerRanking {
  rank: number;
  user_id: string;
  user_name: string;
  score: number;
  total_calls: number;
}

// ============================================================================
// DASHBOARD FILTERS & REQUESTS
// ============================================================================

export interface DashboardFilters {
  date_from: string; // YYYY-MM-DD
  date_to: string; // YYYY-MM-DD
  period: PerformancePeriod;
  call_status: CallStatus;
  call_direction: CallDirection;
  user_ids: string[] | null;
}

export interface AdminDashboardRequest {
  date_from?: string;
  date_to?: string;
  period?: PerformancePeriod;
  user_ids?: string;
  call_status?: CallStatus;
  call_direction?: CallDirection;
  limit?: number;
  page?: number;
}

export interface UserPerformanceRequest {
  user_id: string;
  period?: PerformancePeriod;
  date_from?: string;
  date_to?: string;
  include_day_comparison?: boolean;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface AdminDashboardResponse {
  success: boolean;
  total_calls: number;
  total_users: number;
  total_recordings: number;
  overall_success_rate: number;
  user_stats: UserCallStats[];
  recent_calls: CallRecord[];
  top_performers: PerformerRanking[];
  date_range: string;
  data_fetched_at: string;
  total_pages: number;
  current_page: number;
  filters_applied: DashboardFilters;
  debug_info?: {
    filtering_method: string;
    total_records_fetched: number;
    records_after_user_filter: number;
    tata_api_filters: Record<string, any>;
    filtering_successful: boolean;
  };
}

export interface UserPerformanceResponse {
  success: boolean;
  user_id: string;
  user_name: string;
  agent_number: string;
  stats: UserCallStats;
  day_comparison?: DayComparisonStats[];
  call_records?: CallRecord[];
  ranking?: PerformerRanking;
  period_analyzed: string;
  analysis_date: string;
  debug_info?: {
    total_records_fetched: number;
    user_records_found: number;
    filtering_method: string;
    agent_number_used: string;
  };
}

export interface FilterOptionsResponse {
  success: boolean;
  available_users: AvailableUser[];
  min_date: string; // YYYY-MM-DD
  max_date: string; // YYYY-MM-DD
  call_statuses: CallStatus[];
  call_directions: CallDirection[];
  performance_periods: PerformancePeriod[];
}

export interface SummaryStatsResponse {
  success: boolean;
  date_range: string;
  summary: {
    total_calls: number;
    total_answered: number;
    total_missed: number;
    total_duration_minutes: number;
    total_recordings: number;
    unique_users: number;
    success_rate: number;
    avg_calls_per_day: number;
    avg_call_duration_seconds: number;
  };
  trends: {
    trend: "increasing" | "decreasing" | "stable";
    change_percent: number;
    first_half_avg: number;
    second_half_avg: number;
    total_days_analyzed: number;
  };
  peak_hours: {
    peak_hours: Array<{
      hour: number;
      calls: number;
      percentage: number;
    }>;
    total_calls: number;
    hourly_distribution: Record<string, number>;
  };
  calculated_at: string;
}

// ============================================================================
// RECORDING TYPES
// ============================================================================

export interface PlayRecordingRequest {
  call_id: string;
  reason: string;
  user_id: string;
}

export interface RecordingPlayResponse {
  success: boolean;
  message: string;
  recording_url?: string;
  call_id?: string;
  access_logged: boolean;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface ApiError {
  success: false;
  error_code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

// ============================================================================
// COMPONENT PROP TYPES
// ============================================================================

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

// For table pagination
export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// For table sorting
export interface SortState {
  field: string;
  direction: "asc" | "desc";
}

// For filter state
export interface FilterState {
  dateRange: DateRange;
  period: PerformancePeriod;
  selectedUsers: string[];
  callStatus: CallStatus;
  callDirection: CallDirection;
}
