// src/app/sample-table/columns.tsx - UPDATED for new API endpoint

"use client";
import { useRouter } from "next/navigation";
import { Row } from "@tanstack/react-table";
import {
  ArrowUpDown,
  ListFilter,
  Phone,
  MessageCircle,
  Mail,
  FileText,
  Loader2,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { StageSelect } from "@/components/StageSelectComponent";
import {
  useUpdateLeadStageMutation,
  useDeleteLeadMutation,
} from "@/redux/slices/leadsApi";
import { Lead } from "@/models/types/lead";

// Stage configurations (matching backend values)
const LEAD_STAGES = [
  {
    value: "open",
    label: "Open",
    variant: "secondary" as const,
    className: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200",
  },
  {
    value: "contacted",
    label: "Contacted",
    variant: "secondary" as const,
    className:
      "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200",
  },
  {
    value: "in_progress",
    label: "In Progress",
    variant: "secondary" as const,
    className:
      "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200",
  },
  {
    value: "qualified",
    label: "Qualified",
    variant: "secondary" as const,
    className:
      "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200",
  },
  {
    value: "closed_won",
    label: "Closed Won",
    variant: "secondary" as const,
    className:
      "bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
  },
  {
    value: "closed_lost",
    label: "Closed Lost",
    variant: "secondary" as const,
    className: "bg-red-100 text-red-800 border-red-200 hover:bg-red-200",
  },
];

// Helper functions for contact actions
const handlePhoneCall = (phoneNumber: string) => {
  if (!phoneNumber) {
    alert("No phone number available");
    return;
  }
  window.open(`tel:${phoneNumber}`, "_self");
};

const handleWhatsApp = (phoneNumber: string) => {
  if (!phoneNumber) {
    alert("No phone number available");
    return;
  }
  const cleanNumber = phoneNumber.replace(/[^\d]/g, "");
  if (cleanNumber.length < 10) {
    alert("Invalid phone number format");
    return;
  }
  window.open(`https://wa.me/${cleanNumber}`, "_blank");
};

const handleEmail = (email: string) => {
  if (!email) {
    alert("No email address available");
    return;
  }
  window.open(`mailto:${email}`, "_self");
};

// UPDATED: Stage Select Cell Component with new API
const StageSelectCell = ({ row }: { row: Row<Lead> }) => {
  const [updateStage, { isLoading, error }] = useUpdateLeadStageMutation();
  const stage = row.getValue("stage") as string;
  const currentLead = row.original; // Get the full lead object

  const handleStageChange = async (newStage: string) => {
    if (newStage === stage) return; // No change needed

    try {
      console.log(
        `🔄 Updating lead ${currentLead.id} stage: ${stage} → ${newStage}`
      );

      // UPDATED: Pass the current lead data along with the new stage
      await updateStage({
        leadId: currentLead.id,
        stage: newStage,
        currentLead: currentLead, // Pass the full lead object to preserve other fields
      }).unwrap();

      console.log(`✅ Stage updated successfully: ${newStage}`);
    } catch (error: any) {
      console.error("Failed to update stage:", error);

      // Show user-friendly error message
      let errorMessage = "Failed to update stage";

      if (error?.data?.detail) {
        if (Array.isArray(error.data.detail)) {
          errorMessage = error.data.detail
            .map((err: any) => err.msg)
            .join(", ");
        } else {
          errorMessage = error.data.detail;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }

      alert(`Error: ${errorMessage}`);
    }
  };

  return (
    <div className="relative">
      <StageSelect
        value={stage}
        onValueChange={handleStageChange}
        options={LEAD_STAGES}
        placeholder="Select stage..."
        disabled={isLoading}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        </div>
      )}
      {error && (
        <div className="absolute top-full left-0 mt-1 p-2 bg-red-100 border border-red-200 rounded text-xs text-red-600 z-10">
          Update failed. Please try again.
        </div>
      )}
    </div>
  );
};

