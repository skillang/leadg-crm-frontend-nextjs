// src/components/leads/NewLeadDropdown.tsx

"use client";

import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown, User, Upload } from "lucide-react";
import SingleLeadModal from "./SingleLeadModal";

interface NewLeadDropdownProps {
  className?: string;
}

const NewLeadDropdown: React.FC<NewLeadDropdownProps> = ({ className }) => {
  const [isSingleLeadModalOpen, setIsSingleLeadModalOpen] = useState(false);

  const handleSingleLeadClick = () => {
    setIsSingleLeadModalOpen(true);
  };

  const handleBulkUploadClick = () => {
    // TODO: Implement bulk upload functionality
    console.log("Bulk upload clicked");
    alert("Bulk upload functionality coming soon!");
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={`flex items-center gap-2 bg-blue-200 border-blue-500 border-2 text-blue-800 hover:bg-blue-100 hover:text-blue-800 ${className}`}
          >
            <Plus className="h-4 w-4" />
            New lead
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={handleSingleLeadClick}
            className="cursor-pointer flex items-center gap-2 py-3"
          >
            <User className="h-4 w-4 text-blue-600" />
            <div>
              <div className="font-medium">Single lead</div>
              <div className="text-xs text-gray-500">Add one lead manually</div>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleBulkUploadClick}
            className="cursor-pointer flex items-center gap-2 py-3"
          >
            <Upload className="h-4 w-4 text-green-600" />
            <div>
              <div className="font-medium">Bulk upload</div>
              <div className="text-xs text-gray-500">Import from CSV/Excel</div>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Single Lead Modal */}
      <SingleLeadModal
        isOpen={isSingleLeadModalOpen}
        onClose={() => setIsSingleLeadModalOpen(false)}
      />
    </>
  );
};

export default NewLeadDropdown;
