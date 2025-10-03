// src/app/admin/unassigned-leads/columns.tsx

"use client";

import React, { useState } from "react";
import { ColumnDef, Row } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, MoreHorizontal, Loader2 } from "lucide-react";
import { Lead } from "@/models/types/lead";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeleteLeadMutation } from "@/redux/slices/leadsApi";
import { useNotifications } from "@/components/common/NotificationSystem";
import EditLeadModal from "@/components/leads/EditLeadModal";

const ActionsCell = ({
  row,
  handleLeadNavigation,
  router,
}: {
  row: Row<Lead>;
  handleLeadNavigation?: (leadId: string) => void;
  router: {
    push: (url: string) => void;
  };
}) => {
  const lead = row.original as Lead;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteLead] = useDeleteLeadMutation();
  const { showSuccess, showError } = useNotifications();

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showSuccess("Copied to clipboard!");
    } catch (error) {
      showError(error ? String(error) : "Error", "Failed to copy to clipboard");
    }
  };

  const handleEditLead = () => {
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteLead(lead.id || lead.leadId).unwrap();
      showSuccess(`Lead "${lead.name}" has been deleted successfully.`);
    } catch (error: unknown) {
      const errorMessage =
        (error as { data?: { detail?: string }; message?: string })?.data
          ?.detail ||
        (error as { data?: { detail?: string }; message?: string })?.message ||
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
          <Button variant="ghost" className="h-8 w-8 p-0" disabled={isDeleting}>
            <span className="sr-only">Open menu</span>
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => handleCopy(lead.leadId || lead.id)}>
            Copy Lead ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() =>
              handleLeadNavigation
                ? handleLeadNavigation(lead.id)
                : router.push(`/my-leads/${lead.id}`)
            }
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

// Helper function to format date
const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Column definitions factory
export const createColumns = (
  handleLeadNavigation?: (leadId: string) => void,
  router?: {
    push: (url: string) => void;
  }
): ColumnDef<Lead>[] => {
  return [
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
        <div className="font-medium text-base">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "source",
      header: "Source",
      cell: ({ row }) => {
        const source = row.getValue("source") as string;
        const getSourceDisplay = (source: string) => {
          switch (source?.toLowerCase()) {
            case "website":
              return { text: "Website", variant: "outline" as const };
            case "facebook":
            case "facebook-leads":
              return { text: "Facebook", variant: "secondary" as const };
            default:
              return { text: source || "Unknown", variant: "outline" as const };
          }
        };

        const sourceConfig = getSourceDisplay(source);
        return (
          <Badge variant={sourceConfig.variant} className="text-xs">
            {sourceConfig.text}
          </Badge>
        );
      },
      meta: {
        className: "w-auto",
      },
    },
    {
      accessorKey: "leadCategory",
      header: "Category",
      cell: ({ row }) => {
        const category = row.getValue("leadCategory") as string;
        return (
          <Badge variant="outline" className="text-xs">
            {category || "N/A"}
          </Badge>
        );
      },
      meta: {
        className: "w-auto",
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created On
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as string;
        return (
          <div className="text-gray-600">{date ? formatDate(date) : "N/A"}</div>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return <Badge className="text-xs">{status || "New"}</Badge>;
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
      cell: ({ row }) => {
        const stage = row.getValue("stage") as string;
        return (
          <Badge variant={"outline"} className="text-xs">
            {stage || "Initial"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "assignedTo",
      header: "Assigned To",
      cell: ({ row }) => {
        const assignedTo = row.getValue("assignedTo") as string;
        const assignedToName = row.original.assignedToName as string;

        if (!assignedTo) {
          return (
            <Badge variant="outline" className="text-xs text-red-600">
              Unassigned
            </Badge>
          );
        }

        return (
          <div className="text-sm text-gray-900">
            {assignedToName || assignedTo}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <ActionsCell
          row={row}
          handleLeadNavigation={handleLeadNavigation || (() => {})}
          router={router!}
        />
      ),
      enableSorting: false,
    },
  ];
};
