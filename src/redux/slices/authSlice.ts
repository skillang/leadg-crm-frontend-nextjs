// src/redux/slices/authSlice.ts (UPDATED with token timestamps)

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AuthState } from "@/redux/types/Leads";

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

interface AuthStateExtended extends Omit<AuthState, "user"> {
  user: ApiUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  tokenType: string;
  expiresIn: number | null;
  tokenCreatedAt: number | null; // NEW: Track when token was created
}

const initialState: AuthStateExtended = {
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

    // Set authentication state (after successful login)
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
      state.tokenCreatedAt = now; // NEW: Track token creation time
      state.loading = false;
      state.error = null;

      // Store token creation time in localStorage for persistence
      localStorage.setItem("token_created_at", now.toString());
    },

    // Set user data (after fetching current user)
    setUserData: (state, action: PayloadAction<ApiUser>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
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
      localStorage.removeItem("token_created_at");
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
      state.tokenCreatedAt = now; // NEW: Update token creation time

      // Update localStorage
      localStorage.setItem("token_created_at", now.toString());
    },

    // NEW: Initialize token timestamp from localStorage (for page refresh)
    initializeTokenTimestamp: (state) => {
      const storedTimestamp = localStorage.getItem("token_created_at");
      if (storedTimestamp) {
        state.tokenCreatedAt = parseInt(storedTimestamp);
      }
    },
  },
});

export const {
  setLoading,
  setError,
  clearError,
  setAuthState,
  setUserData,
  clearAuthState,
  updateUser,
  updateTokens,
  initializeTokenTimestamp,
} = authSlice.actions;

export default authSlice.reducer;
