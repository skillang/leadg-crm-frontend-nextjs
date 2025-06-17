// src/redux/selectors/index.ts
import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { Lead } from "@/models/types/lead";

// Basic selectors with proper typing
export const selectLeadsState = (state: RootState) => state.leads;
export const selectFilters = (state: RootState) => state.leads.filters;
export const selectSelectedLeads = (state: RootState) =>
  state.leads.selectedLeads;

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
