// src/redux/slices/leadsSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { LeadFilters } from "@/models/types/lead";

// Simple state for UI-only concerns
interface LeadsState {
  filters: LeadFilters;
  selectedLeads: string[];
}

const initialState: LeadsState = {
  filters: {
    name: "",
    stage: "",
    department: "",
    source: "",
  },
  selectedLeads: [],
};

// Much simpler slice - only for UI state
const leadsSlice = createSlice({
  name: "leads",
  initialState,
  reducers: {
    // Filters
    setNameFilter: (state, action: PayloadAction<string>) => {
      state.filters.name = action.payload;
    },

    setStageFilter: (state, action: PayloadAction<string>) => {
      state.filters.stage = action.payload;
    },

    setDepartmentFilter: (state, action: PayloadAction<string>) => {
      state.filters.department = action.payload;
    },

    setSourceFilter: (state, action: PayloadAction<string>) => {
      state.filters.source = action.payload;
    },

    clearFilters: (state) => {
      state.filters = {
        name: "",
        stage: "",
        department: "",
        source: "",
      };
    },

    // Selection
    toggleLeadSelection: (state, action: PayloadAction<string>) => {
      const leadId = action.payload;
      const index = state.selectedLeads.indexOf(leadId);
      if (index === -1) {
        state.selectedLeads.push(leadId);
      } else {
        state.selectedLeads.splice(index, 1);
      }
    },

    selectAllLeads: (state, action: PayloadAction<string[]>) => {
      state.selectedLeads = action.payload;
    },

    clearSelection: (state) => {
      state.selectedLeads = [];
    },
  },
});

export const {
  setNameFilter,
  setStageFilter,
  setDepartmentFilter,
  setSourceFilter,
  clearFilters,
  toggleLeadSelection,
  selectAllLeads,
  clearSelection,
} = leadsSlice.actions;

export default leadsSlice.reducer;
