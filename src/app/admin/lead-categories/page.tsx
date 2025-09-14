// Updated CategoriesPage with AdminDataConfCard integration

"use client";

import React, { useState } from "react";
import { Plus, Search, Eye, EyeOff, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import AdminDataConfCard from "@/components/custom/cards/AdminDataConfCard"; // Import AdminDataConfCard
import type { Category } from "@/models/types/category";
import StatsCard from "@/components/custom/cards/StatsCard";
import {
  createCategoryService,
  updateCategoryService,
  processCategoriesData,
} from "@/services/leadCategories/leadCategoriesService";

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

  const handleOpenEditModal = (category: Category) => {
    setEditingCategory(category);
  };

  const { filteredCategories, stats } = processCategoriesData(
    categoriesData,
    searchTerm
  );

  // REPLACE the handlers with these simplified versions:
  const handleCreateCategory = async (categoryData: {
    name: string;
    short_form: string;
    description?: string;
    is_active: boolean;
  }) => {
    await createCategoryService(categoryData, {
      createMutation: createCategory,
      showSuccess,
      showError,
      onSuccess: () => {
        setIsCreateModalOpen(false);
      },
    });
  };

  const handleUpdateCategory = async (categoryData: {
    name: string;
    description?: string;
    is_active: boolean;
  }) => {
    if (!editingCategory) return;

    await updateCategoryService(editingCategory, categoryData, {
      updateMutation: updateCategory,
      showSuccess,
      showError,
      onSuccess: () => {
        setEditingCategory(null);
      },
    });
  };

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

        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard
          title="Total Categories"
          value={stats.total}
          icon={<Hash className="h-8 w-8 text-blue-600" />}
          isLoading={isLoading}
        />

        <StatsCard
          title="Active Categories"
          value={stats.active}
          icon={<Eye className="h-8 w-8 text-green-600" />}
          isLoading={isLoading}
        />

        <StatsCard
          title="Inactive Categories"
          value={stats.inactive}
          icon={<EyeOff className="h-8 w-8 text-gray-500" />}
          isLoading={isLoading}
        />
      </div>

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

      {/* Categories Grid using AdminDataConfCard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map((category) => (
          <AdminDataConfCard
            key={category.id}
            title={category.name}
            subtitle={category.short_form}
            description={category.description}
            isActive={category.is_active}
            badges={[
              {
                text: category.is_active ? "Active" : "Inactive",
                variant: category.is_active ? "success-light" : "secondary",
              },
            ]}
            leadCount={category.lead_count}
            nextNumber={category.next_lead_number}
            createdBy={category.created_by}
            createdAt={category.created_at}
            // Actions
            onEdit={() => handleOpenEditModal(category)}
            // Permissions - Categories might not need delete/reorder functionality
            canEdit={true}
            canDelete={false} // Categories typically shouldn't be deleted if they have leads
            canReorder={false} // Categories might not need reordering
            showReorderOutside={false}
            isLoading={isLoading}
          />
        ))}
      </div>

      {/* No results */}
      {filteredCategories.length === 0 && !isLoading && (
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

      {/* Loading state for empty grid */}
      {isLoading && filteredCategories.length === 0 && (
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
