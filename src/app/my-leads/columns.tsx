// src/app/my-leads/columns.tsx - MINIMAL CHANGE: Only fix the stage dropdown

"use client";

import { ColumnDef, Row } from "@tanstack/react-table";
import { ArrowUpDown, Copy, MoreHorizontal, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lead } from "@/models/types/lead";
import {
  useUpdateLeadStageMutation,
  useDeleteLeadMutation,
} from "@/redux/slices/leadsApi";
import { useGetActiveStagesQuery } from "@/redux/slices/stagesApi";
import { useNotifications } from "@/components/common/NotificationSystem";
import { StageDisplay } from "@/components/common/StageDisplay"; // 🔥 ONLY CHANGE: Import StageDisplay
import EditLeadModal from "@/components/leads/EditLeadModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Email cell component (UNCHANGED)
const EmailCell = ({ email }: { email?: string }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleEmailClick = async () => {
    if (!email) return;

    try {
      await navigator.clipboard.writeText(email);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy email:", error);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600 truncate max-w-[150px]">
        {email || "No email"}
      </span>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEmailClick}
              className="p-1 h-6 w-6"
            >
              <Mail
                className={`h-3 w-3 ${
                  email
                    ? isCopied
                      ? "text-green-600"
                      : "text-blue-600 hover:text-blue-700"
                    : "text-gray-300"
                }`}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {isCopied
                ? "Copied!"
                : email
                ? `Email ${email}`
                : "No email address"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

// 🔥 ONLY CHANGE: Updated StageSelectCell to use StageDisplay in dropdown
const StageSelectCell = ({ row }: { row: Row<Lead> }) => {
  const [updateStage, { isLoading }] = useUpdateLeadStageMutation();
  const { showSuccess, showError } = useNotifications();

  const { data: stagesData, isLoading: stagesLoading } =
    useGetActiveStagesQuery({});

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

      // Get stage display name for notification
      const selectedStage = stagesData?.stages.find((s) => s.name === newStage);
      const stageDisplayName = selectedStage?.display_name || newStage;

      showSuccess(
        `${currentLead.name}'s stage updated to "${stageDisplayName}"`,
        "Lead Stage updated successfully!"
      );
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

  // Show loading if stages are being fetched
  if (stagesLoading) {
    return (
      <div className="flex items-center justify-center w-[120px] h-8">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* 🔥 ONLY CHANGE: Using Select with StageDisplay instead of StageSelect */}
      <Select
        value={stage}
        onValueChange={handleStageChange}
        disabled={isLoading}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue>
            <StageDisplay stageName={stage} size="sm" showColor={true} />
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {stagesData?.stages.map((apiStage) => (
            <SelectItem key={apiStage.id} value={apiStage.name}>
              <StageDisplay
                stageName={apiStage.name}
                size="sm"
                showColor={true}
              />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        </div>
      )}
    </div>
  );
};

// Actions cell component (UNCHANGED from your original)
const ActionsCell = ({ row }: { row: Row<Lead> }) => {
  const router = useRouter();
  const lead = row.original;
  const [isActionsLoading, setIsActionsLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteLead] = useDeleteLeadMutation();
  const { showSuccess, showError, showConfirm } = useNotifications();

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showSuccess("Copied to clipboard!");
    } catch (error) {
      showError("Failed to copy to clipboard");
    }
  };

  const handleEditLead = () => {
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
  };

  const handleDelete = async () => {
    // const confirmed =  showConfirm(
    // title:  "Delete Lead",
    //  description: `Are you sure you want to delete "${lead.name}"? This action cannot be undone.`
    // );

    setIsDeleting(true);
    try {
      await deleteLead(lead.id).unwrap();
      showSuccess(`Lead "${lead.name}" has been deleted successfully.`);
    } catch (error: unknown) {
      const errorMessage =
        (error as any)?.data?.detail ||
        (error as any)?.message ||
        "Failed to delete lead";
      showError(`Failed to delete lead: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0"
            disabled={isActionsLoading || isDeleting}
          >
            <span className="sr-only">Open menu</span>
            {isActionsLoading || isDeleting ? (
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

// Helper function (UNCHANGED)
const useStageLabel = () => {
  const { data: stagesData } = useGetActiveStagesQuery({});

  return (value: string) => {
    const stage = stagesData?.stages.find((stage) => stage.name === value);
    return stage?.display_name || value;
  };
};

// Column definitions (UNCHANGED - keeping your original layout)
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
    accessorKey: "createdOn", // KEEPING YOUR ORIGINAL FIELD
    header: "Created On",
    cell: ({ row }) => {
      const date = row.getValue("createdOn") as string;
      return (
        <div className="text-gray-600">
          {date ? new Date(date).toLocaleDateString() : "N/A"}
        </div>
      );
    },
  },
  // {
  //   accessorKey: "leadScore",
  //   header: ({ column }) => (
  //     <Button
  //       variant="ghost"
  //       onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
  //     >
  //       Lead Score
  //       <ArrowUpDown className="ml-2 h-4 w-4" />
  //     </Button>
  //   ),
  //   cell: ({ row }) => {
  //     const score = row.getValue("leadScore") as number;
  //     const getScoreColor = (score: number) => {
  //       if (score >= 80) return "bg-green-100 text-green-800 border-green-200";
  //       if (score >= 60)
  //         return "bg-yellow-100 text-yellow-800 border-yellow-200";
  //       if (score >= 40)
  //         return "bg-orange-100 text-orange-800 border-orange-200";
  //       return "bg-red-100 text-red-800 border-red-200";
  //     };

  //     return (
  //       <Badge className={`${getScoreColor(score)} font-mono`}>{score}</Badge>
  //     );
  //   },
  // },
  {
    accessorKey: "contact", // KEEPING YOUR ORIGINAL FIELD
    header: "Contact",
    cell: ({ row }) => (
      <div className="font-mono text-sm">{row.getValue("contact")}</div>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => <EmailCell email={row.getValue("email")} />,
  },
  {
    accessorKey: "source",
    header: "Source",
    cell: ({ row }) => {
      const source = row.getValue("source") as string;
      return (
        <Badge variant="outline" className="text-xs">
          {source}
        </Badge>
      );
    },
  },
  {
    accessorKey: "stage",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Stage
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <StageSelectCell row={row} />, // 🔥 ONLY CHANGE: Now uses StageDisplay in dropdown
  },
  {
    accessorKey: "media", // KEEPING YOUR ORIGINAL FIELD
    header: "Media",
    cell: ({ row }) => (
      <Badge variant="secondary" className="text-xs">
        {row.getValue("media")}
      </Badge>
    ),
  },
  {
    accessorKey: "lastActivity", // KEEPING YOUR ORIGINAL FIELD
    header: "Last Activity",
    cell: ({ row }) => {
      const date = row.getValue("lastActivity") as string;
      return (
        <div className="text-gray-600 text-sm">
          {date ? new Date(date).toLocaleDateString() : "N/A"}
        </div>
      );
    },
  },
  {
    accessorKey: "department", // KEEPING YOUR ORIGINAL FIELD
    header: "Department",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-xs">
        {row.getValue("department")}
      </Badge>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => <ActionsCell row={row} />,
  },
];
