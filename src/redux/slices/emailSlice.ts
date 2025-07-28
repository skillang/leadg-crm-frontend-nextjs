// src/redux/slices/emailSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { EmailState, EmailTabType } from "@/models/types/email";

const initialState: EmailState = {
  emailDialogOpen: false,
  currentLeadId: null,
  selectedTemplateKey: "",
  selectedSenderPrefix: "noreply",
  isScheduled: false,
  scheduledDateTime: "",
  activeTab: "basic",
  isLoading: false,
  error: null,
  bulkEmailFilters: {
    name: "",
    stage: "all",
    status: "all",
  },
  selectedLeadsForBulk: [],
};

const emailSlice = createSlice({
  name: "email",
  initialState,
  reducers: {
    // Email dialog actions
    openEmailDialog: (state, action: PayloadAction<string>) => {
      state.emailDialogOpen = true;
      state.currentLeadId = action.payload;
      state.activeTab = "basic";
      state.error = null;
    },

    closeEmailDialog: (state) => {
      state.emailDialogOpen = false;
      state.currentLeadId = null;
      state.activeTab = "basic";
      state.selectedTemplateKey = "";
      state.selectedSenderPrefix = "noreply";
      state.isScheduled = false;
      state.scheduledDateTime = "";
      state.error = null;
    },

    setActiveTab: (state, action: PayloadAction<EmailTabType>) => {
      state.activeTab = action.payload;
    },

    // Email form actions
    setSelectedTemplate: (state, action: PayloadAction<string>) => {
      state.selectedTemplateKey = action.payload;
    },

    setSenderPrefix: (state, action: PayloadAction<string>) => {
      state.selectedSenderPrefix = action.payload;
    },

    setIsScheduled: (state, action: PayloadAction<boolean>) => {
      state.isScheduled = action.payload;
      if (!action.payload) {
        state.scheduledDateTime = "";
      }
    },

    setScheduledDateTime: (state, action: PayloadAction<string>) => {
      state.scheduledDateTime = action.payload;
    },

    // Loading and error states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Bulk email actions
    setBulkEmailNameFilter: (state, action: PayloadAction<string>) => {
      state.bulkEmailFilters.name = action.payload;
    },

    setBulkEmailStageFilter: (state, action: PayloadAction<string>) => {
      state.bulkEmailFilters.stage = action.payload;
    },

    setBulkEmailStatusFilter: (state, action: PayloadAction<string>) => {
      state.bulkEmailFilters.status = action.payload;
    },

    clearBulkEmailFilters: (state) => {
      state.bulkEmailFilters = {
        name: "",
        stage: "all",
        status: "all",
      };
    },

    toggleLeadForBulkEmail: (state, action: PayloadAction<string>) => {
      const leadId = action.payload;
      const index = state.selectedLeadsForBulk.indexOf(leadId);
      if (index === -1) {
        state.selectedLeadsForBulk.push(leadId);
      } else {
        state.selectedLeadsForBulk.splice(index, 1);
      }
    },

    selectAllLeadsForBulkEmail: (state, action: PayloadAction<string[]>) => {
      state.selectedLeadsForBulk = action.payload;
    },

    clearBulkEmailSelection: (state) => {
      state.selectedLeadsForBulk = [];
    },

    // Reset bulk email form
    resetBulkEmailForm: (state) => {
      state.selectedTemplateKey = "";
      state.selectedSenderPrefix = "noreply";
      state.isScheduled = false;
      state.scheduledDateTime = "";
      state.selectedLeadsForBulk = [];
      state.error = null;
    },
  },
});

export const {
  openEmailDialog,
  closeEmailDialog,
  setActiveTab,
  setSelectedTemplate,
  setSenderPrefix,
  setIsScheduled,
  setScheduledDateTime,
  setLoading,
  setError,
  setBulkEmailNameFilter,
  setBulkEmailStageFilter,
  setBulkEmailStatusFilter,
  clearBulkEmailFilters,
  toggleLeadForBulkEmail,
  selectAllLeadsForBulkEmail,
  clearBulkEmailSelection,
  resetBulkEmailForm,
} = emailSlice.actions;

export default emailSlice.reducer;
