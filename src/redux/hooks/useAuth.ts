// src/redux/hooks/useAuth.ts (FIXED - Remove conflicting navigation)

import { useAppSelector, useAppDispatch } from "./index";
import { useLogoutMutation } from "../slices/authApi";
import { clearAuthState } from "../slices/authSlice";

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);
  const [logoutMutation] = useLogoutMutation();

  const logout = async (forceLocal: boolean = false) => {
    try {
      if (!forceLocal) {
        // Get refresh token from localStorage or Redux state
        const refreshToken =
          auth.refreshToken || localStorage.getItem("refresh_token");

        if (refreshToken) {
          try {
            // Call logout API with refresh token
            await logoutMutation({ refresh_token: refreshToken }).unwrap();
          } catch (apiError: unknown) {
            if (
              typeof apiError === "object" &&
              apiError !== null &&
              "status" in apiError
            ) {
              const errorWithStatus = apiError as { status: number };

              if (
                errorWithStatus.status === 401 ||
                errorWithStatus.status === 422 ||
                errorWithStatus.status === 404 // 🔥 ADD 404 for missing endpoint
              ) {
                // Token expired or endpoint issue - continue with local logout
                console.log(
                  "⚠️ API logout failed (expected), continuing with local logout"
                );
              } else {
                console.error(
                  "⚠️ API logout failed with unexpected error, continuing with local logout"
                );
              }
            } else {
              console.error(
                "❌ API logout failed with unknown error:",
                apiError
              );
            }
          }
        }
      }
    } catch (error) {
      console.error("💥 Logout error:", error);
      // Continue with local logout even if API call fails
    } finally {
      // Always perform local cleanup regardless of API call success/failure
      performLocalLogout();
    }
  };

  const performLocalLogout = () => {
    // Clear tokens from localStorage
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_data");
    localStorage.removeItem("token_created_at");

    // Clear auth state - AuthLayout will handle navigation automatically
    dispatch(clearAuthState());

    // REMOVED: router.push("/login") - let AuthLayout handle redirect
    // This prevents conflicting navigation calls
  };

  // Force logout (skip API call)
  const forceLogout = async () => {
    await logout(true);
  };

  // Check if token is expired based on stored expiration time
  const isTokenExpired = (): boolean => {
    const tokenCreatedAt = localStorage.getItem("token_created_at");
    const expiresIn = auth.expiresIn;

    if (!tokenCreatedAt || !expiresIn) {
      return false; // Can't determine, assume valid
    }

    const createdTime = parseInt(tokenCreatedAt);
    const expirationTime = createdTime + expiresIn * 1000; // Convert to milliseconds
    const currentTime = Date.now();

    return currentTime >= expirationTime;
  };

  // Helper function to get user's full name
  const getUserFullName = (): string => {
    if (!auth.user) return "User";
    const { first_name, last_name } = auth.user;
    if (first_name && last_name) {
      return `${first_name} ${last_name}`;
    }
    return first_name || last_name || auth.user.username || "User";
  };

  // Helper function to check if user is admin
  const isAdmin = auth.user?.role?.toLowerCase() === "admin";

  // Helper function to get user permissions
  const userPermissions = auth.user?.permissions || null;

  // Helper functions to check specific permissions
  const canCreateSingleLead =
    auth.user?.permissions?.can_create_single_lead || false;
  const canCreateBulkLeads =
    auth.user?.permissions?.can_create_bulk_leads || false;

  // Helper function to check if user has any lead creation permissions
  const canCreateLeads = canCreateSingleLead || canCreateBulkLeads;

  // Helper function to get permission metadata
  const getPermissionInfo = () => {
    if (!userPermissions) return null;

    return {
      grantedBy: userPermissions.granted_by,
      grantedAt: userPermissions.granted_at,
      lastModifiedBy: userPermissions.last_modified_by,
      lastModifiedAt: userPermissions.last_modified_at,
    };
  };

  return {
    // Auth state
    isAuthenticated: auth.isAuthenticated,
    user: auth.user,
    token: auth.token,
    loading: auth.loading,
    error: auth.error,

    // User helpers
    userName: getUserFullName(),
    userEmail: auth.user?.email || "",
    isAdmin,

    // PERMISSION HELPERS:
    permissions: userPermissions,
    canCreateSingleLead,
    canCreateBulkLeads,
    canCreateLeads,
    getPermissionInfo,

    // Auth actions
    logout,
    forceLogout,
    isTokenExpired,
  };
};
