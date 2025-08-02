// src/hooks/useUserPermissions.ts

import { useMemo } from "react";
import { useAppSelector } from "@/redux/hooks";
import { UserWithDetails } from "@/models/types/lead";

interface UserPermissions {
  // Lead permissions
  canCreateSingleLead: boolean;
  canCreateBulkLeads: boolean;
  canViewAllLeads: boolean;
  canAssignLeads: boolean;

  // Combined permissions
  canCreateAnyLead: boolean;
  hasLeadPermissions: boolean;

  // Permission level
  permissionLevel: number; // 0: none, 1: single, 2: bulk

  // Loading and error states
  loading: boolean;
  error: boolean;

  // Admin status (from auth)
  isAdmin: boolean;
}

export const useUserPermissions = (): UserPermissions => {
  // Get current user from auth (this already includes permissions from MongoDB)
  const currentUser = useAppSelector((state) => state.auth.user);
  const authLoading = useAppSelector((state) => state.auth.loading);
  const isAdmin = currentUser?.role === "admin";

  // Return computed permissions
  return useMemo((): UserPermissions => {
    // If no user data, return default state
    if (!currentUser) {
      return {
        canCreateSingleLead: false,
        canCreateBulkLeads: false,
        canViewAllLeads: false,
        canAssignLeads: false,
        canCreateAnyLead: false,
        hasLeadPermissions: false,
        permissionLevel: 0,
        loading: authLoading,
        error: false,
        isAdmin: false,
      };
    }

    // If admin, grant all permissions
    if (isAdmin) {
      return {
        canCreateSingleLead: true,
        canCreateBulkLeads: true,
        canViewAllLeads: true,
        canAssignLeads: true,
        canCreateAnyLead: true,
        hasLeadPermissions: true,
        permissionLevel: 2,
        loading: authLoading,
        error: false,
        isAdmin: true,
      };
    }

    // For regular users, read permissions from user data
    // The permissions field should be available from MongoDB user document
    const userPermissions = (currentUser as UserWithDetails).permissions;

    const canCreateSingleLead =
      userPermissions?.can_create_single_lead || false;
    const canCreateBulkLeads = userPermissions?.can_create_bulk_leads || false;
    const canCreateAnyLead = canCreateSingleLead || canCreateBulkLeads;

    return {
      canCreateSingleLead,
      canCreateBulkLeads,
      canViewAllLeads: false, // Regular users can't view all leads
      canAssignLeads: false, // Regular users can't assign leads
      canCreateAnyLead,
      hasLeadPermissions: canCreateAnyLead,
      permissionLevel: canCreateBulkLeads ? 2 : canCreateSingleLead ? 1 : 0,
      loading: authLoading,
      error: false,
      isAdmin: false,
    };
  }, [currentUser, authLoading, isAdmin]);
};
