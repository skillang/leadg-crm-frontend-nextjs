// src/components/tasks/TaskCard.tsx

"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Phone, Mail, Calendar, Users, Clock, CheckCircle } from "lucide-react";
import { Task } from "@/models/types/task";
import { useCompleteTaskMutation } from "@/redux/slices/tasksApi";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/components/common/NotificationSystem";
import { twoTileDateTime } from "@/utils/formatDate";

interface TaskCardProps {
  task: Task;
  isSelected?: boolean;
  onSelect?: (taskId: string) => void;
  onEdit?: (task: Task) => void;
  className?: string;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isSelected = false,
  onSelect,
  onEdit,
  className,
}) => {
  const [completeTask, { isLoading: isCompleting }] = useCompleteTaskMutation();
  const { showSuccess, showError } = useNotifications();

  const handleComplete = async () => {
    try {
      await completeTask({
        taskId: task.id,
        completionData: { completion_notes: "Task completed via UI" },
      }).unwrap();
      showSuccess(
        `Task "${task.task_title}" has been marked as completed successfully!`,
        "Task Completed"
      );
    } catch (error) {
      console.error("Failed to complete task:", error);
      showError(
        "Failed to complete task. Please try again.",
        "Task Completion Error"
      );
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(task);
    }
  };

  const handleSelect = () => {
    if (onSelect) {
      onSelect(task.id);
    }
  };

  // Get task type icon
  const getTaskIcon = (type: string) => {
    switch (type) {
      case "call":
        return <Phone className="h-4 w-4 text-blue-600" />;
      case "email":
        return <Mail className="h-4 w-4 text-blue-600" />;
      case "meeting":
        return <Users className="h-4 w-4 text-blue-600" />;
      default:
        return <Calendar className="h-4 w-4 text-blue-600" />;
    }
  };

  // Get priority badge styling
  const getPriorityBadge = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "urgent":
        return {
          text: "Urgent",
          className: "bg-red-100 text-red-700 border-red-200",
        };
      case "high":
        return {
          text: "High",
          className: "bg-red-100 text-red-700 border-red-200",
        };
      case "medium":
        return {
          text: "Medium",
          className: "bg-yellow-100 text-yellow-700 border-yellow-200",
        };
      case "low":
        return {
          text: "Low",
          className: "bg-green-100 text-green-700 border-green-200",
        };
      default:
        return {
          text: priority,
          className: "bg-gray-100 text-gray-700 border-gray-200",
        };
    }
  };

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return {
          text: "Completed",
          className: "bg-green-100 text-green-700 border-green-200",
        };
      case "overdue":
        return {
          text: "Overdue",
          className: "bg-red-100 text-red-700 border-red-200",
        };
      case "in_progress":
        return {
          text: "In Progress",
          className: "bg-blue-100 text-blue-700 border-blue-200",
        };
      case "pending":
        return {
          text: "Pending",
          className: "",
        };
      default:
        return {
          text: status.replace("_", " "),
          className: "bg-gray-100 text-gray-700 border-gray-200",
        };
    }
  };

  const isCompleted = task.status === "completed";
  const priorityBadge = getPriorityBadge(task.priority);
  const statusBadge = getStatusBadge(task.status);
  const { dateText, timeText } = twoTileDateTime(task.due_date);
  const isOverdue = task.is_overdue && !isCompleted;

  return (
    <Card
      className={cn(
        "transition-all duration-200 hover:shadow-sm border border-gray-200 bg-white",
        isSelected && "ring-2 ring-blue-500",
        isCompleted && "opacity-75",
        isOverdue && "border-red-200 bg-red-50",
        className
      )}
    >
      <CardContent className="">
        {/* Title Section - Outside Table */}
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          {onSelect && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={handleSelect}
              aria-label="Select task"
              className="mt-0.5"
            />
          )}

          {/* Task Icon and Title */}
          <div className="flex items-center gap-3 flex-1">
            {getTaskIcon(task.task_type)}
            <span
              className={cn(
                "text-blue-600 font-medium cursor-pointer hover:underline text-sm",
                isCompleted && "line-through text-gray-500",
                isOverdue && "text-red-600"
              )}
              onClick={handleEdit}
            >
              {task.task_title}
            </span>
          </div>

          {/* Mark as Complete Button */}
          {!isCompleted && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleComplete}
              disabled={isCompleting}
              className="text-green-600 hover:text-green-700 hover:bg-green-50 text-xs"
            >
              {isCompleting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-1" />
              )}
              Mark as complete
            </Button>
          )}
        </div>

        {/* Details Table */}
        <Table>
          <TableBody>
            {/* Type Row */}
            <TableRow className="border-b border-gray-100 hover:bg-transparent">
              <TableCell className="py-2 text-gray-500 text-sm font-normal w-32">
                Type:
              </TableCell>
              <TableCell className="py-2">
                <span className="capitalize text-gray-900 font-medium text-sm">
                  {task.task_type}
                </span>
              </TableCell>
            </TableRow>

            {/* Assigned To Row */}
            <TableRow className="border-b border-gray-100 hover:bg-transparent">
              <TableCell className="py-2 text-gray-500 text-sm font-normal">
                Assigned to:
              </TableCell>
              <TableCell className="py-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">
                      {task.assigned_to_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-medium text-gray-900 text-sm">
                    {task.assigned_to_name}
                  </span>
                </div>
              </TableCell>
            </TableRow>

            <TableRow className="border-b border-gray-100 hover:bg-transparent">
              <TableCell className="py-2 text-gray-500 text-sm font-normal">
                Desciption:
              </TableCell>
              <TableCell className="py-2">
                {task.task_description ? (
                  <span className="capitalize text-gray-700 text-sm">
                    {task.task_description}
                  </span>
                ) : (
                  <p>No Description Provided</p>
                )}
              </TableCell>
            </TableRow>

            {/* Due Date Row */}
            <TableRow className="border-b border-gray-100 hover:bg-transparent">
              <TableCell className="py-2 text-gray-500 text-sm font-normal">
                Due date:
              </TableCell>
              <TableCell className="py-2">
                <div className="flex items-center gap-4">
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <Calendar className="h-4 w-4" />
                    <span
                      className={cn(
                        "text-xs",
                        isOverdue && !isCompleted
                          ? "text-red-600"
                          : "text-gray-900"
                      )}
                    >
                      {dateText}
                    </span>
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span
                      className={cn(
                        "text-xs",
                        isOverdue && !isCompleted
                          ? "text-red-600"
                          : "text-gray-900"
                      )}
                    >
                      {timeText}
                    </span>
                  </Badge>
                </div>
              </TableCell>
            </TableRow>

            {/* Status Row */}
            <TableRow className="border-b border-gray-100 hover:bg-transparent">
              <TableCell className="py-2 text-gray-500 text-sm font-normal">
                Status:
              </TableCell>
              <TableCell className="py-2">
                <Badge
                  variant="secondary"
                  className={cn("text-xs ", statusBadge.className)}
                >
                  {statusBadge.text}
                </Badge>
              </TableCell>
            </TableRow>

            {/* Priority Row */}
            <TableRow className="hover:bg-transparent">
              <TableCell className="py-2 text-gray-500 text-sm font-normal">
                Priority:
              </TableCell>
              <TableCell className="py-2">
                <Badge
                  variant="outline"
                  className={cn("text-xs font-medium", priorityBadge.className)}
                >
                  {priorityBadge.text}
                </Badge>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default TaskCard;
