// Fixed StageManagementPage with proper loading pattern to prevent flash of empty state
"use client";

import React, { useState, useEffect } from "react";
import {
  useGetStagesQuery,
  useGetInactiveStagesQuery,
  useCreateStageMutation,
  useUpdateStageMutation,
  useDeleteStageMutation,
  useReorderStagesMutation,
  useSetupDefaultStagesMutation,
  useActivateStageMutation,
  useDeactivateStageMutation,
} from "@/redux/slices/stagesApi";
import WhatsAppTemplateMessage from "@/components/communication/whatsapp/WhatsAppTemplateMessage";
import { useNotifications } from "@/components/common/NotificationSystem";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Plus,
  CheckCircle,
  XCircle,
  Settings,
  Users,
  MessageSquare,
} from "lucide-react";
import { Stage, CreateStageRequest, STAGE_COLORS } from "@/models/types/stage";
import StatsCard from "@/components/custom/cards/StatsCard";
import AdminDataConfCard from "@/components/custom/cards/AdminDataConfCard";
import {
  generateInternalName,
  createStageService,
  updateStageService,
  deleteStageService,
  toggleStageStatusService,
  reorderStageService,
  setupDefaultStagesService,
  sortStagesByOrder,
  calculateStageStats,
} from "@/services/stageManagement/stageManagementService";
import WhatsAppTemplateSelect from "@/components/communication/whatsapp/WhatsAppTemplateSelect";

