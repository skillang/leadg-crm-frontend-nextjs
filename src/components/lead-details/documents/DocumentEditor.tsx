// src/components/documents/DocumentEditor.tsx

"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Document,
  UpdateDocumentRequest,
  DOCUMENT_TYPES,
} from "@/models/types/documents";
import {
  useUpdateDocumentMutation,
  useGetDocumentTypesQuery,
} from "@/redux/slices/documentsApi";

interface DocumentEditorProps {
  isOpen: boolean;
  onClose: () => void;
  document?: Document;
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({
  isOpen,
  onClose,
  document,
}) => {
  const [updateDocument, { isLoading }] = useUpdateDocumentMutation();
  const { data: apiDocumentTypes } = useGetDocumentTypesQuery();

  const [formData, setFormData] = useState<{
    document_type: string;
    notes: string;
    expiry_date: string;
  }>({
    document_type: "",
    notes: "",
    expiry_date: "",
  });

  // Use API document types if available, fallback to predefined types
  const documentTypes = apiDocumentTypes?.length
    ? apiDocumentTypes
    : DOCUMENT_TYPES;

  // Reset form when document changes or dialog opens
  useEffect(() => {
    if (isOpen && document) {
      setFormData({
        document_type: document.document_type,
        notes: document.notes || "",
        expiry_date: document.expiry_date
          ? document.expiry_date.split("T")[0]
          : "",
      });
    }
  }, [isOpen, document]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!document) {
      alert("No document selected for editing");
      return;
    }

    try {
      const updateData: UpdateDocumentRequest = {
        document_type: formData.document_type,
        notes: formData.notes.trim(),
        expiry_date: formData.expiry_date || undefined,
      };

      await updateDocument({
        documentId: document.id,
        documentData: updateData,
      }).unwrap();

      // console.log("Document updated successfully");
      onClose();
    } catch (error) {
      console.error("Failed to update document:", error);
      alert("Failed to update document. Please try again.");
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (!document) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl min-w-xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Document Details</DialogTitle>
        </DialogHeader>

        {/* Document Info */}
        <div className="bg-gray-50 p-4 rounded-md mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">{document.filename}</h4>
              <p className="text-sm text-gray-600">
                {formatFileSize(document.file_size)} • Uploaded by{" "}
                {document.uploaded_by_name}
              </p>
            </div>
            <div className="text-right">
              <span
                className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  document.status === "Approved"
                    ? "bg-green-100 text-green-800"
                    : document.status === "Rejected"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {document.status}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Document Type */}
          <div className="space-y-2">
            <Label htmlFor="document_type" className="text-sm font-medium">
              Document Type *
            </Label>
            <Select
              value={formData.document_type}
              onValueChange={(value) =>
                handleInputChange("document_type", value)
              }
              disabled={isLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Expiry Date */}
          <div className="space-y-2">
            <Label htmlFor="expiry_date" className="text-sm font-medium">
              Expiry Date (Optional)
            </Label>
            <Input
              id="expiry_date"
              type="date"
              value={formData.expiry_date}
              onChange={(e) => handleInputChange("expiry_date", e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500">
              Set an expiry date for documents like passports or certificates
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Add any additional notes about this document..."
              className="min-h-[80px] resize-vertical"
              disabled={isLoading}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className=" px-6">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Updating...
                </div>
              ) : (
                "Update Document"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentEditor;
