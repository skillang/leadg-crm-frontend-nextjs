// src/app/admin/course-levels/page.tsx

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  CheckCircle,
  XCircle,
  GraduationCap,
  Users,
  MoreVertical,
  Calendar,
  User,
  Hash,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import {
  CourseLevel,
  CreateCourseLevelRequest,
  UpdateCourseLevelRequest,
} from "@/models/types/courseLevel";

// Define API error interface for better type safety
interface ApiError {
  data?: {
    detail?: string;
    message?: string;
  };
  message?: string;
  status?: number;
}

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

  // Function to generate internal name from display name
  const generateInternalName = (displayName: string): string => {
    return displayName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-") // Replace one or more spaces with single hyphen
      .replace(/[^a-z0-9-]/g, "") // Remove any character that's not lowercase letter, number, or hyphen
      .replace(/-+/g, "-") // Replace multiple consecutive hyphens with single hyphen
      .replace(/^-|-$/g, ""); // Remove leading and trailing hyphens
  };

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
  const [activateCourseLevel, { isLoading: isActivating }] =
    useActivateCourseLevelMutation();
  const [deactivateCourseLevel, { isLoading: isDeactivating }] =
    useDeactivateCourseLevelMutation();

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
  const filteredAndSortedCourseLevels = courseLevels
    .filter(
      (level) =>
        level.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        level.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        level.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "created_at":
          comparison =
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "sort_order":
          comparison = a.sort_order - b.sort_order;
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  // Handlers
  const handleCreateCourseLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCourseLevel(createFormData).unwrap();

      // Close dialog and reset form first
      setIsCreateDialogOpen(false);
      setCreateFormData({
        name: "",
        display_name: "",
        description: "",
        sort_order: 1,
        is_active: true,
        is_default: false,
      });

      // Show success message
      showSuccess(
        `Course level "${createFormData.display_name}" created successfully!`
      );

      // Refetch active data since new course levels are created as active by default
      refetchActive();
    } catch (error: unknown) {
      const apiError = error as ApiError;
      const errorMessage =
        apiError?.data?.detail ||
        apiError?.data?.message ||
        "Failed to create course level";
      showError(errorMessage);
    }
  };

  const handleUpdateCourseLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourseLevel) return;

    try {
      // Remove 'name' from editFormData since it shouldn't be updated
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { name: _name, ...updateData } = editFormData;

      await updateCourseLevel({
        courseLevelId: editingCourseLevel.id,
        data: updateData,
      }).unwrap();

      // Close dialog and reset state first
      setIsEditDialogOpen(false);
      setEditingCourseLevel(null);
      setEditFormData({});

      // Show success message
      showSuccess(
        `Course level "${editingCourseLevel.display_name}" updated successfully!`
      );

      // Refetch both tabs since status might have changed
      refetchActive();
      refetchInactive();
    } catch (error: unknown) {
      const apiError = error as ApiError;
      const errorMessage =
        apiError?.data?.detail ||
        apiError?.data?.message ||
        "Failed to update course level";
      showError(errorMessage);
    }
  };

  const handleDeleteCourseLevel = async (courseLevel: CourseLevel) => {
    // Check if course level has leads before showing confirmation
    if (courseLevel.lead_count > 0) {
      showError(
        `Cannot delete "${courseLevel.display_name}" because it has ${courseLevel.lead_count} associated leads. Please reassign or remove the leads first.`
      );
      return;
    }

    // Use notification system for confirmation
    showConfirm({
      title: "Delete Course Level",
      description: `Are you sure you want to permanently delete the course level "${courseLevel.display_name}"? This action cannot be undone.`,
      confirmText: "Delete Course Level",
      cancelText: "Cancel",
      variant: "destructive",
      onConfirm: async () => {
        try {
          await deleteCourseLevel(courseLevel.id).unwrap();
          showSuccess(
            `Course level "${courseLevel.display_name}" deleted successfully!`
          );

          // Refetch only the current active tab's data
          if (activeTab === "active") {
            refetchActive();
          } else {
            refetchInactive();
          }
        } catch (error: unknown) {
          // Extract meaningful error message
          let errorMessage = "Failed to delete course level";
          const apiError = error as ApiError;

          if (apiError?.data?.detail) {
            errorMessage = apiError.data.detail;
          } else if (apiError?.data?.message) {
            errorMessage = apiError.data.message;
          } else if (apiError?.message) {
            errorMessage = apiError.message;
          } else if (typeof error === "string") {
            errorMessage = error;
          }

          showError(errorMessage);
        }
      },
    });
  };

  const handleActivateDeactivate = async (
    courseLevel: CourseLevel,
    action: "activate" | "deactivate"
  ) => {
    try {
      if (action === "activate") {
        await activateCourseLevel(courseLevel.id).unwrap();
        showSuccess(
          `Course level "${courseLevel.display_name}" activated successfully!`
        );
      } else {
        await deactivateCourseLevel(courseLevel.id).unwrap();
        showSuccess(
          `Course level "${courseLevel.display_name}" deactivated successfully!`
        );
      }

      // Refetch both tabs since activation/deactivation moves items between tabs
      refetchActive();
      refetchInactive();
    } catch (error: unknown) {
      const apiError = error as ApiError;
      const errorMessage =
        apiError?.data?.detail ||
        apiError?.data?.message ||
        `Failed to ${action} course level`;
      showError(errorMessage);
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6 p-6">
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Course Levels
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentData?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Levels</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {currentData?.active_count || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Inactive Levels
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {currentData?.inactive_count || 0}
            </div>
          </CardContent>
        </Card>
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
            Active ({currentData?.active_count || 0})
          </TabsTrigger>
          <TabsTrigger value="inactive" className="gap-2">
            <XCircle className="h-4 w-4" />
            Inactive ({currentData?.inactive_count || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-muted-foreground">
                  Loading course levels...
                </p>
              </div>
            </div>
          )}

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

          {/* Course Levels Grid */}
          {!isLoading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAndSortedCourseLevels.map((courseLevel) => (
                <Card
                  key={courseLevel.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-lg">
                          {courseLevel.display_name}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {courseLevel.name}
                          </Badge>
                          <Badge
                            variant={
                              courseLevel.is_active ? "default" : "secondary"
                            }
                            className="text-xs"
                          >
                            {courseLevel.is_active ? "Active" : "Inactive"}
                          </Badge>
                          {courseLevel.is_default && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                            >
                              Default
                            </Badge>
                          )}
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => openEditDialog(courseLevel)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {courseLevel.is_active ? (
                            <DropdownMenuItem
                              onClick={() =>
                                handleActivateDeactivate(
                                  courseLevel,
                                  "deactivate"
                                )
                              }
                              disabled={isDeactivating}
                            >
                              <EyeOff className="h-4 w-4 mr-2" />
                              Deactivate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() =>
                                handleActivateDeactivate(
                                  courseLevel,
                                  "activate"
                                )
                              }
                              disabled={isActivating}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Activate
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(courseLevel)}
                            className="text-red-600"
                            disabled={courseLevel.lead_count > 0}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {courseLevel.lead_count > 0
                              ? `Cannot Delete (${courseLevel.lead_count} leads)`
                              : "Delete"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {courseLevel.description && (
                      <p className="text-sm text-gray-600">
                        {courseLevel.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>{courseLevel.lead_count} leads</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Hash className="h-4 w-4" />
                        <span>Order: {courseLevel.sort_order}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t text-xs text-gray-500">
                      <div className="flex items-center gap-1 mb-1">
                        <User className="h-3 w-3" />
                        <span>Created by {courseLevel.created_by}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Created {formatDate(courseLevel.created_at)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* No results */}
          {!isLoading &&
            !error &&
            filteredAndSortedCourseLevels.length === 0 && (
              <div className="text-center py-8">
                <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">
                  {searchTerm
                    ? "No course levels found matching your search"
                    : "No course levels found"}
                </p>
                {searchTerm && (
                  <Button variant="ghost" onClick={() => setSearchTerm("")}>
                    Clear search
                  </Button>
                )}
              </div>
            )}
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
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
        <DialogContent className="sm:max-w-[425px]">
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
