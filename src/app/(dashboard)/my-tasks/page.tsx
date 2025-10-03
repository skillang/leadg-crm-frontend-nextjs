// src/app/my-tasks/page.tsx

"use client";
import { useMemo, useState, useCallback, useEffect } from "react";
import { createColumns } from "./columns";
import { DataTable } from "./data-table";
import { useAppSelector } from "@/redux/hooks";
import { selectIsAdmin } from "@/redux/selectors";
import { useGetMyTasksQuery } from "@/redux/slices/tasksApi";
import {
  RefreshCw,
  AlertTriangle,
  ArrowLeftToLineIcon,
  TimerIcon,
  Calendar1Icon,
  TriangleAlert,
  CheckCircle,
} from "lucide-react";
import { Task } from "@/models/types/task";
import { Button } from "@/components/ui/button";
import StatsCard from "@/components/custom/cards/StatsCard";
import { Card, CardContent } from "@/components/ui/card";

// Create a simple debounce hook
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface RTKQueryError {
  data?: {
    detail?: string;
    message?: string;
  };
  message?: string;
  status?: number;
}

export default function MyTasksPage() {
  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isClearingFilters, setIsClearingFilters] = useState(false);

  const isAdmin = useAppSelector(selectIsAdmin);
  const columns = useMemo(() => createColumns(), []);

  // Debounced search query
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // API call
  const {
    data: tasksResponse,
    isLoading,
    error,
    refetch,
  } = useGetMyTasksQuery(
    {
      status_filter: statusFilter !== "all" ? statusFilter : undefined,
    },
    {
      refetchOnMountOrArgChange: true,
    }
  );

  // Reset clearing state when API responds
  useEffect(() => {
    if (isClearingFilters && !isLoading) {
      setIsClearingFilters(false);
    }
  }, [isClearingFilters, isLoading]);

  // Search state management
  const isSearching = searchQuery !== debouncedSearchQuery;

  // Extract tasks and stats
  const { tasks, stats } = useMemo(() => {
    const extractedTasks: Task[] = tasksResponse?.tasks || [];
    const extractedStats = tasksResponse?.stats || {
      total_tasks: 0,
      pending_tasks: 0,
      overdue_tasks: 0,
      due_today: 0,
      completed_tasks: 0,
      in_progress_tasks: 0,
    };

    return { tasks: extractedTasks, stats: extractedStats };
  }, [tasksResponse]);

  // Filter tasks based on search query (client-side filtering)
  const filteredTasks = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return tasks;

    const query = debouncedSearchQuery.toLowerCase();
    return tasks.filter(
      (task) =>
        task.task_title.toLowerCase().includes(query) ||
        task.task_description.toLowerCase().includes(query) ||
        task.assigned_to_name.toLowerCase().includes(query) ||
        task.created_by_name.toLowerCase().includes(query) ||
        task.lead_id.toLowerCase().includes(query) ||
        task.task_type.toLowerCase().includes(query)
    );
  }, [tasks, debouncedSearchQuery]);

  // Event handlers
  const handleSearchChange = useCallback((newSearch: string) => {
    setSearchQuery(newSearch);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    if (statusFilter !== "all") {
      setIsClearingFilters(true);
    }
  }, [statusFilter]);

  const handleStatusFilterChange = useCallback(
    (value: string) => {
      if (value === "all" && statusFilter !== "all") {
        setIsClearingFilters(true);
      }
      setStatusFilter(value);
    },
    [statusFilter]
  );

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Error handling
  if (error) {
    const rtk_error = error as RTKQueryError;
    const errorMessage =
      rtk_error.data?.detail ||
      rtk_error.data?.message ||
      rtk_error.message ||
      "Failed to load tasks";

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-600 mb-4" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              Failed to Load Tasks
            </h3>
            <p className="text-red-700 mb-4">{errorMessage}</p>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <Card>
          <CardContent>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-gray-700">Overview</h2>
            </div>

            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
                <StatsCard
                  title="Total Tasks"
                  value={stats.total_tasks || 0}
                  icon={
                    <ArrowLeftToLineIcon className="h-7 w-7 text-blue-600" />
                  }
                  isLoading={isLoading}
                />

                <StatsCard
                  title="Pending Tasks"
                  value={stats.pending_tasks || 0}
                  icon={<TimerIcon className="h-7 w-7 text-yellow-600" />}
                  isLoading={isLoading}
                />

                <StatsCard
                  title=" Due Today"
                  value={stats.due_today || 0}
                  icon={<Calendar1Icon className="h-7 w-7 text-pink-600" />}
                  isLoading={isLoading}
                />

                <StatsCard
                  title="Overdue Tasks"
                  value={stats.overdue_tasks || 0}
                  icon={<TriangleAlert className="h-7 w-7 text-red-600" />}
                  isLoading={isLoading}
                />

                <StatsCard
                  title="Tasks In Progress"
                  value={stats.in_progress_tasks || 0}
                  icon={<RefreshCw className="h-7 w-7 text-teal-600" />}
                  isLoading={isLoading}
                />

                <StatsCard
                  title="Completed Tasks"
                  value={stats.completed_tasks || 0}
                  icon={<CheckCircle className="h-7 w-7 text-green-600" />}
                  isLoading={isLoading}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <DataTable
          columns={columns}
          data={filteredTasks}
          title={isAdmin ? "All Tasks" : "My Tasks"}
          isLoading={isLoading}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onClearSearch={handleClearSearch}
          isSearching={isSearching}
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
        />
      </div>
    </div>
  );
}
