// components/leads/NewLeadDropdown.tsx (Fixed)

import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Plus, User, Users, ChevronDown, FileText } from "lucide-react";
import { useAuth } from "@/redux/hooks/useAuth";
import SingleLeadModal from "./SingleLeadModal";
import BulkLeadCreation from "./BulkLeadCreation";
import { useNotifications } from "@/components/common/NotificationSystem";
import SingleLeadCreationCVModal from "./SingleLeadCreationCV";

const NewLeadDropdown: React.FC = () => {
  // 🔥 UPDATED: Use permission hooks instead of isAdmin
  const { canCreateSingleLead, canCreateBulkLeads } = useAuth();
  const [isSingleLeadModalOpen, setIsSingleLeadModalOpen] = useState(false);
  const [isBulkLeadModalOpen, setIsBulkLeadModalOpen] = useState(false);
  const [isCVToLeadModalOpen, setIsCVToLeadModalOpen] = useState(false); // ✅ FIXED: Consistent naming
  const { showWarning, showSuccess } = useNotifications();

  // 🔥 NEW: Handle single lead creation with permission check
  const handleSingleLeadClick = () => {
    if (canCreateSingleLead) {
      setIsSingleLeadModalOpen(true);
    } else {
      showWarning(
        "You don't have permission to create single leads. Please contact your administrator.",
        "Permission Required"
      );
    }
  };

  // 🔥 NEW: Handle bulk lead creation with permission check
  const handleBulkLeadClick = () => {
    if (canCreateBulkLeads) {
      setIsBulkLeadModalOpen(true);
    } else {
      showWarning(
        "You don't have permission to create bulk leads. Please contact your administrator.",
        "Permission Required"
      );
    }
  };

  // ✅ NEW: Handle CV to lead creation with permission check
  const handleCVToLeadClick = () => {
    if (canCreateSingleLead) {
      // Using same permission as single lead
      setIsCVToLeadModalOpen(true);
    } else {
      showWarning(
        "You don't have permission to upload CVs and create leads. Please contact your administrator.",
        "Permission Required"
      );
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={"outline-primary"}>
            <Plus className="w-4 h-4" />
            Add Lead
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleSingleLeadClick}>
            <User className="w-4 h-4" />
            Single Lead
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleBulkLeadClick}>
            <Users className="w-4 h-4" />
            Bulk Create Leads
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          {/* ✅ FIXED: Now uses the correct handler */}
          <DropdownMenuItem onClick={handleCVToLeadClick}>
            <FileText className="w-4 h-4" />
            Upload CV to Leads
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Single Lead Modal */}
      <SingleLeadModal
        isOpen={isSingleLeadModalOpen}
        onClose={() => setIsSingleLeadModalOpen(false)}
      />

      {/* Bulk Lead Modal */}
      <BulkLeadCreation
        isOpen={isBulkLeadModalOpen}
        onClose={() => setIsBulkLeadModalOpen(false)}
      />

      {/* ✅ FIXED: Now uses the correct modal component with proper props */}
      <SingleLeadCreationCVModal
        isOpen={isCVToLeadModalOpen}
        onClose={() => setIsCVToLeadModalOpen(false)}
        onLeadCreated={(leadId: string) => {
          showSuccess(`Lead id is ${leadId}`, "Leads Created Successfully");
          // Add any additional logic here like refreshing leads list
        }}
      />
    </>
  );
};

export default NewLeadDropdown;
