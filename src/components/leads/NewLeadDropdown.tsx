// ====================================
// Update your existing NewLeadDropdown.tsx to include bulk creation
// ====================================

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

const NewLeadDropdown: React.FC = () => {
  const { isAdmin } = useAuth();
  const [isSingleLeadModalOpen, setIsSingleLeadModalOpen] = useState(false);
  const [isBulkLeadModalOpen, setIsBulkLeadModalOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>
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

          {isAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsBulkLeadModalOpen(true)}>
                <Users className="w-4 h-4 mr-2" />
                Bulk Create Leads
              </DropdownMenuItem>
            </>
          )}
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

// ====================================
// Usage in your sample-table page
// ====================================

// In your src/app/sample-table/page.tsx, replace your existing NewLeadDropdown usage:

/*
import NewLeadDropdown from "@/components/leads/NewLeadDropdown";

// In your component:
<div className="flex items-center gap-2">
  <NewLeadDropdown />
  <Button variant="outline" onClick={handleRefresh}>
    <RefreshCw className="w-4 h-4 mr-2" />
    Refresh
  </Button>
</div>
*/

// ====================================
// Alternative: Add to your existing action bar
// ====================================

// If you want to add it as a separate button in your action bar:
/*
import BulkLeadButton from "@/components/leads/BulkLeadButton";

// In your component:
<div className="flex items-center gap-2">
  <NewLeadDropdown />
  <BulkLeadButton />
  <Button variant="outline" onClick={handleRefresh}>
    <RefreshCw className="w-4 h-4 mr-2" />
    Refresh
  </Button>
</div>
*/
