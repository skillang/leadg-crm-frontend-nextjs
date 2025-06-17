"use client";
import { useRouter } from "next/navigation";
import {
  ArrowUpDown,
  ListFilter,
  Phone,
  MessageCircle,
  Mail,
  FileText,
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

// Stage configurations
const LEAD_STAGES = [
  {
    value: "contacted",
    label: "Contacted",
    variant: "secondary" as const,
    className:
      "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200",
  },
  {
    value: "first-call",
    label: "First Call",
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
    value: "proposal",
    label: "Proposal",
    variant: "secondary" as const,
    className:
      "bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-200",
  },
  {
    value: "closed-won",
    label: "Closed Won",
    variant: "secondary" as const,
    className:
      "bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
  },
  {
    value: "closed-lost",
    label: "Closed Lost",
    variant: "secondary" as const,
    className: "bg-red-100 text-red-800 border-red-200 hover:bg-red-200",
  },
];

// Helper functions
const handlePhoneCall = (phoneNumber: string) => {
  window.open(`tel:${phoneNumber}`, "_self");
};

const handleWhatsApp = (phoneNumber: string) => {
  const cleanNumber = phoneNumber.replace(/[^\d]/g, "");
  window.open(`https://wa.me/${cleanNumber}`, "_blank");
};

const handleEmail = (email: string) => {
  window.open(`mailto:${email}`, "_self");
};

// Stage Select Cell - SUPER SIMPLE with RTK Query
const StageSelectCell = ({ row }: { row: any }) => {
  const [updateStage] = useUpdateLeadStageMutation();
  const stage = row.getValue("stage") as string;
  const leadId = row.original.id;

  const handleStageChange = async (newStage: string) => {
    try {
      await updateStage({ id: leadId, stage: newStage }).unwrap();
      console.log(`✅ Stage updated to ${newStage}`);
    } catch (error) {
      console.error("Failed to update stage:", error);
    }
  };

  return (
    <StageSelect
      value={stage}
      onValueChange={handleStageChange}
      options={LEAD_STAGES}
      placeholder="Select stage..."
    />
  );
};

// Actions Cell
const ActionsCell = ({ row }: { row: any }) => {
  const [deleteLead] = useDeleteLeadMutation();
  const router = useRouter();
  const lead = row.original;

  const handleDelete = async () => {
    if (window.confirm(`Delete lead "${lead.name}"?`)) {
      try {
        await deleteLead(lead.id).unwrap();
        console.log(`✅ Lead ${lead.name} deleted`);
      } catch (error) {
        console.error("Failed to delete lead:", error);
        alert("Failed to delete lead");
      }
    }
  };

  const handleViewDetails = () => {
    router.push(`/sample-table/${lead.id}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => navigator.clipboard.writeText(lead.id)}
        >
          Copy ID
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => navigator.clipboard.writeText(lead.email)}
        >
          Copy Email
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleViewDetails}>
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem>Edit Lead</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleDelete}
          className="text-red-600 hover:text-red-700"
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const columns: ColumnDef<Lead>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
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
        Name <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "createdOn",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <ListFilter className="ml-2 h-4 w-4" /> Created On
      </Button>
    ),
  },
  {
    accessorKey: "stage",
    header: "Stage",
    cell: StageSelectCell,
  },
  {
    accessorKey: "leadScore",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Lead Score <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const score = row.getValue("leadScore") as number;
      return (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            score >= 80
              ? "bg-green-100 text-green-800"
              : score >= 60
              ? "bg-yellow-100 text-yellow-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {score}
        </span>
      );
    },
  },
  {
    accessorKey: "contact",
    header: "Contact",
    cell: ({ row }) => {
      const contact = row.getValue("contact") as string;
      const email =
        row.original.email ||
        `${row.original.name.toLowerCase().replace(/\s+/g, ".")}@example.com`;

      return (
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handlePhoneCall(contact)}
                >
                  <Phone className="h-4 w-4 text-gray-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Call {contact}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleWhatsApp(contact)}
                >
                  <MessageCircle className="h-4 w-4 text-green-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>WhatsApp {contact}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleEmail(email)}
                >
                  <Mail className="h-4 w-4 text-blue-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Email {email}</p>
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
  },
  {
    accessorKey: "media",
    header: "Media",
  },
  {
    accessorKey: "lastActivity",
    header: "Last Activity",
  },
  {
    accessorKey: "department",
    header: "Department",
  },
  {
    accessorKey: "notes",
    header: "Notes",
    cell: ({ row }) => {
      const notes = row.getValue("notes") as string;
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <FileText className="h-4 w-4 text-gray-600" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-sm">{notes}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    id: "actions",
    cell: ActionsCell,
  },
];
