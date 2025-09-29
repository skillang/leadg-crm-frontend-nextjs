// src/components/communication/whatsapp/WhatsAppButton.tsx
"use client";

import React from "react";
import { useSelector } from "react-redux";
import { useAppDispatch } from "@/redux/hooks";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { RootState } from "@/redux/store";
import { openModal } from "@/redux/slices/whatsappSlice";
import { useNotifications } from "@/components/common/NotificationSystem";
import useWhatsApp from "@/hooks/useWhatsApp";

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

interface WhatsAppButtonProps {
  lead: LeadData;
  user: UserData;
  className?: string;
  disabled?: boolean;
}

const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  lead,
  user,
  className = "",
  disabled = false,
}) => {
  const dispatch = useAppDispatch();
  const { showError } = useNotifications();
  const { isModalOpen } = useSelector((state: RootState) => state.whatsapp);

  // 🔄 NEW: Get real-time unread state
  const { getUnreadCount, hasUnreadMessages } = useWhatsApp();

  const unreadCount = getUnreadCount(lead.leadId);
  const hasUnread = hasUnreadMessages(lead.leadId);

  const handleClick = () => {
    if (!lead?.phoneNumber) {
      showError("No phone number available for this lead");
      return;
    }

    dispatch(openModal({ lead, user }));
  };

  // 🎨 Dynamic button styling based on unread status
  const getButtonStyles = () => {
    if (hasUnread) {
      // 🟢 GREEN: Has unread messages
      return "bg-green-600 hover:bg-green-700 border-green-600 shadow-green-200 shadow-lg";
    } else {
      // 🔘 GREY: No unread messages
      return "bg-blue-500 hover:bg-blue-600 border-blue-500";
    }
  };

  // 🎨 Dynamic icon color
  const getIconColor = () => {
    return hasUnread ? "text-white" : "text-gray-200";
  };

  return (
    <div className="relative">
      <Button
        onClick={handleClick}
        className={`${getButtonStyles()} text-white transition-all duration-200 ${className}`}
        disabled={disabled || !lead?.phoneNumber || isModalOpen}
      >
        <MessageCircle className={`mr-2 h-4 w-4 ${getIconColor()}`} />
        WhatsApp
      </Button>
      {unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs font-bold bg-red-500 hover:bg-red-500 border-white border-2"
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </Badge>
      )}
    </div>
  );
};

export default WhatsAppButton;
