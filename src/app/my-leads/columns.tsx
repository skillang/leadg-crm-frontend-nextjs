// src/app/my-leads/columns.tsx - FIXED: Function Factory Pattern

import { ColumnDef, Row } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Loader2, ArrowRight } from "lucide-react";
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
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useState } from "react";
import { Lead } from "@/models/types/lead";
import {
  useUpdateLeadStageMutation,
  useDeleteLeadMutation,
} from "@/redux/slices/leadsApi";
import { useGetActiveStagesQuery } from "@/redux/slices/stagesApi";
import { useNotifications } from "@/components/common/NotificationSystem";
import EditLeadModal from "@/components/leads/EditLeadModal";
import Image from "next/image";
import { StageSelect } from "@/components/common/StageSelect";
import { StatusSelect } from "@/components/common/StatusSelect";
import { useUpdateLeadMutation } from "@/redux/slices/leadsApi";
import { useGetActiveStatusesQuery } from "@/redux/slices/statusesApi";
import { openEmailDialog } from "@/redux/slices/emailSlice";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { openModal } from "@/redux/slices/whatsappSlice";
import { openModal as openCallModal } from "@/redux/slices/tataTeliSlice";
import { formatContactDate, formatDate } from "@/utils/formatDate";
import { useCommunication } from "@/components/providers/communication-provider";

