// src/app/admin/sources/page.tsx

"use client";

import React, { useState } from "react";
import {
  Plus,
  Search,
  Edit,
  Eye,
  EyeOff,
  Users,
  Hash,
  Calendar,
  User,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Source } from "@/models/types/source";

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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

        {/* Since only admins can access this page, always show the button */}
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
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Sources
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalSources}
                </p>
              </div>
              <Hash className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Sources
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {activeSources}
                </p>
              </div>
              <Eye className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Inactive Sources
                </p>
                <p className="text-2xl font-bold text-gray-500">
                  {inactiveSources}
                </p>
              </div>
              <EyeOff className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Leads</p>
                <p className="text-2xl font-bold text-purple-600">
                  {allSources.reduce(
                    (total, source) => total + (source.lead_count || 0),
                    0
                  )}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
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

      {/* Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSources.map((source) => (
          <Card
            key={source.id}
            className={`transition-all hover:shadow-md ${
              !source.is_active ? "opacity-60" : ""
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">
                    {source.display_name}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{source.name}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {source.short_form}
                    </Badge>
                    <Badge
                      variant={source.is_active ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {source.is_active ? "Active" : "Inactive"}
                    </Badge>
                    {source.is_default && (
                      <Badge variant="outline" className="text-xs">
                        Default
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Since only admins can access this page, always show the edit button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingSource(source)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {source.description && (
                <p className="text-sm text-gray-600">{source.description}</p>
              )}

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>{source.lead_count || 0} leads</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <Hash className="h-4 w-4" />
                  <span>Order: {source.sort_order}</span>
                </div>
              </div>

              <div className="pt-2 border-t text-xs text-gray-500">
                <div className="flex items-center gap-1 mb-1">
                  <User className="h-3 w-3" />
                  <span>Created by {source.created_by || "System"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>Created {formatDate(source.created_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No results */}
      {filteredSources.length === 0 && (
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
