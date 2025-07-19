// src/app/admin/stages/page.tsx

"use client";

import React, { useState } from "react";
import {
  useGetStagesQuery,
  useGetInactiveStagesQuery,
  useCreateStageMutation,
  useUpdateStageMutation,
  useDeleteStageMutation,
  useActivateStageMutation,
  useDeactivateStageMutation,
  useReorderStagesMutation,
  useSetupDefaultStagesMutation,
} from "@/redux/slices/stagesApi";
import { useNotifications } from "@/components/common/NotificationSystem";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowUp,
  ArrowDown,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  RotateCcw,
  Settings,
  Target,
  Users,
} from "lucide-react";
import { Stage, CreateStageRequest, STAGE_COLORS } from "@/models/types/stage";

const StageManagementPage = () => {
  // State for forms and dialogs
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [createFormData, setCreateFormData] = useState<CreateStageRequest>({
    name: "",
    display_name: "",
    description: "",
    color: "#6B7280",
    sort_order: 1,
    is_active: true,
    is_default: false,
  });

  // Hooks
  const { showSuccess, showError, showConfirm } = useNotifications();
  const { hasAccess } = useAdminAccess({
    title: "Admin Access Required",
    description: "You need admin privileges to manage stages.",
  });

  // API Queries
  const {
    data: activeStagesData,
    isLoading: loadingActive,
    refetch: refetchActive,
  } = useGetStagesQuery({ include_lead_count: true, active_only: true });

  const { data: inactiveStagesData, isLoading: loadingInactive } =
    useGetInactiveStagesQuery({ include_lead_count: true });

  // API Mutations
  const [createStage] = useCreateStageMutation();
  const [updateStage] = useUpdateStageMutation();
  const [deleteStage] = useDeleteStageMutation();
  const [activateStage] = useActivateStageMutation();
  const [deactivateStage] = useDeactivateStageMutation();
  const [reorderStages] = useReorderStagesMutation();
  const [setupDefaultStages] = useSetupDefaultStagesMutation();

  // Check admin access
  if (!hasAccess) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-md mx-auto mt-16">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-red-600">
                Admin Access Required
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-4">
                You need admin privileges to manage stages.
              </p>
              <p className="text-sm text-gray-500">
                Contact your administrator for access.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Handle create stage
  const handleCreateStage = async () => {
    try {
      await createStage(createFormData).unwrap();
      showSuccess("Stage created successfully!", "Creation Complete");
      setIsCreateDialogOpen(false);
      setCreateFormData({
        name: "",
        display_name: "",
        description: "",
        color: "#6B7280",
        sort_order: 1,
        is_active: true,
        is_default: false,
      });
      refetchActive();
    } catch (error: any) {
      console.error("Create stage error:", error);
      const errorMessage =
        error?.data?.message || error?.message || "Unknown error occurred";
      showError(`Failed to create stage: ${errorMessage}`, "Creation Failed");
    }
  };

  // Handle edit stage
  const handleEditStage = async () => {
    if (!editingStage) return;

    try {
      await updateStage({
        stageId: editingStage.id,
        stageData: {
          display_name: editingStage.display_name,
          description: editingStage.description,
          color: editingStage.color,
          sort_order: editingStage.sort_order,
          is_active: editingStage.is_active,
          is_default: editingStage.is_default,
        },
      }).unwrap();
      showSuccess("Stage updated successfully!", "Update Complete");
      setIsEditDialogOpen(false);
      setEditingStage(null);
    } catch (error: any) {
      console.error("Update stage error:", error);
      const errorMessage =
        error?.data?.message || error?.message || "Unknown error occurred";
      showError(`Failed to update stage: ${errorMessage}`, "Update Failed");
    }
  };

  // Handle delete stage
  const handleDeleteStage = async (
    stageId: string,
    stageName: string,
    hasLeads: boolean
  ) => {
    showConfirm({
      title: "Delete Stage",
      description: hasLeads
        ? `This stage "${stageName}" has leads assigned to it. Are you sure you want to delete it? This action cannot be undone.`
        : `Are you sure you want to delete "${stageName}"? This action cannot be undone.`,
      confirmText: "Delete",
      variant: "destructive",
      onConfirm: async () => {
        try {
          await deleteStage({ stageId, force: hasLeads }).unwrap();
          showSuccess(
            `Stage "${stageName}" deleted successfully!`,
            "Stage Deleted"
          );
        } catch (error: unknown) {
          console.error("Delete stage error:", error);
          const apiError = error as {
            data?: { message?: string };
            message?: string;
          };
          const errorMessage =
            apiError?.data?.message ||
            apiError?.message ||
            "Unknown error occurred";
          showError(
            `Failed to delete stage: ${errorMessage}`,
            "Deletion Failed"
          );
        }
      },
    });
  };

  // Handle activate/deactivate
  const handleToggleStageStatus = async (
    stageId: string,
    currentlyActive: boolean
  ) => {
    console.log(
      `Toggling stage ${stageId}, currently active: ${currentlyActive}`
    );

    try {
      let result;
      if (currentlyActive) {
        // Currently active, so deactivate it
        console.log("Calling deactivateStage...");
        result = await deactivateStage(stageId).unwrap();
        console.log("Deactivate result:", result);
        showSuccess("Stage deactivated successfully!");
      } else {
        // Currently inactive, so activate it
        console.log("Calling activateStage...");
        result = await activateStage(stageId).unwrap();
        console.log("Activate result:", result);
        showSuccess("Stage activated successfully!");
      }
    } catch (error: any) {
      console.error("Toggle stage status error:", error);
      console.error("Error details:", {
        message: error?.message,
        data: error?.data,
        status: error?.status,
        originalStatus: error?.originalStatus,
      });

      const errorMessage =
        error?.data?.detail ||
        error?.data?.message ||
        error?.message ||
        `HTTP ${error?.status || "Unknown"} error`;

      showError(
        `Failed to ${
          currentlyActive ? "deactivate" : "activate"
        } stage: ${errorMessage}`,
        "Toggle Failed"
      );
    }
  };

  // Handle setup default stages
  const handleSetupDefaults = async () => {
    showConfirm({
      title: "Setup Default Stages",
      description: "This will create default stages for your CRM. Continue?",
      confirmText: "Setup",
      variant: "default",
      onConfirm: async () => {
        try {
          await setupDefaultStages().unwrap();
          showSuccess("Default stages created successfully!", "Setup Complete");
        } catch (error) {
          console.error("Setup defaults error:", error);
          showError("Failed to setup default stages.", "Setup Failed");
        }
      },
    });
  };

  // Handle reorder stages
  const handleReorder = async (stageId: string, direction: "up" | "down") => {
    if (!activeStagesData?.stages) return;

    const stages = [...activeStagesData.stages].sort(
      (a, b) => a.sort_order - b.sort_order
    );
    const currentIndex = stages.findIndex((s) => s.id === stageId);

    if (currentIndex === -1) return;
    if (direction === "up" && currentIndex === 0) return;
    if (direction === "down" && currentIndex === stages.length - 1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const reorderData = stages.map((stage, index) => ({
      id: stage.id,
      sort_order:
        index === currentIndex
          ? newIndex + 1
          : index === newIndex
          ? currentIndex + 1
          : index + 1,
    }));

    try {
      await reorderStages(reorderData).unwrap();
      showSuccess("Stages reordered successfully!");
    } catch (error: unknown) {
      console.error("Reorder error:", error);
      const apiError = error as {
        data?: { message?: string };
        message?: string;
      };
      const errorMessage =
        apiError?.data?.message ||
        apiError?.message ||
        "Unknown error occurred";
      showError(`Failed to reorder stages: ${errorMessage}`);
    }
  };

  const loading = loadingActive || loadingInactive;

  const renderStageCard = (stage: Stage, isActive: boolean = true) => (
    <Card
      key={stage.id}
      className={`border-l-4 ${isActive ? "" : "opacity-75"}`}
      style={{ borderLeftColor: stage.color }}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3
                className={`text-lg font-semibold ${
                  isActive ? "" : "text-gray-600"
                }`}
              >
                {stage.display_name}
              </h3>
              <div
                className={`w-4 h-4 rounded-full border-2 border-white shadow ${
                  isActive ? "" : "opacity-50"
                }`}
                style={{ backgroundColor: stage.color }}
              />
              {stage.is_default && <Badge variant="secondary">Default</Badge>}
              {!isActive && <Badge variant="secondary">Inactive</Badge>}
              <Badge variant="outline">{stage.lead_count} leads</Badge>
            </div>
            <p
              className={`text-sm mb-1 ${
                isActive ? "text-gray-600" : "text-gray-500"
              }`}
            >
              <strong>Name:</strong> {stage.name}
            </p>
            {stage.description && (
              <p
                className={`text-sm ${
                  isActive ? "text-gray-600" : "text-gray-500"
                }`}
              >
                {stage.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isActive && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReorder(stage.id, "up")}
                  disabled={stage.sort_order === 1}
                >
                  <ArrowUp className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReorder(stage.id, "down")}
                >
                  <ArrowDown className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingStage(stage);
                    setIsEditDialogOpen(true);
                  }}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    handleToggleStageStatus(stage.id, stage.is_active)
                  }
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </>
            )}
            {!isActive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  handleToggleStageStatus(stage.id, stage.is_active)
                }
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                handleDeleteStage(
                  stage.id,
                  stage.display_name,
                  stage.lead_count > 0
                )
              }
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stage Management</h1>
          <p className="text-gray-600 mt-1">
            Configure and manage lead stages for your CRM workflow
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleSetupDefaults}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Setup Defaults
          </Button>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Stage
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Stages</p>
                <p className="text-2xl font-bold">
                  {activeStagesData?.active_count || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Inactive Stages</p>
                <p className="text-2xl font-bold">
                  {inactiveStagesData?.inactive_count || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Leads</p>
                <p className="text-2xl font-bold">
                  {activeStagesData?.stages.reduce(
                    (sum, stage) => sum + stage.lead_count,
                    0
                  ) || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Active and Inactive Stages */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Stages</TabsTrigger>
          <TabsTrigger value="inactive">Inactive Stages</TabsTrigger>
        </TabsList>

        {/* Active Stages */}
        <TabsContent value="active" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading stages...</p>
            </div>
          ) : activeStagesData?.stages.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Active Stages
                </h3>
                <p className="text-gray-600 mb-4">
                  Create your first stage to start organizing leads
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Stage
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {activeStagesData?.stages &&
                [...activeStagesData.stages]
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((stage) => renderStageCard(stage, true))}
            </div>
          )}
        </TabsContent>

        {/* Inactive Stages */}
        <TabsContent value="inactive" className="space-y-4">
          {inactiveStagesData?.stages.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Inactive Stages
                </h3>
                <p className="text-gray-600">All stages are currently active</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {inactiveStagesData?.stages.map((stage) =>
                renderStageCard(stage, false)
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Stage Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Stage</DialogTitle>
            <DialogDescription>
              Add a new stage to your lead workflow
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={createFormData.name}
                  onChange={(e) =>
                    setCreateFormData((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="e.g., initial"
                />
              </div>
              <div>
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  value={createFormData.display_name}
                  onChange={(e) =>
                    setCreateFormData((prev) => ({
                      ...prev,
                      display_name: e.target.value,
                    }))
                  }
                  placeholder="e.g., Initial Contact"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={createFormData.description}
                onChange={(e) =>
                  setCreateFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe this stage..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="color">Color</Label>
                <Select
                  value={createFormData.color}
                  onValueChange={(value) =>
                    setCreateFormData((prev) => ({ ...prev, color: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGE_COLORS.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: color.value }}
                          />
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  min="1"
                  value={createFormData.sort_order}
                  onChange={(e) =>
                    setCreateFormData((prev) => ({
                      ...prev,
                      sort_order: parseInt(e.target.value) || 1,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={createFormData.is_active}
                  onCheckedChange={(checked) =>
                    setCreateFormData((prev) => ({
                      ...prev,
                      is_active: checked,
                    }))
                  }
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_default"
                  checked={createFormData.is_default}
                  onCheckedChange={(checked) =>
                    setCreateFormData((prev) => ({
                      ...prev,
                      is_default: checked,
                    }))
                  }
                />
                <Label htmlFor="is_default">Default Stage</Label>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateStage}>Create Stage</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Stage Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Stage</DialogTitle>
            <DialogDescription>Update stage information</DialogDescription>
          </DialogHeader>
          {editingStage && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_name">Name</Label>
                  <Input
                    id="edit_name"
                    value={editingStage.name}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Name cannot be changed
                  </p>
                </div>
                <div>
                  <Label htmlFor="edit_display_name">Display Name</Label>
                  <Input
                    id="edit_display_name"
                    value={editingStage.display_name}
                    onChange={(e) =>
                      setEditingStage((prev) =>
                        prev ? { ...prev, display_name: e.target.value } : null
                      )
                    }
                    placeholder="e.g., Initial Contact"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit_description">Description</Label>
                <Textarea
                  id="edit_description"
                  value={editingStage.description}
                  onChange={(e) =>
                    setEditingStage((prev) =>
                      prev ? { ...prev, description: e.target.value } : null
                    )
                  }
                  placeholder="Describe this stage..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_color">Color</Label>
                  <Select
                    value={editingStage.color}
                    onValueChange={(value) =>
                      setEditingStage((prev) =>
                        prev ? { ...prev, color: value } : null
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGE_COLORS.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: color.value }}
                            />
                            {color.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit_sort_order">Sort Order</Label>
                  <Input
                    id="edit_sort_order"
                    type="number"
                    min="1"
                    value={editingStage.sort_order}
                    onChange={(e) =>
                      setEditingStage((prev) =>
                        prev
                          ? {
                              ...prev,
                              sort_order: parseInt(e.target.value) || 1,
                            }
                          : null
                      )
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit_is_active"
                    checked={editingStage.is_active}
                    onCheckedChange={(checked) =>
                      setEditingStage((prev) =>
                        prev ? { ...prev, is_active: checked } : null
                      )
                    }
                  />
                  <Label htmlFor="edit_is_active">Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit_is_default"
                    checked={editingStage.is_default}
                    onCheckedChange={(checked) =>
                      setEditingStage((prev) =>
                        prev ? { ...prev, is_default: checked } : null
                      )
                    }
                  />
                  <Label htmlFor="edit_is_default">Default Stage</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleEditStage}>Update Stage</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StageManagementPage;
