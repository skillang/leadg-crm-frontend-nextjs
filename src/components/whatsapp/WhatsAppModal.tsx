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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { X, MessageSquare, FileText, File } from "lucide-react";
import type { RootState } from "@/redux/store";
import {
  closeModal,
  setMessageType,
  type MessageType,
} from "@/redux/slices/whatsappSlice";
import {
  useCheckAccountStatusQuery,
  useValidateContactMutation,
} from "@/redux/slices/whatsappApi";
import WhatsAppTextMessage from "./WhatsAppTextMessage";
import WhatsAppTemplateMessage from "./WhatsAppTemplateMessage";
import ContactValidator from "./ContactValidator";

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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-xl font-semibold flex items-center">
            <MessageSquare className="mr-2 h-5 w-5 text-green-600" />
            WhatsApp Message
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6">
          {/* Lead Information */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-medium text-foreground mb-2">Sending to:</h3>
            <div className="space-y-1">
              <p className="text-sm">
                <span className="font-medium">Name:</span> {currentLead.name}
              </p>
              <p className="text-sm">
                <span className="font-medium">Phone:</span>{" "}
                {currentLead.phoneNumber || "No phone number"}
              </p>
              <p className="text-sm">
                <span className="font-medium">Lead ID:</span>{" "}
                {currentLead.leadId}
              </p>
            </div>
          </div>

          {/* Contact Validation */}
          <ContactValidator />

          {/* Account Status Check */}
          {isCheckingStatus ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">
                Checking WhatsApp account status...
              </p>
            </div>
          ) : accountStatus ? (
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-3 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-300">
                ✓ WhatsApp account is active and ready
              </p>
            </div>
          ) : (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-3 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">
                ⚠ WhatsApp account status unknown
              </p>
            </div>
          )}

          {/* Message Type Selection */}
          <div className="space-y-4">
            <h3 className="font-medium text-foreground">
              Select Message Type:
            </h3>
            <RadioGroup
              value={messageType}
              onValueChange={handleMessageTypeChange}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="text" id="text" />
                <Label
                  htmlFor="text"
                  className="flex items-center cursor-pointer"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Send Text Message
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="template" id="template" />
                <Label
                  htmlFor="template"
                  className="flex items-center cursor-pointer"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Send Template Message
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="document" id="document" disabled />
                <Label
                  htmlFor="document"
                  className="flex items-center cursor-pointer opacity-50"
                >
                  <File className="mr-2 h-4 w-4" />
                  Send Document (Coming Soon)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Message Type Content */}
          {contactValidation.isValid && renderMessageTypeContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WhatsAppModal;
