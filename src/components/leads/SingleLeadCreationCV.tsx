// src/components/leads/SingleLeadCreationCVModal.tsx

"use client";

import React, { useState, useRef } from "react";
import {
  FileText,
  Eye,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useUploadCVMutation,
  useGetCVExtractionsQuery,
  useUpdateCVExtractionMutation,
  useDeleteCVExtractionMutation,
  useConvertToLeadMutation,
} from "@/redux/slices/cvExtractionApi";
import { useGetCategoriesQuery } from "@/redux/slices/categoriesApi";
import { useGetActiveSourcesQuery } from "@/redux/slices/sourcesApi";
import {
  CVExtraction,
  ConvertToLeadRequest,
} from "@/models/types/cvExtraction";

interface SingleLeadCreationCVModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadCreated?: (leadId: string) => void;
}

const SingleLeadCreationCVModal: React.FC<SingleLeadCreationCVModalProps> = ({
  isOpen,
  onClose,
  onLeadCreated,
}) => {
  // State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewExtraction, setPreviewExtraction] =
    useState<CVExtraction | null>(null);
  const [editExtraction, setEditExtraction] = useState<CVExtraction | null>(
    null
  );
  const [convertData, setConvertData] = useState<Partial<ConvertToLeadRequest>>(
    {}
  );
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // API hooks
  const [uploadCV, { isLoading: isUploading }] = useUploadCVMutation();
  const [updateCVExtraction, { isLoading: isUpdating }] =
    useUpdateCVExtractionMutation();
  const [deleteCVExtraction, { isLoading: isDeleting }] =
    useDeleteCVExtractionMutation();
  const [convertToLead, { isLoading: isConverting }] =
    useConvertToLeadMutation();

  const { data: extractionsData, refetch } = useGetCVExtractionsQuery(
    {
      page: 1,
      limit: 10,
    },
    { skip: !isOpen } // Only fetch when modal is open
  );
  const { data: categoriesData } = useGetCategoriesQuery({}, { skip: !isOpen });
  const { data: sourcesData } = useGetActiveSourcesQuery({}, { skip: !isOpen });

  // Reset state when modal closes
  const handleClose = () => {
    setSelectedFile(null);
    setPreviewExtraction(null);
    setEditExtraction(null);
    setConvertData({});
    setIsPreviewOpen(false);
    setIsEditOpen(false);
    setIsConvertOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  // Handlers
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      await uploadCV(formData).unwrap();
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      refetch();
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const handlePreview = (extraction: CVExtraction) => {
    setPreviewExtraction(extraction);
    setIsPreviewOpen(true);
  };

  const handleEdit = (extraction: CVExtraction) => {
    setEditExtraction({
      ...extraction,
      extracted_data: {
        ...extraction.extracted_data,
        age: extraction.extracted_data.age || null,
        experience: extraction.extracted_data.experience || "",
        skills: extraction.extracted_data.skills || "",
        education: extraction.extracted_data.education || "",
      },
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editExtraction) return;

    try {
      await updateCVExtraction({
        processing_id: editExtraction.processing_id,
        data: {
          name: editExtraction.extracted_data.name,
          email: editExtraction.extracted_data.email,
          phone: editExtraction.extracted_data.phone,
          skills: editExtraction.extracted_data.skills,
          education: editExtraction.extracted_data.education,
          experience: editExtraction.extracted_data.experience,
        },
      }).unwrap();
      setIsEditOpen(false);
      setEditExtraction(null);
      refetch();
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  const handleDelete = async (processingId: string) => {
    if (!confirm("Are you sure you want to delete this CV extraction?")) return;

    try {
      await deleteCVExtraction(processingId).unwrap();
      refetch();
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleConvert = (extraction: CVExtraction) => {
    setPreviewExtraction(extraction);
    setConvertData({
      processing_id: extraction.processing_id,
      category: "",
      source: "cv_upload",
      course_level: "intermediate",
      stage: "initial",
      lead_score: 75,
      tags: ["CV Upload"],
      notes: `Converted from CV upload. Name: ${extraction.extracted_data.name}`,
      assignment_method: "unassigned",
    });
    setIsConvertOpen(true);
  };

  const handleConvertSubmit = async () => {
    if (
      !convertData.category ||
      !convertData.source ||
      !convertData.processing_id
    )
      return;

    try {
      const result = await convertToLead(
        convertData as ConvertToLeadRequest
      ).unwrap();
      setIsConvertOpen(false);
      setConvertData({});
      refetch();
      onLeadCreated?.(result.lead_id);
      handleClose(); // Close the main modal after successful conversion
    } catch (error) {
      console.error("Convert failed:", error);
    }
  };

  const extractions = extractionsData?.extractions || [];
  const categories = categoriesData?.categories || [];
  const sources = sourcesData?.sources || [];

  return (
    <>
      {/* Main CV Upload Modal */}
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Upload CV to Create Lead
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Upload Section */}
            <div className="space-y-4">
              <div>
                <Label>Upload CV/Resume</Label>
                <p className="text-sm text-gray-600 mb-3">
                  Upload a CV or resume to extract information and create a lead
                </p>
              </div>

              <div className="flex items-center gap-4">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileSelect}
                  className="flex-1"
                />
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                  size="sm"
                >
                  {isUploading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Upload
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Supported: PDF, DOC, DOCX (Max 10MB)
              </p>
            </div>

            {/* CV Extractions List */}
            <div className="space-y-3">
              <Label>Recent CV Extractions</Label>

              {extractions.length === 0 ? (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium">No CV extractions found</p>
                  <p className="text-xs">Upload a CV above to get started</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto border rounded-lg p-4">
                  {extractions.map((extraction) => (
                    <div
                      key={extraction.processing_id}
                      className="border rounded-lg p-4 space-y-3 bg-gray-50/50"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-2 flex-1">
                          <h4 className="font-medium text-sm">
                            {extraction.extracted_data.name || "Name not found"}
                          </h4>
                          <p className="text-xs text-gray-600 truncate">
                            {extraction.file_metadata.original_filename}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                extraction.status === "pending_review"
                                  ? "secondary"
                                  : extraction.status === "reviewed"
                                  ? "default"
                                  : "destructive"
                              }
                            >
                              {extraction.status.replace("_", " ")}
                            </Badge>
                            {extraction.converted_to_lead && (
                              <Badge
                                variant="outline"
                                className="text-green-600"
                              >
                                Converted
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handlePreview(extraction)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(extraction)}
                            disabled={extraction.converted_to_lead}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              handleDelete(extraction.processing_id)
                            }
                            disabled={isDeleting}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="text-xs text-gray-600 space-y-1">
                        <p>
                          <strong>Email:</strong>{" "}
                          {extraction.extracted_data.email || "Not found"}
                        </p>
                        <p>
                          <strong>Phone:</strong>{" "}
                          {extraction.extracted_data.phone || "Not found"}
                        </p>
                      </div>

                      {!extraction.converted_to_lead && (
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => handleConvert(extraction)}
                        >
                          Convert to Lead
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>CV Extraction Preview</DialogTitle>
          </DialogHeader>
          {previewExtraction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <p className="text-sm">
                    {previewExtraction.extracted_data.name || "Not found"}
                  </p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="text-sm">
                    {previewExtraction.extracted_data.email || "Not found"}
                  </p>
                </div>
                <div>
                  <Label>Phone</Label>
                  <p className="text-sm">
                    {previewExtraction.extracted_data.phone || "Not found"}
                  </p>
                </div>
                <div>
                  <Label>Age</Label>
                  <p className="text-sm">
                    {previewExtraction.extracted_data.age || "Not found"}
                  </p>
                </div>
              </div>
              <div>
                <Label>Skills</Label>
                <p className="text-sm bg-gray-50 p-2 rounded">
                  {previewExtraction.extracted_data.skills || "Not extracted"}
                </p>
              </div>
              <div>
                <Label>Education</Label>
                <p className="text-sm bg-gray-50 p-2 rounded">
                  {previewExtraction.extracted_data.education ||
                    "Not extracted"}
                </p>
              </div>
              <div>
                <Label>Experience</Label>
                <p className="text-sm bg-gray-50 p-2 rounded">
                  {previewExtraction.extracted_data.experience ||
                    "Not extracted"}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit CV Extraction</DialogTitle>
          </DialogHeader>
          {editExtraction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Name *</Label>
                  <Input
                    id="edit-name"
                    value={editExtraction.extracted_data.name}
                    onChange={(e) =>
                      setEditExtraction({
                        ...editExtraction,
                        extracted_data: {
                          ...editExtraction.extracted_data,
                          name: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editExtraction.extracted_data.email}
                    onChange={(e) =>
                      setEditExtraction({
                        ...editExtraction,
                        extracted_data: {
                          ...editExtraction.extracted_data,
                          email: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    value={editExtraction.extracted_data.phone}
                    onChange={(e) =>
                      setEditExtraction({
                        ...editExtraction,
                        extracted_data: {
                          ...editExtraction.extracted_data,
                          phone: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-age">Age</Label>
                  <Input
                    id="edit-age"
                    type="number"
                    value={editExtraction.extracted_data.age || ""}
                    onChange={(e) =>
                      setEditExtraction({
                        ...editExtraction,
                        extracted_data: {
                          ...editExtraction.extracted_data,
                          age: e.target.value ? parseInt(e.target.value) : null,
                        },
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-skills">Skills</Label>
                <Textarea
                  id="edit-skills"
                  value={editExtraction.extracted_data.skills}
                  onChange={(e) =>
                    setEditExtraction({
                      ...editExtraction,
                      extracted_data: {
                        ...editExtraction.extracted_data,
                        skills: e.target.value,
                      },
                    })
                  }
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="edit-education">Education</Label>
                <Textarea
                  id="edit-education"
                  value={editExtraction.extracted_data.education}
                  onChange={(e) =>
                    setEditExtraction({
                      ...editExtraction,
                      extracted_data: {
                        ...editExtraction.extracted_data,
                        education: e.target.value,
                      },
                    })
                  }
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="edit-experience">Experience</Label>
                <Textarea
                  id="edit-experience"
                  value={editExtraction.extracted_data.experience}
                  onChange={(e) =>
                    setEditExtraction({
                      ...editExtraction,
                      extracted_data: {
                        ...editExtraction.extracted_data,
                        experience: e.target.value,
                      },
                    })
                  }
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdate} disabled={isUpdating}>
                  {isUpdating && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Update
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Convert to Lead Modal */}
      <Dialog open={isConvertOpen} onOpenChange={setIsConvertOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Convert CV to Lead</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!previewExtraction?.extracted_data.name ||
            !previewExtraction?.extracted_data.email ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Warning: Name or email is missing. Please edit the extraction
                  first.
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="convert-category">Category *</Label>
                <Select
                  value={convertData.category}
                  onValueChange={(value) =>
                    setConvertData({ ...convertData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="convert-source">Source *</Label>
                <Select
                  value={convertData.source}
                  onValueChange={(value) =>
                    setConvertData({ ...convertData, source: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {sources.map((source) => (
                      <SelectItem key={source.id} value={source.name}>
                        {source.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="convert-notes">Notes</Label>
              <Textarea
                id="convert-notes"
                value={convertData.notes}
                onChange={(e) =>
                  setConvertData({ ...convertData, notes: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsConvertOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleConvertSubmit}
                disabled={
                  isConverting || !convertData.category || !convertData.source
                }
              >
                {isConverting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Convert to Lead
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SingleLeadCreationCVModal;
