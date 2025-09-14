"use client";

import React, { useState } from "react";
import {
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
  // useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
} from "@/redux/slices/authApi";
import { useNotifications } from "@/components/common/NotificationSystem";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Building2, Plus } from "lucide-react";
import StatsCard from "@/components/custom/cards/StatsCard";
import AdminDataConfCard from "@/components/custom/cards/AdminDataConfCard";
import {
  createDepartmentService,
  deleteDepartmentService,
  calculateDepartmentStats,
} from "@/services/departments/departmentsService";

const DepartmentManagementPage = () => {
  // ALL HOOKS MUST BE CALLED FIRST - before any conditionals
  const { showSuccess, showError, showConfirm } = useNotifications();
  const { hasAccess, AccessDeniedComponent } = useAdminAccess({
    title: "Admin Access Required",
    description: "You need admin privileges to manage departments.",
  });

  // API hooks
  const {
    data: departmentsData,
    isLoading,
    error,
    refetch,
  } = useGetDepartmentsQuery({
    include_user_count: true,
  });
  const [createDepartment, { isLoading: isCreating }] =
    useCreateDepartmentMutation();
  const [deleteDepartment] = useDeleteDepartmentMutation();

  // Component state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: "",
    description: "",
    is_active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Show error notification for loading errors
  React.useEffect(() => {
    if (error) {
      showError("Failed to load departments", "Loading Error");
    }
  }, [error, showError]);

  // CONDITIONAL ACCESS CHECK AFTER ALL HOOKS
  if (!hasAccess) {
    return AccessDeniedComponent;
  }

  const { total, predefined, custom } =
    calculateDepartmentStats(departmentsData);

  // REPLACE the handlers with these simplified versions:
  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();

    await createDepartmentService(createFormData, {
      createMutation: createDepartment,
      showSuccess,
      showError,
      refetch,
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        setCreateFormData({ name: "", description: "", is_active: true });
        // Remove setErrors({}) since we don't use errors state anymore
      },
    });
  };

  const handleDeleteDepartment = async (
    departmentId: string,
    departmentName: string
  ) => {
    await deleteDepartmentService(departmentId, departmentName, {
      deleteMutation: deleteDepartment,
      showSuccess,
      showError,
      showConfirm,
      refetch,
    });
  };

  return (
    <div className="container mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-primary-600" />
            <div>
              <h1 className="text-2xl font-bold">Department Management</h1>
              <p className="text-gray-600">Manage organizational departments</p>
            </div>
          </div>
          <div className="mb-6">
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Department
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md min-w-lg max-w-2xl max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle>Create New Department</DialogTitle>
                  <DialogDescription>
                    Add a new custom department to your organization
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateDepartment} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Department Name *</Label>
                    <Input
                      id="name"
                      value={createFormData.name}
                      onChange={(e) => {
                        setCreateFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }));
                        if (errors.name)
                          setErrors((prev) => ({ ...prev, name: "" }));
                      }}
                      placeholder="e.g., Study Abroad"
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={createFormData.description}
                      onChange={(e) => {
                        setCreateFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }));
                        if (errors.description)
                          setErrors((prev) => ({ ...prev, description: "" }));
                      }}
                      placeholder="Describe the department's role and responsibilities"
                      rows={3}
                    />
                    {errors.description && (
                      <p className="text-sm text-red-600">
                        {errors.description}
                      </p>
                    )}
                  </div>

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
                    <Label htmlFor="is_active">Active Department</Label>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isCreating}>
                      {isCreating ? "Creating..." : "Create Department"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatsCard
          title="Total Departments"
          value={total}
          icon={<Building2 className="w-8 h-8 text-blue-500" />}
          isLoading={isLoading}
        />

        <StatsCard
          title="Predefined"
          value={predefined}
          icon={<Badge variant="secondary">System</Badge>}
          isLoading={isLoading}
        />

        <StatsCard
          title="Custom"
          value={custom}
          icon={<Badge variant="outline">Custom</Badge>}
          isLoading={isLoading}
        />
      </div>

      <div className="space-y-6">
        {/* Predefined Departments */}
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Predefined Departments
            <Badge variant="secondary">
              {departmentsData?.predefined_count || 0}
            </Badge>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departmentsData?.departments?.predefined?.map((dept) => (
              <AdminDataConfCard
                key={dept.name}
                title={dept.display_name}
                subtitle={dept.name}
                description={dept.description}
                badges={[
                  { text: "Predefined", variant: "secondary" },
                  { text: "Protected", variant: "outline" },
                ]}
                // leadCount={dept.user_count} // Add when available

                // No actions for predefined departments
                canEdit={false}
                canDelete={false}
                isLoading={isLoading}
              />
            )) || []}
          </div>
        </div>

        {/* Custom Departments */}
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Custom Departments
            <Badge variant="outline">
              {departmentsData?.custom_count || 0}
            </Badge>
          </h2>

          {departmentsData?.departments?.custom &&
          departmentsData.departments.custom.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departmentsData.departments.custom.map((dept) => (
                <AdminDataConfCard
                  key={dept.name}
                  title={dept.display_name}
                  subtitle={dept.name}
                  description={dept.description}
                  badges={[{ text: "Custom", variant: "default" }]}
                  // leadCount={dept.user_count} // Add when available
                  createdBy={dept.created_by} // If available
                  createdAt={dept.created_at} // If available
                  // Actions for custom departments
                  onDelete={() => handleDeleteDepartment(dept.id!, dept.name)}
                  canEdit={false} // Set to true when edit is implemented
                  canDelete={true}
                  isLoading={isLoading}
                />
              ))}
            </div>
          ) : (
            <AdminDataConfCard
              title="No Custom Departments"
              description="Create your first custom department to get started"
              badges={[]}
              canEdit={false}
              canDelete={false}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DepartmentManagementPage;
