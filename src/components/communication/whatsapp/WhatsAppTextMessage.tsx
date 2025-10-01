// src/components/whatsapp/WhatsAppTextMessage.tsx
"use client";

import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send } from "lucide-react";
import type { RootState } from "@/redux/store";
import { setSending, closeModal } from "@/redux/slices/whatsappSlice";
import { useSendTextMessageMutation } from "@/redux/slices/whatsappApi";
import { useNotifications } from "@/components/common/NotificationSystem";
import { useAppDispatch } from "@/redux/hooks";
import { ApiError } from "@/models/types/apiError";

const WhatsAppTextMessage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { showSuccess, showError } = useNotifications();
  const { isSending, currentLead } = useSelector(
    (state: RootState) => state.whatsapp
  );

  const [message, setMessage] = useState("");

  // Send text message mutation
  const [sendTextMessage] = useSendTextMessageMutation();

  const handleSend = async () => {
    if (!message.trim() || !currentLead?.phoneNumber) return;

    dispatch(setSending(true));
    try {
      await sendTextMessage({
        contact: currentLead.phoneNumber,
        message: message.trim(),
      }).unwrap();

      showSuccess("WhatsApp message sent successfully!");

      dispatch(closeModal());
    } catch (error: unknown) {
      // Type-safe error handling
      const apiError = error as ApiError;
      const errorMessage =
        apiError?.data?.detail ||
        apiError?.data?.message ||
        apiError?.message ||
        "Failed to send WhatsApp message. Please try again.";

      showError(errorMessage);
      console.error("Failed to send text message:", error);
    }
  };

  const isMessageValid = message.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Message Input */}
      <div className="space-y-2">
        <Label htmlFor="message">Your Message:</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your WhatsApp message here..."
          rows={6}
          className="resize-none"
          maxLength={4096}
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Plain text message</span>
          <span>{message.length}/4096</span>
        </div>
      </div>

      {/* Message Preview */}
      {message.trim() && (
        <div className="space-y-2">
          <Label>Preview:</Label>
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-4 rounded-lg">
            <div className="bg-background rounded-lg p-3 shadow-sm border-l-4 border-green-500">
              <p className="text-sm whitespace-pre-wrap">{message}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              This is how your message will appear in WhatsApp
            </p>
          </div>
        </div>
      )}

      {/* Send Button */}
      <div className="flex justify-end pt-4 border-t">
        <Button
          onClick={handleSend}
          disabled={!isMessageValid || isSending}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {isSending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Sending...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send Message
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default WhatsAppTextMessage;
