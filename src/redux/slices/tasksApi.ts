// src/redux/slices/tasksApi.ts

import { createApi } from "@reduxjs/toolkit/query/react";
import {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  TasksResponse,
  CompleteTaskRequest,
  TaskStats,
  AssignableUsersResponse,
} from "@/models/types/task";
import { createBaseQueryWithReauth } from "../utils/baseQuerryWithReauth";

// Base query with authentication and auto-refresh
const baseQuery = createBaseQueryWithReauth(
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
);

// Transform API response to match our frontend types
const transformTask = (apiTask: Record<string, unknown>): Task => ({
  id: apiTask.id as string,
  task_title: apiTask.task_title as string,
  task_description: apiTask.task_description as string,
  task_type: apiTask.task_type as
    | "call"
    | "email"
    | "meeting"
    | "follow_up"
    | "other",
  priority: apiTask.priority as "low" | "medium" | "high" | "urgent",
  assigned_to: apiTask.assigned_to as string,
  assigned_to_name: apiTask.assigned_to_name as string,
  due_date: apiTask.due_date as string,
  due_time: apiTask.due_time as string,
  notes: apiTask.notes as string,
  lead_id: apiTask.lead_id as string,
  status: apiTask.status as
    | "pending"
    | "in_progress"
    | "completed"
    | "overdue"
    | "cancelled",
  string: apiTask.string as string,
  created_by: apiTask.created_by as string,
  created_by_name: apiTask.created_by_name as string,
  created_at: apiTask.created_at as string,
  updated_at: apiTask.updated_at as string,
  completed_at: apiTask.completed_at as string,
  is_overdue: apiTask.is_overdue as boolean,
});

export const tasksApi = createApi({
  reducerPath: "tasksApi",
  baseQuery,
  tagTypes: ["Task"],
  endpoints: (builder) => ({
    getLeadTasks: builder.query<
      TasksResponse,
      { leadId: string; status_filter?: string }
    >({
      query: ({ leadId, status_filter }) => {
        const params = new URLSearchParams();
        if (status_filter) params.append("status_filter", status_filter);
        return `/tasks/leads/${leadId}/tasks?${params.toString()}`;
      },
      transformResponse: (response: unknown): TasksResponse => {
        const parsed = response as {
          tasks?: Record<string, unknown>[];
          total?: number;
          stats?: TaskStats;
        };
        return {
          tasks: parsed.tasks?.map(transformTask) || [],
          total: parsed.total || 0,
          stats: parsed.stats || {
            total_tasks: 0,
            pending_tasks: 0,
            overdue_tasks: 0,
            due_today: 0,
            completed_tasks: 0,
            in_progress_tasks: 0,
          },
        };
      },
      providesTags: (result, _error, { leadId }) => [
        { type: "Task", id: "LIST" },
        { type: "Task", id: leadId },
      ],
    }),

    getLeadTaskStats: builder.query<TaskStats, string>({
      query: (leadId) => `/tasks/leads/${leadId}/tasks/stats`,
      providesTags: (result, _error, leadId) => [
        { type: "Task", id: `${leadId}-stats` },
      ],
    }),

    getTask: builder.query<Task, string>({
      query: (taskId) => `/tasks/${taskId}`,
      transformResponse: (response: unknown): Task => {
        return transformTask(response as Record<string, unknown>);
      },
      providesTags: (result, _error, id) => [{ type: "Task", id }],
    }),

    createTask: builder.mutation<
      { message: string },
      { leadId: string; taskData: CreateTaskRequest }
    >({
      query: ({ leadId, taskData }) => ({
        url: `/tasks/leads/${leadId}/tasks`,
        method: "POST",
        body: taskData,
      }),
      invalidatesTags: (_result, _error, { leadId }) => [
        { type: "Task", id: "LIST" },
        { type: "Task", id: leadId },
        { type: "Task", id: `${leadId}-stats` },
      ],
    }),

    updateTask: builder.mutation<
      { message: string },
      { taskId: string; taskData: UpdateTaskRequest }
    >({
      query: ({ taskId, taskData }) => ({
        url: `/tasks/${taskId}`,
        method: "PUT",
        body: taskData,
      }),
      invalidatesTags: (_result, _error, { taskId }) => [
        { type: "Task", id: taskId },
        { type: "Task", id: "LIST" },
      ],
    }),

    getAssignableUsers: builder.query<AssignableUsersResponse, string>({
      query: (leadId) => `/tasks/tasks/assignable-users?lead_id=${leadId}`,
      transformResponse: (response: unknown): AssignableUsersResponse => {
        const parsed = response as AssignableUsersResponse;
        return {
          success: parsed.success,
          users: parsed.users || [],
          lead_id: parsed.lead_id,
          total_assigned_users: parsed.total_assigned_users || 0,
          assignment_summary: parsed.assignment_summary || {
            primary_assignee: "",
            co_assignees_count: 0,
            is_multi_assigned: false,
          },
        };
      },
      providesTags: (result, _error, leadId) => [
        { type: "Task", id: `${leadId}-assignable-users` },
      ],
    }),

    completeTask: builder.mutation<
      { message: string },
      { taskId: string; completionData: CompleteTaskRequest }
    >({
      query: ({ taskId, completionData }) => ({
        url: `/tasks/${taskId}/complete`,
        method: "PATCH",
        body: completionData,
      }),
      invalidatesTags: (_result, _error, { taskId }) => [
        { type: "Task", id: taskId },
        { type: "Task", id: "LIST" },
      ],
    }),

    deleteTask: builder.mutation<{ message: string }, string>({
      query: (taskId) => ({
        url: `/tasks/${taskId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, taskId) => [
        { type: "Task", id: taskId },
        { type: "Task", id: "LIST" },
      ],
    }),

    getMyTasks: builder.query<TasksResponse, { status_filter?: string }>({
      query: ({ status_filter }) => {
        const params = new URLSearchParams();
        if (status_filter) params.append("status_filter", status_filter);
        return `/tasks/my-tasks?${params.toString()}`;
      },
      transformResponse: (response: unknown): TasksResponse => {
        const parsed = response as {
          tasks?: Record<string, unknown>[];
          total?: number;
          stats?: TaskStats;
        };
        return {
          tasks: parsed.tasks?.map(transformTask) || [],
          total: parsed.total || 0,
          stats: parsed.stats || {
            total_tasks: 0,
            pending_tasks: 0,
            overdue_tasks: 0,
            due_today: 0,
            completed_tasks: 0,
            in_progress_tasks: 0,
          },
        };
      },
      providesTags: [{ type: "Task", id: "MY_TASKS" }],
    }),
  }),
});

export const {
  useGetLeadTasksQuery,
  useGetLeadTaskStatsQuery,
  useGetTaskQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useGetAssignableUsersQuery,
  useCompleteTaskMutation,
  useDeleteTaskMutation,
  useGetMyTasksQuery,
} = tasksApi;
