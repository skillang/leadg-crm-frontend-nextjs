// src/models/types/task.ts

export interface Task {
  id: string;
  task_title: string;
  task_description: string;
  task_type: "call" | "email" | "meeting" | "follow_up" | "other";
  priority: "low" | "medium" | "high" | "urgent";
  assigned_to: string;
  assigned_to_name: string;
  due_date: string;
  due_time: string;
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

export interface CreateTaskRequest {
  task_title: string;
  task_description: string;
  task_type: "call" | "email" | "meeting" | "follow_up" | "other";
  priority: "low" | "medium" | "high" | "urgent";
  assigned_to: string;
  due_date: string;
  due_time: string;
  notes: string;
}

export interface UpdateTaskRequest {
  task_title?: string;
  task_description?: string;
  task_type?: "call" | "email" | "meeting" | "follow_up" | "other";
  priority?: "low" | "medium" | "high" | "urgent";
  assigned_to?: string;
  due_date?: string;
  due_time?: string;
  notes?: string;
  status?: "pending" | "in_progress" | "completed" | "overdue" | "cancelled";
}

export interface TasksResponse {
  tasks: Task[];
  total: number;
  stats: {
    total_tasks?: number;
    pending_tasks?: number;
    overdue_tasks?: number;
    due_today?: number;
    completed_tasks?: number;
    in_progress_tasks?: number;
  };
}

export interface CompleteTaskRequest {
  completion_notes: string;
}
