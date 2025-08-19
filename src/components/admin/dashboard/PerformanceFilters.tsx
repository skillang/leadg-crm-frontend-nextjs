// src/components/admin/PerformanceFilters.tsx
// Comprehensive filters for Tata Tele Admin Call Dashboard

"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangePicker, DateRange } from "@/components/ui/date-range-picker";
import {
  Filter,
  X,
  RefreshCw,
  Calendar,
  Users,
  Phone,
  TrendingUp,
  Search,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types
import {
  PerformancePeriod,
  CallStatus,
  CallDirection,
  AvailableUser,
  FilterState,
} from "@/models/types/callDashboard";

interface PerformanceFiltersProps {
  // Filter state
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;

  // Data from API
  availableUsers?: AvailableUser[];

  // Loading states
  loading?: boolean;

  // Actions
  onApplyFilters?: () => void;
  onResetFilters?: () => void;
  onRefresh?: () => void;
  onExport?: () => void;

  // UI customization
  className?: string;
  showAdvanced?: boolean;
}

// Performance period options
const PERFORMANCE_PERIODS: { value: PerformancePeriod; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

// Call status options
const CALL_STATUS_OPTIONS: {
  value: CallStatus;
  label: string;
  color?: string;
}[] = [
  { value: "all", label: "All Calls", color: "bg-gray-100" },
  {
    value: "answered",
    label: "Answered",
    color: "bg-green-100 text-green-800",
  },
  { value: "missed", label: "Missed", color: "bg-red-100 text-red-800" },
];

// Call direction options
const CALL_DIRECTION_OPTIONS: {
  value: CallDirection;
  label: string;
  color?: string;
}[] = [
  { value: "all", label: "All Directions", color: "bg-gray-100" },
  { value: "inbound", label: "Inbound", color: "bg-blue-100 text-blue-800" },
  {
    value: "outbound",
    label: "Outbound",
    color: "bg-purple-100 text-purple-800",
  },
];

export function PerformanceFilters({
  filters,
  onFiltersChange,
  availableUsers = [],
  loading = false,
  onApplyFilters,
  onResetFilters,
  onRefresh,
  onExport,
  className,
  showAdvanced = true,
}: PerformanceFiltersProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Handle date range changes
  const handleDateRangeChange = (dateRange: { range: DateRange }) => {
    console.log("PerformanceFilters: Date range changed:", dateRange.range); // Debug log
    onFiltersChange({
      ...filters,
      dateRange: dateRange.range,
    });
  };

  // Handle period change
  const handlePeriodChange = (period: PerformancePeriod) => {
    onFiltersChange({
      ...filters,
      period,
    });
  };

  // Handle user selection
  const handleUserToggle = (userId: string) => {
    const newSelectedUsers = filters.selectedUsers.includes(userId)
      ? filters.selectedUsers.filter((id) => id !== userId)
      : [...filters.selectedUsers, userId];

    onFiltersChange({
      ...filters,
      selectedUsers: newSelectedUsers,
    });
  };

  // Handle status change
  const handleStatusChange = (status: CallStatus) => {
    onFiltersChange({
      ...filters,
      callStatus: status,
    });
  };

  // Handle direction change
  const handleDirectionChange = (direction: CallDirection) => {
    onFiltersChange({
      ...filters,
      callDirection: direction,
    });
  };

  // Reset all filters to defaults
  const handleReset = () => {
    const defaultFilters: FilterState = {
      dateRange: { from: new Date(), to: new Date() },
      period: "daily",
      selectedUsers: [],
      callStatus: "all",
      callDirection: "all",
    };
    onFiltersChange(defaultFilters);
    onResetFilters?.();
  };

  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.selectedUsers.length > 0) count++;
    if (filters.callStatus !== "all") count++;
    if (filters.callDirection !== "all") count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">Call Performance Filters</CardTitle>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFilterCount} active
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center space-x-1"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              <span>{loading ? "Refreshing..." : "Refresh"}</span>
            </Button>
          )}

          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="flex items-center space-x-1"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Basic Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Date Range Picker */}
          <div className="space-y-2">
            <Label className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>Date Range</span>
            </Label>
            <DateRangePicker
              onUpdate={handleDateRangeChange}
              initialDateFrom={filters.dateRange.from}
              initialDateTo={filters.dateRange.to}
              className="w-full"
              placeholder="Select date range"
            />
          </div>

          {/* Performance Period */}
          <div className="space-y-2">
            <Label className="flex items-center space-x-1">
              <TrendingUp className="h-4 w-4" />
              <span>Period</span>
            </Label>
            <Select value={filters.period} onValueChange={handlePeriodChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {PERFORMANCE_PERIODS.map((period) => (
                  <SelectItem key={period.value} value={period.value}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <Label>Quick Actions</Label>
            <div className="flex space-x-2">
              <Button
                onClick={onApplyFilters}
                disabled={loading}
                className="flex-1 flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    <span>Apply</span>
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={loading}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-1" />
                Reset
              </Button>
            </div>
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        {showAdvanced && (
          <div className="border-t pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className="flex items-center space-x-2 mb-4"
            >
              <Filter className="h-4 w-4" />
              <span>Advanced Filters</span>
              <span className="text-xs text-muted-foreground">
                ({isAdvancedOpen ? "Hide" : "Show"})
              </span>
            </Button>

            {isAdvancedOpen && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Call Status Filter */}
                  <div className="space-y-3">
                    <Label className="flex items-center space-x-1">
                      <Phone className="h-4 w-4" />
                      <span>Call Status</span>
                    </Label>
                    <div className="grid grid-cols-1 gap-2">
                      {CALL_STATUS_OPTIONS.map((option) => (
                        <Button
                          key={option.value}
                          variant={
                            filters.callStatus === option.value
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() => handleStatusChange(option.value)}
                          className="justify-start"
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Call Direction Filter */}
                  <div className="space-y-3">
                    <Label>Call Direction</Label>
                    <div className="grid grid-cols-1 gap-2">
                      {CALL_DIRECTION_OPTIONS.map((option) => (
                        <Button
                          key={option.value}
                          variant={
                            filters.callDirection === option.value
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() => handleDirectionChange(option.value)}
                          className="justify-start"
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* User Selection */}
                <div className="space-y-3">
                  <Label className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>
                      Select Users ({filters.selectedUsers.length} selected)
                    </span>
                  </Label>

                  {availableUsers.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                      {availableUsers.map((user) => (
                        <Button
                          key={user.user_id}
                          variant={
                            filters.selectedUsers.includes(user.user_id)
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() => handleUserToggle(user.user_id)}
                          className="justify-start text-left h-auto py-2"
                        >
                          <div className="truncate">
                            <div className="font-medium">{user.user_name}</div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No users available
                    </div>
                  )}

                  {/* Selected Users Summary */}
                  {filters.selectedUsers.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm">Selected Users:</Label>
                      <div className="flex flex-wrap gap-1">
                        {filters.selectedUsers.map((userId) => {
                          const user = availableUsers.find(
                            (u) => u.user_id === userId
                          );
                          return (
                            <Badge
                              key={userId}
                              variant="secondary"
                              className="flex items-center space-x-1"
                            >
                              <span>{user?.user_name || userId}</span>
                              <button
                                onClick={() => handleUserToggle(userId)}
                                className="hover:bg-red-500 hover:text-white rounded-full p-0.5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Export useful types and constants
export { PERFORMANCE_PERIODS, CALL_STATUS_OPTIONS, CALL_DIRECTION_OPTIONS };
