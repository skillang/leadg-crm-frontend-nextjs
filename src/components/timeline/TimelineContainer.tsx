"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Activity, AlertCircle, Filter, Loader2, Search } from "lucide-react";
import { TimelineFilters } from "@/models/types/timeline";
import {
  useGetLeadTimelineQuery,
  useGetActivityTypesQuery,
} from "@/redux/slices/timelineApi";
import TimelineItem from "./TimelineItem";
import TimelineFiltersPanel from "./TimelineFiltersPanel";

interface TimelineContainerProps {
  leadId: string;
}

const TimelineContainer: React.FC<TimelineContainerProps> = ({ leadId }) => {
  const [filters, setFilters] = useState<TimelineFilters>({
    page: 1,
    limit: 20,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // API queries
  const {
    data: timelineData,
    isLoading,
    error,
    refetch,
  } = useGetLeadTimelineQuery({
    leadId,
    ...filters,
    search: searchQuery || undefined,
  });

  const { data: activityTypes } = useGetActivityTypesQuery();

  const activities = timelineData?.activities || [];
  const hasNextPage = timelineData?.has_next || false;
  const hasPrevPage = timelineData?.has_prev || false;
  const totalActivities = timelineData?.total || 0;
  const currentPage = timelineData?.page || 1;
  const totalPages = timelineData?.total_pages || 1;

  // Handlers
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setFilters((prev) => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (
    key: keyof TimelineFilters,
    value: string | number | undefined
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleClearFilters = () => {
    setFilters({ page: 1, limit: 20 });
    setSearchQuery("");
  };

  const hasActiveFilters =
    filters.activity_type ||
    filters.date_from ||
    filters.date_to ||
    searchQuery;

  if (isLoading && currentPage === 1) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading timeline...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-gray-600 mb-4">Failed to load timeline</p>
          <Button onClick={() => refetch()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search timeline..."
              value={searchQuery}
              onChange={handleSearch}
              className="pl-10"
            />
          </div>

          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5 ml-1">
                {
                  [
                    filters.activity_type,
                    filters.date_from,
                    filters.date_to,
                    searchQuery,
                  ].filter(Boolean).length
                }
              </span>
            )}
          </Button>

          {hasActiveFilters && (
            <Button variant="ghost" onClick={handleClearFilters}>
              Clear All
            </Button>
          )}
        </div>

        {showFilters && (
          <TimelineFiltersPanel
            filters={filters}
            onFilterChange={handleFilterChange}
            activityTypes={activityTypes || []}
          />
        )}
      </div>

      {/* Timeline Activities */}
      {activities.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Activity className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {hasActiveFilters
              ? "No activities match your filters"
              : "No timeline activities yet"}
          </h3>
          <p className="text-gray-600 mb-4">
            {hasActiveFilters
              ? "Try adjusting your search criteria or filters"
              : "Activities will appear here as they are performed on this lead"}
          </p>
          {hasActiveFilters && (
            <Button onClick={handleClearFilters} variant="outline">
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-0">
            {activities.map((activity, index) => (
              <TimelineItem
                key={activity.id}
                activity={activity}
                isLast={index === activities.length - 1}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {activities.length} of {totalActivities} activities
                {currentPage > 1 && ` (Page ${currentPage} of ${totalPages})`}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!hasPrevPage || isLoading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!hasNextPage || isLoading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TimelineContainer;
