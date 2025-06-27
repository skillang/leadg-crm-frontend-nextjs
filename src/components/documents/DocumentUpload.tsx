// src/components/documents/DocumentUpload.tsx

"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X, FileText, AlertCircle, CheckCircle } from "lucide-react";
import {
  UploadDocumentRequest,
  DOCUMENT_TYPES,
} from "@/models/types/documents";
import {
  useUploadDocumentMutation,
  useGetDocumentTypesQuery,
} from "@/redux/slices/documentsApi";
import { cn } from "@/lib/utils";

interface DocumentUploadProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  isOpen,
  onClose,
  leadId,
}) => {
  const [uploadDocument, { isLoading }] = useUploadDocumentMutation();
  const { data: apiDocumentTypes } = useGetDocumentTypesQuery();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use API document types if available, fallback to predefined types
  const documentTypes = apiDocumentTypes?.length
    ? apiDocumentTypes
    : DOCUMENT_TYPES;

  // File validation
  const validateFile = (file: File): string | null => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
      "image/gif",
      "text/plain",
    ];

    if (file.size > maxSize) {
      return "File size must be less than 10MB";
    }

    if (!allowedTypes.includes(file.type)) {
      return "File type not supported. Please upload PDF, Word, Image, or Text files.";
    }

    return null;
  };

  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      alert(validationError);
      return;
    }

    setSelectedFile(file);
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      alert("Please select a file to upload");
      return;
    }

    if (!documentType) {
      alert("Please select a document type");
      return;
    }

    try {
      setUploadProgress(0);

      const uploadData: UploadDocumentRequest = {
        file: selectedFile,
        document_type: documentType,
        notes: notes.trim(),
      };

      await uploadDocument({
        leadId,
        documentData: uploadData,
      }).unwrap();

      console.log("Document uploaded successfully");

      // Reset form
      setSelectedFile(null);
      setDocumentType("");
      setNotes("");
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      onClose();
    } catch (error) {
      console.error("Failed to upload document:", error);
      alert("Failed to upload document. Please try again.");
      setUploadProgress(0);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setDocumentType("");
    setNotes("");
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (file: File) => {
    if (file.type.includes("pdf")) {
      return <FileText className="h-8 w-8 text-red-600" />;
    } else if (file.type.includes("image")) {
      return <FileText className="h-8 w-8 text-purple-600" />;
    } else if (file.type.includes("word") || file.type.includes("document")) {
      return <FileText className="h-8 w-8 text-blue-600" />;
    } else {
      return <FileText className="h-8 w-8 text-gray-600" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload Area */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Select Document *</Label>

            {!selectedFile ? (
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                  dragActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                )}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={handleBrowseClick}
              >
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Drop files here or click to browse
                </p>
                <p className="text-sm text-gray-600">
                  Supports: PDF, Word, Images (Max 10MB)
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
                  onChange={handleFileInputChange}
                  disabled={isLoading}
                />
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getFileIcon(selectedFile)}
                    <div>
                      <p className="font-medium text-gray-900">
                        {selectedFile.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                    disabled={isLoading}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {isLoading && uploadProgress > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Uploading...</span>
                      <span className="text-gray-600">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Document Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Document Type *</Label>
            <Select
              value={documentType}
              onValueChange={setDocumentType}
              disabled={isLoading}
            >
              <SelectTrigger>
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

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes about this document..."
              className="min-h-[80px] resize-vertical"
              disabled={isLoading}
            />
          </div>

          {/* Info Message */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-blue-800 font-medium">Upload Guidelines:</p>
              <ul className="text-blue-700 mt-1 space-y-1 text-xs">
                <li>• Document will be pending admin approval after upload</li>
                <li>• Maximum file size: 10MB</li>
                <li>• Supported formats: PDF, Word, Images, Text</li>
                <li>
                  • Choose the correct document type for faster processing
                </li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading || !selectedFile || !documentType}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Uploading...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Document
                </div>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentUpload;
