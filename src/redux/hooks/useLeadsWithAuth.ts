// src/redux/hooks/useLeadsWithAuth.ts
import { useAppSelector } from "./index";
import { useGetLeadsQuery } from "../slices/leadsApi";
import { createUserFilteredLeadsSelector } from "../selectors";
import { useMemo } from "react";

export const useLeadsWithAuth = () => {
  const { data: leads = [], isLoading, error } = useGetLeadsQuery();
  const currentUser = useAppSelector((state) => state.auth.user);

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
  };
};
