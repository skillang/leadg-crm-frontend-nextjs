// src/redux/slices/authSlice.ts

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Define the user interface
export interface ApiUser {
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
}

// Define the auth state interface
interface AuthState {
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

// Define the initial state
const initialState: AuthState = {
  isAuthenticated: false,
  token: null,
  accessToken: null,
  refreshToken: null,
  user: null,
  loading: false,
  error: null,
  expiresIn: null,
  tokenCreatedAt: null,
};

// Create the auth slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    // Set error message
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Clear error message
    clearError: (state) => {
      state.error = null;
    },

    // Set auth state after successful login (from API response)
    setAuthState: (
      state,
      action: PayloadAction<{
        access_token: string;
        refresh_token: string;
        user: ApiUser;
        expires_in: number;
      }>
    ) => {
      const now = Date.now();

      state.isAuthenticated = true;
      state.token = action.payload.access_token;
      state.accessToken = action.payload.access_token;
      state.refreshToken = action.payload.refresh_token; // ✅ FIXED
      state.user = action.payload.user;
      state.expiresIn = action.payload.expires_in;
      state.tokenCreatedAt = now;
      state.loading = false;
      state.error = null;

      // Store in localStorage - 🔥 FIXED: Store refresh token too
      if (typeof window !== "undefined") {
        localStorage.setItem("access_token", action.payload.access_token);
        localStorage.setItem("refresh_token", action.payload.refresh_token); // ✅ FIXED
        localStorage.setItem("user_data", JSON.stringify(action.payload.user));
        localStorage.setItem("token_created_at", now.toString());
      }
    },

    // Set auth state from localStorage (for page refresh/reload)
    setAuthFromStorage: (state) => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("access_token");
        const refreshToken = localStorage.getItem("refresh_token"); // ✅ FIXED
        const userData = localStorage.getItem("user_data");
        const tokenCreatedAt = localStorage.getItem("token_created_at");

        if (token && userData) {
          state.isAuthenticated = true;
          state.token = token;
          state.accessToken = token;
          state.refreshToken = refreshToken; // ✅ FIXED
          state.user = JSON.parse(userData);
          state.tokenCreatedAt = tokenCreatedAt
            ? parseInt(tokenCreatedAt)
            : null;
          state.loading = false;
          state.error = null;
        }
      }
    },

    // Set user data
    setUserData: (state, action: PayloadAction<ApiUser>) => {
      state.user = action.payload;
      state.isAuthenticated = true;

      // Update localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("user_data", JSON.stringify(action.payload));
      }
    },

    // Clear auth state (logout)
    clearAuthState: (state) => {
      state.isAuthenticated = false;
      state.token = null;
      state.accessToken = null;
      state.refreshToken = null; // ✅ FIXED
      state.user = null;
      state.loading = false;
      state.error = null;
      state.expiresIn = null;
      state.tokenCreatedAt = null;

      // Clear localStorage - 🔥 FIXED: Clear refresh token too
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token"); // ✅ FIXED
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

      // Update localStorage - 🔥 FIXED: Store refresh token properly
      if (typeof window !== "undefined") {
        localStorage.setItem("access_token", action.payload.access_token);
        localStorage.setItem("refresh_token", action.payload.refresh_token); // ✅ ALREADY FIXED
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
