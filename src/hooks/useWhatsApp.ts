// src/hooks/useWhatsApp.ts
import { useSelector, useDispatch } from "react-redux";
import { useCallback } from "react";
import type { RootState } from "@/redux/store";
import {
  openModal,
  closeModal,
  setMessageType,
  setSelectedTemplate,
  setTemplateParameter,
  setPreviewMode,
} from "@/redux/slices/whatsappSlice";
import { type MessageType } from "@/models/types/whatsapp";
import {
  useCheckAccountStatusQuery,
  useValidateContactMutation,
  useGetTemplatesQuery,
  useSendTemplateMutation,
  useSendTextMessageMutation,
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

interface UseWhatsAppReturn {
  // State
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

  // Loading states
  isCheckingStatus: boolean;
  isLoadingTemplates: boolean;
  isSendingTemplate: boolean;
  isSendingText: boolean;

  // Actions
  openWhatsAppModal: (lead: LeadData, user: UserData) => void;
  closeWhatsAppModal: () => void;
  changeMessageType: (type: MessageType) => void;
  selectTemplate: (templateName: string) => void;
  updateTemplateParameter: (key: string, value: string) => void;
  togglePreview: () => void;

  // API calls
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

  // Helper functions
  canSendMessage: () => boolean;
  getSelectedTemplateData: () => WhatsAppTemplate | null;
  areAllParametersFilled: () => boolean;
  autoFillParameters: (templateName: string) => void;
}

const useWhatsApp = (): UseWhatsAppReturn => {
  const dispatch = useDispatch();
  const whatsappState = useSelector((state: RootState) => state.whatsapp);

  // RTK Query hooks
  const { data: accountStatus, isLoading: isCheckingStatus } =
    useCheckAccountStatusQuery();
  const { data: templates, isLoading: isLoadingTemplates } =
    useGetTemplatesQuery();
  const [validateContact] = useValidateContactMutation();
  const [sendTemplate, { isLoading: isSendingTemplate }] =
    useSendTemplateMutation();
  const [sendTextMessage, { isLoading: isSendingText }] =
    useSendTextMessageMutation();

  // Modal actions
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
  }, [dispatch]);

  // Message type actions
  const changeMessageType = useCallback(
    (type: MessageType) => {
      dispatch(setMessageType(type));
    },
    [dispatch]
  );

  // Template actions
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

  // Contact validation
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

  // Send messages
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

  // Helper functions
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
    // State
    ...whatsappState,
    accountStatus,
    templates,
    // Loading states
    isCheckingStatus,
    isLoadingTemplates,
    isSendingTemplate,
    isSendingText,

    // Actions
    openWhatsAppModal,
    closeWhatsAppModal,
    changeMessageType,
    selectTemplate,
    updateTemplateParameter,
    togglePreview,

    // API calls
    validatePhoneNumber,
    sendWhatsAppTemplate,
    sendWhatsAppText,

    // Helper functions
    canSendMessage,
    getSelectedTemplateData,
    areAllParametersFilled,
    autoFillParameters,
  };
};

export default useWhatsApp;
