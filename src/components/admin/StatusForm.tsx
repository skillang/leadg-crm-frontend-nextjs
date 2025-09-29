// src/components/admin/StatusForm.tsx

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useCreateStatusMutation,
  useUpdateStatusMutation,
} from "@/redux/slices/statusesApi";
import {
  Status,
  CreateStatusRequest,
  UpdateStatusRequest,
} from "@/models/types/status";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNotifications } from "@/components/common/NotificationSystem";
import { Loader2 } from "lucide-react";
import { ApiError } from "@/models/types/apiError";

// Form validation schema
const statusSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be less than 50 characters")
    .regex(
      /^[a-zA-Z0-9_\s-]+$/,
      "Name can only contain letters, numbers, spaces, hyphens, and underscores"
    ),
  display_name: z
    .string()
    .min(1, "Display name is required")
    .max(100, "Display name must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .or(z.literal("")),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format"),
  sort_order: z.number().min(0, "Sort order must be non-negative"),
  is_active: z.boolean(),
  is_default: z.boolean(),
});

type StatusFormData = z.infer<typeof statusSchema>;

interface StatusFormProps {
  status?: Status | null;
  onClose: () => void;
  onSuccess: () => void;
}

// Predefined color options
const colorOptions = [
  { name: "Gray", value: "#6B7280" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Green", value: "#10B981" },
  { name: "Yellow", value: "#F59E0B" },
  { name: "Red", value: "#EF4444" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Pink", value: "#EC4899" },
  { name: "Indigo", value: "#6366F1" },
  { name: "Orange", value: "#F97316" },
  { name: "Teal", value: "#14B8A6" },
];

// Utility function to generate internal name from display name
const generateInternalName = (displayName: string): string => {
  return displayName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
};

// Utility function to convert RGB to Hex
const rgbToHex = (rgb: string): string => {
  // Handle rgb(r, g, b) format
  const rgbMatch = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]);
    const g = parseInt(rgbMatch[2]);
    const b = parseInt(rgbMatch[3]);
    return (
      "#" +
      ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()
    );
  }

  // If it's already hex, return as is
  if (rgb.startsWith("#")) {
    return rgb;
  }

  // Default fallback
  return "#6B7280";
};

// Utility function to ensure valid hex format
const ensureHexFormat = (color: string): string => {
  if (color.startsWith("rgb")) {
    return rgbToHex(color);
  }
  if (color.startsWith("#") && color.length === 7) {
    return color;
  }
  return "#6B7280"; // Default gray
};

