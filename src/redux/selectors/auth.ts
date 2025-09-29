import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../store";

// Basic state selectors
const selectAuthState = (state: RootState) => state.auth;

// Authentication status selectors
export const selectIsAuthenticated = createSelector(
  [selectAuthState],
  (auth) => !!auth.token && !!auth.user
);

export const selectAuthLoading = createSelector(
  [selectAuthState],
  (auth) => auth.loading || false
);

export const selectAuthError = createSelector(
  [selectAuthState],
  (auth) => auth.error || null
);

// User data selectors
export const selectCurrentUser = createSelector(
  [selectAuthState],
  (auth) => auth.user
);

export const selectUserId = createSelector(
  [selectCurrentUser],
  (user) => user?.id || null
);

// Permission selectors with safe role checking
export const selectIsAdmin = createSelector([selectCurrentUser], (user) => {
  if (!user?.role) return false;
  return user.role.toLowerCase() === "admin";
});

export const selectCanManageLeads = createSelector(
  [selectIsAdmin],
  (isAdmin) => isAdmin
);

// Token selector
export const selectAuthToken = createSelector(
  [selectAuthState],
  (auth) => auth.token || null
);

// Helper: Get user role in lowercase (useful for other checks)
export const selectUserRole = createSelector(
  [selectCurrentUser],
  (user) => user?.role?.toLowerCase() || null
);
