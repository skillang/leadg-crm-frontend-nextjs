// components/leads/NewLeadDropdown.tsx (Updated with Permissions)

import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Plus, User, Users, ChevronDown } from "lucide-react";
import { useAuth } from "@/redux/hooks/useAuth";
import SingleLeadModal from "./SingleLeadModal";
import BulkLeadCreation from "./BulkLeadCreation";
import { useNotifications } from "@/components/common/NotificationSystem";

const NewLeadDropdown: React.FC = () => {
  // 🔥 UPDATED: Use permission hooks instead of isAdmin
  const { canCreateSingleLead, canCreateBulkLeads } = useAuth();

  const [isSingleLeadModalOpen, setIsSingleLeadModalOpen] = useState(false);
  const [isBulkLeadModalOpen, setIsBulkLeadModalOpen] = useState(false);
  const { showWarning } = useNotifications();

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

  // 🔥 UPDATED: Always show dropdown (removed isAdmin check)
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="bg-blue-200 border-blue-500 border-2 text-blue-800 hover:bg-blue-100 hover:text-blue-800">
            <Plus className="w-4 h-4 mr-2" />
            Add Lead
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleSingleLeadClick}>
            <User className="w-4 h-4 mr-2" />
            Single Lead
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleBulkLeadClick}>
            <Users className="w-4 h-4 mr-2" />
            Bulk Create Leads
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
    </>
  );
};

export default NewLeadDropdown;
