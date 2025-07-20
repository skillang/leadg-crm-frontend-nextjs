// src/redux/slices/whatsappSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type MessageType = "text" | "template" | "document";

interface ContactValidation {
  isValid: boolean | null;
  isValidating: boolean;
  error: string | null;
}

interface LeadData {
  id: string;
  leadId: string;
  name: string;
  phoneNumber: string;
  email?: string;
}

interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface TemplateParameters {
  [key: string]: string;
}

interface WhatsAppState {
  // Modal states
  isModalOpen: boolean;
  messageType: MessageType;

  // Contact validation
  contactValidation: ContactValidation;

  // Template selection
  selectedTemplate: string | null;
  templateParameters: TemplateParameters;

  // UI states
  isPreviewMode: boolean;
  isSending: boolean;

  // Current context
  currentLead: LeadData | null;
  currentUser: UserData | null;
}

const initialState: WhatsAppState = {
  // Modal states
  isModalOpen: false,
  messageType: "text",

  // Contact validation
  contactValidation: {
    isValid: null,
    isValidating: false,
    error: null,
  },

  // Template selection
  selectedTemplate: null,
  templateParameters: {},

  // UI states
  isPreviewMode: false,
  isSending: false,

  // Current context
  currentLead: null,
  currentUser: null,
};

interface OpenModalPayload {
  lead: LeadData;
  user: UserData;
}

interface SetTemplateParameterPayload {
  key: string;
  value: string;
}

const whatsappSlice = createSlice({
  name: "whatsapp",
  initialState,
  reducers: {
    // Modal actions
    openModal: (state, action: PayloadAction<OpenModalPayload>) => {
      state.isModalOpen = true;
      state.currentLead = action.payload.lead;
      state.currentUser = action.payload.user;
      // Reset states when opening modal
      state.messageType = "text";
      state.selectedTemplate = null;
      state.templateParameters = {};
      state.isPreviewMode = false;
      state.contactValidation = {
        isValid: null,
        isValidating: false,
        error: null,
      };
    },

    closeModal: (state) => {
      state.isModalOpen = false;
      state.currentLead = null;
      state.currentUser = null;
      // Reset all states
      state.messageType = "text";
      state.selectedTemplate = null;
      state.templateParameters = {};
      state.isPreviewMode = false;
      state.contactValidation = {
        isValid: null,
        isValidating: false,
        error: null,
      };
    },

    // Message type selection
    setMessageType: (state, action: PayloadAction<MessageType>) => {
      state.messageType = action.payload;
      // Reset template-related states when switching types
      if (action.payload !== "template") {
        state.selectedTemplate = null;
        state.templateParameters = {};
        state.isPreviewMode = false;
      }
    },

    // Contact validation
    setContactValidating: (state) => {
      state.contactValidation.isValidating = true;
      state.contactValidation.error = null;
    },

    setContactValid: (state, action: PayloadAction<boolean>) => {
      state.contactValidation.isValid = action.payload;
      state.contactValidation.isValidating = false;
      state.contactValidation.error = null;
    },

    setContactValidationError: (state, action: PayloadAction<string>) => {
      state.contactValidation.isValid = false;
      state.contactValidation.isValidating = false;
      state.contactValidation.error = action.payload;
    },

    // Template selection
    setSelectedTemplate: (state, action: PayloadAction<string>) => {
      state.selectedTemplate = action.payload;
      // Auto-populate parameters based on current lead and user
      if (action.payload && state.currentLead && state.currentUser) {
        state.templateParameters = {
          lead_name: state.currentLead.name,
          agent_name: `${state.currentUser.firstName} ${state.currentUser.lastName}`,
        };
      }
    },

    // Template parameters
    setTemplateParameter: (
      state,
      action: PayloadAction<SetTemplateParameterPayload>
    ) => {
      const { key, value } = action.payload;
      state.templateParameters[key] = value;
    },

    updateTemplateParameters: (
      state,
      action: PayloadAction<TemplateParameters>
    ) => {
      state.templateParameters = {
        ...state.templateParameters,
        ...action.payload,
      };
    },

    // Preview mode
    setPreviewMode: (state, action: PayloadAction<boolean>) => {
      state.isPreviewMode = action.payload;
    },

    // Sending state
    setSending: (state, action: PayloadAction<boolean>) => {
      state.isSending = action.payload;
    },
  },
});

export const {
  openModal,
  closeModal,
  setMessageType,
  setContactValidating,
  setContactValid,
  setContactValidationError,
  setSelectedTemplate,
  setTemplateParameter,
  updateTemplateParameters,
  setPreviewMode,
  setSending,
} = whatsappSlice.actions;

export default whatsappSlice.reducer;
