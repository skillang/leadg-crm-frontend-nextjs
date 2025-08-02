// src/models/types/permissions.ts

// ✅ Permission interfaces based on your API structure
export interface UserPermissions {
  can_create_single_lead: boolean;
  can_create_bulk_leads: boolean;
  granted_by: string | null;
  granted_at: string | null;
  last_modified_by: string | null;
  last_modified_at: string | null;
}

// Update the ApiUser interface to include permissions
export interface ApiUserWithPermissions {
  id: string;
  email: string;
  name?: string;
  first_name: string;
  last_name: string;
  role: string;
  username: string;
  is_active: boolean;
  department: string;
  created_at: string;
  last_login?: string;
  departments?: string[];
  permissions?: {
    can_create_single_lead: boolean;
    can_create_bulk_leads: boolean;
    granted_by: string | null;
    granted_at: string | null;
    last_modified_by: string | null;
    last_modified_at: string | null;
  };
}

export interface PermissionSummary {
  has_any_permission: boolean;
  permission_level: number;
  granted_by: string | null;
  granted_at: string | null;
}

export interface UserWithPermissions {
  _id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: string;
  created_at: string;
  last_login?: string;
  departments: string[];
  permissions: UserPermissions;
  permission_summary: PermissionSummary;
}

export interface PermissionUpdateRequest {
  user_email: string;
  can_create_single_lead: boolean;
  can_create_bulk_leads: boolean;
  reason?: string;
}

export interface PermissionUpdateResponse {
  success: boolean;
  message: string;
  user_email: string;
  updated_permissions: UserPermissions;
  updated_by: string;
  updated_at: string;
}

export interface PermissionsSummary {
  total_users: number;
  users_with_single_permission: number;
  users_with_bulk_permission: number;
  users_with_any_permission: number;
  users_with_no_permissions: number;
  percentages: {
    with_single_permission: number;
    with_bulk_permission: number;
    with_any_permission: number;
    with_no_permissions: number;
  };
}

// ✅ API Response interfaces
export interface GetUsersPermissionsResponse {
  success: boolean;
  users: UserWithPermissions[];
  total: number;
  summary: PermissionsSummary;
}

export interface PermissionAuditLogEntry {
  _id: string;
  user_email: string;
  user_name: string;
  action: string;
  old_permissions: UserPermissions;
  new_permissions: UserPermissions;
  performed_by: string;
  performed_by_name: string;
  performed_at: string;
  reason?: string;
}

export interface PermissionAuditLogResponse {
  success: boolean;
  audit_log: PermissionAuditLogEntry[];
  total: number;
  has_more: boolean;
}

// ✅ Permission validation interfaces
export interface PermissionValidationResult {
  success: boolean;
  issues_found: number;
  users_without_permissions: number;
  recommendations: string[];
  details: {
    users_missing_permission_fields: UserWithPermissions[];
    users_with_invalid_permissions: UserWithPermissions[];
  };
}

// ✅ Permission check interfaces
export interface UserPermissionCheck {
  user_email: string;
  user_name: string;
  permissions: UserPermissions;
  permission_summary: PermissionSummary;
  last_activity: string | null;
}

// ✅ Bulk operation interfaces
export interface BulkPermissionUpdateRequest {
  user_emails: string[];
  can_create_single_lead: boolean;
  can_create_bulk_leads: boolean;
  reason?: string;
}

export interface BulkPermissionUpdateResponse {
  success: boolean;
  message: string;
  updated_count: number;
  failed_count: number;
  updated_users: string[];
  failed_users: { email: string; error: string }[];
  updated_by: string;
  updated_at: string;
}

// ✅ Filter and search interfaces
export interface PermissionFilters {
  search_term: string;
  department: string;
  permission_level: "all" | "none" | "single" | "bulk";
  granted_by?: string;
  date_range?: {
    start_date: string;
    end_date: string;
  };
}

// ✅ Permission level enum for better type safety
export enum PermissionLevel {
  NONE = 0,
  SINGLE = 1,
  BULK = 2,
}

// ✅ Permission action types for audit log
export enum PermissionAction {
  GRANTED_SINGLE = "granted_single",
  GRANTED_BULK = "granted_bulk",
  REVOKED_SINGLE = "revoked_single",
  REVOKED_BULK = "revoked_bulk",
  REVOKED_ALL = "revoked_all",
  UPDATED = "updated",
}

// ✅ Export for convenience
export type PermissionToggleType = "single" | "bulk";

// ✅ Modal state interfaces
export interface PermissionModalState {
  isOpen: boolean;
  currentUser: UserWithPermissions | null;
  pendingUpdate: PermissionUpdateRequest | null;
}

export interface ConfirmationModalState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
}
