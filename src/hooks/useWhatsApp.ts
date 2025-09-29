// src/hooks/useWhatsApp.ts
import { useSelector } from "react-redux";
import { useCallback } from "react";
import type { RootState } from "@/redux/store";
import {
  openModal,
  closeModal,
  setMessageType,
  setSelectedTemplate,
  setTemplateParameter,
  setPreviewMode,
  // 💬 NEW: Chat actions
  setChatHistory,
  setLoadingHistory,
  setChatError,
  addChatMessage,
  clearChatHistory,
  // setPaginationTotalMessages,
  // setCurrentOffset,
  // setHasMoreMessages,
  setLoadingMore,
  initializeChatHistory,
  appendChatHistory,
  resetChatPagination,
  // 🔄 NEW: Real-time actions
  setUnreadCount,
  // setConnectionStatus,
  // updateUnreadCounts,
  // clearUnreadCounts,
} from "@/redux/slices/whatsappSlice";
import {
  type MessageType,
  // 💬 NEW: Chat types
  type ChatMessage,
  type ChatHistoryResponse,
  type SendChatMessageRequest,
  // type SendChatMessageResponse,
  type ConnectionStatus,
  type MessageStatus,
} from "@/models/types/whatsapp";
import {
  useCheckAccountStatusQuery,
  useValidateContactMutation,
  useGetTemplatesQuery,
  useSendTemplateMutation,
  useSendTextMessageMutation,
  // 💬 NEW: Chat API hooks
  useSendChatMessageMutation,
  // useGetActiveChatsQuery,
  useLazyLoadMoreChatHistoryQuery,
} from "@/redux/slices/whatsappApi";
import {
  formatPhoneNumber,
  isValidPhoneNumber,
  type LeadData,
  type UserData,
  type WhatsAppTemplate,
  type TemplateParameters,
  type AccountStatusResponse,
  type ContactValidationResponse,
  type SendTemplateResponse,
  type SendTextResponse,
} from "@/models/types/whatsapp";
import { useAppDispatch } from "@/redux/hooks";

interface UseWhatsAppReturn {
  // Existing state
  isModalOpen: boolean;
  messageType: MessageType;
  contactValidation: {
    isValid: boolean | null;
    isValidating: boolean;
    error: string | null;
  };
  selectedTemplate: string | null;
  templateParameters: TemplateParameters;
  isPreviewMode: boolean;
  isSending: boolean;
  currentLead: LeadData | null;
  currentUser: UserData | null;
  accountStatus: AccountStatusResponse | undefined;
  templates: WhatsAppTemplate[] | undefined;

  // 💬 NEW: Chat state
  chatHistory: ChatMessage[];
  isLoadingHistory: boolean;
  chatError: string | null;

  chatPagination: {
    totalMessages: number;
    currentOffset: number;
    messagesPerBatch: number;
    hasMoreMessages: boolean;
    isLoadingMore: boolean;
  };

  // 🔄 NEW: Real-time state
  unreadCounts: { [leadId: string]: number };
  connectionStatus: ConnectionStatus;
  isConnected: boolean;

  // Loading states
  isCheckingStatus: boolean;
  isLoadingTemplates: boolean;
  isSendingTemplate: boolean;
  isSendingText: boolean;
  isSendingChatMessage: boolean;

  // Existing actions
  openWhatsAppModal: (lead: LeadData, user: UserData) => void;
  closeWhatsAppModal: () => void;
  changeMessageType: (type: MessageType) => void;
  selectTemplate: (templateName: string) => void;
  updateTemplateParameter: (key: string, value: string) => void;
  togglePreview: () => void;

  // 💬 NEW: Chat actions
  loadChatHistory: (leadId: string, autoMarkRead?: boolean) => Promise<void>;
  sendChatMessage: (leadId: string, message: string) => Promise<void>;
  refreshChatHistory: (leadId: string) => void;
  clearChat: () => void;

  loadMoreMessages: (leadId: string) => Promise<void>;
  resetChatPagination: () => void;
  initializeChat: (leadId: string) => Promise<void>;

  // 🔄 NEW: Real-time actions
  updateUnreadCount: (leadId: string, count: number) => void;
  markLeadAsRead: (leadId: string) => void;
  getUnreadCount: (leadId: string) => number;
  hasUnreadMessages: (leadId: string) => boolean;

