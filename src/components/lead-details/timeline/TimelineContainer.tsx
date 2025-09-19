// src/components/lead-details/timeline/TimelineContainer.tsx

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Activity, AlertCircle, Filter, Loader2, Search } from "lucide-react";
import { TimelineFilters } from "@/models/types/timeline";
import { useGetLeadTimelineQuery } from "@/redux/slices/timelineApi";
import TimelineItem from "./TimelineItem";
import TimelineFiltersPanel from "./TimelineFiltersPanel";
import ServerPagination from "@/components/common/ServerPagination";
import { PaginationMeta } from "@/models/types/pagination";

interface TimelineContainerProps {
  leadId: string;
}

const TimelineContainer: React.FC<TimelineContainerProps> = ({ leadId }) => {
  const [filters, setFilters] = useState<TimelineFilters>({
    page: 1,
    limit: 10,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // API query - using only the timeline query since it includes lead-specific data
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

  // Extract data from timeline response
  const activities = timelineData?.timeline || timelineData?.activities || [];
  const paginationInfo = timelineData?.pagination;

  // Create pagination metadata for ServerPagination component
  const paginationMeta: PaginationMeta = {
    total: paginationInfo?.total || 0,
    page: paginationInfo?.page || 1,
    pages: paginationInfo?.pages || 1,
    limit: paginationInfo?.limit || filters.limit || 10, // Add || 10 as final fallback
    has_next: paginationInfo?.has_next || false,
    has_prev: paginationInfo?.has_prev || false,
  };

  const totalActivities = paginationMeta.total;
  // console.log(totalActivities, "is total activities in pagination");
  // console.log("timelineData:", timelineData);
  // console.log("paginationInfo:", paginationInfo);

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
      page: 1, // Reset to first page when filtering
    }));
  };

  // Updated pagination handlers for ServerPagination
  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newLimit: number) => {
    setFilters((prev) => ({
      ...prev,
      limit: newLimit,
      page: 1, // Reset to first page when changing page size
    }));
  };

  const handleClearFilters = () => {
    setFilters({ page: 1, limit: filters.limit }); // Keep current limit
    setSearchQuery("");
  };

  const hasActiveFilters =
    filters.activity_type ||
    filters.date_from ||
    filters.date_to ||
    searchQuery;

  if (isLoading && paginationMeta.page === 1) {
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
            activityTypes={[]} // Empty array since we're not using separate activity types query
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
          {/* Activities List */}
          <div className="space-y-0">
            {activities.map((activity, index) => (
              <TimelineItem
                key={activity.id}
                activity={activity}
                isLast={index === activities.length - 1}
              />
            ))}
          </div>

          {/* Loading indicator for pagination */}
          {isLoading && paginationMeta.page > 1 && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
              <span className="text-sm text-gray-600">
                Loading more activities...
              </span>
            </div>
          )}

          {/* ServerPagination Component */}
          {totalActivities > 0 && (
            <ServerPagination
              paginationMeta={paginationMeta}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              searchQuery={searchQuery}
              isLoading={isLoading}
              showResultsInfo={true}
              showPageSizeSelector={true}
              pageSizeOptions={[5, 10, 20, 30]}
              className="mt-6"
            />
          )}
        </div>
      )}
    </div>
  );
};

export default TimelineContainer;
