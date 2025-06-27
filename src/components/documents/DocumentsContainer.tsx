// src/components/documents/DocumentsContainer.tsx

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Upload,
  Loader2,
  AlertCircle,
  FileText,
  Filter,
  Grid,
  List,
} from "lucide-react";
import { Document } from "@/models/types/documents";
import {
  useGetLeadDocumentsQuery,
  useGetDocumentTypesQuery,
  useGetDocumentStatusesQuery,
} from "@/redux/slices/documentsApi";
import { useAppSelector } from "@/redux/hooks";
import { selectIsAdmin } from "@/redux/selectors";
import { cn } from "@/lib/utils";
import DocumentCard from "./DocumentCard";
import DocumentUpload from "./DocumentUpload";
import DocumentEditor from "./DocumentEditor";

interface DocumentsContainerProps {
  leadId: string;
}

const DocumentsContainer: React.FC<DocumentsContainerProps> = ({ leadId }) => {
  const isAdmin = useAppSelector(selectIsAdmin);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<
    Document | undefined
  >();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    document_type: "",
    status: "",
  });
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // API queries
  const {
    data: documentsData,
    isLoading,
    error,
    refetch,
  } = useGetLeadDocumentsQuery({
    leadId,
    page,
    limit: 20,
    document_type: filters.document_type || undefined,
    status: filters.status || undefined,
  });

  const { data: documentTypes } = useGetDocumentTypesQuery();
  const { data: documentStatuses } = useGetDocumentStatusesQuery();

  const documents = documentsData?.documents || [];
  const totalCount = documentsData?.total_count || 0;
  const totalPages = documentsData?.total_pages || 1;

  // Filter options
  const typeOptions = [
    { value: "all", label: "All Types" },
    ...(documentTypes || []),
  ];

  const statusOptions = [
    { value: "all", label: "All Status" },
    ...(documentStatuses || []),
  ];

  // Handlers
  const handleUploadDocument = () => {
    setIsUploadOpen(true);
  };

  const handleCloseUpload = () => {
    setIsUploadOpen(false);
  };

  const handleEditDocument = (document: Document) => {
    setEditingDocument(document);
    // Open the document editor
  };

  const handleCloseEditor = () => {
    setEditingDocument(undefined);
  };

  const handleDocumentSelect = (documentId: string) => {
    setSelectedDocuments((prev) =>
      prev.includes(documentId)
        ? prev.filter((id) => id !== documentId)
        : [...prev, documentId]
    );
  };

  const handleClearSelection = () => {
    setSelectedDocuments([]);
  };

  const handleSelectAll = () => {
    if (selectedDocuments.length === documents.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(documents.map((doc) => doc.id));
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setPage(1); // Reset to first page when filter changes
  };

  const handleClearFilters = () => {
    setFilters({
      document_type: "",
      status: "",
    });
    setPage(1);
  };

  const getStatusCounts = () => {
    const counts = {
      total: documents.length,
      pending: documents.filter((doc) => doc.status === "Pending").length,
      approved: documents.filter((doc) => doc.status === "Approved").length,
      rejected: documents.filter((doc) => doc.status === "Rejected").length,
    };
    return counts;
  };

  const statusCounts = getStatusCounts();

  if (isLoading && page === 1) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-gray-600 mb-4">Failed to load documents</p>
          <Button onClick={() => refetch()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Bar */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-gray-900">
            {statusCounts.total}
          </div>
          <div className="text-sm text-gray-600">Total Documents</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-yellow-600">
            {statusCounts.pending}
          </div>
          <div className="text-sm text-gray-600">Pending Approval</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">
            {statusCounts.approved}
          </div>
          <div className="text-sm text-gray-600">Approved</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-red-600">
            {statusCounts.rejected}
          </div>
          <div className="text-sm text-gray-600">Rejected</div>
        </div>
      </div>

      {/* Header with Upload Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
          {selectedDocuments.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {selectedDocuments.length} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearSelection}
              >
                Clear
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <Button
            onClick={handleUploadDocument}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Upload className="h-4 w-4" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Select
            value={filters.document_type}
            onValueChange={(value) =>
              handleFilterChange("document_type", value)
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Document Type" />
            </SelectTrigger>
            <SelectContent>
              {typeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={filters.status}
            onValueChange={(value) => handleFilterChange("status", value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(filters.document_type || filters.status) && (
          <Button variant="outline" size="sm" onClick={handleClearFilters}>
            Clear Filters
          </Button>
        )}

        {documents.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            className="ml-auto"
          >
            {selectedDocuments.length === documents.length
              ? "Deselect All"
              : "Select All"}
          </Button>
        )}
      </div>

      {/* Documents List */}
      {documents.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <FileText className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filters.document_type || filters.status
              ? "No documents match your filters"
              : "No documents uploaded"}
          </h3>
          <p className="text-gray-600 mb-4">
            {filters.document_type || filters.status
              ? "Try adjusting your filter criteria"
              : "Start by uploading the first document for this lead"}
          </p>
          {!filters.document_type && !filters.status && (
            <Button onClick={handleUploadDocument}>
              Upload First Document
            </Button>
          )}
        </div>
      ) : (
        <div
          className={cn(
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-4"
              : "space-y-4"
          )}
        >
          {documents.map((document) => (
            <DocumentCard
              key={document.id}
              document={document}
              isSelected={selectedDocuments.includes(document.id)}
              onSelect={handleDocumentSelect}
              onEdit={handleEditDocument}
              className={viewMode === "list" ? "max-w-full" : ""}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {documents.length} of {totalCount} documents
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1 || isLoading}
            >
              Previous
            </Button>
            <span className="flex items-center px-3 text-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages || isLoading}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <DocumentUpload
        isOpen={isUploadOpen}
        onClose={handleCloseUpload}
        leadId={leadId}
      />

      {/* Edit Modal */}
      <DocumentEditor
        isOpen={!!editingDocument}
        onClose={handleCloseEditor}
        document={editingDocument}
      />
    </div>
  );
};

export default DocumentsContainer;