  // Existing API calls
  validatePhoneNumber: (
    phoneNumber: string
  ) => Promise<ContactValidationResponse>;
  sendWhatsAppTemplate: (
    templateName: string,
    contact: string,
    leadName: string,
    parameters?: Record<string, string>
  ) => Promise<SendTemplateResponse>;
  sendWhatsAppText: (
    contact: string,
    message: string
  ) => Promise<SendTextResponse>;

  // Existing helper functions
  canSendMessage: () => boolean;
  getSelectedTemplateData: () => WhatsAppTemplate | null;
  areAllParametersFilled: () => boolean;
  autoFillParameters: (templateName: string) => void;
}

const useWhatsApp = (): UseWhatsAppReturn => {
  const dispatch = useAppDispatch();
  const whatsappState = useSelector((state: RootState) => state.whatsapp);

  // Existing RTK Query hooks
  const { data: accountStatus, isLoading: isCheckingStatus } =
    useCheckAccountStatusQuery();
  const { data: templates, isLoading: isLoadingTemplates } =
    useGetTemplatesQuery();
  const [validateContact] = useValidateContactMutation();
  const [sendTemplate, { isLoading: isSendingTemplate }] =
    useSendTemplateMutation();
  const [sendTextMessage, { isLoading: isSendingText }] =
    useSendTextMessageMutation();
  const [triggerLoadMore] = useLazyLoadMoreChatHistoryQuery();

  // 💬 NEW: Chat RTK Query hooks
  const [sendChatMessageMutation, { isLoading: isSendingChatMessage }] =
    useSendChatMessageMutation();

  // Existing modal actions
  const openWhatsAppModal = useCallback(
    (lead: LeadData, user: UserData) => {
      if (!lead?.phoneNumber) {
        throw new Error(
          "Lead must have a phone number to send WhatsApp messages"
        );
      }
      dispatch(openModal({ lead, user }));
    },
    [dispatch]
  );

  const closeWhatsAppModal = useCallback(() => {
    dispatch(closeModal());
    // Clear chat history when modal closes
    dispatch(clearChatHistory());
  }, [dispatch]);

  // Existing message type actions
  const changeMessageType = useCallback(
    (type: MessageType) => {
      dispatch(setMessageType(type));
    },
    [dispatch]
  );

  // Existing template actions
  const selectTemplate = useCallback(
    (templateName: string) => {
      dispatch(setSelectedTemplate(templateName));
    },
    [dispatch]
  );

  const updateTemplateParameter = useCallback(
    (key: string, value: string) => {
      dispatch(setTemplateParameter({ key, value }));
    },
    [dispatch]
  );

  const togglePreview = useCallback(() => {
    dispatch(setPreviewMode(!whatsappState.isPreviewMode));
  }, [dispatch, whatsappState.isPreviewMode]);

  // 💬 NEW: Chat history functions
  const loadChatHistory = useCallback(
    async (leadId: string, autoMarkRead = true): Promise<void> => {
      try {
        dispatch(setLoadingHistory(true));
        dispatch(setChatError(null));

        // Get auth token from localStorage or Redux state
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Authentication required");
        }
        const API_BASE_URL =
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

        // Use RTK Query to fetch chat history
        const response = await fetch(
          `${API_BASE_URL}/whatsapp/lead-messages/${leadId}?auto_mark_read=${autoMarkRead}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to load chat history");
        }

        const data: ChatHistoryResponse = await response.json();

        if (data.success) {
          dispatch(setChatHistory(data.messages));

          // Update unread count
          dispatch(
            setUnreadCount({
              leadId,
              count: data.unread_count,
            })
          );
        } else {
          throw new Error("Failed to load chat history");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to load chat history";
        console.error("Error loading chat history:", error);
        dispatch(setChatError(errorMessage));
      } finally {
        dispatch(setLoadingHistory(false));
      }
    },
    [dispatch]
  );

  const initializeChat = useCallback(
    async (leadId: string): Promise<void> => {
      try {
        dispatch(setLoadingHistory(true));
        dispatch(setChatError(null));
        dispatch(resetChatPagination());

        // This will use the existing useGetChatHistoryQuery logic
        // but we need to handle it manually here for initialization
        const result = await triggerLoadMore({
          leadId,
          limit: whatsappState.chatPagination.messagesPerBatch,
          offset: 0,
          autoMarkRead: true,
        }).unwrap();

        if (result.success) {
          dispatch(
            initializeChatHistory({
              messages: result.messages,
              totalMessages: result.total_messages,
              messagesPerBatch: whatsappState.chatPagination.messagesPerBatch,
            })
          );

          dispatch(
            setUnreadCount({
              leadId,
              count: result.unread_count,
            })
          );
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to load chat history";
        dispatch(setChatError(errorMessage));
        dispatch(setLoadingHistory(false));
      }
    },
    [dispatch, triggerLoadMore, whatsappState.chatPagination.messagesPerBatch]
  );

  // 🆕 NEW: Load more messages function
  const loadMoreMessages = useCallback(
    async (leadId: string): Promise<void> => {
      if (
        whatsappState.chatPagination.isLoadingMore ||
        !whatsappState.chatPagination.hasMoreMessages
      ) {
        return;
      }

      try {
        dispatch(setLoadingMore(true));

        const result = await triggerLoadMore({
          leadId,
          limit: whatsappState.chatPagination.messagesPerBatch,
          offset: whatsappState.chatPagination.currentOffset,
          autoMarkRead: false, // Don't mark as read when loading more
        }).unwrap();

        if (result.success) {
          dispatch(
            appendChatHistory({
              messages: result.messages,
              newOffset:
                whatsappState.chatPagination.currentOffset +
                whatsappState.chatPagination.messagesPerBatch,
            })
          );
        }
      } catch (error) {
        console.error("Failed to load more messages:", error);
        dispatch(setLoadingMore(false));
      }
    },
    [dispatch, triggerLoadMore, whatsappState.chatPagination]
  );

  // 🆕 NEW: Reset pagination
  const resetChatPaginationHandler = useCallback(() => {
    dispatch(resetChatPagination());
  }, [dispatch]);

  const sendChatMessageHandler = useCallback(
    async (leadId: string, message: string): Promise<void> => {
      if (!message?.trim()) {
        throw new Error("Message cannot be empty");
      }

      try {
        const request: SendChatMessageRequest = { message: message.trim() };

        const result = await sendChatMessageMutation({
          leadId,
          request,
        }).unwrap();

        if (result.success) {
          // Add message to local chat history
          const newMessage: ChatMessage = {
            id: result.message_id || `temp_${Date.now()}`,
            message_id: result.message_id || `temp_${Date.now()}`,
            direction: "outgoing",
            message_type: "text",
            content: message.trim(),
            timestamp: result.timestamp || new Date().toISOString(),
            status: (result.status as MessageStatus) || "sent",
            is_read: true,
            sent_by_name: whatsappState.currentUser
              ? `${whatsappState.currentUser.firstName} ${whatsappState.currentUser.lastName}`
              : "You",
          };

          dispatch(addChatMessage(newMessage));
        } else {
          throw new Error("Failed to send message");
        }
      } catch (error) {
        console.error("Failed to send chat message:", error);
        throw error;
      }
    },
    [sendChatMessageMutation, dispatch, whatsappState.currentUser]
  );

  const refreshChatHistory = useCallback(
    (leadId: string) => {
      loadChatHistory(leadId, false); // Don't auto-mark as read on refresh
    },
    [loadChatHistory]
  );

  const clearChat = useCallback(() => {
    dispatch(clearChatHistory());
  }, [dispatch]);

  // 🔄 NEW: Real-time notification functions
  const updateUnreadCount = useCallback(
    (leadId: string, count: number) => {
      dispatch(setUnreadCount({ leadId, count }));
    },
    [dispatch]
  );

  const markLeadAsRead = useCallback(
    (leadId: string) => {
      dispatch(setUnreadCount({ leadId, count: 0 }));
    },
    [dispatch]
  );

  const getUnreadCount = useCallback(
    (leadId: string): number => {
      return whatsappState.unreadCounts[leadId] || 0;
    },
    [whatsappState.unreadCounts]
  );

  const hasUnreadMessages = useCallback(
    (leadId: string): boolean => {
      return getUnreadCount(leadId) > 0;
    },
    [getUnreadCount]
  );

  // Existing contact validation
  const validatePhoneNumber = useCallback(
    async (phoneNumber: string): Promise<ContactValidationResponse> => {
      if (!phoneNumber) {
        throw new Error("Phone number is required");
      }

      const formattedNumber = formatPhoneNumber(phoneNumber);
      if (!isValidPhoneNumber(formattedNumber)) {
        throw new Error("Invalid phone number format");
      }

      try {
        const result = await validateContact(formattedNumber).unwrap();
        return result;
      } catch (error) {
        console.error("Contact validation failed:", error);
        throw error;
      }
    },
    [validateContact]
  );

  // Existing send messages
  const sendWhatsAppTemplate = useCallback(
    async (
      templateName: string,
      contact: string,
      leadName: string,
      parameters: Record<string, string> = {}
    ): Promise<SendTemplateResponse> => {
      try {
        const result = await sendTemplate({
          template_name: templateName,
          contact: formatPhoneNumber(contact),
          lead_name: leadName,
          ...parameters,
        }).unwrap();
        return result;
      } catch (error) {
        console.error("Failed to send template message:", error);
        throw error;
      }
    },
    [sendTemplate]
  );

  const sendWhatsAppText = useCallback(
    async (contact: string, message: string): Promise<SendTextResponse> => {
      if (!message?.trim()) {
        throw new Error("Message cannot be empty");
      }

      try {
        const result = await sendTextMessage({
          contact: formatPhoneNumber(contact),
          message: message.trim(),
        }).unwrap();
        return result;
      } catch (error) {
        console.error("Failed to send text message:", error);
        throw error;
      }
    },
    [sendTextMessage]
  );

  // Existing helper functions
  const canSendMessage = useCallback((): boolean => {
    return !!(
      whatsappState.currentLead?.phoneNumber &&
      whatsappState.contactValidation.isValid &&
      !whatsappState.isSending
    );
  }, [whatsappState]);

  const getSelectedTemplateData = useCallback((): WhatsAppTemplate | null => {
    if (!whatsappState.selectedTemplate || !templates) return null;
    return (
      templates.find((t) => t.name === whatsappState.selectedTemplate) || null
    );
  }, [whatsappState.selectedTemplate, templates]);

  const areAllParametersFilled = useCallback((): boolean => {
    const templateData = getSelectedTemplateData();
    if (!templateData || !templateData.parameters) return false;

    return templateData.parameters.every((param) =>
      whatsappState.templateParameters[param]?.trim()
    );
  }, [getSelectedTemplateData, whatsappState.templateParameters]);

  // Auto-fill parameters for templates
  const autoFillParameters = useCallback(
    (templateName: string) => {
      const template = templates?.find((t) => t.name === templateName);
      if (!template || !whatsappState.currentLead || !whatsappState.currentUser)
        return;

      const autoParams: Record<string, string> = {};

      if (template.parameters?.includes("lead_name")) {
        autoParams.lead_name = whatsappState.currentLead.name;
      }

      if (template.parameters?.includes("agent_name")) {
        const user = whatsappState.currentUser;
        autoParams.agent_name = `${user.firstName} ${user.lastName}`;
      }

      // Only fill empty parameters
      Object.keys(autoParams).forEach((key) => {
        if (!whatsappState.templateParameters[key]) {
          dispatch(setTemplateParameter({ key, value: autoParams[key] }));
        }
      });
    },
    [templates, whatsappState, dispatch]
  );

  return {
    // Existing state
    ...whatsappState,
    accountStatus,
    templates,

    // Loading states
    isCheckingStatus,
    isLoadingTemplates,
    isSendingTemplate,
    isSendingText,
    isSendingChatMessage,

    // Existing actions
    openWhatsAppModal,
    closeWhatsAppModal,
    changeMessageType,
    selectTemplate,
    updateTemplateParameter,
    togglePreview,
    loadMoreMessages,
    // 💬 NEW: Chat actions
    loadChatHistory,
    sendChatMessage: sendChatMessageHandler,
    refreshChatHistory,
    clearChat,

    // 🔄 NEW: Real-time actions
    updateUnreadCount,
    markLeadAsRead,
    getUnreadCount,
    hasUnreadMessages,

    // Existing API calls
    validatePhoneNumber,
    sendWhatsAppTemplate,
    sendWhatsAppText,

    // Existing helper functions
    canSendMessage,
    getSelectedTemplateData,
    areAllParametersFilled,
    autoFillParameters,
    chatPagination: whatsappState.chatPagination,
    resetChatPagination: resetChatPaginationHandler,
    initializeChat,
  };
};

export default useWhatsApp;
