// src/app/my-tasks/columns.tsx

import { ColumnDef, Row } from "@tanstack/react-table";
import {
  ArrowUpDown,
  MoreHorizontal,
  Loader2,
  CheckCircle,
  Edit,
  ArrowRight,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { useState } from "react";
import { Task } from "@/models/types/task";
import { useCompleteTaskMutation } from "@/redux/slices/tasksApi";
import { useNotifications } from "@/components/common/NotificationSystem";
import { formatDate } from "@/utils/formatDate";
import Link from "next/link";

// Priority color mapping
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "urgent":
      return "bg-red-100 text-red-800 border-red-200";
    case "high":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "medium":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "low":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

// Status color mapping
const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800 border-green-200";
    case "in_progress":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "overdue":
      return "bg-red-100 text-red-800 border-red-200";
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "cancelled":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

// Actions Cell Component
const ActionsCell = ({ row }: { row: Row<Task> }) => {
  const [isCompleting, setIsCompleting] = useState(false);
  const [completeTask] = useCompleteTaskMutation();
  const { showSuccess, showError } = useNotifications();

  const task = row.original;

  const handleCompleteTask = async () => {
    if (task.status === "completed") return;

    setIsCompleting(true);
    try {
      await completeTask({
        taskId: task.id,
        completionData: { completion_notes: "" },
      }).unwrap();
      showSuccess(`Task "${task.task_title}" marked as completed!`);
    } catch (error) {
      showError("Failed to complete task");
      console.error("Error completing task:", error);
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => navigator.clipboard.writeText(task.lead_id)}
        >
          Copy Lead ID
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        {task.status !== "completed" && (
          <DropdownMenuItem
            onClick={handleCompleteTask}
            disabled={isCompleting}
          >
            {isCompleting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Completing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Complete Task
              </span>
            )}
          </DropdownMenuItem>
        )}

        <DropdownMenuItem>
          <Edit className="h-4 w-4 mr-2" />
          Edit Task
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        {/* <DropdownMenuItem
          onClick={handleDeleteTask}
          className="text-red-600 hover:text-red-700"
          disabled={isDeleting}
        >
          {isDeleting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Deleting...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Delete Task
            </span>
          )}
        </DropdownMenuItem> */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Main columns factory function
export const createColumns = (): ColumnDef<Task>[] => [
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
    accessorKey: "lead_name",
    header: "Lead Name",
    cell: ({ row }) => {
      const task = row.original;
      return <div className="text-sm">{task.lead_name}</div>;
    },
  },
  {
    accessorKey: "task_title",
    header: "Task",
    cell: ({ row }) => {
      const task = row.original;
      return (
        <div className=" max-w-[200px]">
          <div className="truncate" title={task.task_title}>
            {task.task_title}
          </div>
          {task.task_description && (
            <div
              className="text-xs text-gray-500 truncate"
              title={task.task_description}
            >
              {task.task_description}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "created_by_name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="w-full"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Created by
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const createdByName = row.getValue("created_by_name") as string;
      return (
        <div className="flex items-center">
          <div className="flex items-center gap-2">
            <Avatar className="w-4 h-4 bg-blue-500">
              <AvatarFallback className="text-xs text-white bg-blue-500">
                {createdByName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className=" text-gray-900 text-sm">{createdByName}</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "assigned_to_name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="w-full"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Assigned to
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const assignedToName = row.getValue("assigned_to_name") as string;
      return (
        <div className="flex items-center">
          {assignedToName && assignedToName !== "Unassigned" ? (
            <div className="flex items-center gap-2">
              <Avatar className="w-4 h-4 bg-gray-300">
                <AvatarFallback className="text-xs text-gray-600 bg-gray-300">
                  {assignedToName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className=" text-gray-900 text-sm">{assignedToName}</span>
            </div>
          ) : (
            <Badge variant="outline">Unassigned</Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "lead_id",
    header: "View Lead",
    cell: ({ row }) => {
      const leadId = row.getValue("lead_id") as string;
      return (
        <div className="flex items-center justify-center">
          <Link href={`/my-leads/${leadId}`}>
            <Button variant={"outline"} size={"sm"}>
              <ArrowRight />
            </Button>
          </Link>
        </div>
      );
    },
  },
  {
    accessorKey: "task_type",
    header: "Type",
    cell: ({ row }) => {
      const taskType = row.getValue("task_type") as string;
      return (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs capitalize">
            {taskType.replace("_", " ")}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "priority",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Priority
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const priority = row.getValue("priority") as string;
      return (
        <Badge
          variant="outline"
          className={`text-xs capitalize ${getPriorityColor(priority)}`}
        >
          {priority}
        </Badge>
      );
    },
  },
  {
    accessorKey: "due_date",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Due Date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const task = row.original;
      const dueDate = task.due_date;
      const dueTime = task.due_time;

      if (!dueDate) {
        return (
          <Badge variant="secondary" className="text-xs">
            No due date
          </Badge>
        );
      }

      return (
        <div className="text-sm">
          <div className={``}>{formatDate(dueDate)}</div>
          {dueTime && <div className={`text-xs `}>{dueTime}</div>}
        </div>
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
      return (
        <Badge
          variant="outline"
          className={`text-xs capitalize ${getStatusColor(status)}`}
        >
          {status.replace("_", " ")}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => <ActionsCell row={row} />,
  },
];

// Mobile columns for responsive design
export const createMobileColumns = (): ColumnDef<Task>[] => [
  {
    accessorKey: "task_title",
    header: "Task",
    cell: ({ row }) => (
      <div className=" text-base">{row.getValue("task_title")}</div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge
          variant="outline"
          className={`text-xs capitalize ${getStatusColor(status)}`}
        >
          {status.replace("_", " ")}
        </Badge>
      );
    },
  },
  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => {
      const priority = row.getValue("priority") as string;
      return (
        <Badge
          variant="outline"
          className={`text-xs capitalize ${getPriorityColor(priority)}`}
        >
          {priority}
        </Badge>
      );
    },
  },
  {
    accessorKey: "assigned_to_name",
    header: "Assigned To",
    cell: ({ row }) => {
      const assignedToName = row.getValue("assigned_to_name") as string;
      return (
        // <div className="text-sm">
        //   {assignedToName && assignedToName !== "Unassigned" ? (
        //     <span className="text-gray-900">{assignedToName}</span>
        //   ) : (
        //     <Badge variant="secondary" className="text-xs">
        //       Unassigned
        //     </Badge>
        //   )}
        // </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-xs text-white ">
              {assignedToName.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className=" text-gray-900 text-sm">{assignedToName}</span>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <ActionsCell row={row} />,
    enableSorting: false,
  },
];
