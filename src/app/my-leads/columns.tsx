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
import { LEAD_STAGES } from "@/constants/stageConfig";
import { useNotifications } from "@/components/common/NotificationSystem";

const WhatsAppButton: React.FC<{
  phoneNumber: string;
  leadName?: string;
}> = ({ phoneNumber, leadName }) => {
  const { showWarning } = useNotifications();

  const handleWhatsAppClick = () => {
    if (!phoneNumber) return showWarning("No phone number available");
    showWarning(
      `WhatsApp chat with ${leadName || phoneNumber} - is not available yet`,
      "Feature coming soon"
    );
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

// FINAL StageSelectCell with Notifications (Clean - No Debug Logs)
const StageSelectCell = ({ row }: { row: Row<Lead> }) => {
  const [updateStage, { isLoading, error }] = useUpdateLeadStageMutation();
  const { showSuccess, showError } = useNotifications();

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

      // Show success notification
      showSuccess(
        `${currentLead.name}'s stage updated to "${newStage}"`,
        "Lead Stage updated successfully!"
      );

      // Cache invalidation will automatically refetch and update the UI
    } catch (err: unknown) {
      const error = err as {
        message?: string;
        data?: {
          detail?: { msg: string }[] | string;
        };
      };

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

      showError(
        `Failed to update ${currentLead.name}'s stage: ${errorMessage}`
      );
    }
  };

  return (
    <div className="relative">
      <StageSelect
        value={stage} // Direct value from server data, no local state
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
  const { showConfirm, showWarning, showError } = useNotifications();

  const handleDelete = () => {
    showConfirm({
      title: "Delete Lead",
      description: `Are you sure you want to delete "${lead.name}"? This action cannot be undone.`,
      confirmText: "Delete",
      variant: "destructive",
      onConfirm: async () => {
        try {
          await deleteLead(lead.id).unwrap();
          showWarning(
            `Lead "${lead.name}" deleted successfully`,
            "Lead Deleted!"
          );
        } catch (err: unknown) {
          const error = err as {
            message?: string;
            data?: {
              detail?: { msg: string }[] | string;
            };
          };
          const message =
            error?.data?.detail || error?.message || "Failed to delete lead";
          showError("Failed to delete lead.", String(message));
        }
      },
    });
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
          <DropdownMenuItem onClick={() => router.push(`/my-leads/${lead.id}`)}>
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
  // Fixed contact cell - move useNotifications inside the cell component
  {
    accessorKey: "contact",
    header: "Contact",
    cell: ({ row }) => {
      const contact = row.getValue("contact") as string;
      const email = row.original.email || "";
      const leadName = row.original.name;

      // ✅ Move the hook call inside the component
      const { showWarning } = useNotifications();

      const handlePhoneCall = (phoneNumber: string, leadName?: string) => {
        if (!phoneNumber) return showWarning("No phone number available");
        showWarning(
          `Phone call to ${leadName || phoneNumber} is not available yet`,
          "Feature Coming Soon..."
        );
      };

      const handleEmail = (email: string) => {
        if (!email) return showWarning("No email address available");
        showWarning(
          "Email feature is not available yet",
          "Feature Coming Soon..."
        );
      };

      return (
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                  onClick={() => handlePhoneCall(contact, leadName)} // ✅ No need to pass notifications
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
                  onClick={() => handleEmail(email)} // ✅ No need to pass notifications
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
