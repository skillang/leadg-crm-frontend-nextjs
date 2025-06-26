// src/components/tasks/TaskCard.tsx

"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Phone,
  Mail,
  Calendar,
  Users,
  Clock,
  CheckCircle,
  Edit3,
  Trash2,
} from "lucide-react";
import { Task } from "@/models/types/task";
import {
  useCompleteTaskMutation,
  useDeleteTaskMutation,
} from "@/redux/slices/tasksApi";
import { cn } from "@/lib/utils";

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
  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();

  const handleComplete = async () => {
    try {
      await completeTask({
        taskId: task.id,
        completionData: { completion_notes: "Task completed via UI" },
      }).unwrap();
      console.log("Task completed successfully");
    } catch (error) {
      console.error("Failed to complete task:", error);
      alert("Failed to complete task. Please try again.");
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
          className: "bg-gray-100 text-gray-700 border-gray-200",
        };
      default:
        return {
          text: status.replace("_", " "),
          className: "bg-gray-100 text-gray-700 border-gray-200",
        };
    }
  };

  // Format date to show Today/Yesterday/Date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
      return { text: "Today", isOverdue: false };
    } else if (isYesterday) {
      return { text: "Yesterday", isOverdue: task.is_overdue };
    } else {
      return {
        text: date.toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
        }),
        isOverdue: task.is_overdue,
      };
    }
  };

  // Format time to 12-hour format
  const formatTime = (timeString: string) => {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const isCompleted = task.status === "completed";
  const priorityBadge = getPriorityBadge(task.priority);
  const statusBadge = getStatusBadge(task.status);
  const dateInfo = formatDate(task.due_date);

  return (
    <Card
      className={cn(
        "transition-all duration-200 hover:shadow-sm border border-gray-200 bg-white",
        isSelected && "ring-2 ring-blue-500",
        isCompleted && "opacity-75",
        className
      )}
    >
      <CardContent className="p-4">
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

          {/* Task Icon */}
          <div className="mt-0.5">{getTaskIcon(task.task_type)}</div>

          {/* Task Content */}
          <div className="flex-1 space-y-3">
            {/* Task Title */}
            <h3
              className={cn(
                "text-blue-600 font-medium cursor-pointer hover:underline text-sm",
                isCompleted && "line-through text-gray-500"
              )}
              onClick={handleEdit}
            >
              {task.task_title}
            </h3>

            {/* Task Details Grid */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              {/* Left Column */}
              <div className="space-y-2">
                <div>
                  <span className="text-gray-500">Type:</span>
                  <p className="font-medium text-gray-900 capitalize">
                    {task.task_type}
                  </p>
                </div>

                <div>
                  <span className="text-gray-500">Due date:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span
                      className={cn(
                        "font-medium",
                        dateInfo.isOverdue && !isCompleted
                          ? "text-red-600"
                          : "text-gray-900"
                      )}
                    >
                      {dateInfo.text}
                    </span>
                    <Clock className="h-4 w-4 text-gray-400 ml-2" />
                    <span className="font-medium text-gray-900">
                      {formatTime(task.due_time)}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-gray-500">Priority:</span>
                  <div className="mt-1">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs font-medium",
                        priorityBadge.className
                      )}
                    >
                      {priorityBadge.text}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-2">
                <div>
                  <span className="text-gray-500">Assigned to:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-medium">
                        {task.assigned_to_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <p className="font-medium text-gray-900">
                      {task.assigned_to_name}
                    </p>
                  </div>
                </div>

                <div>
                  <span className="text-gray-500">Status:</span>
                  <div className="mt-1">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs font-medium",
                        statusBadge.className
                      )}
                    >
                      {statusBadge.text}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mark as Complete Button */}
          {!isCompleted && (
            <div className="flex items-center">
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
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskCard;