const StatusForm: React.FC<StatusFormProps> = ({
  status,
  onClose,
  onSuccess,
}) => {
  const isEditing = !!status;
  const { showSuccess, showError, showConfirm } = useNotifications();

  // State for auto-generated internal name
  const [displayName, setDisplayName] = useState("");

  // Mutations
  const [createStatus, { isLoading: isCreating }] = useCreateStatusMutation();
  const [updateStatus, { isLoading: isUpdating }] = useUpdateStatusMutation();

  const isLoading = isCreating || isUpdating;

  // Form setup
  const form = useForm<StatusFormData>({
    resolver: zodResolver(statusSchema),
    defaultValues: {
      name: "",
      display_name: "",
      description: "",
      color: "#6B7280",
      sort_order: 1,
      is_active: true,
      is_default: false,
    },
  });

  // Reset form when status changes
  useEffect(() => {
    if (status) {
      const formValues = {
        name: status.name,
        display_name: status.display_name,
        description: status.description || "",
        color: ensureHexFormat(status.color),
        sort_order: status.sort_order,
        is_active: status.is_active,
        is_default: status.is_default,
      };

      form.reset(formValues);
      setDisplayName(status.display_name);
    } else {
      const formValues = {
        name: "",
        display_name: "",
        description: "",
        color: "#6B7280",
        sort_order: 1,
        is_active: true,
        is_default: false,
      };

      form.reset(formValues);
      setDisplayName("");
    }
  }, [status, form]);

  // Auto-generate internal name when display name changes (only for create mode)
  useEffect(() => {
    if (!isEditing && displayName) {
      const generatedName = generateInternalName(displayName);
      form.setValue("name", generatedName);
    }
  }, [displayName, isEditing, form]);

  const handleSubmit = async (data: StatusFormData) => {
    try {
      // Ensure color is in proper hex format
      const submissionData = {
        ...data,
        color: ensureHexFormat(data.color),
      };

      if (isEditing && status) {
        // For editing, exclude the name field from updates
        const updateData: UpdateStatusRequest = {
          display_name: submissionData.display_name,
          description: submissionData.description || undefined,
          color: submissionData.color,
          sort_order: submissionData.sort_order,
          is_active: submissionData.is_active,
          is_default: submissionData.is_default,
        };

        await updateStatus({
          statusId: status.id,
          statusData: updateData,
        }).unwrap();

        showSuccess(
          `Status "${submissionData.display_name}" updated successfully!`
        );
      } else {
        const createData: CreateStatusRequest = {
          name: submissionData.name,
          display_name: submissionData.display_name,
          description: submissionData.description || "",
          color: submissionData.color,
          sort_order: submissionData.sort_order,
          is_active: submissionData.is_active,
          is_default: submissionData.is_default,
        };

        await createStatus(createData).unwrap();
        showSuccess(
          `Status "${submissionData.display_name}" created successfully!`
        );
      }

      onSuccess();
      onClose();
    } catch (error: unknown) {
      const apiError = error as ApiError;
      const errorMessage =
        apiError?.data?.detail ||
        apiError?.data?.message ||
        (isEditing ? "Failed to update status" : "Failed to create status");
      showError(errorMessage);
    }
  };

  const handleDeleteConfirm = () => {
    if (!status) return;

    showConfirm({
      title: "Delete Status",
      description: `Are you sure you want to permanently delete the status "${status.display_name}"? This action cannot be undone.`,
      confirmText: "Delete Status",
      cancelText: "Cancel",
      variant: "destructive",
      onConfirm: async () => {
        try {
          // Add your delete mutation here when available
          // await deleteStatus(status.id).unwrap();
          showSuccess(`Status "${status.display_name}" deleted successfully!`);
          onSuccess();
          onClose();
        } catch (error: unknown) {
          const apiError = error as ApiError;
          const errorMessage =
            apiError?.data?.detail ||
            apiError?.data?.message ||
            "Failed to delete status";
          showError(errorMessage);
        }
      },
    });
  };

  const handleColorChange = (
    value: string,
    onChange: (value: string) => void
  ) => {
    const hexColor = ensureHexFormat(value);
    onChange(hexColor);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] min-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Status" : "Create New Status"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the status information."
              : "Add a new status for lead management."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {/* Display Name */}
            <FormField
              control={form.control}
              name="display_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., New Lead"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        if (!isEditing) {
                          setDisplayName(e.target.value);
                        }
                      }}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isEditing
                      ? "Internal Name (Cannot be changed)"
                      : "Internal Name (Auto-generated)"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        isEditing
                          ? "Cannot be modified"
                          : "Auto-generated from display name"
                      }
                      {...field}
                      disabled={true}
                      className="bg-gray-50 text-gray-600"
                    />
                  </FormControl>
                  <FormDescription>
                    {isEditing
                      ? "Internal name cannot be modified after creation"
                      : "Automatically generated from display name (lowercase, spaces replaced with underscores)"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of this status"
                      rows={3}
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Color */}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      {/* Predefined Color Selection */}
                      <Select
                        value={field.value}
                        onValueChange={(value) =>
                          handleColorChange(value, field.onChange)
                        }
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-4 h-4 rounded border"
                              style={{ backgroundColor: field.value }}
                            />
                            <SelectValue placeholder="Select a color" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {colorOptions.map((color) => (
                            <SelectItem key={color.value} value={color.value}>
                              <div className="flex items-center space-x-2">
                                <div
                                  className="w-4 h-4 rounded border"
                                  style={{ backgroundColor: color.value }}
                                />
                                <span>{color.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Manual Color Input with Color Picker */}
                      <div className="flex items-center space-x-2">
                        <Input
                          placeholder="#6B7280"
                          value={field.value}
                          onChange={(e) =>
                            handleColorChange(e.target.value, field.onChange)
                          }
                          disabled={isLoading}
                          className="flex-1"
                          pattern="^#[0-9A-Fa-f]{6}$"
                        />
                        <input
                          type="color"
                          value={field.value}
                          onChange={(e) =>
                            handleColorChange(e.target.value, field.onChange)
                          }
                          disabled={isLoading}
                          className="w-10 h-10 border border-gray-300 rounded cursor-pointer disabled:opacity-50"
                          title="Pick a color"
                        />
                      </div>

                      {/* Color Preview */}
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Preview:</span>
                        <Badge
                          style={{
                            backgroundColor: field.value,
                            color:
                              field.value === "#FFFFFF" ? "#000000" : "#FFFFFF",
                          }}
                        >
                          {form.watch("display_name") || "Status"}
                        </Badge>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Sort Order */}
            <FormField
              control={form.control}
              name="sort_order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sort Order</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value) || 0)
                      }
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Active Switch */}
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Active</FormLabel>
                    <FormDescription>
                      Active statuses are available for selection
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Default Switch */}
            <FormField
              control={form.control}
              name="is_default"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Default Status</FormLabel>
                    <FormDescription>
                      New leads will use this status by default
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              {isEditing && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteConfirm}
                  disabled={isLoading}
                >
                  Delete
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>{isEditing ? "Update Status" : "Create Status"}</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default StatusForm;
