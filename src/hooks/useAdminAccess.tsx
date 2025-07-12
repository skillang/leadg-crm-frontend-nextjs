// src/hooks/useAdminAccess.tsx

"use client";

import { useAppSelector } from "@/redux/hooks";
import AccessDeniedCard from "@/components/common/AccessDeniedCard";

interface UseAdminAccessOptions {
  redirectPath?: string;
  title?: string;
  description?: string;
  requiredRole?: "admin" | "user";
}

// Define proper User interface instead of using 'any'
interface User {
  id?: string;
  email?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  role?: "admin" | "user";
  is_active?: boolean;
  phone?: string;
  departments?: string | string[];
  created_at?: string;
  last_login?: string;
}

interface UseAdminAccessReturn {
  isAdmin: boolean;
  hasAccess: boolean;
  user: User | null;
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

  const { user } = useAppSelector((state) => state.auth);

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
