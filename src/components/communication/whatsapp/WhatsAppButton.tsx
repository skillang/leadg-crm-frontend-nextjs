// src/components/whatsapp/WhatsAppButton.tsx
"use client";

import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import type { RootState } from "@/redux/store";
import { openModal } from "@/redux/slices/whatsappSlice";
import { useNotifications } from "@/components/common/NotificationSystem";

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
  const dispatch = useDispatch();
  const { showError } = useNotifications();
  const { isModalOpen } = useSelector((state: RootState) => state.whatsapp);

  const handleClick = () => {
    if (!lead?.phoneNumber) {
      showError("No phone number available for this lead");
      return;
    }

    dispatch(openModal({ lead, user }));
  };

  return (
    <Button
      onClick={handleClick}
      className={`bg-green-600 hover:bg-green-700 text-white ${className}`}
      disabled={disabled || !lead?.phoneNumber || isModalOpen}
    >
      <Phone className="mr-2 h-4 w-4" />
      WhatsApp
    </Button>
  );
};

export default WhatsAppButton;
