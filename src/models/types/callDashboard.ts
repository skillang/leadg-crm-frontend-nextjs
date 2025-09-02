// src/types/callDashboard.ts
// TypeScript interfaces for Tata Tele Admin Call Dashboard API

// ============================================================================
// BASE TYPES & ENUMS
// ============================================================================

export type PerformancePeriod = "daily" | "weekly" | "monthly";
export type CallStatus = "all" | "answered" | "missed";
export type CallDirection = "all" | "inbound" | "outbound";
export type CallTrend = "up" | "down" | "stable";
export type CallInfo = Pick<
  CallRecord,
  "agent_name" | "client_number" | "date" | "time"
>;

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
  missed_agents: Array<{ agent_id: string; name: string }> | []; // instead of any[]
  call_flow: Array<{ step: string; timestamp: string }> | []; // instead of any[]
  accountid: string | null;
  agent_ring_time: string | null;
  agent_hangup_data: string | null;
  transfer_missed_agent: Array<{ agent_id: string; name: string }> | []; // instead of any[]
  call_hint: string | null;
  sid: string | null;
  sname: string | null;
  is_incoming_from_broadcast: boolean;
  sip_agent_ids: string | null;
  dialer_call_details: string | null;
  custom_status: string | null;
  is_whatsapp: number;
  lead_data: Array<Record<string, unknown>> | []; // instead of any[]
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
  total_calls: number;
  answered_calls: number;
  missed_calls: number;
  total_duration: number;
  recordings_count: number;
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
    tata_api_filters: Record<string, unknown>;
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

// src/models/types/callDashboard.ts
// Updated interface to match the new API response structure

export interface SummaryStatsResponse {
  success: boolean;
  date_range: string;
  filter_info: {
    applied: boolean;
    scope: string;
    user_count?: number;
    user_ids?: string[];
    agent_id?: string[];
  };
  summary: {
    total_calls: number;
    total_calls_all_pages: number;
    total_answered: number;
    total_missed: number;
    total_duration_minutes: number;
    total_recordings: number;
    unique_users: number;
    success_rate: number;
    avg_calls_per_day: number;
    avg_call_duration_seconds: number;
  };
  trends: EnhancedTrendsData; // Updated to use enhanced structure
  peak_hours: {
    peak_hours: Array<{
      hour: number;
      display: string;
      calls: number;
      answered: number;
      success_rate: number;
      avg_duration: number;
      agent_count: number;
      productivity_score: number;
      percentage: number;
    }>;
    total_calls: number;
    hourly_distribution: Record<string, number>;
    peak_answered_hours: Array<{
      hour: number;
      calls: number;
      percentage: number;
      hour_display: string;
      calls_type: "answered";
      success_rate: number;
      agent_count: number;
      avg_duration: number;
      efficiency_score: number;
    }>;
    peak_missed_hours: Array<{
      hour: number;
      calls: number;
      percentage: number;
      hour_display: string;
      calls_type: "missed";
      success_rate: number;
      agent_count: number;
      avg_duration: number;
      efficiency_score: number;
    }>;
    insights: {
      best_calling_time: number;
      best_answer_time: number;
      worst_miss_time: number;
      overall_answer_rate: number;
    };
    analysis_metadata: {
      hours_with_calls: number;
      hours_with_answered: number;
      hours_with_missed: number;
      most_active_hour: number;
      best_answer_hour: number;
      worst_miss_hour: number;
      total_active_agents: number;
      peak_agent_hour: number;
    };
  };
  optimization_info: {
    filtering_method: string;
    records_analyzed: number;
    total_available: number;
  };
  calculated_at: string;
}

// Helper types for easier component usage
export interface PeakHourData {
  hour: number;
  calls: number;
  percentage: number;
  hour_display?: string;
  calls_type?: "answered" | "missed";
}

export interface InsightsData {
  best_calling_time: number;
  best_answer_time: number;
  worst_miss_time: number;
  overall_answer_rate: number;
}

export interface TrendData {
  trend: "increasing" | "decreasing" | "stable" | "insufficient_data";
  change_percent: number;
  first_half_avg: number;
  second_half_avg: number;
  total_days_analyzed: number;
}

