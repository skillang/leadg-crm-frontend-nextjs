// Fixed CourseLevelManagementPage with proper loading pattern to prevent flash of empty state
"use client";

import React, { useState, useEffect } from "react";
import {
  useGetCourseLevelsQuery,
  useGetInactiveCourseLevelsQuery,
  useCreateCourseLevelMutation,
  useUpdateCourseLevelMutation,
  useDeleteCourseLevelMutation,
  useActivateCourseLevelMutation,
  useDeactivateCourseLevelMutation,
} from "@/redux/slices/courseLevelsApi";
import { useNotifications } from "@/components/common/NotificationSystem";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  CheckCircle,
  XCircle,
  GraduationCap,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import {
  CourseLevel,
  CreateCourseLevelRequest,
  UpdateCourseLevelRequest,
} from "@/models/types/courseLevel";
import StatsCard from "@/components/custom/cards/StatsCard";
import AdminDataConfCard from "@/components/custom/cards/AdminDataConfCard";
import {
  generateInternalName,
  createCourseLevelService,
  updateCourseLevelService,
  deleteCourseLevelService,
  activateDeactivateCourseLevelService,
  filterAndSortCourseLevels,
} from "@/services/courseLevels/courseLevelService";

const CourseLevelManagementPage = () => {
  // State for forms and dialogs
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCourseLevel, setEditingCourseLevel] =
    useState<CourseLevel | null>(null);
  const [activeTab, setActiveTab] = useState("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "created_at" | "sort_order">(
    "sort_order"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [createFormData, setCreateFormData] =
    useState<CreateCourseLevelRequest>({
      name: "",
      display_name: "",
      description: "",
      sort_order: 1,
      is_active: true,
      is_default: false,
    });

  const [editFormData, setEditFormData] = useState<UpdateCourseLevelRequest>(
    {}
  );

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
    description: "You need admin privileges to manage course levels.",
  });

  // RTK Query hooks - Always start both queries to prevent refetch errors
  const {
    data: activeCourseLevelsData,
    isLoading: isLoadingActive,
    error: activeError,
    refetch: refetchActive,
  } = useGetCourseLevelsQuery({ include_lead_count: true, active_only: true });

  const {
    data: inactiveCourseLevelsData,
    isLoading: isLoadingInactive,
    error: inactiveError,
    refetch: refetchInactive,
  } = useGetInactiveCourseLevelsQuery({ include_lead_count: true });

  // Mutations
  const [createCourseLevel, { isLoading: isCreating }] =
    useCreateCourseLevelMutation();
  const [updateCourseLevel, { isLoading: isUpdating }] =
    useUpdateCourseLevelMutation();
  const [deleteCourseLevel] = useDeleteCourseLevelMutation();
  const [activateCourseLevel] = useActivateCourseLevelMutation();
  const [deactivateCourseLevel] = useDeactivateCourseLevelMutation();

  // Check admin access
  if (!hasAccess) {
    return null;
  }

  // Get current data based on active tab
  const currentData =
    activeTab === "active" ? activeCourseLevelsData : inactiveCourseLevelsData;
  const isLoading =
    activeTab === "active" ? isLoadingActive : isLoadingInactive;
  const error = activeTab === "active" ? activeError : inactiveError;
  const courseLevels = currentData?.course_levels || [];

  // Filter and sort course levels
  const filteredAndSortedCourseLevels = filterAndSortCourseLevels(
    courseLevels,
    searchTerm,
    sortBy,
    sortOrder
  );

  // Handlers
  const handleCreateCourseLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    await createCourseLevelService(createFormData, {
      createMutation: createCourseLevel,
      showSuccess,
      showError,
      refetchActive,
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        setCreateFormData({
          name: "",
          display_name: "",
          description: "",
          sort_order: 1,
          is_active: true,
          is_default: false,
        });
      },
    });
  };

  const handleUpdateCourseLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourseLevel) return;

    await updateCourseLevelService(editingCourseLevel, editFormData, {
      updateMutation: updateCourseLevel,
      showSuccess,
      showError,
      refetchActive,
      refetchInactive,
      onSuccess: () => {
        setIsEditDialogOpen(false);
        setEditingCourseLevel(null);
        setEditFormData({});
      },
    });
  };

  const handleDeleteCourseLevel = async (courseLevel: CourseLevel) => {
    await deleteCourseLevelService(courseLevel, activeTab, {
      deleteMutation: deleteCourseLevel,
      showSuccess,
      showError,
      showConfirm,
      refetchActive,
      refetchInactive,
    });
  };

  const handleActivateDeactivate = async (
    courseLevel: CourseLevel,
    action: "activate" | "deactivate"
  ) => {
    await activateDeactivateCourseLevelService(courseLevel, action, {
      activateMutation: activateCourseLevel,
      deactivateMutation: deactivateCourseLevel,
      showSuccess,
      showError,
      refetchActive,
      refetchInactive,
    });
  };

  const openEditDialog = (courseLevel: CourseLevel) => {
    setEditingCourseLevel(courseLevel);
    setEditFormData({
      name: courseLevel.name, // Include name for reference but won't be editable
      display_name: courseLevel.display_name,
      description: courseLevel.description,
      sort_order: courseLevel.sort_order,
      is_active: courseLevel.is_active,
      is_default: courseLevel.is_default,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (courseLevel: CourseLevel) => {
    handleDeleteCourseLevel(courseLevel);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Course Level Management
          </h1>
          <p className="text-muted-foreground">
            Manage course levels for lead categorization and tracking
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Course Level
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Total Course Levels"
          value={currentData?.total || 0}
          icon={<GraduationCap className="h-8 w-8 text-blue-600" />}
          isLoading={isLoading}
        />

        <StatsCard
          title="Active Levels"
          value={currentData?.active_count || 0}
          icon={<CheckCircle className="h-8 w-8 text-green-600" />}
          isLoading={isLoading}
        />

        <StatsCard
          title="Inactive Levels"
          value={currentData?.inactive_count || 0}
          icon={<XCircle className="h-8 w-8 text-gray-600" />}
          isLoading={isLoading}
        />
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search course levels..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Select
            value={sortBy}
            onValueChange={(value: "name" | "created_at" | "sort_order") =>
              setSortBy(value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sort_order">Sort Order</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="created_at">Created Date</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            {sortOrder === "asc" ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Active ({activeCourseLevelsData?.active_count || 0})
          </TabsTrigger>
          <TabsTrigger value="inactive" className="gap-2">
            <XCircle className="h-4 w-4" />
            Inactive ({inactiveCourseLevelsData?.inactive_count || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {/* Error State */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center text-red-600">
                  <XCircle className="h-5 w-5 mr-2" />
                  Failed to load course levels
                </div>
              </CardContent>
            </Card>
          )}

          {/* Show actual data when available */}
          {filteredAndSortedCourseLevels.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAndSortedCourseLevels.map((courseLevel) => (
                <AdminDataConfCard
                  key={courseLevel.id}
                  title={courseLevel.display_name}
                  subtitle={courseLevel.name}
                  description={courseLevel.description}
                  isActive={courseLevel.is_active}
                  badges={[
                    {
                      text: courseLevel.is_active ? "Active" : "Inactive",
                      variant: courseLevel.is_active
                        ? "success-light"
                        : "secondary",
                    },
                    // Conditionally add default badge
                    ...(courseLevel.is_default
                      ? [
                          {
                            text: "Default",
                            variant: "primary-ghost" as const,
                          },
                        ]
                      : []),
                  ]}
                  leadCount={courseLevel.lead_count}
                  orderNumber={courseLevel.sort_order}
                  createdBy={courseLevel.created_by}
                  createdAt={courseLevel.created_at}
                  onEdit={() => openEditDialog(courseLevel)}
                  onDelete={() => openDeleteDialog(courseLevel)}
                  onActivate={
                    !courseLevel.is_active
                      ? () => handleActivateDeactivate(courseLevel, "activate")
                      : undefined
                  }
                  onDeactivate={
                    courseLevel.is_active
                      ? () =>
                          handleActivateDeactivate(courseLevel, "deactivate")
                      : undefined
                  }
                  canEdit={true}
                  canDelete={courseLevel.lead_count === 0}
                  canReorder={false}
                  isLoading={false}
                />
              ))}
            </div>
          )}

          {/* Loading State - Show skeleton when loading and no data */}
          {isLoading && filteredAndSortedCourseLevels.length === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <AdminDataConfCard
                  key={`loading-${activeTab}-${i}`}
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
          {!isLoading &&
            !error &&
            filteredAndSortedCourseLevels.length === 0 && (
              <div className="text-center py-8">
                <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">
                  {searchTerm
                    ? "No course levels found matching your search"
                    : `No ${activeTab} course levels found`}
                </p>
                {searchTerm ? (
                  <Button variant="ghost" onClick={() => setSearchTerm("")}>
                    Clear search
                  </Button>
                ) : activeTab === "active" ? (
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Course Level
                  </Button>
                ) : null}
              </div>
            )}
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px] min-w-xl max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Create New Course Level</DialogTitle>
            <DialogDescription>
              Add a new course level for lead categorization.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCourseLevel} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name *</Label>
              <Input
                id="display_name"
                value={createFormData.display_name}
                onChange={(e) =>
                  setCreateFormData({
                    ...createFormData,
                    display_name: e.target.value,
                  })
                }
                placeholder="e.g., Undergraduate Programs"
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
              <p className="text-xs text-gray-500">
                Automatically generated from display name (lowercase, spaces
                replaced with hyphens)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={createFormData.description}
                onChange={(e) =>
                  setCreateFormData({
                    ...createFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Brief description of this course level"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sort_order">Sort Order</Label>
              <Input
                id="sort_order"
                type="number"
                value={createFormData.sort_order}
                onChange={(e) =>
                  setCreateFormData({
                    ...createFormData,
                    sort_order: parseInt(e.target.value) || 1,
                  })
                }
                min={1}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={createFormData.is_active}
                onCheckedChange={(checked) =>
                  setCreateFormData({ ...createFormData, is_active: checked })
                }
              />
              <Label htmlFor="is_active">Active</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_default"
                checked={createFormData.is_default}
                onCheckedChange={(checked) =>
                  setCreateFormData({ ...createFormData, is_default: checked })
                }
              />
              <Label htmlFor="is_default">Set as default</Label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Course Level"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] min-w-xl max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Course Level</DialogTitle>
            <DialogDescription>
              Update the course level information.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateCourseLevel} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_name">
                Internal Name (Cannot be changed)
              </Label>
              <Input
                id="edit_name"
                value={editFormData.name || ""}
                disabled
                className="bg-gray-50 text-gray-600"
              />
              <p className="text-xs text-gray-500">
                Internal name cannot be modified after creation
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_display_name">Display Name *</Label>
              <Input
                id="edit_display_name"
                value={editFormData.display_name || ""}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    display_name: e.target.value,
                  })
                }
                placeholder="e.g., Undergraduate Programs"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_description">Description</Label>
              <Textarea
                id="edit_description"
                value={editFormData.description || ""}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Brief description of this course level"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_sort_order">Sort Order</Label>
              <Input
                id="edit_sort_order"
                type="number"
                value={editFormData.sort_order || 1}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    sort_order: parseInt(e.target.value) || 1,
                  })
                }
                min={1}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit_is_active"
                checked={editFormData.is_active ?? true}
                onCheckedChange={(checked) =>
                  setEditFormData({ ...editFormData, is_active: checked })
                }
              />
              <Label htmlFor="edit_is_active">Active</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit_is_default"
                checked={editFormData.is_default ?? false}
                onCheckedChange={(checked) =>
                  setEditFormData({ ...editFormData, is_default: checked })
                }
              />
              <Label htmlFor="edit_is_default">Set as default</Label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Updating..." : "Update Course Level"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseLevelManagementPage;
