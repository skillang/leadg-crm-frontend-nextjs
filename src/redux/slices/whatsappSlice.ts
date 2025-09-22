// src/redux/slices/whatsappSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  MessageType,
  WhatsAppState,
  OpenModalPayload,
  SetTemplateParameterPayload,
  TemplateParameters,
  ChatMessage,
  ConnectionStatus,
  // CreateBulkWhatsAppJobRequest,
  // CreateBulkWhatsAppJobResponse,
  // BulkWhatsAppJobsResponse,
  // BulkWhatsAppJobStatusResponse,
  // CancelBulkJobRequest,
  // BulkWhatsAppStatsResponse,
  // ValidatePhoneNumbersResponse,
  NotificationHistoryFilters,
} from "@/models/types/whatsapp";

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

  notificationHistoryFilters: {
    date_from: undefined,
    date_to: undefined,
    notification_type: undefined,
    search: undefined,
  },

  bulkWhatsappFilters: {
    name: "",
    stage: "all",
    status: "all",
  },
  selectedLeadsForBulk: [],
  bulkJobName: "",
  bulkMessageType: "template",
  bulkSelectedTemplate: null,
  bulkMessageContent: "",
  bulkIsScheduled: false,
  bulkScheduledDateTime: "",
  bulkBatchSize: 10,
  bulkDelayBetweenMessages: 2,

  // Bulk UI states
  bulkIsLoading: false,
  bulkError: null,

  chatHistory: [],
  isLoadingHistory: false,
  chatError: null,

  chatPagination: {
    totalMessages: 0,
    currentOffset: 0,
    messagesPerBatch: 20,
    hasMoreMessages: true,
    isLoadingMore: false,
  },

  // 🔄 NEW: Real-time States (ADD THESE)
  unreadCounts: {},
  connectionStatus: "disconnected",
  isConnected: false,
};

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

    setBulkWhatsappNameFilter: (state, action: PayloadAction<string>) => {
      state.bulkWhatsappFilters.name = action.payload;
    },

    setBulkWhatsappStageFilter: (state, action: PayloadAction<string>) => {
      state.bulkWhatsappFilters.stage = action.payload;
    },

    setBulkWhatsappStatusFilter: (state, action: PayloadAction<string>) => {
      state.bulkWhatsappFilters.status = action.payload;
    },

    clearBulkWhatsappFilters: (state) => {
      state.bulkWhatsappFilters = {
        name: "",
        stage: "all",
        status: "all",
      };
    },

    // Lead selection for bulk
    toggleLeadForBulkWhatsapp: (state, action: PayloadAction<string>) => {
      const leadId = action.payload;
      const index = state.selectedLeadsForBulk.indexOf(leadId);
      if (index === -1) {
        state.selectedLeadsForBulk.push(leadId);
      } else {
        state.selectedLeadsForBulk.splice(index, 1);
      }
    },

    selectAllLeadsForBulkWhatsapp: (state, action: PayloadAction<string[]>) => {
      state.selectedLeadsForBulk = action.payload;
    },

    clearBulkWhatsappSelection: (state) => {
      state.selectedLeadsForBulk = [];
    },

    // Bulk job configuration
    setBulkJobName: (state, action: PayloadAction<string>) => {
      state.bulkJobName = action.payload;
    },

    setBulkMessageType: (state, action: PayloadAction<"template" | "text">) => {
      state.bulkMessageType = action.payload;
      // Reset template/content when switching types
      if (action.payload === "template") {
        state.bulkMessageContent = "";
      } else {
        state.bulkSelectedTemplate = null;
      }
    },

    setBulkSelectedTemplate: (state, action: PayloadAction<string | null>) => {
      state.bulkSelectedTemplate = action.payload;
      if (action.payload) {
        state.bulkMessageContent = ""; // Clear custom message when template selected
      }
    },

    setBulkMessageContent: (state, action: PayloadAction<string>) => {
      state.bulkMessageContent = action.payload;
    },

    // Bulk scheduling
    setBulkIsScheduled: (state, action: PayloadAction<boolean>) => {
      state.bulkIsScheduled = action.payload;
      if (!action.payload) {
        state.bulkScheduledDateTime = "";
      }
    },

    setBulkScheduledDateTime: (state, action: PayloadAction<string>) => {
      state.bulkScheduledDateTime = action.payload;
    },

    // Bulk settings
    setBulkBatchSize: (state, action: PayloadAction<number>) => {
      state.bulkBatchSize = action.payload;
    },

    setBulkDelayBetweenMessages: (state, action: PayloadAction<number>) => {
      state.bulkDelayBetweenMessages = action.payload;
    },

    // Bulk UI states
    setBulkLoading: (state, action: PayloadAction<boolean>) => {
      state.bulkIsLoading = action.payload;
    },

    setBulkError: (state, action: PayloadAction<string | null>) => {
      state.bulkError = action.payload;
    },

    // Reset bulk form
    resetBulkWhatsappForm: (state) => {
      state.bulkJobName = "";
      state.bulkMessageType = "template";
      state.bulkSelectedTemplate = null;
      state.bulkMessageContent = "";
      state.bulkIsScheduled = false;
      state.bulkScheduledDateTime = "";
      state.bulkBatchSize = 10;
      state.bulkDelayBetweenMessages = 2;
      state.selectedLeadsForBulk = [];
      state.bulkError = null;
    },
    // 💬 Chat History Actions (ADD TO REDUCERS)
    setChatHistory: (state, action: PayloadAction<ChatMessage[]>) => {
      state.chatHistory = action.payload;
      state.isLoadingHistory = false;
      state.chatError = null;
    },

    setLoadingHistory: (state, action: PayloadAction<boolean>) => {
      state.isLoadingHistory = action.payload;
      if (action.payload) {
        state.chatError = null;
      }
    },

    setChatError: (state, action: PayloadAction<string | null>) => {
      state.chatError = action.payload;
      state.isLoadingHistory = false;
    },

    addChatMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.chatHistory.push(action.payload);
    },

    clearChatHistory: (state) => {
      state.chatHistory = [];
      state.chatError = null;
    },

    // 🔄 Real-time Notification Actions (ADD TO REDUCERS)
    setUnreadCount: (
      state,
      action: PayloadAction<{ leadId: string; count: number }>
    ) => {
      const { leadId, count } = action.payload;
      if (count === 0) {
        delete state.unreadCounts[leadId];
      } else {
        state.unreadCounts[leadId] = count;
      }
    },

    setConnectionStatus: (state, action: PayloadAction<ConnectionStatus>) => {
      state.connectionStatus = action.payload;
      state.isConnected = action.payload === "connected";
    },

    updateUnreadCounts: (
      state,
      action: PayloadAction<{ [leadId: string]: number }>
    ) => {
      state.unreadCounts = { ...state.unreadCounts, ...action.payload };
    },

    clearUnreadCounts: (state) => {
      state.unreadCounts = {};
    },

    setPaginationTotalMessages: (state, action: PayloadAction<number>) => {
      state.chatPagination.totalMessages = action.payload;
    },

    setCurrentOffset: (state, action: PayloadAction<number>) => {
      state.chatPagination.currentOffset = action.payload;
    },

    setHasMoreMessages: (state, action: PayloadAction<boolean>) => {
      state.chatPagination.hasMoreMessages = action.payload;
    },

    setLoadingMore: (state, action: PayloadAction<boolean>) => {
      state.chatPagination.isLoadingMore = action.payload;
    },

    // 🆕 NEW: Enhanced Chat Actions for Pagination
    initializeChatHistory: (
      state,
      action: PayloadAction<{
        messages: ChatMessage[];
        totalMessages: number;
        messagesPerBatch: number;
      }>
    ) => {
      const { messages, totalMessages, messagesPerBatch } = action.payload;
      state.chatHistory = messages;
      state.chatPagination.totalMessages = totalMessages;
      state.chatPagination.currentOffset = messagesPerBatch;
      state.chatPagination.hasMoreMessages =
        messages.length >= messagesPerBatch;
      state.isLoadingHistory = false;
      state.chatError = null;
    },

    appendChatHistory: (
      state,
      action: PayloadAction<{
        messages: ChatMessage[];
        newOffset: number;
      }>
    ) => {
      const { messages, newOffset } = action.payload;
      // Prepend older messages to the beginning of the array
      state.chatHistory = [...messages, ...state.chatHistory];
      state.chatPagination.currentOffset = newOffset;
      state.chatPagination.hasMoreMessages =
        messages.length >= state.chatPagination.messagesPerBatch;
      state.chatPagination.isLoadingMore = false;
    },

    resetChatPagination: (state) => {
      state.chatHistory = [];
      state.chatPagination = {
        totalMessages: 0,
        currentOffset: 0,
        messagesPerBatch: 20,
        hasMoreMessages: true,
        isLoadingMore: false,
      };
      state.isLoadingHistory = false;
      state.chatError = null;
    },

    setNotificationHistoryFilters: (
      state,
      action: PayloadAction<Partial<NotificationHistoryFilters>>
    ) => {
      state.notificationHistoryFilters = {
        ...state.notificationHistoryFilters,
        ...action.payload,
      };
    },

    setNotificationHistoryDateFrom: (
      state,
      action: PayloadAction<string | undefined>
    ) => {
      state.notificationHistoryFilters.date_from = action.payload;
    },

    setNotificationHistoryDateTo: (
      state,
      action: PayloadAction<string | undefined>
    ) => {
      state.notificationHistoryFilters.date_to = action.payload;
    },

    setNotificationHistoryType: (
      state,
      action: PayloadAction<string | undefined>
    ) => {
      state.notificationHistoryFilters.notification_type = action.payload;
    },

    setNotificationHistorySearch: (
      state,
      action: PayloadAction<string | undefined>
    ) => {
      state.notificationHistoryFilters.search = action.payload;
    },

    clearNotificationHistoryFilters: (state) => {
      state.notificationHistoryFilters = {
        date_from: undefined,
        date_to: undefined,
        notification_type: undefined,
        search: undefined,
      };
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
  setBulkWhatsappStatusFilter,
  clearBulkWhatsappFilters,
  toggleLeadForBulkWhatsapp,
  selectAllLeadsForBulkWhatsapp,
  clearBulkWhatsappSelection,
  setBulkJobName,
  setBulkMessageType,
  setBulkSelectedTemplate,
  setBulkMessageContent,
  setBulkIsScheduled,
  setBulkScheduledDateTime,
  setBulkBatchSize,
  setBulkDelayBetweenMessages,
  setBulkLoading,
  setBulkError,
  setBulkWhatsappStageFilter,
  resetBulkWhatsappForm,
  setBulkWhatsappNameFilter,
  setChatHistory,
  setLoadingHistory,
  setChatError,
  addChatMessage,
  clearChatHistory,
  setUnreadCount,
  setConnectionStatus,
  updateUnreadCounts,
  clearUnreadCounts,
  setPaginationTotalMessages,
  setCurrentOffset,
  setHasMoreMessages,
  setLoadingMore,
  initializeChatHistory,
  appendChatHistory,
  resetChatPagination,
  setNotificationHistoryFilters,
  setNotificationHistoryDateFrom,
  setNotificationHistoryDateTo,
  setNotificationHistoryType,
  setNotificationHistorySearch,
  clearNotificationHistoryFilters,
} = whatsappSlice.actions;

export default whatsappSlice.reducer;
