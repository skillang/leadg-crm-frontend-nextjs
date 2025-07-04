// src/redux/selectors/index.ts (Fixed role comparisons)
import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { Lead } from "@/redux/types/Leads";

// Basic selectors with proper typing
export const selectLeadsState = (state: RootState) => state.leads;
export const selectFilters = (state: RootState) => state.leads.filters;
export const selectSelectedLeads = (state: RootState) =>
  state.leads.selectedLeads;

// Auth selectors with fixed role comparisons
export const selectAuthState = (state: RootState) => state.auth;
export const selectIsAuthenticated = (state: RootState) =>
  state.auth.isAuthenticated;
export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectAuthToken = (state: RootState) => state.auth.token;
export const selectAuthLoading = (state: RootState) => state.auth.loading;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectUserRole = (state: RootState) => state.auth.user?.role;

// Fixed role comparisons - normalize to lowercase
export const selectIsAdmin = (state: RootState) =>
  state.auth.user?.role?.toLowerCase() === "admin";

export const selectIsUser = (state: RootState) =>
  state.auth.user?.role?.toLowerCase() === "user";

// Helper selector for user's full name
export const selectUserFullName = (state: RootState) => {
  const user = state.auth.user;
  return user ? `${user.first_name} ${user.last_name}` : "";
};

// Filter leads based on current filters
export const createFilteredLeadsSelector = (leads: Lead[] = []) =>
  createSelector([selectFilters], (filters) => {
    return leads.filter((lead) => {
      const matchesName =
        !filters.name ||
        lead.name.toLowerCase().includes(filters.name.toLowerCase());

      const matchesStage = !filters.stage || lead.stage === filters.stage;

      const matchesDepartment =
        !filters.department || lead.department === filters.department;

      const matchesSource = !filters.source || lead.source === filters.source;

      return matchesName && matchesStage && matchesDepartment && matchesSource;
    });
  });

// Filter leads based on user role and assignment
export const createUserFilteredLeadsSelector = (leads: Lead[] = []) =>
  createSelector(
    [selectCurrentUser, selectFilters, selectIsAdmin],
    (user, filters, isAdmin) => {
      if (!user) return [];

      // First filter by user permissions
      let userLeads = leads;
      if (!isAdmin) {
        // Non-admin users only see their assigned leads
        // Assuming leads have an assignedTo field - adjust based on your Lead interface
        userLeads = leads.filter(
          (lead) =>
            lead.assignedTo === user.id ||
            lead.assignedToId === user.id ||
            lead.contact === user.email // fallback logic
        );
      }

      // Then apply standard filters
      return userLeads.filter((lead) => {
        const matchesName =
          !filters.name ||
          lead.name.toLowerCase().includes(filters.name.toLowerCase());

        const matchesStage = !filters.stage || lead.stage === filters.stage;

        const matchesDepartment =
          !filters.department || lead.department === filters.department;

        const matchesSource = !filters.source || lead.source === filters.source;

        return (
          matchesName && matchesStage && matchesDepartment && matchesSource
        );
      });
    }
  );

// Stats calculator
export const calculateLeadStats = (leads: Lead[] = []) => {
  const total = leads.length;

  const byStage = leads.reduce((acc, lead) => {
    acc[lead.stage] = (acc[lead.stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const byDepartment = leads.reduce((acc, lead) => {
    acc[lead.department] = (acc[lead.department] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const averageScore =
    total > 0
      ? Math.round(
          (leads.reduce((sum, lead) => sum + lead.leadScore, 0) / total) * 100
        ) / 100
      : 0;

  const closedWon = byStage["closed-won"] || 0;
  const conversionRate =
    total > 0 ? Math.round((closedWon / total) * 100 * 100) / 100 : 0;

  return {
    total,
    byStage,
    byDepartment,
    averageScore,
    conversionRate,
  };
};