const StageManagementPage = () => {
  // State for forms and dialogs
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [currentStageForTemplate, setCurrentStageForTemplate] = useState<
    "create" | "edit"
  >("create");
  const [isCreatePreviewMode, setIsCreatePreviewMode] = useState(false);
  const [isEditPreviewMode, setIsEditPreviewMode] = useState(false);
  const [createFormData, setCreateFormData] = useState<CreateStageRequest>({
    name: "",
    display_name: "",
    description: "",
    color: "#6B7280",
    sort_order: 1,
    is_active: true,
    is_default: false,
    automation: false,
    automation_config: null,
  });

  // Auto-generate internal name when display name changes in create form
  useEffect(() => {
    if (createFormData.display_name) {
      const generatedName = generateInternalName(createFormData.display_name);
      setCreateFormData((prev) => ({
        ...prev,
        name: generatedName,
      }));
    } else {
      setCreateFormData((prev) => ({
        ...prev,
        name: "",
      }));
    }
  }, [createFormData.display_name]);

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

  const handleOpenEditModal = (stage: Stage) => {
    setEditingStage(stage);
    setIsEditDialogOpen(true);
  };

  //handlers
  const handleCreateStage = async () => {
    await createStageService(createFormData, {
      createMutation: createStage,
      showSuccess,
      showError,
      refetchActive,
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        setCreateFormData({
          name: "",
          display_name: "",
          description: "",
          color: "#6B7280",
          sort_order: 1,
          is_active: true,
          is_default: false,
          automation: false,
          automation_config: null,
        });
      },
    });
  };

  const handleEditStage = async () => {
    if (!editingStage) return;

    await updateStageService(editingStage, {
      updateMutation: updateStage,
      showSuccess,
      showError,
      onSuccess: () => {
        setIsEditDialogOpen(false);
        setEditingStage(null);
      },
    });
  };

  const handleDeleteStage = async (stage: Stage) => {
    await deleteStageService(stage, {
      deleteMutation: deleteStage,
      showSuccess,
      showError,
      showConfirm,
      refetchActive,
    });
  };

  const handleToggleStageStatus = async (
    stageId: string,
    currentlyActive: boolean
  ) => {
    await toggleStageStatusService(stageId, currentlyActive, {
      activateMutation: activateStage,
      deactivateMutation: deactivateStage,
      showSuccess,
      showError,
    });
  };

  const handleReorder = async (stageId: string, direction: "up" | "down") => {
    await reorderStageService(stageId, direction, activeStages, {
      reorderMutation: reorderStages,
      showSuccess,
      showError,
    });
  };

  const handleSetupDefaults = async () => {
    await setupDefaultStagesService({
      setupDefaultMutation: setupDefaultStages,
      showSuccess,
      showError,
      showConfirm,
      refetchActive,
    });
  };
  const activeStages = activeStagesData?.stages || [];
  const inactiveStages = inactiveStagesData?.stages || [];
  const sortedActiveStages = sortStagesByOrder(activeStages);
  const { totalActive, totalInactive, totalStages } = calculateStageStats(
    activeStagesData,
    inactiveStagesData
  );
  return (
    <div className="container mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stage Management</h1>
          <p className="text-gray-600 mt-1">
            Configure and manage lead stages for your CRM workflow
          </p>
        </div>
        <div className="flex gap-2">
          {activeStages.length === 0 && !loadingActive && (
            <Button
              onClick={handleSetupDefaults}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Setup Defaults
            </Button>
          )}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatsCard
          title="Active Stages"
          value={totalActive}
          icon={<CheckCircle className="w-8 h-8 text-green-600" />}
          isLoading={loadingActive}
        />

        <StatsCard
          title="Inactive Stages"
          value={totalInactive}
          icon={<XCircle className="w-8 h-8 text-gray-600" />}
          isLoading={loadingInactive}
        />

        <StatsCard
          title="Total Leads"
          value={totalStages}
          icon={<Users className="w-8 h-8 text-blue-600" />}
          isLoading={loadingActive}
        />
      </div>

      {/* Tabs for Active and Inactive Stages */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Stages</TabsTrigger>
          <TabsTrigger value="inactive">Inactive Stages</TabsTrigger>
        </TabsList>

        {/* Active Stages */}
        <TabsContent value="active" className="space-y-4">
          {/* Show actual data when available */}
          {sortedActiveStages.length > 0 && (
            <div className="grid gap-4">
              {sortedActiveStages.map((stage) => (
                <AdminDataConfCard
                  key={stage.id}
                  title={stage.display_name}
                  subtitle={stage.name}
                  description={stage.description}
                  color={stage.color}
                  isActive={true}
                  badges={[
                    { text: "Active", variant: "success-light" },
                    ...(stage.is_default
                      ? [
                          {
                            text: "Default",
                            variant: "primary-ghost" as const,
                          },
                        ]
                      : []),
                  ]}
                  leadCount={stage.lead_count}
                  orderNumber={stage.sort_order}
                  createdBy={stage.created_by}
                  createdAt={stage.created_at}
                  onEdit={() => handleOpenEditModal(stage)}
                  onDelete={() => handleDeleteStage(stage)}
                  onDeactivate={() =>
                    handleToggleStageStatus(stage.id, stage.is_active)
                  }
                  onMoveUp={() => handleReorder(stage.id, "up")}
                  onMoveDown={() => handleReorder(stage.id, "down")}
                  canEdit={true}
                  canDelete={stage.lead_count === 0}
                  canReorder={true}
                  showReorderOutside={true}
                  isLoading={false}
                />
              ))}
            </div>
          )}

          {/* Loading State - Show skeleton when loading and no data */}
          {loadingActive && sortedActiveStages.length === 0 && (
            <div className="grid gap-4">
              {[...Array(3)].map((_, i) => (
                <AdminDataConfCard
                  key={`loading-active-${i}`}
                  title=""
                  badges={[]}
                  canEdit={false}
                  canDelete={false}
                  canReorder={false}
                  isLoading={true}
                />
              ))}
            </div>
          )}

          {/* Empty State - Show only when not loading and no data */}
          {sortedActiveStages.length === 0 && !loadingActive && (
            <div className="text-center py-12">
              <CheckCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
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
            </div>
          )}
        </TabsContent>

        {/* Inactive Stages */}
        <TabsContent value="inactive" className="space-y-4">
          {/* Show actual data when available */}
          {inactiveStages.length > 0 && (
            <div className="grid gap-4">
              {inactiveStages.map((stage) => (
                <AdminDataConfCard
                  key={stage.id}
                  title={stage.display_name}
                  subtitle={stage.name}
                  description={stage.description}
                  color={stage.color}
                  isActive={false}
                  badges={[
                    { text: "Inactive", variant: "secondary" },
                    ...(stage.is_default
                      ? [
                          {
                            text: "Default",
                            variant: "primary-ghost" as const,
                          },
                        ]
                      : []),
                  ]}
                  leadCount={stage.lead_count}
                  orderNumber={stage.sort_order}
                  createdBy={stage.created_by}
                  createdAt={stage.created_at}
                  onEdit={() => handleOpenEditModal(stage)}
                  onDelete={() => handleDeleteStage(stage)}
                  onActivate={() =>
                    handleToggleStageStatus(stage.id, stage.is_active)
                  }
                  onMoveUp={() => handleReorder(stage.id, "up")}
                  onMoveDown={() => handleReorder(stage.id, "down")}
                  canEdit={true}
                  canDelete={stage.lead_count === 0}
                  canReorder={true}
                  showReorderOutside={true}
                  isLoading={false}
                />
              ))}
            </div>
          )}

          {/* Loading State - Show skeleton when loading and no data */}
          {loadingInactive && inactiveStages.length === 0 && (
            <div className="grid gap-4">
              {[...Array(2)].map((_, i) => (
                <AdminDataConfCard
                  key={`loading-inactive-${i}`}
                  title=""
                  badges={[]}
                  canEdit={false}
                  canDelete={false}
                  canReorder={false}
                  isLoading={true}
                />
              ))}
            </div>
          )}

          {/* Empty State - Show only when not loading and no data */}
          {inactiveStages.length === 0 && !loadingInactive && (
            <div className="text-center py-12">
              <XCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Inactive Stages
              </h3>
              <p className="text-gray-600 mb-4">
                All stages are currently active
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Stage Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px] min-w-xl max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Create New Stage</DialogTitle>
            <DialogDescription>
              Add a new stage to your lead workflow
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name *</Label>
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
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Internal Name (Auto-generated)</Label>
              <Input
                id="name"
                value={createFormData.name}
                disabled
                className="bg-gray-50 text-gray-600"
                placeholder="Auto-generated from display name"
              />
              <p className="text-xs text-gray-500 mt-1">
                Automatically generated from display name (lowercase, spaces
                replaced with underscores)
              </p>
            </div>

            <div className="space-y-2">
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
              <div className="space-y-2">
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
              <div className="space-y-2">
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
            <div className="space-y-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="automation"
                  checked={createFormData.automation}
                  onCheckedChange={(checked) =>
                    setCreateFormData((prev) => ({
                      ...prev,
                      automation: checked,
                      automation_config: checked ? { template_name: "" } : null,
                    }))
                  }
                />
                <Label htmlFor="automation">Enable WhatsApp Automation</Label>
              </div>

              {createFormData.automation && (
                <div className="space-y-2 ml-6">
                  <WhatsAppTemplateSelect
                    showLabel={false}
                    value={
                      createFormData.automation_config?.template_name || ""
                    }
                    onValueChange={(templateName) =>
                      setCreateFormData((prev) => ({
                        ...prev,
                        automation_config: { template_name: templateName },
                      }))
                    }
                    required
                  />
                </div>
              )}
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
        <DialogContent className="sm:max-w-[500px] min-w-xl max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Stage</DialogTitle>
            <DialogDescription>Update stage information</DialogDescription>
          </DialogHeader>
          {editingStage && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit_display_name">Display Name *</Label>
                <Input
                  id="edit_display_name"
                  value={editingStage.display_name}
                  onChange={(e) =>
                    setEditingStage((prev) =>
                      prev ? { ...prev, display_name: e.target.value } : null
                    )
                  }
                  placeholder="e.g., Initial Contact"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_name">
                  Internal Name (Cannot be changed)
                </Label>
                <Input
                  id="edit_name"
                  value={editingStage.name}
                  disabled
                  className="bg-gray-50 text-gray-600"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Internal name cannot be modified after creation
                </p>
              </div>

              <div className="space-y-2">
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
                <div className="space-y-2">
                  <Label htmlFor="edit_color">Color</Label>
                  <Select
                    value={editingStage.color}
                    onValueChange={(value) =>
                      setEditingStage((prev) =>
                        prev ? { ...prev, color: value } : null
                      )
                    }
                  >
                    <SelectTrigger className="w-full">
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
                <div className="space-y-2">
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
              <div className="space-y-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit_automation"
                    checked={editingStage.automation || false}
                    onCheckedChange={(checked) =>
                      setEditingStage((prev) =>
                        prev
                          ? {
                              ...prev,
                              automation: checked,
                              automation_config: checked
                                ? prev.automation_config || {
                                    template_name: "",
                                  }
                                : null,
                            }
                          : null
                      )
                    }
                  />
                  <Label htmlFor="edit_automation">
                    Enable WhatsApp Automation
                  </Label>
                </div>
                {editingStage.automation && (
                  <div className="space-y-2 ml-6">
                    <WhatsAppTemplateSelect
                      showLabel={false}
                      value={
                        editingStage.automation_config?.template_name || ""
                      }
                      onValueChange={(templateName) =>
                        setEditingStage((prev) =>
                          prev
                            ? {
                                ...prev,
                                automation_config: {
                                  template_name: templateName,
                                },
                              }
                            : null
                        )
                      }
                      required
                    />
                  </div>
                )}
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

      {/* WhatsApp Template Selection Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select WhatsApp Template</DialogTitle>
            <DialogDescription>
              Choose a template for automation when leads move to this stage
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StageManagementPage;
