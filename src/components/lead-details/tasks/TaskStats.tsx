// src/components/tasks/TaskStats.tsx

"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface TaskStatsProps {
  stats: {
    total_tasks?: number;
    pending_tasks?: number;
    overdue_tasks?: number;
    due_today?: number;
    completed_tasks?: number;
    in_progress_tasks?: number;
  };
  isLoading?: boolean;
}

const TaskStats: React.FC<TaskStatsProps> = ({ stats, isLoading = false }) => {
  // Safely extract stats with default values to prevent NaN
  const safeStats = {
    total_tasks: stats?.total_tasks || 0,
    pending_tasks: stats?.pending_tasks || 0,
    overdue_tasks: stats?.overdue_tasks || 0,
    due_today: stats?.due_today || 0,
    completed_tasks: stats?.completed_tasks || 0,
    in_progress_tasks: stats?.in_progress_tasks || 0,
  };

  const statsItems = [
    {
      label: "Total task due",
      value: Math.max(0, safeStats.total_tasks - safeStats.completed_tasks),
      className: "bg-gray-50 border-gray-200",
    },
    {
      label: "Overdue tasks",
      value: safeStats.overdue_tasks,
      className: "bg-red-50 border-red-200 text-red-600",
    },
    {
      label: "Due today",
      value: safeStats.due_today,
      className: "bg-blue-50 border-blue-200",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <Card key={i}>
              <CardContent className="">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
      {statsItems.map((item, index) => (
        <Card
          key={index}
          className={`transition-colors w-full ${item.className}`}
        >
          <CardContent className="">
            <p className="text-sm text-gray-600 font-medium">{item.label}</p>
            <p className="text-2xl font-bold mt-1">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TaskStats;
