// src/models/email.ts

// =============== EMAIL TEMPLATE TYPES ===============
export interface EmailTemplate {
  key: string;
  name: string;
  subject: string;
  description: string;
  template_type: string;
  is_active: boolean;
}

export interface EmailTemplatesResponse {
  success: boolean;
  templates: EmailTemplate[];
  total: number;
  message: string;
}

// =============== EMAIL SENDING TYPES ===============
export interface SendEmailRequest {
  template_key: string;
  sender_email_prefix: string;
  scheduled_time?: string;
}

export interface BulkEmailRequest {
  lead_ids: string[];
  template_key: string;
  sender_email_prefix: string;
  scheduled_time?: string;
}

export interface EmailResponse {
  success: boolean;
  data: {
    email_id: string;
    lead_id?: string;
    message: string;
    scheduled: boolean;
    scheduled_time: string | null;
    created_at: string;
  };
}

// =============== EMAIL HISTORY TYPES ===============
export interface EmailHistoryItem {
  email_id: string;
  template_name: string;
  status: "sent" | "failed" | "pending" | "cancelled";
  scheduled_time: string | null;
  sent_time: string | null;
  created_at: string;
  sender_email: string;
  created_by_name: string;
}

export interface EmailHistoryResponse {
  success: boolean;
  emails: EmailHistoryItem[];
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
  has_prev: boolean;
}

// =============== SCHEDULED EMAIL TYPES ===============
export interface ScheduledEmail {
  email_id: string;
  lead_id: string;
  lead_name: string;
  template_name: string;
  status: "pending" | "sent" | "failed" | "cancelled";
  scheduled_time: string;
  created_at: string;
}

export interface ScheduledEmailsResponse {
  success: boolean;
  emails: ScheduledEmail[];
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
  has_prev: boolean;
}

// =============== EMAIL STATISTICS TYPES ===============
export interface EmailStats {
  total_sent: number;
  total_pending: number;
  total_failed: number;
  total_cancelled: number;
  success_rate: number;
  monthly_sent: number;
}

export interface EmailStatsResponse {
  success: boolean;
  stats: EmailStats;
}

// =============== SCHEDULER TYPES ===============
export interface SchedulerStatus {
  is_running: boolean;
  last_run: string | null;
  next_run: string | null;
  pending_jobs: number;
  failed_jobs: number;
  total_processed: number;
  uptime: string;
  version: string;
}

export interface SchedulerStatusResponse {
  success: boolean;
  status: SchedulerStatus;
}

// =============== EMAIL STATUS ENUM ===============
export type EmailStatus = "sent" | "failed" | "pending" | "cancelled";

// =============== VALIDATION HELPERS ===============
export const validateEmailTemplate = (
  template: Partial<EmailTemplate>
): string[] => {
  const errors: string[] = [];

  if (!template.key?.trim()) errors.push("Template key is required");
  if (!template.name?.trim()) errors.push("Template name is required");
  if (!template.subject?.trim()) errors.push("Subject is required");

  return errors;
};

export const validateSendEmailRequest = (
  request: SendEmailRequest
): string[] => {
  const errors: string[] = [];

  if (!request.template_key?.trim()) errors.push("Template key is required");
  if (!request.sender_email_prefix?.trim())
    errors.push("Sender email prefix is required");

  // Validate scheduled time if provided
  if (request.scheduled_time) {
    const scheduledDate = new Date(request.scheduled_time);
    if (scheduledDate <= new Date()) {
      errors.push("Scheduled time must be in the future");
    }
  }

  return errors;
};

// =============== EMAIL CONSTANTS ===============
export const EMAIL_STATUSES = [
  { value: "sent", label: "Sent", color: "green" },
  { value: "pending", label: "Pending", color: "yellow" },
  { value: "failed", label: "Failed", color: "red" },
  { value: "cancelled", label: "Cancelled", color: "gray" },
] as const;

export const EMAIL_TEMPLATE_TYPES = [
  { value: "welcome", label: "Welcome Email" },
  { value: "follow_up", label: "Follow Up" },
  { value: "reminder", label: "Reminder" },
  { value: "promotional", label: "Promotional" },
  { value: "newsletter", label: "Newsletter" },
] as const;

// =============== EMAIL UI STATE TYPES ===============
export interface EmailState {
  // Email dialog states
  emailDialogOpen: boolean;
  currentLeadId: string | null;

  // Bulk email states
  selectedTemplateKey: string;
  selectedSenderPrefix: string;
  isScheduled: boolean;
  scheduledDateTime: string;

  // UI states
  activeTab: "basic" | "send" | "history";
  isLoading: boolean;
  error: string | null;

  // Bulk email page states
  bulkEmailFilters: {
    name: string;
    stage: string;
    status: string;
  };
  selectedLeadsForBulk: string[];
}

// =============== EMAIL TAB TYPES ===============
export type EmailTabType = "basic" | "send" | "history";

// =============== SENDER PREFIX OPTIONS ===============
export const SENDER_PREFIX_OPTIONS = [
  { value: "noreply", label: "noreply@leadg.com" },
  { value: "info", label: "info@leadg.com" },
  { value: "support", label: "support@leadg.com" },
  { value: "sales", label: "sales@leadg.com" },
] as const;

// =============== EMAIL FILTER TYPES ===============
export interface BulkEmailFilters {
  name: string;
  stage: string;
  status: string;
}

// You could also break down the EmailState for better organization:
export interface EmailDialogState {
  emailDialogOpen: boolean;
  currentLeadId: string | null;
  activeTab: EmailTabType;
}

export interface EmailFormState {
  selectedTemplateKey: string;
  selectedSenderPrefix: string;
  isScheduled: boolean;
  scheduledDateTime: string;
}

export interface EmailUIState {
  isLoading: boolean;
  error: string | null;
}

export interface BulkEmailState {
  bulkEmailFilters: BulkEmailFilters;
  selectedLeadsForBulk: string[];
}
