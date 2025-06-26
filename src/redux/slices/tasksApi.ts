// src/redux/slices/tasksApi.ts

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../store";
import {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  TasksResponse,
  CompleteTaskRequest,
} from "@/models/types/task";

// Base query with authentication
const baseQuery = fetchBaseQuery({
  baseUrl:
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1",
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const token = state.auth.token;

    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

// Transform API response to match our frontend types
const transformTask = (apiTask: any): Task => ({
  id: apiTask.id,
  task_title: apiTask.task_title,
  task_description: apiTask.task_description,
  task_type: apiTask.task_type,
  priority: apiTask.priority,
  assigned_to: apiTask.assigned_to,
  assigned_to_name: apiTask.assigned_to_name,
  due_date: apiTask.due_date,
  due_time: apiTask.due_time,
  notes: apiTask.notes,
  lead_id: apiTask.lead_id,
  status: apiTask.status,
  created_by: apiTask.created_by,
  created_by_name: apiTask.created_by_name,
  created_at: apiTask.created_at,
  updated_at: apiTask.updated_at,
  completed_at: apiTask.completed_at,
  is_overdue: apiTask.is_overdue,
});

export const tasksApi = createApi({
  reducerPath: "tasksApi",
  baseQuery,
  tagTypes: ["Task"],
  endpoints: (builder) => ({
    // Get tasks for a specific lead
    getLeadTasks: builder.query<
      TasksResponse,
      {
        leadId: string;
        status_filter?: string;
      }
    >({
      query: ({ leadId, status_filter }) => {
        const params = new URLSearchParams();
        if (status_filter) params.append("status_filter", status_filter);

        return `/tasks/leads/${leadId}/tasks?${params.toString()}`;
      },
      transformResponse: (response: any): TasksResponse => ({
        tasks: response.tasks?.map(transformTask) || [],
        total: response.total || 0,
        stats: response.stats || {
          total_tasks: 0,
          pending_tasks: 0,
          overdue_tasks: 0,
          due_today: 0,
          completed_tasks: 0,
          in_progress_tasks: 0,
        },
      }),
      providesTags: (result, error, { leadId }) => [
        { type: "Task", id: "LIST" },
        { type: "Task", id: leadId },
      ],
    }),

    // Get task statistics for a lead
    getLeadTaskStats: builder.query<any, string>({
      query: (leadId) => `/tasks/leads/${leadId}/tasks/stats`,
      providesTags: (result, error, leadId) => [
        { type: "Task", id: `${leadId}-stats` },
      ],
    }),

    // Get a specific task
    getTask: builder.query<Task, string>({
      query: (taskId) => `/tasks/${taskId}`,
      transformResponse: transformTask,
      providesTags: (result, error, id) => [{ type: "Task", id }],
    }),

    // Create a new task
    createTask: builder.mutation<
      any,
      { leadId: string; taskData: CreateTaskRequest }
    >({
      query: ({ leadId, taskData }) => ({
        url: `/tasks/leads/${leadId}/tasks`,
        method: "POST",
        body: taskData,
      }),
      invalidatesTags: (result, error, { leadId }) => [
        { type: "Task", id: "LIST" },
        { type: "Task", id: leadId },
        { type: "Task", id: `${leadId}-stats` },
      ],
    }),

    // Update a task
    updateTask: builder.mutation<
      any,
      { taskId: string; taskData: UpdateTaskRequest }
    >({
      query: ({ taskId, taskData }) => ({
        url: `/tasks/${taskId}`,
        method: "PUT",
        body: taskData,
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: "Task", id: taskId },
        { type: "Task", id: "LIST" },
      ],
    }),

    // Complete a task
    completeTask: builder.mutation<
      any,
      { taskId: string; completionData: CompleteTaskRequest }
    >({
      query: ({ taskId, completionData }) => ({
        url: `/tasks/${taskId}/complete`,
        method: "PATCH",
        body: completionData,
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: "Task", id: taskId },
        { type: "Task", id: "LIST" },
      ],
    }),

    // Delete a task
    deleteTask: builder.mutation<any, string>({
      query: (taskId) => ({
        url: `/tasks/${taskId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, taskId) => [
        { type: "Task", id: taskId },
        { type: "Task", id: "LIST" },
      ],
    }),

    // Get my tasks (across all leads)
    getMyTasks: builder.query<
      TasksResponse,
      {
        status_filter?: string;
      }
    >({
      query: ({ status_filter }) => {
        const params = new URLSearchParams();
        if (status_filter) params.append("status_filter", status_filter);

        return `/tasks/my-tasks?${params.toString()}`;
      },
      transformResponse: (response: any): TasksResponse => ({
        tasks: response.tasks?.map(transformTask) || [],
        total: response.total || 0,
        stats: response.stats || {},
      }),
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
  useCompleteTaskMutation,
  useDeleteTaskMutation,
  useGetMyTasksQuery,
} = tasksApi;
