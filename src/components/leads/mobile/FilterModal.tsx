// src/components/leads/FilterModal.tsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StageSelect } from "@/components/common/StageSelect";
import { StatusSelect } from "@/components/common/StatusSelect";
import { useGetActiveStagesQuery } from "@/redux/slices/stagesApi";
import { useGetActiveStatusesQuery } from "@/redux/slices/statusesApi";
import { Loader2, RotateCcw } from "lucide-react";

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStageFilter: string;
  currentStatusFilter: string;
  onApplyFilters: (stageFilter: string, statusFilter: string) => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  currentStageFilter,
  currentStatusFilter,
  onApplyFilters,
}) => {
  // Local state for filter values (before applying)
  const [selectedStage, setSelectedStage] = useState(currentStageFilter);
  const [selectedStatus, setSelectedStatus] = useState(currentStatusFilter);

  // API queries for dropdown options
  const { data: stagesData, isLoading: stagesLoading } =
    useGetActiveStagesQuery({});
  const { data: statusesData, isLoading: statusesLoading } =
    useGetActiveStatusesQuery({});

  // Update local state when props change (when modal opens with current values)
  useEffect(() => {
    if (isOpen) {
      setSelectedStage(currentStageFilter);
      setSelectedStatus(currentStatusFilter);
    }
  }, [isOpen, currentStageFilter, currentStatusFilter]);

  // Handle apply filters
  const handleApply = () => {
    onApplyFilters(selectedStage, selectedStatus);
    onClose();
  };

  // Handle cancel
  const handleCancel = () => {
    // Reset to current values
    setSelectedStage(currentStageFilter);
    setSelectedStatus(currentStatusFilter);
    onClose();
  };

  // Handle clear all filters
  const handleClearAll = () => {
    setSelectedStage("all");
    setSelectedStatus("all");
  };

  // Check if filters have changed
  const hasChanges =
    selectedStage !== currentStageFilter ||
    selectedStatus !== currentStatusFilter;

  // Check if any filters are active
  const hasActiveFilters = selectedStage !== "all" || selectedStatus !== "all";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              Filter Leads
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Stage Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Filter by Stage
            </label>
            {stagesLoading ? (
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
            ) : (
              <StageSelect
                value={selectedStage === "all" ? "" : selectedStage}
                onValueChange={(value) => setSelectedStage(value || "all")}
                stages={stagesData?.stages || []}
                disabled={stagesLoading}
                isLoading={stagesLoading}
                placeholder="All Stages"
                className="w-full"
                showLabel={false}
              />
            )}
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Filter by Status
            </label>
            {statusesLoading ? (
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
            ) : (
              <StatusSelect
                value={selectedStatus === "all" ? "" : selectedStatus}
                onValueChange={(value) => setSelectedStatus(value || "all")}
                statuses={statusesData?.statuses || []}
                disabled={statusesLoading}
                isLoading={statusesLoading}
                placeholder="All Statuses"
                className="w-full"
                showLabel={false}
              />
            )}
          </div>

          {/* Clear All Button */}
          {hasActiveFilters && (
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                className="w-full flex items-center justify-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Clear All Filters
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={handleCancel} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={stagesLoading || statusesLoading}
            className="flex-1"
          >
            {stagesLoading || statusesLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading...
              </>
            ) : (
              <>
                Apply
                {hasChanges && (
                  <span className="ml-1 bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded-full">
                    {(selectedStage !== "all" ? 1 : 0) +
                      (selectedStatus !== "all" ? 1 : 0)}
                  </span>
                )}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
