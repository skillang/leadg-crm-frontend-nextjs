// src/components/whatsapp/WhatsAppModal.tsx
"use client";

import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useAppDispatch } from "@/redux/hooks";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { MessageSquare, FileText, File, Info, Send, Users } from "lucide-react";
import type { RootState } from "@/redux/store";
import { closeModal, setMessageType } from "@/redux/slices/whatsappSlice";
import { useCheckAccountStatusQuery } from "@/redux/slices/whatsappApi";
import WhatsAppTextMessage from "./WhatsAppTextMessage";
import WhatsAppTemplateMessage from "./WhatsAppTemplateMessage";
import ContactValidator from "./ContactValidator";
import ChatHistoryTab from "./ChatHistoryTab"; // Import the new component
import { MessageType } from "@/models/types/whatsapp";

const WhatsAppModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isModalOpen, messageType, currentLead } = useSelector(
    (state: RootState) => state.whatsapp
  );

  // Check WhatsApp account status
  const { data: accountStatus, isLoading: isCheckingStatus } =
    useCheckAccountStatusQuery();

  const handleClose = () => {
    dispatch(closeModal());
  };

  const handleMessageTypeChange = (value: MessageType) => {
    dispatch(setMessageType(value));
  };

  useEffect(() => {
    if (isModalOpen) {
      // Reset validation state when modal opens
      dispatch({ type: "whatsapp/resetContactValidation" });
    }
  }, [isModalOpen, dispatch]);

  if (!isModalOpen || !currentLead) {
    return null;
  }

  const renderMessageTypeContent = () => {
    switch (messageType) {
      case "text":
        return <WhatsAppTextMessage />;
      case "template":
        return <WhatsAppTemplateMessage />;
      case "document":
        return (
          <div className="text-center py-8 text-muted-foreground">
            <File className="mx-auto h-12 w-12 mb-4" />
            <p>Document sending feature coming soon!</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-xl font-semibold flex items-center">
            <MessageSquare className="mr-2 h-5 w-5 text-green-600" />
            WhatsApp Communication
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="send-message" className="w-full">
          <TabsList className="grid w-full grid-cols-3 p-0">
            <TabsTrigger
              value="basic-info"
              className="flex items-center gap-1 md:gap-2"
            >
              <Info className="h-4 w-4" />
              Info
            </TabsTrigger>
            <TabsTrigger
              value="send-message"
              className="flex items-center gap-1 md:gap-2"
            >
              <Send className="h-2 w-2 md:h-4 md:w-4" />
              Send Mssg
            </TabsTrigger>
            <TabsTrigger
              value="chat-history"
              className="flex items-center gap-1 md:gap-2"
            >
              <Users className="h-4 w-4" />
              Mssg History
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            {/* Basic Info Tab */}
            <TabsContent value="basic-info" className="space-y-6 mt-0">
              {/* Lead Information */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-medium text-foreground mb-3 flex items-center">
                  <Info className="mr-2 h-4 w-4" />
                  Lead Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Name
                    </p>
                    <p className="text-sm font-semibold">{currentLead.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Phone Number
                    </p>
                    <p className="text-sm font-semibold">
                      {currentLead.phoneNumber || "No phone number"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Lead ID
                    </p>
                    <p className="text-sm font-semibold">
                      {currentLead.leadId}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Email
                    </p>
                    <p className="text-sm font-semibold">
                      {currentLead.email || "No email provided"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Validation */}
              <div>
                <h3 className="font-medium text-foreground mb-3 flex items-center">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  WhatsApp Connectivity
                </h3>
                <ContactValidator />
              </div>

              {/* Account Status Check */}
              <div>
                <h3 className="font-medium text-foreground mb-3">
                  Account Status
                </h3>
                {isCheckingStatus ? (
                  <div className="flex items-center py-4 px-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Checking WhatsApp account status...
                    </p>
                  </div>
                ) : accountStatus ? (
                  <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-4 rounded-lg">
                    <div className="text-sm text-green-700 dark:text-green-300 flex items-center">
                      <p className="h-2 w-2 bg-green-500 rounded-full mr-2"></p>
                      WhatsApp account is active and ready to send messages
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-300 flex items-center">
                      <div className="h-2 w-2 bg-red-500 rounded-full mr-2"></div>
                      WhatsApp account status unknown - please check
                      configuration
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Send Message Tab */}
            <TabsContent value="send-message" className="space-y-6 mt-0">
              {/* Message Type Selection */}
              <div className="space-y-4">
                <h3 className="font-medium text-foreground flex items-center">
                  <Send className="mr-2 h-4 w-4" />
                  Select Message Type
                </h3>
                <RadioGroup
                  value={messageType}
                  onValueChange={handleMessageTypeChange}
                  className="grid md:grid-cols-2 grid-cols-1 gap-3"
                >
                  <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="text" id="text" />
                    <Label
                      htmlFor="text"
                      className="flex items-center cursor-pointer flex-1"
                    >
                      <MessageSquare className="mr-3 h-4 w-4 text-blue-600" />
                      <div>
                        <p className="font-medium">Text Message</p>
                        <p className="text-sm text-muted-foreground">
                          Send a custom text message
                        </p>
                        <p className="text-xs text-muted-foreground">
                          (Channel is open only when the customer texts first in
                          the past 24 hours)
                        </p>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="template" id="template" />
                    <Label
                      htmlFor="template"
                      className="flex items-center cursor-pointer flex-1"
                    >
                      <FileText className="mr-3 h-4 w-4 text-purple-600" />
                      <div>
                        <p className="font-medium">Template Message</p>
                        <p className="text-sm text-muted-foreground">
                          Use pre-approved templates
                        </p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Message Content */}
              {messageType && (
                <div className="border-t pt-6">
                  {renderMessageTypeContent()}
                </div>
              )}
            </TabsContent>

            {/* Chat History Tab - Now using separate component */}
            <TabsContent value="chat-history" className="space-y-6 mt-0">
              <ChatHistoryTab />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default WhatsAppModal;
