// src/redux/hooks/useLeadsWithAuth.ts
import { useAppSelector } from "./index";
import { useGetLeadsQuery } from "../slices/leadsApi";
import { createUserFilteredLeadsSelector } from "../selectors";
import { useMemo } from "react";
import { Lead } from "@/models/types/lead";

// Define PaginatedResponse interface locally if not imported
interface PaginatedResponse<T> {
  leads?: T[];
  total?: number;
  page?: number;
  limit?: number;
  has_next?: boolean;
  has_prev?: boolean;
}

interface UseLeadsWithAuthProps {
  page?: number;
  limit?: number;
  lead_status?: string;
  assigned_to?: string;
  search?: string;
  include_multi_assigned?: boolean;
  assigned_to_me?: boolean;
}

// Helper function to extract leads array from response
const extractLeadsArray = (
  data: Lead[] | PaginatedResponse<Lead> | undefined
): Lead[] => {
  if (!data) return [];

  // Type guard for paginated response
  const isPaginatedResponse = (
    obj: unknown
  ): obj is PaginatedResponse<Lead> => {
    return typeof obj === "object" && obj !== null && "leads" in obj;
  };

  // If it's a paginated response with leads property
  if (isPaginatedResponse(data)) {
    return data.leads || [];
  }

  // If it's already an array
  if (Array.isArray(data)) {
    return data;
  }

  return [];
};

export const useLeadsWithAuth = (params: UseLeadsWithAuthProps = {}) => {
  // 🔥 FIXED: Added required argument object with default values
  const {
    data: leadsResponse,
    isLoading,
    error,
  } = useGetLeadsQuery({
    page: params.page || 1,
    limit: params.limit || 20,
    lead_status: params.lead_status || "all",
    assigned_to: params.assigned_to,
    search: params.search,
    include_multi_assigned: params.include_multi_assigned,
    assigned_to_me: params.assigned_to_me,
  });

  const currentUser = useAppSelector((state) => state.auth.user);

  // 🔥 FIXED: Extract leads array from response
  const leads = useMemo(
    () => extractLeadsArray(leadsResponse),
    [leadsResponse]
  );

  // Create memoized selector for user-filtered leads
  const userFilteredLeadsSelector = useMemo(
    () => createUserFilteredLeadsSelector(leads),
    [leads]
  );

  const filteredLeads = useAppSelector(userFilteredLeadsSelector);

  return {
    leads: filteredLeads,
    allLeads: leads, // For admins who might need all leads
    isLoading,
    error,
    isAdmin: currentUser?.role === "admin",
    // 🔥 ADDED: Return pagination metadata if available
    paginationMeta:
      leadsResponse &&
      typeof leadsResponse === "object" &&
      "total" in leadsResponse
        ? {
            total: (leadsResponse as PaginatedResponse<Lead>).total || 0,
            page: (leadsResponse as PaginatedResponse<Lead>).page || 1,
            limit: (leadsResponse as PaginatedResponse<Lead>).limit || 20,
            has_next:
              (leadsResponse as PaginatedResponse<Lead>).has_next || false,
            has_prev:
              (leadsResponse as PaginatedResponse<Lead>).has_prev || false,
          }
        : undefined,
  };
};
