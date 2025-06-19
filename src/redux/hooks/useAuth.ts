// src/redux/hooks/useAuth.ts (Fixed)
import { useAppSelector, useAppDispatch } from "./index";
import { useLogoutMutation } from "../slices/authApi";
import { clearAuthState } from "../slices/authSlice";
import { useRouter } from "next/navigation";

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const auth = useAppSelector((state) => state.auth);
  const [logoutMutation] = useLogoutMutation();

  const logout = async () => {
    try {
      // Get refresh token from localStorage or Redux state
      const refreshToken =
        localStorage.getItem("refresh_token") || auth.refreshToken;

      if (refreshToken) {
        // Call logout API with refresh token
        await logoutMutation({ refresh_token: refreshToken }).unwrap();
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Continue with logout even if API call fails
    } finally {
      // Clear tokens from localStorage
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");

      // Clear auth state
      dispatch(clearAuthState());

      // Redirect to login
      router.push("/login");
    }
  };

  // Fix the role comparisons by normalizing case
  const userRole = auth.user?.role?.toLowerCase();
  const isAdmin = userRole === "admin";
  const isUser = userRole === "user";

  return {
    ...auth,
    logout,
    isAdmin,
    isUser,
    // Additional helper properties
    userName: auth.user ? `${auth.user.first_name} ${auth.user.last_name}` : "",
    userEmail: auth.user?.email || "",
    userDepartment: auth.user?.department || "",
  };
};
