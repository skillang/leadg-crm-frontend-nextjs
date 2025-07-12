// src/app/admin/lead-categories/page.tsx

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
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
} from "@/redux/slices/categoriesApi";
import CreateCategoryModal from "@/components/leads/CreateCategoryModal";
import EditCategoryModal from "@/components/leads/EditCategoryModal";
import type { Category } from "@/models/types/category";

const CategoriesPage = () => {
  // ALL HOOKS MUST BE CALLED FIRST - before any conditionals
  const { showSuccess, showError } = useNotifications();
  const { hasAccess, AccessDeniedComponent } = useAdminAccess({
    title: "Admin Access Required",
    description: "You need admin privileges to manage lead categories.",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // RTK Query hooks
  const {
    data: categoriesData,
    isLoading,
    error,
  } = useGetCategoriesQuery({ include_inactive: showInactive });

  const [createCategory, { isLoading: isCreating }] =
    useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] =
    useUpdateCategoryMutation();

  // Show error notification for loading errors
  React.useEffect(() => {
    if (error) {
      showError("Failed to load categories", "Loading Error");
    }
  }, [error, showError]);

  // CONDITIONAL ACCESS CHECK AFTER ALL HOOKS
  if (!hasAccess) {
    return AccessDeniedComponent;
  }

  // Filter categories based on search term
  const filteredCategories =
    categoriesData?.categories?.filter(
      (category) =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.short_form.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (category.description &&
          category.description.toLowerCase().includes(searchTerm.toLowerCase()))
    ) || [];

  const handleCreateCategory = async (categoryData: {
    name: string;
    short_form: string;
    description?: string;
    is_active: boolean;
  }) => {
    try {
      await createCategory(categoryData).unwrap();
      setIsCreateModalOpen(false);
      showSuccess(
        `Category "${categoryData.name}" created successfully!`,
        "Category Created"
      );
    } catch (error) {
      console.error("Failed to create category:", error);
      showError(
        "Failed to create category. Please try again.",
        "Creation Failed"
      );
    }
  };

  const handleUpdateCategory = async (categoryData: {
    name: string;
    description?: string;
    is_active: boolean;
  }) => {
    if (!editingCategory) return;

    try {
      await updateCategory({
        categoryId: editingCategory.id,
        data: categoryData,
      }).unwrap();
      setEditingCategory(null);
      showSuccess(
        `Category "${categoryData.name}" updated successfully!`,
        "Category Updated"
      );
    } catch (error) {
      console.error("Failed to update category:", error);
      showError(
        "Failed to update category. Please try again.",
        "Update Failed"
      );
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
          <h1 className="text-2xl font-bold text-gray-900">Lead Categories</h1>
          <p className="text-gray-600">
            Manage category types for organizing leads
          </p>
        </div>

        {/* Since only admins can access this page, always show the button */}
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Summary Stats */}
      {categoriesData?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Categories
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {categoriesData.summary.total}
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
                    Active Categories
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {categoriesData.summary.active}
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
                    Inactive Categories
                  </p>
                  <p className="text-2xl font-bold text-gray-500">
                    {categoriesData.summary.inactive}
                  </p>
                </div>
                <EyeOff className="h-8 w-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search categories..."
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

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map((category) => (
          <Card
            key={category.id}
            className={`transition-all hover:shadow-md ${
              !category.is_active ? "opacity-60" : ""
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {category.short_form}
                    </Badge>
                    <Badge
                      variant={category.is_active ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {category.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>

                {/* Since only admins can access this page, always show the edit button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingCategory(category)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {category.description && (
                <p className="text-sm text-gray-600">{category.description}</p>
              )}

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>{category.lead_count} leads</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <Hash className="h-4 w-4" />
                  <span>Next: {category.next_lead_number}</span>
                </div>
              </div>

              <div className="pt-2 border-t text-xs text-gray-500">
                <div className="flex items-center gap-1 mb-1">
                  <User className="h-3 w-3" />
                  <span>Created by {category.created_by}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>Created {formatDate(category.created_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No results */}
      {filteredCategories.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No categories found</p>
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
      <CreateCategoryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateCategory}
        isLoading={isCreating}
      />

      <EditCategoryModal
        isOpen={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        onSubmit={handleUpdateCategory}
        category={editingCategory}
        isLoading={isUpdating}
      />
    </div>
  );
};

export default CategoriesPage;
