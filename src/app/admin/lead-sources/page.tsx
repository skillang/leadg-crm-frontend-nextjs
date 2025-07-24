// src/app/admin/sources/page.tsx
"use client";

import React, { useState } from "react";
import {
  useGetSourcesQuery,
  useGetInactiveSourcesQuery,
  useCreateSourceMutation,
  useUpdateSourceMutation,
  useDeleteSourceMutation,
  useActivateSourceMutation,
  useDeactivateSourceMutation,
  Source,
  CreateSourceRequest,
  UpdateSourceRequest,
} from "@/redux/slices/sourcesApi";
import { useNotifications } from "@/components/common/NotificationSystem";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Search,
  Users,
  Hash,
} from "lucide-react";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

// Define proper error types based on your API structure
interface ApiErrorData {
  detail?: string;
  message?: string;
}

// Type for RTK Query errors with proper API error data
type RTKQueryError = FetchBaseQueryError & {
  status?: number;
  data?: ApiErrorData;
};

const SourcesManagementPage = () => {
  // State for forms and dialogs
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<Source | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("active");

  const [createFormData, setCreateFormData] = useState<CreateSourceRequest>({
    name: "",
    display_name: "",
    description: "",
    sort_order: 0,
    is_active: true,
    is_default: false,
  });

  const [editFormData, setEditFormData] = useState<UpdateSourceRequest>({});

  // Hooks
  const { showSuccess, showError, showConfirm } = useNotifications();
  const { hasAccess } = useAdminAccess({
    title: "Admin Access Required",
    description: "You need admin privileges to manage sources.",
  });

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

  // Mutations - removed unused loading states
  const [createSource, { isLoading: isCreating }] = useCreateSourceMutation();
  const [updateSource, { isLoading: isUpdating }] = useUpdateSourceMutation();
  const [deleteSource] = useDeleteSourceMutation();
  const [activateSource] = useActivateSourceMutation();
  const [deactivateSource] = useDeactivateSourceMutation();

  // Check admin access
  if (!hasAccess) {
    return null;
  }

  // Get current data based on active tab
  const currentData =
    activeTab === "active" ? activeSourcesData : inactiveSourcesData;
  const isLoading =
    activeTab === "active" ? isLoadingActive : isLoadingInactive;
  const error = activeTab === "active" ? activeError : inactiveError;

  // Filter sources based on search
  const filteredSources =
    currentData?.sources?.filter(
      (source) =>
        source.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        source.display_name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  // Handle create source
  const handleCreateSource = async () => {
    try {
      await createSource(createFormData).unwrap();
      showSuccess("Source created successfully");
      setIsCreateDialogOpen(false);
      setCreateFormData({
        name: "",
        display_name: "",
        description: "",
        sort_order: 0,
        is_active: true,
        is_default: false,
      });
    } catch (error: unknown) {
      const rtkError = error as RTKQueryError;
      const errorMessage =
        rtkError?.data?.message ||
        rtkError?.data?.detail ||
        "Failed to create source";
      showError(errorMessage);
    }
  };

  // Handle edit source
  const handleEditSource = async () => {
    if (!editingSource) return;

    try {
      await updateSource({
        sourceId: editingSource.id,
        data: editFormData,
      }).unwrap();
      showSuccess("Source updated successfully");
      setIsEditDialogOpen(false);
      setEditingSource(null);
      setEditFormData({});
    } catch (error: unknown) {
      const rtkError = error as RTKQueryError;
      const errorMessage =
        rtkError?.data?.message ||
        rtkError?.data?.detail ||
        "Failed to update source";
      showError(errorMessage);
    }
  };

  // Handle delete source
  const handleDeleteSource = async (source: Source) => {
    showConfirm({
      title: "Delete Source",
      description: `Are you sure you want to delete "${source.display_name}"? This action cannot be undone.`,
      confirmText: "Delete",
      variant: "destructive",
      onConfirm: async () => {
        try {
          await deleteSource(source.id).unwrap();
          showSuccess("Source deleted successfully");
        } catch (error: unknown) {
          const rtkError = error as RTKQueryError;
          const errorMessage =
            rtkError?.data?.message ||
            rtkError?.data?.detail ||
            "Failed to delete source";
          showError(errorMessage);
        }
      },
    });
  };

  // Handle activate/deactivate
  const handleToggleSourceStatus = async (source: Source) => {
    try {
      if (source.is_active) {
        await deactivateSource(source.id).unwrap();
        showSuccess("Source deactivated successfully");
      } else {
        await activateSource(source.id).unwrap();
        showSuccess("Source activated successfully");
      }
    } catch (error: unknown) {
      const rtkError = error as RTKQueryError;
      const errorMessage =
        rtkError?.data?.message ||
        rtkError?.data?.detail ||
        "Failed to update source status";
      showError(errorMessage);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Source Management</h1>
          <p className="text-gray-600 mt-1">
            Manage lead sources and their configurations
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Source
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Sources</p>
                <p className="text-2xl font-bold">
                  {(activeSourcesData?.total || 0) +
                    (inactiveSourcesData?.total || 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Sources</p>
                <p className="text-2xl font-bold text-green-600">
                  {activeSourcesData?.total || 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inactive Sources</p>
                <p className="text-2xl font-bold text-red-600">
                  {inactiveSourcesData?.total || 0}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Tabs */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search sources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="active">Active Sources</TabsTrigger>
            <TabsTrigger value="inactive">Inactive Sources</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Sources List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">Loading sources...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">
              Failed to load sources
            </div>
          ) : filteredSources.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No sources found
            </div>
          ) : (
            <div className="divide-y">
              {filteredSources.map((source) => (
                <div
                  key={source.id}
                  className="p-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                      <Hash className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">{source.display_name}</h3>
                      <p className="text-sm text-gray-500">
                        {source.name} • {source.description}
                      </p>
                      {source.lead_count !== undefined && (
                        <p className="text-xs text-gray-400">
                          {source.lead_count} leads
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {source.is_default && (
                      <Badge variant="secondary">Default</Badge>
                    )}
                    <Badge variant={source.is_active ? "default" : "secondary"}>
                      {source.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingSource(source);
                        setEditFormData({
                          name: source.name,
                          display_name: source.display_name,
                          description: source.description,
                          sort_order: source.sort_order,
                          is_active: source.is_active,
                          is_default: source.is_default,
                        });
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleSourceStatus(source)}
                    >
                      {source.is_active ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSource(source)}
                      disabled={
                        source.lead_count !== undefined && source.lead_count > 0
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Source Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Source</DialogTitle>
            <DialogDescription>
              Add a new source for lead tracking
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name (Internal)</Label>
                <Input
                  value={createFormData.name}
                  onChange={(e) =>
                    setCreateFormData((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="website"
                />
              </div>
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input
                  value={createFormData.display_name}
                  onChange={(e) =>
                    setCreateFormData((prev) => ({
                      ...prev,
                      display_name: e.target.value,
                    }))
                  }
                  placeholder="Website"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={createFormData.description}
                onChange={(e) =>
                  setCreateFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Leads from company website"
              />
            </div>
            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={createFormData.sort_order}
                onChange={(e) =>
                  setCreateFormData((prev) => ({
                    ...prev,
                    sort_order: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={createFormData.is_active}
                  onCheckedChange={(checked) =>
                    setCreateFormData((prev) => ({
                      ...prev,
                      is_active: checked,
                    }))
                  }
                />
                <Label>Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={createFormData.is_default}
                  onCheckedChange={(checked) =>
                    setCreateFormData((prev) => ({
                      ...prev,
                      is_default: checked,
                    }))
                  }
                />
                <Label>Default</Label>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateSource} disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Source"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Source Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Source</DialogTitle>
            <DialogDescription>Update source information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name (Internal)</Label>
                <Input
                  value={editFormData.name || ""}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input
                  value={editFormData.display_name || ""}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      display_name: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editFormData.description || ""}
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={editFormData.sort_order || 0}
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    sort_order: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editFormData.is_active || false}
                  onCheckedChange={(checked) =>
                    setEditFormData((prev) => ({ ...prev, is_active: checked }))
                  }
                />
                <Label>Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editFormData.is_default || false}
                  onCheckedChange={(checked) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      is_default: checked,
                    }))
                  }
                />
                <Label>Default</Label>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleEditSource} disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update Source"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SourcesManagementPage;