// StageSelectCell with StageDisplay in dropdown (UNCHANGED)
const StageSelectCell = ({ row }: { row: Row<Lead> }) => {
  const [updateStage, { isLoading }] = useUpdateLeadStageMutation();
  const { showSuccess, showError } = useNotifications();

  const { data: stagesData, isLoading: stagesLoading } =
    useGetActiveStagesQuery({});

  const stage = row.getValue("stage") as string;
  const currentLead = row.original;

  const handleStageChange = async (
    newStage: string,
    options?: { automation_approved?: boolean }
  ) => {
    if (newStage === stage) return;

    try {
      await updateStage({
        leadId: currentLead.id,
        stage: newStage,
        automation_approved: options?.automation_approved,
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
      <StageSelect
        value={stage}
        onValueChange={handleStageChange}
        stages={stagesData?.stages || []}
        disabled={isLoading}
        isLoading={stagesLoading}
        placeholder="Select stage"
        className="w-[140px]"
        showLabel={false}
      />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        </div>
      )}
    </div>
  );
};

const ContactCell = ({ row }: { row: Row<Lead> }) => {
  const dispatch = useDispatch();
  const { user: currentUser } = useSelector((state: RootState) => state.auth); // ✅ Single declaration
  const { getUnreadCount, hasUnreadMessages } = useCommunication(); // ADD THIS LINE
  const lead = row.original;
  const { showError } = useNotifications();

  const unreadCount = getUnreadCount(lead.id);
  const hasUnread = hasUnreadMessages(lead.id);

  const handleCall = () => {
    // ✅ No hooks inside function - use currentUser from component scope
    if (!currentUser) {
      showError("User data not available", "Error");
      return;
    }

    // Dispatch Tata Teli modal
    dispatch(
      openCallModal({
        leadId: lead.leadId || lead.id,
      })
    );
  };

  const handleEmail = () => {
    if (lead.id) {
      dispatch(openEmailDialog(lead.id));
    } else {
      showError("No lead ID available", "Error");
    }
  };

  const handleWhatsApp = () => {
    if (!lead.phoneNumber && !lead.contact) {
      showError("No phone number available for this lead", "No Phone Number");
      return;
    }

    // Prepare lead data for WhatsApp modal
    const whatsappLeadData = {
      id: lead.id,
      leadId: lead.id,
      name: lead.name,
      phoneNumber: lead.phoneNumber || lead.contact || "",
      email: lead.email,
    };

    // Prepare user data for WhatsApp modal
    const whatsappUserData = currentUser
      ? {
          id: currentUser.id,
          firstName: currentUser.first_name,
          lastName: currentUser.last_name,
          email: currentUser.email,
        }
      : null;

    if (whatsappUserData) {
      dispatch(
        openModal({
          lead: whatsappLeadData,
          user: whatsappUserData,
        })
      );
    } else {
      showError("User data not available", "Error");
    }
  };

  return (
    <div className="flex gap-2">
      <Badge
        className="bg-slate-500/10 text-slate-700 border-slate-500/25 border-2 cursor-pointer hover:bg-slate-500/20"
        onClick={handleCall}
      >
        <Image
          src="/assets/icons/call-icon.svg"
          alt="Call Icon"
          width={16}
          height={16}
        />
      </Badge>
      <Button
        className="bg-slate-500/10 text-slate-700 border-slate-500/25 border-2 cursor-pointer hover:bg-slate-500/20 h-6 px-2"
        onClick={handleEmail}
      >
        <Image
          src="/assets/icons/email-icon.svg"
          alt="Email Icon"
          width={16}
          height={16}
        />
      </Button>
      <div className="relative">
        <Badge
          className={`${
            hasUnread
              ? "bg-green-600/90 border-green-600 hover:bg-green-700 text-white" // WHITE text on green
              : "bg-slate-500/10 text-slate-700 border-slate-500/25 border-2 cursor-pointer hover:bg-slate-500/20" // GREY text on grey
          } border-2 cursor-pointer transition-all duration-200`}
          onClick={handleWhatsApp}
        >
          <Image
            src="/assets/icons/whatsapp-icon.svg"
            alt="WhatsApp Icon"
            width={16}
            height={16}
            className={`transition-all duration-200 ${
              hasUnread ? "opacity-100 brightness-0 invert" : "opacity-70" // INVERT icon on green background
            }`}
          />
        </Badge>
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-xs font-bold bg-red-500 hover:bg-red-500 border-white border-2 rounded-full"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </div>
    </div>
  );
};

// FIXED: Actions cell that accepts router as prop
const ActionsCell = ({
  row,
  router,
  handleLeadNavigation,
}: {
  row: Row<Lead>;
  router: AppRouterInstance;
  handleLeadNavigation?: (leadId: string) => void;
}) => {
  const lead = row.original;
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
      await deleteLead(lead.id).unwrap();
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

// FIXED: View Details Cell that accepts router as prop
// 🔥 REPLACE the ViewDetailsCell component with this:
const ViewDetailsCell = ({
  row,
  router,
  handleLeadNavigation,
}: {
  row: Row<Lead>;
  router: AppRouterInstance;
  handleLeadNavigation?: (leadId: string) => void;
}) => {
  const leadId = row.original.id;

  const handleClick = () => {
    if (handleLeadNavigation) {
      handleLeadNavigation(leadId);
    } else {
      router.push(`/my-leads/${leadId}`);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick} // 🔥 CHANGED: Use new handler
      className="p-2 hover:bg-gray-50 border-2 cursor-pointer"
    >
      <ArrowRight className="h-4 w-4 text-gray-600 " />
    </Button>
  );
};

// Add this component before createColumns function
const StatusSelectCell = ({ row }: { row: Row<Lead> }) => {
  const [updateLeadStatus, { isLoading }] = useUpdateLeadMutation(); // You'll need to create this
  const { showSuccess, showError } = useNotifications();

  const { data: statusesData, isLoading: statusesLoading } =
    useGetActiveStatusesQuery({}); // You'll need to create this

  const status = row.getValue("status") as string;
  const currentLead = row.original;

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === status) return;

    try {
      await updateLeadStatus({
        lead_id: currentLead.id,
        status: newStatus,
        currentLead,
      }).unwrap();

      const selectedStatus = statusesData?.statuses.find(
        (s) => s.name === newStatus
      );
      const statusDisplayName = selectedStatus?.display_name || newStatus;

      showSuccess(
        `${currentLead.name}'s status updated to "${statusDisplayName}"`,
        "Lead Status updated successfully!"
      );
    } catch (err: unknown) {
      const error = err as {
        message?: string;
        data?: { detail?: { msg: string }[] | string };
      };

      let errorMessage = "Failed to update status";
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
        `Failed to update ${currentLead.name}'s status: ${errorMessage}`
      );
    }
  };

  if (statusesLoading) {
    return (
      <div className="flex items-center justify-center w-[120px] h-8">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="relative">
      <StatusSelect
        value={status}
        onValueChange={handleStatusChange}
        statuses={statusesData?.statuses || []}
        disabled={isLoading}
        isLoading={statusesLoading}
        placeholder="Select status"
        className="w-[140px]"
        showLabel={false}
      />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        </div>
      )}
    </div>
  );
};

