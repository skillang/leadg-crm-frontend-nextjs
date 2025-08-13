// src/redux/slices/leadsSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  // LeadFilters,
  LeadsState,
} from "@/models/types/lead";

const initialState: LeadsState = {
  filters: {
    name: "",
    stage: "",
    department: "",
    source: "",
    assignedTo: "",
    category: "", // Category filter
    dateFrom: "",
    dateTo: "",
    includeMultiAssigned: false,
    assignedToMe: false,
  },
  selectedLeads: [],
  bulkUpdateModalOpen: false,
  editModalOpen: false,
  currentEditLeadId: null,
};

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

    setAssignedToFilter: (state, action: PayloadAction<string>) => {
      state.filters.assignedTo = action.payload;
    },

    setIncludeMultiAssignedFilter: (state, action: PayloadAction<boolean>) => {
      state.filters.includeMultiAssigned = action.payload;
    },

    setAssignedToMeFilter: (state, action: PayloadAction<boolean>) => {
      state.filters.assignedToMe = action.payload;
    },

    setCategoryFilter: (state, action: PayloadAction<string>) => {
      state.filters.category = action.payload;
    },

    setDateFromFilter: (state, action: PayloadAction<string>) => {
      state.filters.dateFrom = action.payload;
    },

    setDateToFilter: (state, action: PayloadAction<string>) => {
      state.filters.dateTo = action.payload;
    },

    setDateRangeFilter: (
      state,
      action: PayloadAction<{ from?: string; to?: string }>
    ) => {
      state.filters.dateFrom = action.payload.from;
      state.filters.dateTo = action.payload.to;
    },

    clearFilters: (state) => {
      state.filters = {
        name: "",
        stage: "",
        department: "",
        source: "",
        assignedTo: "",
        includeMultiAssigned: false,
        assignedToMe: false,
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

    // Modals
    openBulkUpdateModal: (state) => {
      state.bulkUpdateModalOpen = true;
    },

    closeBulkUpdateModal: (state) => {
      state.bulkUpdateModalOpen = false;
      state.selectedLeads = [];
    },

    openEditModal: (state, action: PayloadAction<string>) => {
      state.editModalOpen = true;
      state.currentEditLeadId = action.payload;
    },

    closeEditModal: (state) => {
      state.editModalOpen = false;
      state.currentEditLeadId = null;
    },
  },
});

export const {
  setNameFilter,
  setStageFilter,
  setDepartmentFilter,
  setSourceFilter,
  setAssignedToFilter,
  setIncludeMultiAssignedFilter,
  setAssignedToMeFilter,
  clearFilters,
  toggleLeadSelection,
  selectAllLeads,
  clearSelection,
  openBulkUpdateModal,
  closeBulkUpdateModal,
  openEditModal,
  closeEditModal,
} = leadsSlice.actions;

export default leadsSlice.reducer;
