// src/components/whatsapp/WhatsAppModal.tsx
"use client";

import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  X,
  MessageSquare,
  FileText,
  File,
  Info,
  Send,
  Users,
} from "lucide-react";
import type { RootState } from "@/redux/store";
import { closeModal, setMessageType } from "@/redux/slices/whatsappSlice";
import {
  useCheckAccountStatusQuery,
  useValidateContactMutation,
} from "@/redux/slices/whatsappApi";
import WhatsAppTextMessage from "./WhatsAppTextMessage";
import WhatsAppTemplateMessage from "./WhatsAppTemplateMessage";
import ContactValidator from "./ContactValidator";
import { MessageType } from "@/models/types/whatsapp";

const WhatsAppModal: React.FC = () => {
  const dispatch = useDispatch();
  const { isModalOpen, messageType, currentLead, contactValidation } =
    useSelector((state: RootState) => state.whatsapp);

  // Check WhatsApp account status
  const { data: accountStatus, isLoading: isCheckingStatus } =
    useCheckAccountStatusQuery();

  // Contact validation mutation
  const [validateContact] = useValidateContactMutation();

  const handleClose = () => {
    dispatch(closeModal());
  };

  const handleMessageTypeChange = (value: MessageType) => {
    dispatch(setMessageType(value));
  };

  // Validate contact when modal opens
  useEffect(() => {
    if (isModalOpen && currentLead?.phoneNumber) {
      validateContact(currentLead.phoneNumber);
    }
  }, [isModalOpen, currentLead?.phoneNumber, validateContact]);

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
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0"
          ></Button>
        </DialogHeader>

        <Tabs defaultValue="basic-info" className="w-full">
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
              value="bulk-send"
              className="flex items-center gap-1 md:gap-2"
              disabled
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
              {/* Connection Check */}
              {!contactValidation.isValid ? (
                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-300 mb-2 flex items-center">
                    <X className="mr-2 h-4 w-4" />
                    Contact validation required
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    Please check the &quot;Basic Info&quot; tab to wait for
                    contact before sending messages.
                  </p>
                </div>
              ) : (
                <>
                  {/* Message Type Selection */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-foreground flex items-center">
                      <Send className="mr-2 h-4 w-4" />
                      Select Message Type
                    </h3>
                    <RadioGroup
                      value={messageType}
                      onValueChange={handleMessageTypeChange}
                      className="grid grid-cols-1 gap-3"
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
                      <div className="flex items-center space-x-3 p-3 border rounded-lg opacity-50">
                        <RadioGroupItem
                          value="document"
                          id="document"
                          disabled
                        />
                        <Label
                          htmlFor="document"
                          className="flex items-center cursor-pointer flex-1"
                        >
                          <File className="mr-3 h-4 w-4 text-gray-400" />
                          <div>
                            <p className="font-medium">Document Message</p>
                            <p className="text-sm text-muted-foreground">
                              Send files and documents (Coming Soon)
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
                </>
              )}
            </TabsContent>

            {/* Bulk Send Tab (Coming Soon) */}
            <TabsContent value="bulk-send" className="space-y-6 mt-0">
              <div className="text-center py-12 text-muted-foreground">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-8 border-2 border-dashed border-gray-200 dark:border-gray-700">
                  <Users className="mx-auto h-16 w-16 mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">Bulk Messaging</h3>
                  <p className="text-sm max-w-md mx-auto mb-4">
                    Send WhatsApp messages to multiple leads simultaneously.
                    Perfect for campaigns, announcements, and bulk
                    communications.
                  </p>
                  <div className="space-y-2 text-xs text-muted-foreground max-w-sm mx-auto">
                    <p>• Send to multiple contacts at once</p>
                    <p>• Template-based bulk messaging</p>
                    <p>• Campaign tracking and analytics</p>
                    <p>• Delivery status monitoring</p>
                  </div>
                  <div className="mt-6">
                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                      Coming Soon
                    </span>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default WhatsAppModal;
