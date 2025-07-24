// src/redux/slices/authSlice.ts (CORRECTED - Multiple action types)

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Updated User interface to match your API response
interface ApiUser {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: "admin" | "user"; // lowercase to match your API
  is_active: boolean;
  phone: string;
  department: string;
  created_at: string;
  last_login: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: ApiUser | null;
  token: string | null; // This will store the access token
  accessToken: string | null;
  refreshToken: string | null;
  tokenType: string;
  expiresIn: number | null;
  tokenCreatedAt: number | null; // Track when token was created
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null, // This will store the access token
  accessToken: null,
  refreshToken: null,
  tokenType: "bearer",
  expiresIn: null,
  tokenCreatedAt: null,
  loading: false,
  error: null,
};

// Auth slice for UI state management
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    // Set error
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Set authentication state from API response (after successful login)
    setAuthState: (
      state,
      action: PayloadAction<{
        access_token: string;
        refresh_token: string;
        token_type: string;
        expires_in: number;
        user: ApiUser;
      }>
    ) => {
      const now = Date.now();

      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.access_token; // For compatibility
      state.accessToken = action.payload.access_token;
      state.refreshToken = action.payload.refresh_token;
      state.tokenType = action.payload.token_type;
      state.expiresIn = action.payload.expires_in;
      state.tokenCreatedAt = now; // Track token creation time
      state.loading = false;
      state.error = null;

      // Store token creation time in localStorage for persistence
      if (typeof window !== "undefined") {
        localStorage.setItem("token_created_at", now.toString());
      }
    },

    // NEW: Set auth state from localStorage (for app initialization)
    setAuthFromStorage: (
      state,
      action: PayloadAction<{
        token: string;
        user: ApiUser;
      }>
    ) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.accessToken = action.payload.token;
      state.loading = false;
      state.error = null;
    },

    // Set user data (after fetching current user)
    setUserData: (state, action: PayloadAction<ApiUser>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.loading = false;
    },

    // Clear authentication state (logout)
    clearAuthState: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.tokenType = "bearer";
      state.expiresIn = null;
      state.tokenCreatedAt = null;
      state.loading = false;
      state.error = null;

      // Clear localStorage items
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_data");
        localStorage.removeItem("token_created_at");
      }
    },

    // Update user data
    updateUser: (state, action: PayloadAction<Partial<ApiUser>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },

    // Update tokens (for token refresh)
    updateTokens: (
      state,
      action: PayloadAction<{
        access_token: string;
        refresh_token: string;
        expires_in: number;
      }>
    ) => {
      const now = Date.now();

      state.token = action.payload.access_token;
      state.accessToken = action.payload.access_token;
      state.refreshToken = action.payload.refresh_token;
      state.expiresIn = action.payload.expires_in;
      state.tokenCreatedAt = now;

      // Update localStorage - 🔥 ADD refresh_token storage
      if (typeof window !== "undefined") {
        localStorage.setItem("access_token", action.payload.access_token);
        localStorage.setItem("refresh_token", action.payload.refresh_token); // 🔥 ADD THIS LINE
        localStorage.setItem("token_created_at", now.toString());
      }
    },

    // Initialize token timestamp from localStorage (for page refresh)
    initializeTokenTimestamp: (state) => {
      if (typeof window !== "undefined") {
        const storedTimestamp = localStorage.getItem("token_created_at");
        if (storedTimestamp) {
          state.tokenCreatedAt = parseInt(storedTimestamp);
        }
      }
    },
  },
});

export const {
  setLoading,
  setError,
  clearError,
  setAuthState, // For API login response
  setAuthFromStorage, // For localStorage initialization
  setUserData,
  clearAuthState,
  updateUser,
  updateTokens,
  initializeTokenTimestamp,
} = authSlice.actions;

export default authSlice.reducer;
