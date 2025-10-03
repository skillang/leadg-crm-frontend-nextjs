// src/redux/slices/authSlice.ts

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AuthState, CurrentUserResponse } from "@/models/types/auth";
import { setCookie } from "@/lib/cookie";

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
        user: CurrentUserResponse;
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
      // if (typeof window !== "undefined") {
      //   localStorage.setItem("access_token", action.payload.access_token);
      //   localStorage.setItem("refresh_token", action.payload.refresh_token); // ✅ FIXED
      //   localStorage.setItem("user_data", JSON.stringify(action.payload.user));
      //   localStorage.setItem("token_created_at", now.toString());
      //   // console.log("🔥 AUTH STORED:", {
      //   //    user: action.payload.user,
      //   // });
      // }

      setCookie("access_token", action.payload.access_token, 30); // 30 days
      // setCookie("user_role", action.payload.user.role, 30);
    },

    // Set auth state from localStorage (for page refresh/reload)
    setAuthFromStorage: (state) => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("access_token");
        const refreshToken = localStorage.getItem("refresh_token"); // ✅ FIXED
        const userData = localStorage.getItem("user_data");
        const tokenCreatedAt = localStorage.getItem("token_created_at");
        // console.log("🔥 AUTH LOADED FROM CACHE:", {
        //   userData,
        // });

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
    setUserData: (state, action: PayloadAction<CurrentUserResponse>) => {
      state.user = action.payload;
      state.isAuthenticated = true;

      // Update localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("user_data", JSON.stringify(action.payload));
      }
    },

    // Update user data with permissions (from /auth/me endpoint)
    updateUserWithPermissions: (
      state,
      action: PayloadAction<CurrentUserResponse>
    ) => {
      state.user = action.payload;
      state.isAuthenticated = true;

      // Update localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("user_data", JSON.stringify(action.payload));
        // 🔥 ADD LOGGING TO SEE PERMISSIONS CACHED:
        // console.log("🔥 USER UPDATED WITH PERMISSIONS:", {
        //   user: action.payload,
        //   permissions: action.payload.permissions,
        // });
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
        // localStorage.removeItem("access_token");
        // localStorage.removeItem("refresh_token"); // ✅ FIXED
        // localStorage.removeItem("user_data");
        // localStorage.removeItem("token_created_at");
        document.cookie = "access_token=; path=/; max-age=0";
        // document.cookie = "user_role=; path=/; max-age=0";
      }
    },

    // Update user data
    updateUser: (
      state,
      action: PayloadAction<Partial<CurrentUserResponse>>
    ) => {
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
  updateUserWithPermissions,
  clearAuthState,
  updateUser,
  updateTokens,
  initializeTokenTimestamp,
} = authSlice.actions;

export default authSlice.reducer;
