"use client";

import { useAppSelector } from "@/redux/hooks";
import AccessDeniedCard from "@/components/common/AccessDeniedCard";
import { selectIsAdmin } from "@/redux/selectors";

interface UseAdminAccessOptions {
  redirectPath?: string;
  title?: string;
  description?: string;
  requiredRole?: "admin" | "user";
}

interface UseAdminAccessReturn {
  isAdmin: boolean;
  hasAccess: boolean;
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

  const isAdmin = useAppSelector(selectIsAdmin);
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
    AccessDeniedComponent,
  };
};
