// Updated TaskEditor.tsx with integrated date/time picker

"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDownIcon, Calendar as CalendarIcon, Clock } from "lucide-react";
import {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
} from "@/models/types/task";
import {
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useGetAssignableUsersQuery,
} from "@/redux/slices/tasksApi";
import { useNotifications } from "@/components/common/NotificationSystem";

interface TaskEditorProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  task?: Task; // If provided, we're editing; otherwise creating
}

// Define the form data type
type TaskFormData = {
  task_title: string;
  task_description: string;
  task_type: "call" | "email" | "meeting" | "follow_up" | "other";
  priority: "low" | "medium" | "high" | "urgent";
  assigned_to: string;
  due_date: string;
  due_time: string;
  notes: string;
};

const TaskEditor: React.FC<TaskEditorProps> = ({
  isOpen,
  onClose,
  leadId,
  task,
}) => {
  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();
  const {
    data: assignableUsersData,
    isLoading: isLoadingUsers,
    error: usersError,
  } = useGetAssignableUsersQuery(leadId);

  // Add state for date picker popover
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const [formData, setFormData] = useState<TaskFormData>({
    task_title: "",
    task_description: "",
    task_type: "call",
    priority: "medium",
    assigned_to: "",
    due_date: "",
    due_time: "",
    notes: "",
  });

  const isEditing = !!task;
  const isLoading = isCreating || isUpdating;

  // Task type options
  const taskTypes = [
    { value: "call", label: "Call" },
    { value: "email", label: "Email" },
    { value: "meeting", label: "Meeting" },
    { value: "follow_up", label: "Follow Up" },
    { value: "other", label: "Other" },
  ] as const;

  // Priority options
  const priorityOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
  ] as const;

  const { showError } = useNotifications();

  // Reset form when task changes or dialog opens
  useEffect(() => {
    if (isOpen) {
      if (task) {
        // Editing existing task
        setFormData({
          task_title: task.task_title,
          task_description: task.task_description,
          task_type: task.task_type,
          priority: task.priority,
          assigned_to: assignableUsersData?.users?.[0]?.id || "",
          due_date: task.due_date,
          due_time: task.due_time,
          notes: task.notes,
        });
      } else {
        // Creating new task
        const primaryAssignee = assignableUsersData?.users?.find(
          (user) => user.assignment_type === "primary"
        );
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        setFormData({
          task_title: "",
          task_description: "",
          task_type: "call",
          priority: "medium",
          assigned_to: primaryAssignee?.id || "", // Default user ID to primary Assignee
          due_date: tomorrow.toISOString().split("T")[0],
          due_time: "10:00",
          notes: "",
        });
      }
    }
  }, [isOpen, task]);

  // FIXED: Properly typed function with mapped types for each field
  const handleInputChange = <K extends keyof TaskFormData>(
    field: K,
    value: TaskFormData[K]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle date selection from calendar
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const formattedDate = date.toLocaleDateString("en-CA"); // YYYY-MM-DD format
      handleInputChange("due_date", formattedDate);
    }
    setDatePickerOpen(false);
  };

  // Get selected date as Date object for calendar
  const getSelectedDate = () => {
    return formData.due_date ? new Date(formData.due_date) : undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.task_title.trim() ||
      !formData.due_date ||
      !formData.due_time
    ) {
      showError(
        "Task title, due date, and due time are required",
        "Missing Fields!"
      );
      return;
    }

    try {
      if (isEditing && task) {
        // Update existing task
        const updateData: UpdateTaskRequest = {
          task_title: formData.task_title,
          task_description: formData.task_description,
          task_type: formData.task_type,
          priority: formData.priority,
          assigned_to: formData.assigned_to,
          due_date: formData.due_date,
          due_time: formData.due_time,
          notes: formData.notes,
        };

        await updateTask({
          taskId: task.id,
          taskData: updateData,
        }).unwrap();
      } else {
        // Create new task
        const createData: CreateTaskRequest = {
          task_title: formData.task_title,
          task_description: formData.task_description,
          task_type: formData.task_type,
          string: "", // Ensure leadId is a string
          priority: formData.priority,
          assigned_to: formData.assigned_to,
          due_date: formData.due_date,
          due_time: formData.due_time,
          notes: formData.notes,
        };

        await createTask({
          leadId,
          taskData: createData,
        }).unwrap();
      }

      onClose();
    } catch (error) {
      console.error("Failed to save task:", error);
      showError(
        `Failed to ${isEditing ? "update" : "create"} task. `,
        `Please try again.`
      );
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit task" : "Create new task"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Task Title */}
          <div className="space-y-2">
            <Label htmlFor="task_title" className="text-sm font-medium">
              Task title *
            </Label>
            <Input
              id="task_title"
              value={formData.task_title}
              onChange={(e) => handleInputChange("task_title", e.target.value)}
              placeholder="Enter title"
              disabled={isLoading}
              required
            />
          </div>

          {/* Task Type and Priority Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 ">
              <Label htmlFor="task_type" className="text-sm font-medium">
                Task type *
              </Label>
              <Select
                value={formData.task_type}
                onValueChange={(value) =>
                  handleInputChange(
                    "task_type",
                    value as TaskFormData["task_type"]
                  )
                }
                disabled={isLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {taskTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority" className="text-sm font-medium">
                Priority *
              </Label>
              <Select
                value={formData.priority}
                onValueChange={(value) =>
                  handleInputChange(
                    "priority",
                    value as TaskFormData["priority"]
                  )
                }
                disabled={isLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assigned To Dropdown - Add this new section */}
          <div className="space-y-2">
            <Label htmlFor="assigned_to" className="text-sm font-medium">
              Assign to *
            </Label>
            <Select
              value={formData.assigned_to}
              onValueChange={(value) => handleInputChange("assigned_to", value)}
              disabled={isLoading || isLoadingUsers}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select assignee" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingUsers ? (
                  <SelectItem value="" disabled>
                    Loading users...
                  </SelectItem>
                ) : usersError ? (
                  <SelectItem value="" disabled>
                    Error loading users
                  </SelectItem>
                ) : (
                  assignableUsersData?.users?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{user.name}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({user.assignment_type})
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {isLoadingUsers && (
              <p className="text-xs text-gray-500">
                Loading assignable users...
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="task_description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="task_description"
              value={formData.task_description}
              onChange={(e) =>
                handleInputChange("task_description", e.target.value)
              }
              placeholder="Write Description"
              className="min-h-[80px] resize-vertical"
              disabled={isLoading}
            />
          </div>

          {/* Due Date and Time Row - UPDATED WITH POPOVER */}
          <div className="grid grid-cols-2 gap-4">
            {/* Date Picker with Popover */}
            <div className="space-y-2">
              <Label htmlFor="due_date" className="text-sm font-medium">
                Due date *
              </Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={isLoading}
                    className="w-full justify-between font-normal text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-gray-500" />
                      {formData.due_date
                        ? new Date(formData.due_date).toLocaleDateString()
                        : "Select date"}
                    </div>
                    <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto overflow-hidden p-0"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={getSelectedDate()}
                    captionLayout="dropdown"
                    onSelect={handleDateSelect}
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time Picker */}
            <div className="space-y-2">
              <Label htmlFor="due_time" className="text-sm font-medium">
                Time *
              </Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="due_time"
                  type="time"
                  value={formData.due_time}
                  onChange={(e) =>
                    handleInputChange("due_time", e.target.value)
                  }
                  disabled={isLoading}
                  required
                  className="pl-10 bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none text-sm"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Additional notes..."
              className="min-h-[60px] resize-vertical"
              disabled={isLoading}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="px-6">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {isEditing ? "Updating..." : "Creating..."}
                </div>
              ) : isEditing ? (
                "Update task"
              ) : (
                "Create task"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskEditor;
