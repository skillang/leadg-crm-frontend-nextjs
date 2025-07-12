// components/leads/NewLeadDropdown.tsx (Updated)

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
  const { isAdmin } = useAuth();
  const [isSingleLeadModalOpen, setIsSingleLeadModalOpen] = useState(false);
  const [isBulkLeadModalOpen, setIsBulkLeadModalOpen] = useState(false);
  const { showWarning } = useNotifications();

  const handleNonAdminClick = () => {
    showWarning("Adding leads needs admin access", "Action Not Allowed !");
  };

  return (
    <>
      {isAdmin ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-blue-200 border-blue-500 border-2 text-blue-800 hover:bg-blue-100 hover:text-blue-800">
              <Plus className="w-4 h-4 mr-2" />
              Add Lead
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsSingleLeadModalOpen(true)}>
              <User className="w-4 h-4 mr-2" />
              Single Lead
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setIsBulkLeadModalOpen(true)}>
              <Users className="w-4 h-4 mr-2" />
              Bulk Create Leads
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button
          onClick={handleNonAdminClick}
          className="bg-blue-200 border-blue-500 border-2 text-blue-800 hover:bg-blue-100 hover:text-blue-800"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Lead
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      )}

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
