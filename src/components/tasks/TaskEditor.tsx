// src/components/tasks/TaskEditor.tsx

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
import { Calendar } from "lucide-react";
import {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
} from "@/models/types/task";
import {
  useCreateTaskMutation,
  useUpdateTaskMutation,
} from "@/redux/slices/tasksApi";

interface TaskEditorProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  task?: Task; // If provided, we're editing; otherwise creating
}

const TaskEditor: React.FC<TaskEditorProps> = ({
  isOpen,
  onClose,
  leadId,
  task,
}) => {
  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();

  const [formData, setFormData] = useState<{
    task_title: string;
    task_description: string;
    task_type: "call" | "email" | "meeting" | "follow_up" | "other";
    priority: "low" | "medium" | "high" | "urgent";
    assigned_to: string;
    due_date: string;
    due_time: string;
    notes: string;
  }>({
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
  ];

  // Priority options
  const priorityOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
  ];

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
          assigned_to: task.assigned_to,
          due_date: task.due_date,
          due_time: task.due_time,
          notes: task.notes,
        });
      } else {
        // Creating new task
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        setFormData({
          task_title: "",
          task_description: "",
          task_type: "call",
          priority: "medium",
          assigned_to: "6853b46a94c81d9328a29e82", // Default user ID - you might want to make this dynamic
          due_date: tomorrow.toISOString().split("T")[0],
          due_time: "10:00",
          notes: "",
        });
      }
    }
  }, [isOpen, task]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.task_title.trim() ||
      !formData.due_date ||
      !formData.due_time
    ) {
      alert("Task title, due date, and due time are required");
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

        console.log("Task updated successfully");
      } else {
        // Create new task
        const createData: CreateTaskRequest = {
          task_title: formData.task_title,
          task_description: formData.task_description,
          task_type: formData.task_type,
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

        console.log("Task created successfully");
      }

      onClose();
    } catch (error) {
      console.error("Failed to save task:", error);
      alert(
        `Failed to ${isEditing ? "update" : "create"} task. Please try again.`
      );
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
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
            <div className="space-y-2">
              <Label htmlFor="task_type" className="text-sm font-medium">
                Task type *
              </Label>
              <Select
                value={formData.task_type}
                onValueChange={(value) => handleInputChange("task_type", value)}
                disabled={isLoading}
              >
                <SelectTrigger>
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
                onValueChange={(value) => handleInputChange("priority", value)}
                disabled={isLoading}
              >
                <SelectTrigger>
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

          {/* Assign to */}
          <div className="space-y-2">
            <Label htmlFor="assigned_to" className="text-sm font-medium">
              Assign to *
            </Label>
            <Select
              value={formData.assigned_to}
              onValueChange={(value) => handleInputChange("assigned_to", value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Person" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6853b46a94c81d9328a29e82">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                    Aman Rawat
                  </div>
                </SelectItem>
                {/* Add more users here */}
              </SelectContent>
            </Select>
          </div>

          {/* Due Date and Time Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="due_date" className="text-sm font-medium">
                Due date *
              </Label>
              <div className="relative">
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) =>
                    handleInputChange("due_date", e.target.value)
                  }
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_time" className="text-sm font-medium">
                Time
              </Label>
              <Input
                id="due_time"
                type="time"
                value={formData.due_time}
                onChange={(e) => handleInputChange("due_time", e.target.value)}
                disabled={isLoading}
                required
              />
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
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6"
            >
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
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskEditor;
