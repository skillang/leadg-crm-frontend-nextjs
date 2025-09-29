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
import { Source } from "@/models/types/source";
import StatsCard from "@/components/custom/cards/StatsCard";

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

  // Combine and filter sources
  const allSources = [
    ...(activeSourcesData?.sources || []),
    ...(showInactive ? inactiveSourcesData?.sources || [] : []),
  ];

  const filteredSources = allSources.filter(
    (source) =>
      source.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      source.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      source.short_form.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (source.description &&
        source.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Calculate summary stats
  const totalSources =
    (activeSourcesData?.total || 0) + (inactiveSourcesData?.total || 0);
  const activeSources = activeSourcesData?.total || 0;
  const inactiveSources = inactiveSourcesData?.total || 0;

  const isLoading = isLoadingActive || isLoadingInactive;

  // Add this function to handle opening edit modal
  const handleOpenEditModal = (source: Source) => {
    setEditingSource(source);
  };

  const handleCreateSource = async (sourceData: {
    name: string;
    display_name: string;
    short_form: string;
    description?: string;
    sort_order: number;
    is_active: boolean;
    is_default: boolean;
  }) => {
    try {
      await createSource(sourceData).unwrap();
      setIsCreateModalOpen(false);
      showSuccess(
        `Source "${sourceData.display_name}" created successfully!`,
        "Source Created"
      );
    } catch (error) {
      console.error("Failed to create source:", error);
      showError(
        "Failed to create source. Please try again.",
        "Creation Failed"
      );
    }
  };

  const handleUpdateSource = async (sourceData: {
    display_name: string;
    description?: string;
    sort_order: number;
    is_active: boolean;
    is_default: boolean;
  }) => {
    if (!editingSource) return;

    try {
      // Generate internal name from display name
      const generateInternalName = (displayName: string): string => {
        return displayName
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "");
      };

      await updateSource({
        sourceId: editingSource.id,
        data: {
          ...sourceData,
          name: generateInternalName(sourceData.display_name),
          // Keep existing short_form - don't allow editing to maintain lead ID consistency
          short_form: editingSource.short_form,
        },
      }).unwrap();
      setEditingSource(null);
      showSuccess(
        `Source "${sourceData.display_name}" updated successfully!`,
        "Source Updated"
      );
    } catch (error) {
      console.error("Failed to update source:", error);
      showError("Failed to update source. Please try again.", "Update Failed");
    }
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
          value={activeSources}
          icon={<Eye className="h-8 w-8 text-green-600" />}
          isLoading={isLoading}
        />

        <StatsCard
          title="Inactive Sources"
          value={inactiveSources}
          icon={<EyeOff className="h-8 w-8 text-gray-500" />}
          isLoading={isLoading}
        />

        <StatsCard
          title="Total Leads"
          value={allSources.reduce(
            (total, source) => total + (source.lead_count || 0),
            0
          )}
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
