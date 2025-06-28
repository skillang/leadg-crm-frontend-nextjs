// src/components/timeline/TimelineFiltersPanel.tsx

"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { TimelineFilters, ActivityType } from "@/models/types/timeline";

interface TimelineFiltersPanelProps {
  filters: TimelineFilters;
  onFilterChange: (key: keyof TimelineFilters, value: any) => void;
  activityTypes: ActivityType[];
}

const TimelineFiltersPanel: React.FC<TimelineFiltersPanelProps> = ({
  filters,
  onFilterChange,
  activityTypes,
}) => {
  // Get today's date for date inputs
  const today = new Date().toISOString().split("T")[0];

  // Predefined date ranges
  const getDateRange = (days: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    return {
      from: startDate.toISOString().split("T")[0],
      to: endDate.toISOString().split("T")[0],
    };
  };

  const handleQuickDateFilter = (days: number) => {
    const range = getDateRange(days);
    onFilterChange("date_from", range.from);
    onFilterChange("date_to", range.to);
  };

  const clearDateFilters = () => {
    onFilterChange("date_from", undefined);
    onFilterChange("date_to", undefined);
  };

  return (
    <Card className="border-gray-200">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Activity Type Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Activity Type</Label>
            <Select
              value={filters.activity_type || ""}
              onValueChange={(value) =>
                onFilterChange(
                  "activity_type",
                  value === "all" ? undefined : value
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {activityTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* From Date */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">From Date</Label>
            <Input
              type="date"
              value={filters.date_from || ""}
              onChange={(e) =>
                onFilterChange("date_from", e.target.value || undefined)
              }
              max={today}
            />
          </div>

          {/* To Date */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">To Date</Label>
            <Input
              type="date"
              value={filters.date_to || ""}
              onChange={(e) =>
                onFilterChange("date_to", e.target.value || undefined)
              }
              max={today}
              min={filters.date_from}
            />
          </div>

          {/* Results per page */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Results per page</Label>
            <Select
              value={filters.limit?.toString() || "20"}
              onValueChange={(value) =>
                onFilterChange("limit", parseInt(value))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Quick Date Filters */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Label className="text-sm font-medium mb-3 block">
            Quick Date Filters
          </Label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickDateFilter(1)}
              className="text-xs"
            >
              Last 24 hours
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickDateFilter(7)}
              className="text-xs"
            >
              Last 7 days
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickDateFilter(30)}
              className="text-xs"
            >
              Last 30 days
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickDateFilter(90)}
              className="text-xs"
            >
              Last 3 months
            </Button>

            {(filters.date_from || filters.date_to) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearDateFilters}
                className="text-xs text-red-600 hover:text-red-700"
              >
                <X className="h-3 w-3 mr-1" />
                Clear dates
              </Button>
            )}
          </div>
        </div>

        {/* Active Filters Summary */}
        {(filters.activity_type || filters.date_from || filters.date_to) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Label className="text-sm font-medium mb-2 block">
              Active Filters
            </Label>
            <div className="flex flex-wrap gap-2">
              {filters.activity_type && (
                <div className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                  <span>Type: {filters.activity_type}</span>
                  <button
                    onClick={() => onFilterChange("activity_type", undefined)}
                    className="hover:bg-blue-200 rounded p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              {filters.date_from && (
                <div className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                  <span>From: {filters.date_from}</span>
                  <button
                    onClick={() => onFilterChange("date_from", undefined)}
                    className="hover:bg-green-200 rounded p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              {filters.date_to && (
                <div className="flex items-center gap-1 bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                  <span>To: {filters.date_to}</span>
                  <button
                    onClick={() => onFilterChange("date_to", undefined)}
                    className="hover:bg-purple-200 rounded p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TimelineFiltersPanel;
