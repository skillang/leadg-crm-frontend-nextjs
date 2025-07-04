// src/models/types/task.ts

// Single task object
export interface Task {
  id: string;
  task_title: string;
  task_description: string;
  priority: "low" | "medium" | "high" | "urgent";
  task_type: "call" | "email" | "meeting" | "follow_up" | "other";
  string: string;
  assigned_to: string;
  assigned_to_name: string;
  due_date: string; // ISO 8601 string (e.g., "2025-07-01")
  due_time: string; // e.g., "14:30"
  notes: string;
  lead_id: string;
  status: "pending" | "in_progress" | "completed" | "overdue" | "cancelled";
  created_by: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  is_overdue: boolean;
}

// Task creation
export interface CreateTaskRequest {
  task_title: string;
  task_description: string;
  priority: "low" | "medium" | "high" | "urgent";
  task_type: "call" | "email" | "meeting" | "follow_up" | "other";
  string: string;
  assigned_to: string;
  due_date: string;
  due_time: string;
  notes: string;
}

// Partial task update
export interface UpdateTaskRequest {
  task_title?: string;
  task_description?: string;
  priority: "low" | "medium" | "high" | "urgent";
  task_type?: "call" | "email" | "meeting" | "follow_up" | "other";
  string?: string;
  assigned_to?: string;
  due_date?: string;
  due_time?: string;
  notes?: string;
  status?: "pending" | "in_progress" | "completed" | "overdue" | "cancelled";
}

// Used for marking completion
export interface CompleteTaskRequest {
  completion_notes: string;
}

// Stats returned with task lists
export interface TaskStats {
  total_tasks?: number;
  pending_tasks?: number;
  overdue_tasks?: number;
  due_today?: number;
  completed_tasks?: number;
  in_progress_tasks?: number;
}

// List of tasks with stats
export interface TasksResponse {
  tasks: Task[];
  total: number;
  stats: TaskStats;
}
