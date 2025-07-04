// src/app/sample-table/columns.tsx

"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Row } from "@tanstack/react-table";
import {
  ArrowUpDown,
  Phone,
  MessageCircle,
  Mail,
  FileText,
  Loader2,
  MoreHorizontal,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
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
import EditLeadModal from "@/components/leads/EditLeadModal";

// Stage Config
const LEAD_STAGES = [
  {
    value: "open",
    label: "Open",
    variant: "secondary" as const,
    className: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200",
  },
  {
    value: "initial",
    label: "Initial",
    variant: "secondary" as const,
    className: "bg-pink-100 text-pink-800 border-pink-200 hover:bg-pink-200",
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

const handlePhoneCall = (phoneNumber: string, leadName?: string) => {
  if (!phoneNumber) return alert("No phone number available");
  alert(`Calling ${leadName || phoneNumber} at ${phoneNumber}`);
};

const handleEmail = (email: string) => {
  if (!email) return alert("No email address available");
  window.open(`mailto:${email}`, "_self");
};

const WhatsAppButton: React.FC<{
  phoneNumber: string;
  leadName?: string;
}> = ({ phoneNumber, leadName }) => {
  const handleWhatsAppClick = () => {
    if (!phoneNumber) return alert("No phone number available");
    alert(`Open WhatsApp modal for ${leadName || phoneNumber}`);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-100"
            onClick={handleWhatsAppClick}
            disabled={!phoneNumber}
          >
            <MessageCircle
              className={`h-4 w-4 ${
                phoneNumber
                  ? "text-green-600 hover:text-green-700"
                  : "text-gray-300"
              }`}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {phoneNumber
              ? `WhatsApp ${leadName || phoneNumber}`
              : "No phone number"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const StageSelectCell = ({ row }: { row: Row<Lead> }) => {
  const [updateStage, { isLoading, error }] = useUpdateLeadStageMutation();
  const stage = row.getValue("stage") as string;
  const currentLead = row.original;

  const handleStageChange = async (newStage: string) => {
    if (newStage === stage) return;

    try {
      await updateStage({
        leadId: currentLead.id,
        stage: newStage,
        currentLead,
      }).unwrap();
    } catch (err: unknown) {
      const error = err as {
        message?: string;
        data?: {
          detail?: { msg: string }[] | string;
        };
      };
      console.error("Failed to update stage:", error);

      let errorMessage = "Failed to update stage";

      if (error?.data?.detail) {
        if (Array.isArray(error.data.detail)) {
          errorMessage = error.data.detail
            .map((e: { msg: string }) => e.msg)
            .join(", ");
        } else if (typeof error.data.detail === "string") {
          errorMessage = error.data.detail;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }

      alert(`Error: ${errorMessage}`);
    }
  };

  return (
    <div className="relative ">
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

const ActionsCell = ({ row }: { row: Row<Lead> }) => {
  const [deleteLead, { isLoading: isDeleting }] = useDeleteLeadMutation();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const router = useRouter();
  const lead = row.original;

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete lead "${lead.name}"?`))
      return;

    try {
      await deleteLead(lead.id).unwrap();
    } catch (err: unknown) {
      const error = err as {
        message?: string;
        data?: {
          detail?: { msg: string }[] | string;
        };
      };
      const message =
        error?.data?.detail || error?.message || "Failed to delete lead";
      alert(`Error: ${message}`);
    }
  };

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
  };

  const handleEditLead = () => {
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
  };

  return (
    <>
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
          <DropdownMenuItem onClick={() => handleCopy(lead.id)}>
            Copy Lead ID
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleCopy(lead.email!)}
            disabled={!lead.email}
          >
            Copy Email
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => router.push(`/sample-table/${lead.id}`)}
          >
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleEditLead}>
            Edit Lead
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleDelete}
            className="text-red-600 hover:text-red-700"
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
      <EditLeadModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        lead={lead}
      />
    </>
  );
};

// Column definitions
export const columns: ColumnDef<Lead>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(v) => row.toggleSelected(!!v)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Lead Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("name")}</div>
    ),
  },
  {
    accessorKey: "createdOn",
    header: "Created On",
    cell: ({ row }) => {
      const date = row.getValue("createdOn") as string;
      return (
        <div className="text-gray-600">
          {date ? new Date(date).toLocaleDateString() : "Unknown"}
        </div>
      );
    },
  },
  {
    accessorKey: "stage",
    header: "Stage",
    cell: StageSelectCell,
  },
  {
    accessorKey: "contact",
    header: "Contact",
    cell: ({ row }) => {
      const contact = row.getValue("contact") as string;
      const email = row.original.email || "";
      const leadName = row.original.name;

      return (
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                  onClick={() => handlePhoneCall(contact, leadName)}
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
                <p>
                  {contact
                    ? `Call ${leadName} via Tata Tele`
                    : "No phone number"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <WhatsAppButton phoneNumber={contact} leadName={leadName} />

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
  {
    accessorKey: "source",
    header: "Source",
    cell: ({ row }) => (
      <span className="capitalize text-gray-700">
        {row.getValue("source") || "Unknown"}
      </span>
    ),
  },
  {
    accessorKey: "media",
    header: "Media",
    cell: ({ row }) => (
      <span className="text-gray-600">{row.getValue("media") || "N/A"}</span>
    ),
  },
  {
    accessorKey: "lastActivity",
    header: "Last Activity",
    cell: ({ row }) => {
      const val = row.getValue("lastActivity") as string;
      return (
        <span className="text-gray-600">
          {val ? new Date(val).toLocaleDateString() : "No activity"}
        </span>
      );
    },
  },
  {
    accessorKey: "department",
    header: "Department",
    cell: ({ row }) => (
      <span className="text-gray-700">
        {row.getValue("department") || "Unassigned"}
      </span>
    ),
  },
  {
    accessorKey: "notes",
    header: "Notes",
    cell: ({ row }) => {
      const notes = row.getValue("notes") as string;
      if (!notes || notes.trim() === "")
        return <span className="text-gray-400 italic">No notes</span>;

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
  {
    id: "actions",
    header: "Actions",
    cell: ActionsCell,
    enableSorting: false,
    enableHiding: false,
  },
];
