// src/components/tasks/TasksContainer.tsx

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  PlusIcon,
  Loader2,
  AlertCircle,
  BarChart3,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import { Task } from "@/models/types/task";
import { useGetLeadTasksQuery } from "@/redux/slices/tasksApi";
import TaskCard from "./TaskCard";
import TaskEditor from "./TaskEditor";
import TaskStats from "./TaskStats";

interface TasksContainerProps {
  leadId: string;
}

const TasksContainer: React.FC<TasksContainerProps> = ({ leadId }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("due_date");

  // API queries
  const {
    data: tasksData,
    isLoading,
    error,
    refetch,
  } = useGetLeadTasksQuery({
    leadId,
    status_filter: statusFilter === "all" ? undefined : statusFilter,
  });

  const tasks = tasksData?.tasks || [];
  const stats = tasksData?.stats || {
    total_tasks: 0,
    pending_tasks: 0,
    overdue_tasks: 0,
    due_today: 0,
    completed_tasks: 0,
    in_progress_tasks: 0,
  };

  // If stats are empty from API, calculate them from tasks
  const calculatedStats = React.useMemo(() => {
    if (tasks.length === 0) {
      return stats;
    }

    // If API didn't return proper stats, calculate from tasks
    const hasValidStats = stats.total_tasks! > 0 || tasks.length === 0;

    if (hasValidStats) {
      return stats;
    }

    // Calculate stats from tasks
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    return {
      total_tasks: tasks.length,
      pending_tasks: tasks.filter((t) => t.status === "pending").length,
      overdue_tasks: tasks.filter((t) => t.is_overdue).length,
      due_today: tasks.filter(
        (t) => t.due_date === today && t.status !== "completed"
      ).length,
      completed_tasks: tasks.filter((t) => t.status === "completed").length,
      in_progress_tasks: tasks.filter((t) => t.status === "in_progress").length,
    };
  }, [tasks, stats]);

  // Filter and sort tasks based on local state
  const filteredAndSortedTasks = React.useMemo(() => {
    // Create a mutable copy of the tasks array to avoid mutation errors
    let filteredTasks = [...tasks];

    // Apply search filter
    if (searchQuery) {
      filteredTasks = filteredTasks.filter(
        (task) =>
          task.task_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.task_description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          task.assigned_to_name
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting (now safe since we have a mutable copy)
    filteredTasks.sort((a, b) => {
      switch (sortBy) {
        case "due_date":
          return (
            new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
          );
        case "priority":
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          return (
            (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) -
            (priorityOrder[a.priority as keyof typeof priorityOrder] || 0)
          );
        case "created_at":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "task_title":
          return a.task_title.localeCompare(b.task_title);
        default:
          return 0;
      }
    });

    return filteredTasks;
  }, [tasks, searchQuery, sortBy]);

  // Status filter options
  const statusOptions = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "in_progress", label: "In Progress" },
    { value: "overdue", label: "Overdue" },
    { value: "completed", label: "Completed" },
  ];

  // Sort options
  const sortOptions = [
    { value: "due_date", label: "Due Date" },
    { value: "priority", label: "Priority" },
    { value: "created_at", label: "Created Date" },
    { value: "task_title", label: "Task Title" },
  ];

  // Handlers
  const handleCreateTask = () => {
    setEditingTask(undefined);
    setIsEditorOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setEditingTask(undefined);
  };

  const handleTaskSelect = (taskId: string) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-gray-600 mb-4">Failed to load tasks</p>
          <Button onClick={() => refetch()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Task Statistics */}
      <TaskStats stats={calculatedStats} isLoading={isLoading} />

      {/* Filtering Header */}
      <div className="space-y-4">
        {/* First Row: Search + New Task Button */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-gray-300"
            />
          </div>

          <Button
            onClick={handleCreateTask}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4" />
            New task
          </Button>
        </div>

        {/* Second Row: Filter Options */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            More filters
          </Button>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-gray-500" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      {filteredAndSortedTasks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <BarChart3 className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery || statusFilter !== "all"
              ? "No tasks match your filters"
              : "No tasks yet"}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || statusFilter !== "all"
              ? "Try adjusting your search criteria or filters"
              : "Start by creating your first task for this lead"}
          </p>
          {!searchQuery && statusFilter === "all" && (
            <Button onClick={handleCreateTask}>Create First Task</Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAndSortedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isSelected={selectedTasks.includes(task.id)}
              onSelect={handleTaskSelect}
              onEdit={handleEditTask}
            />
          ))}
        </div>
      )}

      {/* Task Editor Modal */}
      <TaskEditor
        isOpen={isEditorOpen}
        onClose={handleCloseEditor}
        leadId={leadId}
        task={editingTask}
      />
    </div>
  );
};

export default TasksContainer;
