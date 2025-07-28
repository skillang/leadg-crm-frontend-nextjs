// src/models/auth.ts

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
  user: ApiUser; // Reference the user interface
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
export interface ApiUser {
  id: string;
  email: string;
  name?: string;
  first_name: string;
  last_name: string;
  role: "admin" | "user";
  username: string;
  is_active: boolean;
  department: string;
  phone: string;
  created_at: string;
  last_login?: string;
}

export interface CurrentUserResponse {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: "admin" | "user";
  is_active: boolean;
  phone: string;
  department: string;
  created_at: string;
  last_login: string;
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
  user?: ApiUser | null;
  loading: boolean;
  error: string | null;
  expiresIn: number | null;
  tokenCreatedAt: number | null;
}
