// src/components/facebook/ImportLeadsModal.tsx

"use client";

import React, { useState, useEffect } from "react";
import { z } from "zod";
import {
  useImportFacebookFormLeadsMutation,
  ImportLeadRequest,
} from "@/redux/slices/facebookApi";
import { useGetCategoriesQuery } from "@/redux/slices/categoriesApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Import,
  Facebook,
  Settings,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Info,
  Target,
  Hash,
} from "lucide-react";
import { useNotifications } from "@/components/common/NotificationSystem";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

// ============================
// VALIDATION SCHEMA
// ============================

const importSchema = z.object({
  form_id: z.string().min(1, "Form ID is required"),
  category_override: z.string().optional(),
  auto_assign: z.boolean(),
  limit: z
    .number()
    .min(1, "Limit must be at least 1")
    .max(1000, "Limit cannot exceed 1000"),
});

type ImportFormData = z.infer<typeof importSchema>;

// ============================
// INTERFACES
// ============================

interface ImportLeadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  formId: string;
  formName: string;
  totalLeads: number;
  suggestedCategory: string;
}

interface ValidationError {
  loc: string[];
  msg: string;
  type: string;
}

interface ApiErrorData {
  detail?: string | ValidationError[];
  message?: string;
  error?: string;
}

type RTKQueryError = FetchBaseQueryError & {
  status?: number;
  data?: ApiErrorData;
};

interface FormErrors {
  category_override?: string;
  limit?: string;
  general?: string;
}

// ============================
// IMPORT LEADS MODAL COMPONENT
// ============================

export const ImportLeadsModal: React.FC<ImportLeadsModalProps> = ({
  isOpen,
  onClose,
  formId,
  formName,
  totalLeads,
  suggestedCategory,
}) => {
  // Notifications
  const { showSuccess, showError } = useNotifications();

  // RTK Query hooks
  const { data: categoriesData, isLoading: categoriesLoading } =
    useGetCategoriesQuery({ include_inactive: false });
  const [importLeads, { isLoading: importLoading }] =
    useImportFacebookFormLeadsMutation();

  // Form state
  const [formData, setFormData] = useState<ImportFormData>({
    form_id: formId,
    category_override: "",
    auto_assign: false,
    limit: Math.min(totalLeads, 100), // Default to 100 or total leads if less
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [importSuccess, setImportSuccess] = useState(false);
  const [importResult, setImportResult] = useState<{
    imported_count?: number;
    skipped_count?: number;
    message?: string;
  }>({});

  // Update form_id when prop changes
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      form_id: formId,
    }));
  }, [formId]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        form_id: formId,
        category_override: "",
        auto_assign: false,
        limit: Math.min(totalLeads, 100),
      });
      setErrors({});
      setImportSuccess(false);
      setImportResult({});
    }
  }, [isOpen, formId, totalLeads]);

  // Get categories list
  const categories = categoriesData?.categories || [];

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form data
    try {
      importSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: FormErrors = {};
        // error.errors.forEach((err) => {
        //   if (err.path.length > 0) {
        //     const field = err.path[0] as keyof FormErrors;
        //     fieldErrors[field] = err.message;
        //   }
        // });
        setErrors(fieldErrors);
        return;
      }
    }

    try {
      // Prepare import request
      const importRequest: ImportLeadRequest = {
        form_id: formData.form_id,
        category_override: formData.category_override || null,
        auto_assign: formData.auto_assign || false,
        limit: formData.limit,
      };

      // Execute import
      const result = await importLeads(importRequest).unwrap();

      // Handle success
      setImportSuccess(true);
      setImportResult({
        imported_count: result.imported_count || 0,
        skipped_count: result.skipped_count || 0,
        message: result.message,
      });

      showSuccess(
        `Successfully imported ${
          result.imported_count || 0
        } leads from Facebook form.`
      );
    } catch (error) {
      console.error("Import failed:", error);
      const rtqError = error as RTKQueryError;

      let errorMessage = "Failed to import leads. Please try again.";

      if (rtqError.data) {
        if (typeof rtqError.data.detail === "string") {
          errorMessage = rtqError.data.detail;
        } else if (rtqError.data.message) {
          errorMessage = rtqError.data.message;
        } else if (Array.isArray(rtqError.data.detail)) {
          // Handle validation errors
          const fieldErrors: FormErrors = {};
          rtqError.data.detail.forEach((err: ValidationError) => {
            if (err.loc.length > 1) {
              const field = err.loc[1] as keyof FormErrors;
              fieldErrors[field] = err.msg;
            }
          });
          if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors);
            return;
          }
        }
      }

      setErrors({ general: errorMessage });
      showError(errorMessage);
    }
  };

  // Handle close
  const handleClose = () => {
    setErrors({});
    setImportSuccess(false);
    setImportResult({});
    onClose();
  };

  // Handle input changes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleInputChange = (field: keyof ImportFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear field error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  // Render success state
  if (importSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <DialogTitle>Import Successful!</DialogTitle>
                <DialogDescription>
                  Facebook leads have been imported successfully.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {importResult.imported_count || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Leads Imported
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">
                      {importResult.skipped_count || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Leads Skipped
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {importResult.message && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>{importResult.message}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Render main form
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Import className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <DialogTitle>Import Facebook Leads</DialogTitle>
              <DialogDescription>
                Configure import settings for leads from {formName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Form Information */}
          <Card>
            <CardContent className="">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Facebook className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Form Information</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Form Name:</span>
                    <div className="font-medium">{formName}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Leads:</span>
                    <div className="font-medium">{totalLeads}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Form ID:</span>
                    <div className="font-mono text-xs">{formId}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Suggested Category:
                    </span>
                    <Badge variant="outline">{suggestedCategory}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Import Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-gray-600" />
              <span className="font-medium">Import Settings</span>
            </div>

            {/* Category Override */}
            <div className="space-y-2">
              <Label
                htmlFor="category_override"
                className="flex items-center gap-2"
              >
                <Target className="h-3 w-3" />
                Category Override (Optional)
              </Label>
              <Select
                value={formData.category_override}
                onValueChange={(value) =>
                  handleInputChange("category_override", value)
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={`Use suggested: ${suggestedCategory}`}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={suggestedCategory}>
                    Use Suggested Category
                  </SelectItem>
                  {categories.map((category, index) => (
                    <SelectItem key={index} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category_override && (
                <p className="text-sm text-destructive">
                  {errors.category_override}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Leave empty to use the suggested category:
                {suggestedCategory}
              </p>
            </div>

            {/* Import Limit */}
            <div className="space-y-2">
              <Label htmlFor="limit" className="flex items-center gap-2">
                <Hash className="h-3 w-3" />
                Import Limit
              </Label>
              <Input
                id="limit"
                type="number"
                min="1"
                max="1000"
                value={formData.limit}
                onChange={(e) =>
                  handleInputChange("limit", parseInt(e.target.value) || 1)
                }
                placeholder="Number of leads to import"
              />
              {errors.limit && (
                <p className="text-sm text-destructive">{errors.limit}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Maximum: 1000 leads per import. Total available: {totalLeads}
              </p>
            </div>
          </div>

          {/* General Error */}
          {errors.general && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{errors.general}</AlertDescription>
            </Alert>
          )}

          {/* Footer Actions */}
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={importLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={importLoading || categoriesLoading}
              className="flex items-center gap-2"
            >
              {importLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Import className="h-4 w-4" />
                  Import {formData.limit} Leads
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
