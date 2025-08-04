"use client";

import { useAppSelector } from "@/redux/hooks";
import AccessDeniedCard from "@/components/common/AccessDeniedCard";
import type { CurrentUserResponse } from "@/models/types/auth"; // ✅ Use your existing CurrentUserResponse type

interface UseAdminAccessOptions {
  redirectPath?: string;
  title?: string;
  description?: string;
  requiredRole?: "admin" | "user";
}

interface UseAdminAccessReturn {
  isAdmin: boolean;
  hasAccess: boolean;
  user: CurrentUserResponse | null;
  AccessDeniedComponent: React.ReactNode | null;
}

export const useAdminAccess = (
  options: UseAdminAccessOptions = {}
): UseAdminAccessReturn => {
  const {
    redirectPath = "/dashboard",
    title = "Access Denied",
    description = "Admin privileges required to access this page.",
    requiredRole = "admin",
  } = options;

  // ✅ Ensure fallback to null for typing
  const user = useAppSelector((state) => state.auth.user) ?? null;

  const isAdmin = user?.role === "admin";
  const hasAccess = requiredRole === "admin" ? isAdmin : true;

  const AccessDeniedComponent = !hasAccess ? (
    <AccessDeniedCard
      title={title}
      description={description}
      redirectPath={redirectPath}
      requiredRole={requiredRole}
      variant="admin"
    />
  ) : null;

  return {
    isAdmin,
    hasAccess,
    user,
    AccessDeniedComponent,
  };
};
