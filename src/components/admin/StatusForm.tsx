// src/components/admin/StatusForm.tsx

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useCreateStatusMutation,
  useUpdateStatusMutation,
  Status,
  CreateStatusRequest,
  UpdateStatusRequest,
} from "@/redux/slices/statusesApi";
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

const StatusForm: React.FC<StatusFormProps> = ({
  status,
  onClose,
  onSuccess,
}) => {
  const isEditing = !!status;

  // Use existing notification system
  const { showSuccess, showError } = useNotifications();

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
      sort_order: 0,
      is_active: true,
      is_default: false,
    },
  });

  // Reset form when status changes
  useEffect(() => {
    if (status) {
      form.reset({
        name: status.name,
        display_name: status.display_name,
        description: status.description || "",
        color: status.color,
        sort_order: status.sort_order,
        is_active: status.is_active,
        is_default: status.is_default,
      });
    } else {
      form.reset({
        name: "",
        display_name: "",
        description: "",
        color: "#6B7280",
        sort_order: 0,
        is_active: true,
        is_default: false,
      });
    }
  }, [status, form]);

  // Generate name from display name
  const generateName = (displayName: string) => {
    return displayName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "_")
      .substring(0, 50);
  };

  // Handle display name change
  const handleDisplayNameChange = (value: string) => {
    if (!isEditing) {
      // Auto-generate name only for new statuses
      const generatedName = generateName(value);
      form.setValue("name", generatedName);
    }
  };

  // Handle form submission
  const onSubmit = async (data: StatusFormData) => {
    try {
      if (isEditing && status) {
        // Update existing status
        const updateData: UpdateStatusRequest = {
          display_name: data.display_name,
          description: data.description || undefined,
          color: data.color,
          sort_order: data.sort_order,
          is_active: data.is_active,
          is_default: data.is_default,
        };

        const result = await updateStatus({
          statusId: status.id,
          statusData: updateData,
        }).unwrap();

        showSuccess(result.message || "Status updated successfully");
      } else {
        // Create new status
        const createData: CreateStatusRequest = {
          name: data.name,
          display_name: data.display_name,
          description: data.description || "null",
          color: data.color,
          sort_order: data.sort_order,
          is_active: data.is_active,
          is_default: data.is_default,
        };

        const result = await createStatus(createData).unwrap();
        showSuccess(result.message || "Status created successfully");
      }

      onSuccess();
    } catch (error: any) {
      console.error("Form submission error:", error);
      showError(error?.data?.detail || "Failed to save status");
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Status" : "Create New Status"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the status information below."
              : "Create a new lead status for your CRM workflow."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., contacted"
                      disabled={isEditing || isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    {isEditing
                      ? "Status name cannot be changed after creation"
                      : "Unique identifier (auto-generated from display name)"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Display Name Field */}
            <FormField
              control={form.control}
              name="display_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Contacted"
                      disabled={isLoading}
                      onChange={(e) => {
                        field.onChange(e);
                        handleDisplayNameChange(e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Friendly name shown in the UI
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description Field */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="e.g., Lead has been contacted"
                      disabled={isLoading}
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional description of what this status represents
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Color Field */}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      {/* Color Selection */}
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
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

                      {/* Manual Color Input */}
                      <div className="flex items-center space-x-2">
                        <Input
                          placeholder="#6B7280"
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          disabled={isLoading}
                          className="flex-1"
                        />
                        <input
                          type="color"
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          className="w-10 h-10 border rounded cursor-pointer"
                          disabled={isLoading}
                        />
                      </div>

                      {/* Preview Badge */}
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Preview:</span>
                        <Badge
                          style={{
                            backgroundColor: field.value,
                            color: "#ffffff",
                          }}
                        >
                          {form.watch("display_name") || "Status Name"}
                        </Badge>
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Color used for status badges and indicators
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Sort Order Field */}
            <FormField
              control={form.control}
              name="sort_order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sort Order</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min="0"
                      placeholder="0"
                      disabled={isLoading}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Display order (lower numbers appear first)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Switches */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Status</FormLabel>
                      <FormDescription>
                        Active statuses are available for lead assignment
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

              <FormField
                control={form.control}
                name="is_default"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Default Status
                      </FormLabel>
                      <FormDescription>
                        New leads will be assigned this status by default
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
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Update Status" : "Create Status"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default StatusForm;
