// src/components/admin/PerformanceFilters.tsx
// Comprehensive filters for Tata Tele Admin Call Dashboard

"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import MultiSelect, { SelectOption } from "@/components/common/MultiSelect";
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
}: PerformanceFiltersProps) {
  // Handle date range changes
  const handleDateRangeChange = (dateRange: { range: DateRange }) => {
    console.log("PerformanceFilters: Date range changed:", dateRange.range); // Debug log
    onFiltersChange({
      ...filters,
      dateRange: dateRange.range,
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

  const transformUsersToOptions = (): SelectOption[] => {
    return availableUsers.map((user) => ({
      value: user.user_id,
      label: user.user_name,
      subtitle: `ID: ${user.user_id}`, // You can customize this based on available user data
    }));
  };

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

      <CardContent className="space-y-4">
        {/* Basic Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Date Range Picker */}
          <div className="space-y-2 ">
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

          <div className="items-center flex flex-col">
            <div className="space-y-2">
              <Label className="flex items-center space-x-1">
                <Phone className="h-4 w-4" />
                <span>Call Status</span>
              </Label>
              <Select
                value={filters.callStatus}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select call status" />
                </SelectTrigger>
                <SelectContent>
                  {CALL_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            option.value === "answered"
                              ? "bg-green-500"
                              : option.value === "missed"
                              ? "bg-red-500"
                              : "bg-gray-500"
                          }`}
                        />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Call Direction Filter */}
          <div className="space-y-2">
            <Label>Call Direction</Label>
            <Select
              value={filters.callDirection}
              onValueChange={handleDirectionChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select call direction" />
              </SelectTrigger>
              <SelectContent>
                {CALL_DIRECTION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          option.value === "inbound"
                            ? "bg-blue-500"
                            : option.value === "outbound"
                            ? "bg-purple-500"
                            : "bg-gray-500"
                        }`}
                      />
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Additional Filters - Always Visible */}
        <div className="">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* User Selection with MultiSelect */}
            <div className="space-y-2 w-full">
              <Label className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>Select Users</span>
              </Label>
              <MultiSelect
                options={transformUsersToOptions()}
                value={filters.selectedUsers}
                onChange={(selectedUsers) =>
                  onFiltersChange({ ...filters, selectedUsers })
                }
                placeholder="Select users..."
                searchPlaceholder="Search users..."
                emptyMessage="No users found"
                maxDisplayItems={2}
                showCheckbox={true}
                showSelectedBadges={false} // We'll show our own summary below
                showIcon={true}
                icon={<Users className="h-4 w-4" />}
                buttonVariant="outline"
                buttonSize="default"
                className="w-full"
              />
            </div>
          </div>

          {/* Selected Users Summary */}
          {filters.selectedUsers.length > 0 && (
            <div className="space-y-2 pt-4">
              <Label className="text-sm">
                Selected Users ({filters.selectedUsers.length}):
              </Label>
              <div className="flex flex-wrap gap-1">
                {filters.selectedUsers.map((userId) => {
                  const user = availableUsers.find((u) => u.user_id === userId);
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

        <div>
          {/* Quick Actions */}
          <div className="space-y-2">
            <Label>Actions</Label>
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
      </CardContent>
    </Card>
  );
}

// Export useful types and constants
export { PERFORMANCE_PERIODS, CALL_STATUS_OPTIONS, CALL_DIRECTION_OPTIONS };