// Actions Cell Component with Real API
const ActionsCell = ({ row }: { row: Row<Lead> }) => {
  const [deleteLead, { isLoading: isDeleting }] = useDeleteLeadMutation();
  const router = useRouter();
  const lead = row.original;

  const handleDelete = async () => {
    const confirmMessage = `Are you sure you want to delete lead "${lead.name}"?\n\nThis action cannot be undone.`;

    if (window.confirm(confirmMessage)) {
      try {
        console.log(`🗑️ Deleting lead: ${lead.name} (${lead.id})`);
        await deleteLead(lead.id).unwrap();
        console.log(`✅ Lead ${lead.name} deleted successfully`);
      } catch (error: any) {
        console.error("Failed to delete lead:", error);

        const errorMessage =
          error?.data?.detail || error?.message || "Failed to delete lead";
        alert(`Error: ${errorMessage}`);
      }
    }
  };

  const handleViewDetails = () => {
    router.push(`/sample-table/${lead.id}`);
  };

  const handleEdit = () => {
    // TODO: Implement edit functionality
    console.log("Edit lead:", lead.id);
    alert("Edit functionality coming soon!");
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(lead.id);
      console.log("Lead ID copied to clipboard");
    } catch (error) {
      console.error("Failed to copy ID:", error);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = lead.id;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
  };

  const handleCopyEmail = async () => {
    if (!lead.email) {
      alert("No email address available");
      return;
    }

    try {
      await navigator.clipboard.writeText(lead.email);
      console.log("Email copied to clipboard");
    } catch (error) {
      console.error("Failed to copy email:", error);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = lead.email;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0" disabled={isDeleting}>
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>

        <DropdownMenuItem onClick={handleCopyId} className="cursor-pointer">
          Copy Lead ID
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleCopyEmail}
          className="cursor-pointer"
          disabled={!lead.email}
        >
          Copy Email
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleViewDetails}
          className="cursor-pointer"
        >
          View Details
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
          Edit Lead
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleDelete}
          className="text-red-600 hover:text-red-700 cursor-pointer"
          disabled={isDeleting}
        >
          {isDeleting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Deleting...
            </span>
          ) : (
            "Delete Lead"
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Column Definitions (unchanged from original)
export const columns: ColumnDef<Lead>[] = [
  // Selection Column
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },

  // Name Column
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="hover:bg-gray-100"
      >
        Lead Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const name = row.getValue("name") as string;
      return (
        <div className="font-medium text-gray-900">{name || "Unknown"}</div>
      );
    },
  },

  // Created Date Column
  {
    accessorKey: "createdOn",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="hover:bg-gray-100"
      >
        <ListFilter className="mr-2 h-4 w-4" />
        Created On
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = row.getValue("createdOn") as string;
      return (
        <div className="text-gray-600">
          {date ? new Date(date).toLocaleDateString() : "Unknown"}
        </div>
      );
    },
  },

  // Stage Column (UPDATED with new API logic)
  {
    accessorKey: "stage",
    header: "Stage",
    cell: StageSelectCell,
  },

  // Lead Score Column
  // {
  //   accessorKey: "leadScore",
  //   header: ({ column }) => (
  //     <Button
  //       variant="ghost"
  //       onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
  //       className="hover:bg-gray-100"
  //     >
  //       Lead Score
  //       <ArrowUpDown className="ml-2 h-4 w-4" />
  //     </Button>
  //   ),
  //   cell: ({ row }) => {
  //     const score = row.getValue("leadScore") as number;
  //     return (
  //       <span
  //         className={`px-2 py-1 rounded-full text-xs font-medium ${
  //           score >= 80
  //             ? "bg-green-100 text-green-800"
  //             : score >= 60
  //             ? "bg-yellow-100 text-yellow-800"
  //             : score >= 40
  //             ? "bg-orange-100 text-orange-800"
  //             : "bg-red-100 text-red-800"
  //         }`}
  //       >
  //         {score || 0}
  //       </span>
  //     );
  //   },
  // },

  // Contact Column (with working actions)
  {
    accessorKey: "contact",
    header: "Contact",
    cell: ({ row }) => {
      const contact = row.getValue("contact") as string;
      const email = row.original.email || "";

      return (
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                  onClick={() => handlePhoneCall(contact)}
                  disabled={!contact}
                >
                  <Phone
                    className={`h-4 w-4 ${
                      contact
                        ? "text-gray-600 hover:text-blue-600"
                        : "text-gray-300"
                    }`}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{contact ? `Call ${contact}` : "No phone number"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                  onClick={() => handleWhatsApp(contact)}
                  disabled={!contact}
                >
                  <MessageCircle
                    className={`h-4 w-4 ${
                      contact
                        ? "text-green-600 hover:text-green-700"
                        : "text-gray-300"
                    }`}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{contact ? `WhatsApp ${contact}` : "No phone number"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                  onClick={() => handleEmail(email)}
                  disabled={!email}
                >
                  <Mail
                    className={`h-4 w-4 ${
                      email
                        ? "text-blue-600 hover:text-blue-700"
                        : "text-gray-300"
                    }`}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{email ? `Email ${email}` : "No email address"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    },
  },

  // Source Column
  {
    accessorKey: "source",
    header: "Source",
    cell: ({ row }) => {
      const source = row.getValue("source") as string;
      return (
        <span className="capitalize text-gray-700">{source || "Unknown"}</span>
      );
    },
  },

  // Media Column
  {
    accessorKey: "media",
    header: "Media",
    cell: ({ row }) => {
      const media = row.getValue("media") as string;
      return <span className="text-gray-600">{media || "N/A"}</span>;
    },
  },

  // Last Activity Column
  {
    accessorKey: "lastActivity",
    header: "Last Activity",
    cell: ({ row }) => {
      const lastActivity = row.getValue("lastActivity") as string;
      return (
        <span className="text-gray-600">
          {lastActivity
            ? new Date(lastActivity).toLocaleDateString()
            : "No activity"}
        </span>
      );
    },
  },

  // Department Column
  {
    accessorKey: "department",
    header: "Department",
    cell: ({ row }) => {
      const department = row.getValue("department") as string;
      return (
        <span className="text-gray-700">{department || "Unassigned"}</span>
      );
    },
  },

  // Notes Column
  {
    accessorKey: "notes",
    header: "Notes",
    cell: ({ row }) => {
      const notes = row.getValue("notes") as string;

      if (!notes || notes.trim() === "") {
        return <span className="text-gray-400 italic">No notes</span>;
      }

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-gray-100"
              >
                <FileText className="h-4 w-4 text-gray-600" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs" side="left">
              <p className="text-sm whitespace-pre-wrap">{notes}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },

  // Actions Column
  {
    id: "actions",
    header: "Actions",
    cell: ActionsCell,
    enableSorting: false,
    enableHiding: false,
  },
];
