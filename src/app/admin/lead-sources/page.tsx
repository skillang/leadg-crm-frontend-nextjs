// Updated SourcesPage with AdminDataConfCard integration

"use client";

import React, { useState } from "react";
import { Plus, Search, Eye, EyeOff, Hash, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { useNotifications } from "@/components/common/NotificationSystem";
import {
  useGetSourcesQuery,
  useGetInactiveSourcesQuery,
  useCreateSourceMutation,
  useUpdateSourceMutation,
} from "@/redux/slices/sourcesApi";
import CreateSourceModal from "@/components/leads/CreateSourceModal";
import EditSourceModal from "@/components/leads/EditSourceModal";
import AdminDataConfCard from "@/components/custom/cards/AdminDataConfCard"; // Import AdminDataConfCard
import {
  CreateSourceRequest,
  Source,
  UpdateSourceRequest,
} from "@/models/types/source";
import StatsCard from "@/components/custom/cards/StatsCard";
import {
  createSourceService,
  updateSourceService,
  combineAndFilterSources,
  calculateSourceStats,
} from "@/services/leadSources/leadSourcesService";

const SourcesPage = () => {
  // ALL HOOKS MUST BE CALLED FIRST - before any conditionals
  const { showSuccess, showError } = useNotifications();
  const { hasAccess, AccessDeniedComponent } = useAdminAccess({
    title: "Admin Access Required",
    description: "You need admin privileges to manage lead sources.",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<Source | null>(null);

  // RTK Query hooks
  const {
    data: activeSourcesData,
    isLoading: isLoadingActive,
    error: activeError,
  } = useGetSourcesQuery({ include_lead_count: true, active_only: true });

  const {
    data: inactiveSourcesData,
    isLoading: isLoadingInactive,
    error: inactiveError,
  } = useGetInactiveSourcesQuery({ include_lead_count: true });

  const [createSource, { isLoading: isCreating }] = useCreateSourceMutation();
  const [updateSource, { isLoading: isUpdating }] = useUpdateSourceMutation();

  // Show error notification for loading errors
  React.useEffect(() => {
    if (activeError || inactiveError) {
      showError("Failed to load sources", "Loading Error");
    }
  }, [activeError, inactiveError, showError]);

  // CONDITIONAL ACCESS CHECK AFTER ALL HOOKS
  if (!hasAccess) {
    return AccessDeniedComponent;
  }
  const activeSources = activeSourcesData?.sources || [];
  const inactiveSources = inactiveSourcesData?.sources || [];

  const filteredSources = combineAndFilterSources(
    activeSources,
    inactiveSources,
    showInactive,
    searchTerm
  );

  const {
    totalSources,
    activeSources: activeCount,
    inactiveSources: inactiveCount,
    totalLeads,
  } = calculateSourceStats(
    activeSourcesData,
    inactiveSourcesData,
    filteredSources
  );

  // REPLACE the handlers with these simplified versions:
  const handleCreateSource = async (sourceData: CreateSourceRequest) => {
    await createSourceService(sourceData, {
      createMutation: createSource,
      showSuccess,
      showError,
      onSuccess: () => {
        setIsCreateModalOpen(false);
      },
    });
  };

  const handleUpdateSource = async (sourceData: UpdateSourceRequest) => {
    if (!editingSource) return;

    await updateSourceService(editingSource, sourceData, {
      updateMutation: updateSource,
      showSuccess,
      showError,
      onSuccess: () => {
        setEditingSource(null);
      },
    });
  };
  const isLoading = isLoadingActive || isLoadingInactive;

  // Add this function to handle opening edit modal
  const handleOpenEditModal = (source: Source) => {
    setEditingSource(source);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lead Sources</h1>
          <p className="text-gray-600">
            Manage source channels for lead acquisition and tracking
          </p>
        </div>

        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Source
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Sources"
          value={totalSources}
          icon={<Hash className="h-8 w-8 text-blue-600" />}
          isLoading={isLoading}
        />

        <StatsCard
          title="Active Sources"
          value={activeCount}
          icon={<Eye className="h-8 w-8 text-green-600" />}
          isLoading={isLoading}
        />

        <StatsCard
          title="Inactive Sources"
          value={inactiveCount}
          icon={<EyeOff className="h-8 w-8 text-gray-500" />}
          isLoading={isLoading}
        />

        <StatsCard
          title="Total Leads"
          value={totalLeads}
          icon={<TrendingUp className="h-8 w-8 text-purple-600" />}
          isLoading={isLoading}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search sources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="show-inactive"
            checked={showInactive}
            onCheckedChange={setShowInactive}
          />
          <Label htmlFor="show-inactive">Show inactive</Label>
        </div>
      </div>

      {/* Sources Grid using AdminDataConfCard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSources.map((source) => (
          <AdminDataConfCard
            key={source.id}
            title={source.display_name}
            subtitle={`${source.name} (${source.short_form})`}
            description={source.description}
            isActive={source.is_active}
            badges={[
              {
                text: source.is_active ? "Active" : "Inactive",
                variant: source.is_active ? "success-light" : "secondary",
              },
              ...(source.is_default
                ? [{ text: "Default", variant: "outline" as const }]
                : []),
            ]}
            leadCount={source.lead_count || 0}
            orderNumber={source.sort_order}
            createdBy={source.created_by || "System"}
            createdAt={source.created_at}
            // Actions
            onEdit={() => handleOpenEditModal(source)}
            canEdit={true}
            canDelete={false} // Sources typically shouldn't be deleted if they have leads
            canReorder={false}
            showReorderOutside={false}
            isLoading={isLoading}
          />
        ))}
      </div>

      {/* No results */}
      {filteredSources.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <p className="text-gray-500">No sources found</p>
          {searchTerm && (
            <Button
              variant="ghost"
              onClick={() => setSearchTerm("")}
              className="mt-2"
            >
              Clear search
            </Button>
          )}
        </div>
      )}

      {/* Loading state for empty grid */}
      {isLoading && filteredSources.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <AdminDataConfCard
              key={i}
              title=""
              badges={[]}
              canEdit={false}
              canDelete={false}
              isLoading={true}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateSourceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSource}
        isLoading={isCreating}
      />

      <EditSourceModal
        isOpen={!!editingSource}
        onClose={() => setEditingSource(null)}
        onSubmit={handleUpdateSource}
        source={editingSource}
        isLoading={isUpdating}
      />
    </div>
  );
};

export default SourcesPage;
