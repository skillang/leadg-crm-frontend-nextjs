// components/leads/BulkLeadButton.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { useAuth } from "@/redux/hooks/useAuth";
import BulkLeadCreation from "./BulkLeadCreation";

interface BulkLeadButtonProps {
  variant?: "default" | "outline";
  size?: "sm" | "default" | "lg";
  className?: string;
}

const BulkLeadButton: React.FC<BulkLeadButtonProps> = ({
  variant = "outline",
  size = "default",
  className = "",
}) => {
  const { isAdmin } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Only show for admin users
  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setIsModalOpen(true)}
      >
        <Users className="w-4 h-4 mr-2" />
        Bulk Create Leads
      </Button>

      <BulkLeadCreation
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default BulkLeadButton;
