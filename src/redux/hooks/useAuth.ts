// src/redux/hooks/useAuth.ts (UPDATED with graceful logout)

import { useAppSelector, useAppDispatch } from "./index";
import { useLogoutMutation } from "../slices/authApi";
import { clearAuthState } from "../slices/authSlice";
import { useRouter } from "next/navigation";

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const auth = useAppSelector((state) => state.auth);
  const [logoutMutation] = useLogoutMutation();

  const logout = async (forceLocal: boolean = false) => {
    try {
      if (!forceLocal) {
        // Get refresh token from localStorage or Redux state
        const refreshToken =
          localStorage.getItem("refresh_token") || auth.refreshToken;

        if (refreshToken) {
          try {
            // console.log("🔄 Attempting API logout...");
            // Call logout API with refresh token
            await logoutMutation({ refresh_token: refreshToken }).unwrap();
            // console.log("✅ API logout successful");
          } catch (apiError: unknown) {
            if (
              typeof apiError === "object" &&
              apiError !== null &&
              "status" in apiError
            ) {
              const errorWithStatus = apiError as { status: number };

              if (
                errorWithStatus.status === 401 ||
                errorWithStatus.status === 422
              ) {
                // Token expired
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
        } else {
          // console.log(
          // "ℹ️ No refresh token available, performing local logout only"
          // );
        }
      } else {
        // console.log("🔄 Performing forced local logout");
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
    // console.log("🧹 Performing local logout cleanup");

    // Clear tokens from localStorage
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    // Clear auth state
    dispatch(clearAuthState());

    // Redirect to login
    router.push("/login");
  };

  // Force logout (skip API call)
  const forceLogout = async () => {
    await logout(true);
  };

  // Check if token is expired based on stored expiration time
  const isTokenExpired = (): boolean => {
    if (!auth.accessToken || !auth.expiresIn) return true;

    // Get token creation time from localStorage or estimate
    const tokenCreatedAt = localStorage.getItem("token_created_at");
    if (!tokenCreatedAt) return false; // If we don't know when it was created, assume it's valid

    const createdTime = parseInt(tokenCreatedAt);
    const currentTime = Date.now();
    const expirationTime = createdTime + auth.expiresIn * 1000;

    return currentTime >= expirationTime;
  };

  // Check if token expires soon (within 5 minutes)
  const isTokenExpiringSoon = (): boolean => {
    if (!auth.accessToken || !auth.expiresIn) return false;

    const tokenCreatedAt = localStorage.getItem("token_created_at");
    if (!tokenCreatedAt) return false;

    const createdTime = parseInt(tokenCreatedAt);
    const currentTime = Date.now();
    const expirationTime = createdTime + auth.expiresIn * 1000;
    const fiveMinutesInMs = 5 * 60 * 1000;

    return expirationTime - currentTime <= fiveMinutesInMs;
  };

  // Fix the role comparisons by normalizing case
  const userRole = auth.user?.role?.toLowerCase();
  const isAdmin = userRole === "admin";
  const isUser = userRole === "user";

  return {
    ...auth,
    logout,
    forceLogout,
    performLocalLogout,
    isTokenExpired,
    isTokenExpiringSoon,
    isAdmin,
    isUser,
    // Additional helper properties
    userName: auth.user ? `${auth.user.first_name} ${auth.user.last_name}` : "",
    userEmail: auth.user?.email || "",
    userDepartment: auth.user?.department || "",
  };
};