// FIXED: Create columns as a factory function that accepts router
export const createColumns = (
  router: AppRouterInstance,
  handleLeadNavigation?: (leadId: string) => void
): ColumnDef<Lead>[] => [
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
    accessorKey: "callStats.total_calls",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        TDC
        <ArrowUpDown className="h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const lead = row.original;
      const totalCalls = lead.callStats?.total_calls ?? 0;

      return (
        <div className="flex items-center justify-center">
          <Badge
            variant="outline"
            className="text-xs bg-gray-50 text-gray-700 border-gray-200"
          >
            {totalCalls}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "callStats.answered_calls",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        AC
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const lead = row.original;
      const answeredCalls = lead.callStats?.answered_calls ?? 0;
      return (
        <div className="flex items-center justify-center">
          <Badge variant="success-light">{answeredCalls}</Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created On",
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as string;
      return (
        <div className="text-gray-600">{date ? formatDate(date) : "N/A"}</div>
      );
    },
  },
  {
    accessorKey: "contact",
    header: "Contact the Lead via",
    minSize: 100,
    maxSize: 200,
    cell: ({ row }) => <ContactCell row={row} />,
    meta: {
      className: "w-auto",
    },
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
    meta: {
      className: "w-auto", // This helps with auto-sizing
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
    cell: ({ row }) => <StageSelectCell row={row} />,
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
    cell: ({ row }) => <StatusSelectCell row={row} />,
  },
  {
    id: "view_details",
    header: "View More",
    cell: ({ row }) => (
      <ViewDetailsCell
        row={row}
        router={router}
        handleLeadNavigation={handleLeadNavigation} // 🔥 ADD this prop
      />
    ),
    enableSorting: false,
  },
  {
    accessorKey: "lastContacted",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Last Contacted
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const lastContacted = row.getValue("lastContacted") as string;
      return (
        <div className="text-sm">
          {lastContacted ? (
            <span className="text-gray-900">
              {formatContactDate(lastContacted)}
            </span>
          ) : (
            <Badge variant="secondary" className="text-xs">
              Never
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Last Updated
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const updatedAt = row.getValue("updatedAt") as string;
      return (
        <div className="text-sm">
          {updatedAt ? (
            <span className="text-gray-900">
              {formatContactDate(updatedAt)}
            </span>
          ) : (
            <Badge variant="secondary" className="text-xs">
              Never
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "assignedTo",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Assigned To
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const lead = row.original;
      const assignedToName = lead.assignedToName;

      return (
        <div className="flex items-center">
          {assignedToName ? (
            <Badge
              variant="outline"
              className="text-xs bg-blue-50 text-blue-700 border-blue-200"
            >
              {assignedToName}
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="text-xs bg-gray-100 text-gray-500"
            >
              Unassigned
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => {
      // Try both possible field names from the API response
      const category =
        (row.getValue("category") as string) ||
        (row.original.leadCategory as string);
      return (
        <Badge variant="outline" className="text-xs">
          {category || "N/A"}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => (
      <ActionsCell
        row={row}
        router={router}
        handleLeadNavigation={handleLeadNavigation}
      />
    ),
  },
];

export const createMobileColumns = (
  router: AppRouterInstance,
  handleLeadNavigation?: (leadId: string) => void
): ColumnDef<Lead>[] => [
  {
    accessorKey: "name",
    header: "Lead Name",
    cell: ({ row }) => (
      <div className="font-medium text-base">{row.getValue("name")}</div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusSelectCell row={row} />,
  },
  {
    accessorKey: "stage",
    header: "Stage",
    cell: ({ row }) => <StageSelectCell row={row} />,
  },
  {
    accessorKey: "contact",
    header: "Contact",
    cell: ({ row }) => <ContactCell row={row} />,
    meta: {
      className: "w-auto",
    },
  },
  {
    id: "view_details",
    header: "View More",
    cell: ({ row }) => (
      <ViewDetailsCell
        row={row}
        router={router}
        handleLeadNavigation={handleLeadNavigation}
      />
    ),
    enableSorting: false,
  },
];
