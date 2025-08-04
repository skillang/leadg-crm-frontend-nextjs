// src/models/types/auth.ts

import { UserPermissions } from "./permissions";

// =============== AUTH TYPES ===============
export interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: CurrentUserResponse; // ✅ Changed from ApiUser to CurrentUserResponse
}

export interface RegisterRequest {
  department: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  phone: string;
  role: "admin" | "user";
  username: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  user: CurrentUserResponse;
}

export interface LogoutRequest {
  refresh_token: string;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
  data: Record<string, unknown>;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

// =============== USER TYPES ===============

export interface CurrentUserResponse {
  // ✅ Core required fields
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: "admin" | "user";
  is_active: boolean;
  phone: string;
  department: string[]; // Always array format
  created_at: string;
  last_login: string;
  permissions?: UserPermissions;

  // ✅ Calling system fields
  tata_extension?: string | null;
  smartflo_agent_id?: string | null; // Maps to tata_agent_id from backend
  calling_enabled?: boolean;
  sync_status?: string | null; // Maps to tata_sync_status from backend

  // ✅ Additional backend fields (optional)
  assigned_leads?: string[];
  total_assigned_leads?: number;
  login_count?: number;
  full_name?: string; // Backend generates this
  created_by?: string;
  updated_at?: string;
  failed_login_attempts?: number;
  last_activity?: string;
  locked_until?: string | null;
  last_tata_sync?: string;
  routing_method?: string | null;
  tata_agent_pool?: string[];
  calling_status?: string; // Different from sync_status
  calling_setup_date?: string | null;

  // ✅ Backward compatibility (in case some components still expect these)
  extension_number?: string | null; // Alias for tata_extension
  smartflo_user_id?: string | null; // If backend provides this

  // ✅ Computed field for ready to call status
  ready_to_call?: boolean;
}

export interface AdminRegisterRequest {
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  password: string;
  role: "admin" | "user";
  phone: string;
  departments: string[];
}

export interface AdminRegisterResponse {
  success: boolean;
  message: string;
  user: {
    id: string;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    role: string;
    created_at: string;
  };
}

export interface DeleteUserResponse {
  success: boolean;
  message: string;
  reassigned_leads?: number;
  deleted_user: {
    email: string;
    name: string;
  };
}

// =============== AUTH STATE ===============
export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  user?: CurrentUserResponse | null; // ✅ Changed from ApiUser to CurrentUserResponse
  loading: boolean;
  error: string | null;
  expiresIn: number | null;
  tokenCreatedAt: number | null;
}
