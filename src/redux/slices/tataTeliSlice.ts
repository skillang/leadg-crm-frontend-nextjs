// src/redux/slices/tataTeliSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  TataTeliState,
  TataTeliTabType,
  OpenCallModalPayload,
  ValidateCallResponse,
  // CallValidation,
} from "@/models/types/tatatTeli";

const initialState: TataTeliState = {
  isModalOpen: false,
  activeTab: "validate",
  currentLeadId: null,

  // Validation cache
  validation: {
    isValidating: false,
    canCall: null,
    leadPhone: null,
    userCanCall: null,
    leadFound: null,
    userAgentId: null,
    recommendations: [],
    error: null,
  },

  // Call form
  callNotes: "",
  callPurpose: "",
  callPriority: "normal",
  isCallInProgress: false,
  callError: null,
};

const tataTeliSlice = createSlice({
  name: "tataTeli",
  initialState,
  reducers: {
    // Modal actions
    openModal: (state, action: PayloadAction<OpenCallModalPayload>) => {
      state.isModalOpen = true;
      state.currentLeadId = action.payload.leadId;
      state.activeTab = "validate";
      state.callError = null;
      // Reset validation cache when opening new modal
      state.validation = {
        isValidating: false,
        canCall: null,
        leadPhone: null,
        userCanCall: null,
        leadFound: null,
        userAgentId: null,
        recommendations: [],
        error: null,
      };
    },

    closeModal: (state) => {
      state.isModalOpen = false;
      state.currentLeadId = null;
      state.activeTab = "validate";
      state.callError = null;
      // Reset form data
      state.callNotes = "";
      state.callPurpose = "";
      state.callPriority = "normal";
      // Reset validation cache
      state.validation = initialState.validation;
    },

    setActiveTab: (state, action: PayloadAction<TataTeliTabType>) => {
      state.activeTab = action.payload;
    },

    // Validation actions
    setValidationLoading: (state, action: PayloadAction<boolean>) => {
      state.validation.isValidating = action.payload;
      if (action.payload) {
        state.validation.error = null;
      }
    },

    setValidationResult: (
      state,
      action: PayloadAction<ValidateCallResponse>
    ) => {
      const result = action.payload;
      state.validation.isValidating = false;
      state.validation.canCall = result.can_call;
      state.validation.leadPhone = result.lead_phone;
      state.validation.userCanCall = result.user_can_call;
      state.validation.leadFound = result.lead_found;
      state.validation.userAgentId = result.user_agent_id;
      state.validation.recommendations = result.recommendations;
      state.validation.error = null;
    },

    setValidationError: (state, action: PayloadAction<string>) => {
      state.validation.isValidating = false;
      state.validation.error = action.payload;
      state.validation.canCall = false;
    },

    // Call form actions
    setCallNotes: (state, action: PayloadAction<string>) => {
      state.callNotes = action.payload;
    },

    setCallPurpose: (state, action: PayloadAction<string>) => {
      state.callPurpose = action.payload;
    },

    setCallPriority: (state, action: PayloadAction<string>) => {
      state.callPriority = action.payload;
    },

    // Call status actions
    setCallInProgress: (state, action: PayloadAction<boolean>) => {
      state.isCallInProgress = action.payload;
      if (action.payload) {
        state.callError = null;
      }
    },

    setCallError: (state, action: PayloadAction<string | null>) => {
      state.callError = action.payload;
      state.isCallInProgress = false;
    },

    setCallSuccess: (state) => {
      state.isCallInProgress = false;
      state.callError = null;
      // Optionally reset form after successful call
      state.callNotes = "";
      state.callPurpose = "";
      state.callPriority = "normal";
    },
  },
});

export const {
  openModal,
  closeModal,
  setActiveTab,
  setValidationLoading,
  setValidationResult,
  setValidationError,
  setCallNotes,
  setCallPurpose,
  setCallPriority,
  setCallInProgress,
  setCallError,
  setCallSuccess,
} = tataTeliSlice.actions;

export default tataTeliSlice.reducer;