// Enum for trend types
export enum TrendType {
  INCREASING = "increasing",
  DECREASING = "decreasing",
  STABLE = "stable",
  INSUFFICIENT_DATA = "insufficient_data",
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
  details?: Record<string, unknown>;
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

// ============================================================================
// CHART DATA
// ============================================================================

// Hourly Heatmap Data Structure

export interface HourlyHeatmapData {
  data: Array<{
    hour: number;
    display: string; // "HH:MM" format
    call_count: number;
    answered_count: number;
    success_rate: number;
    intensity: number; // 0.0 to 1.0 for heatmap coloring
    is_active: boolean;
  }>;
  max_calls: number;
  best_hour: {
    hour: number;
    success_rate: number;
  };
  total_active_hours: number;
}

// Duration Distribution Data Structure
export interface DurationDistributionData {
  buckets: Array<{
    range: string; // "0-30s", "30-60s", etc.
    count: number;
    percentage: number;
    is_quality: boolean; // Whether this duration range is considered quality
  }>;
  avg_duration: number;
  quality_threshold: number; // Seconds threshold for quality calls
  quality_calls: number;
  quality_percentage: number;
  total_analyzed: number;
  median_duration: number;
}

// Temporal Trends Data Structure
export interface TemporalTrendsData {
  daily_series: Array<{
    date: string; // YYYY-MM-DD
    total_calls: number;
    answered_calls: number;
    success_rate: number;
    avg_duration: number;
    active_agents: number;
  }>;
  hourly_series: Array<{
    hour: number;
    display: string; // "HH:MM" format
    calls: number;
    answered: number;
    success_rate: number;
    avg_duration: number;
  }>;
  date_range: string;
  total_days: number;
  active_hours: number;
}

// Peak Hours Analysis Data Structure
export interface PeakHoursAnalysisData {
  hourly_data: Array<{
    hour: number;
    display: string;
    total_calls: number;
    answered_calls: number;
    success_rate: number;
    is_active: boolean;
    rank?: number;
    is_peak?: boolean;
  }>;
  active_hours: Array<{
    hour: number;
    display: string;
    total_calls: number;
    answered_calls: number;
    success_rate: number;
    is_active: boolean;
    rank: number;
    is_peak: boolean;
  }>;
  peak_summary: {
    best_hours: number[];
    worst_hours: number[];
    recommended_calling_window: string;
    peak_success_rate: number;
  };
  analysis_metadata: {
    total_active_hours: number;
    peak_threshold: number;
  };
}

// Trend Forecast Data Structure
export interface TrendForecastData {
  historical: Array<{
    date: string; // YYYY-MM-DD
    total_calls: number;
    answered_calls: number;
    success_rate: number;
    avg_duration: number;
    active_agents: number;
  }>;
  trend_direction: "increasing" | "decreasing" | "stable" | "insufficient_data";
  trend_strength: number;
  slope: number;
  analysis_period: number;
}

// Enhanced Trends Data Structure (Updated)
export interface EnhancedTrendsData {
  trend: "increasing" | "decreasing" | "stable" | "insufficient_data" | "error";
  change_percent: number;
  trend_strength: "strong" | "moderate" | "weak" | "none";

  // Performance Gauge
  performance_gauge: {
    current_rate: number;
    target_rate: number;
    status: "above_target" | "below_target" | "at_target";
    color_zone: "green" | "yellow" | "red";
    previous_period: number | null;
    improvement: number | null;
    progress_to_target: number;
  };

  // Temporal Trends
  temporal_trends: TemporalTrendsData;

  // Hourly Heatmap
  hourly_heatmap: HourlyHeatmapData;

  // Duration Distribution
  duration_distribution: DurationDistributionData;

  // Peak Hours Analysis
  peak_hours_analysis: PeakHoursAnalysisData;

  // Trend Forecast
  historical_analysis: TrendForecastData;

  // Available chart types
  charts_available: string[];
  view_type: "individual" | "team" | "all";
}
