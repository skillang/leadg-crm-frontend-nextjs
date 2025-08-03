// src/components/documents/DocumentCard.tsx

"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useNotifications } from "@/components/common/NotificationSystem";
import { getFileIconForDocument } from "@/utils/getFileIconForDocument";
import {
  Calendar,
  Clock,
  FileCheck,
  FileX,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Edit,
  Trash,
} from "lucide-react";
import { Document } from "@/models/types/documents";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import {
  useDeleteDocumentMutation,
  useDownloadDocumentMutation,
  useApproveDocumentMutation,
  useRejectDocumentMutation,
} from "@/redux/slices/documentsApi";
import { useAppSelector } from "@/redux/hooks";
import { selectIsAdmin } from "@/redux/selectors";
import { cn } from "@/lib/utils";
import DocumentViewerModal from "./DocumentViewerModal";

interface DocumentCardProps {
  document: Document;
  isSelected?: boolean;
  onSelect?: (documentId: string) => void;
  onEdit?: (document: Document) => void;
  className?: string;
}

const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  isSelected = false,
  onSelect,
  onEdit,
  className,
}) => {
  const isAdmin = useAppSelector(selectIsAdmin);
  const [viewerData, setViewerData] = useState<{
    isOpen: boolean;
    documentUrl: string | null;
    document: Document | null;
  }>({
    isOpen: false,
    documentUrl: null,
    document: null,
  });

  // ✅ SIMPLE: Direct hook usage - no naming conflicts
  const { showSuccess, showError, showConfirm, showPrompt } =
    useNotifications();
  const [deleteDocument, { isLoading: isDeleting }] =
    useDeleteDocumentMutation();
  const [downloadDocument, { isLoading: isDownloading }] =
    useDownloadDocumentMutation();
  const [approveDocument, { isLoading: isApproving }] =
    useApproveDocumentMutation();
  const [rejectDocument, { isLoading: isRejecting }] =
    useRejectDocumentMutation();
  // ✅ SIMPLE: Direct confirmation calls
  const handleDelete = () => {
    showConfirm({
      title: "Delete Document",
      description: `Are you sure you want to delete "${document.filename}"? This action cannot be undone.`,
      confirmText: "Delete",
      variant: "destructive",
      onConfirm: async () => {
        try {
          await deleteDocument(document.id).unwrap();
          showSuccess(`Document "${document.filename}" deleted successfully`);
        } catch (error) {
          console.error("Failed to delete document:", error);
          showError("Failed to delete document. Please try again.");
        }
      },
    });
  };

  // ✅ SIMPLE: Direct success/error calls
  const handleDownload = async () => {
    try {
      const blob = await downloadDocument(document.id).unwrap();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = document.filename;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showSuccess(`Document "${document.filename}" downloaded successfully`);
    } catch (error) {
      console.error("Failed to download document:", error);
      showError("Failed to download document. Please try again.");
    }
  };

  // ✅ SIMPLE: Using showPrompt for approval notes
  const handleApprove = () => {
    if (!isAdmin) return;

    showPrompt({
      title: "Approve Document",
      description: `You are about to approve "${document.filename}". You can add optional notes below.`,
      placeholder: "Optional approval notes...",
      multiline: true,
      confirmText: "Approve",
      onConfirm: async (notes: string) => {
        try {
          await approveDocument({
            documentId: document.id,
            approvalData: {
              approval_notes: notes || "No specific approval notes",
            },
          }).unwrap();
          showSuccess(`Document "${document.filename}" approved successfully`);
        } catch (error) {
          console.error("Failed to approve document:", error);
          showError("Failed to approve document. Please try again.");
        }
      },
    });
  };

  // ✅ SIMPLE: Using showPrompt for rejection reason
  const handleReject = () => {
    if (!isAdmin) return;

    showPrompt({
      title: "Reject Document",
      description: `Please provide a reason for rejecting "${document.filename}".`,
      placeholder: "Reason for rejection (required)...",
      required: true,
      multiline: true,
      confirmText: "Reject",
      onConfirm: async (reason: string) => {
        try {
          await rejectDocument({
            documentId: document.id,
            rejectionData: { approval_notes: reason },
          }).unwrap();
          showSuccess(`Document "${document.filename}" rejected successfully`);
        } catch (error) {
          console.error("Failed to reject document:", error);
          showError("Failed to reject document. Please try again.");
        }
      },
    });
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(document);
    }
  };

  const handleSelect = () => {
    if (onSelect) {
      onSelect(document.id);
    }
  };

  const handleView = async () => {
    try {
      // Use existing download endpoint (but for viewing)
      const blob = await downloadDocument(document.id).unwrap();

      // Create blob URL for viewer
      const blobUrl = URL.createObjectURL(blob);

      // Open in viewer
      setViewerData({
        isOpen: true,
        documentUrl: blobUrl,
        document: document,
      });
    } catch (error) {
      showError(`Error Due to ${error}`, "Failed to load document viewer.");
    }
  };

  // Don't forget to cleanup blob URL when modal closes
  const handleCloseViewer = () => {
    if (viewerData.documentUrl) {
      URL.revokeObjectURL(viewerData.documentUrl); // Cleanup memory
    }
    setViewerData({ isOpen: false, documentUrl: null, document: null });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not available";
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return "Not available";
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // ✅ UPDATED: Now uses Badge variants instead of custom className
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
        return {
          icon: <CheckCircle className="h-3 w-3" />,
          variant: "success-light" as const,
        };
      case "Rejected":
        return {
          icon: <XCircle className="h-3 w-3" />,
          variant: "destructive-light" as const,
        };
      case "Pending":
        return {
          icon: <AlertCircle className="h-3 w-3" />,
          variant: "pending" as const,
        };
      default:
        return {
          icon: <AlertCircle className="h-3 w-3" />,
          variant: "outline" as const,
        };
    }
  };

  // FIXED: Use properly typed properties from Document interface
  const documentStatus = document.status || "Pending";
  const approvalNotes = document.approval_notes;
  const notes = document.notes;
  const expiryDate = document.expiry_date;
  const approvedByName = document.approved_by_name;
  const approvedAt = document.approved_at;

  const statusBadge = getStatusBadge(documentStatus);

  return (
    <Card
      className={cn(
        "transition-all duration-200 hover:shadow-md border border-gray-200 w-full",
        isSelected && "ring-2 ring-blue-500",
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3 flex-1">
          {onSelect && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={handleSelect}
              aria-label="Select document"
            />
          )}

          <div className="flex items-center gap-3">
            {getFileIconForDocument(document.mime_type, 24, 24)}
            <div>
              <h3 className="font-semibold text-gray-900 line-clamp-1">
                {document.filename}
              </h3>
              <p className="text-sm text-gray-500">
                {formatFileSize(document.file_size)} • {document.document_type}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-gray-100"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              <Download className="h-4 w-4 text-gray-600" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-100"
            onClick={handleView}
            // disabled={isDownloading}
          >
            <Eye className="h-4 w-4 text-gray-600" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-100"
            onClick={handleEdit}
            disabled={isDeleting}
          >
            <Edit className="h-4 w-4 text-gray-600" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-100"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash className="h-4 w-4 text-gray-600" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        <Table>
          <TableBody>
            {/* Status section */}
            <TableRow>
              <TableCell className="py-2 text-gray-500 text-sm font-medium w-1/3">
                Status:
              </TableCell>
              <TableCell className="py-2">
                <Badge
                  variant={statusBadge.variant}
                  className="text-sm px-2 py-1 gap-1"
                >
                  {statusBadge.icon}
                  {documentStatus}
                </Badge>
              </TableCell>
            </TableRow>

            {/* Admin approval actions for pending documents */}
            {isAdmin && documentStatus === "Pending" && (
              <TableRow>
                <TableCell className="py-2 text-gray-500 text-sm font-medium w-1/3">
                  Approval Request:
                </TableCell>
                <TableCell className="py-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleApprove}
                      disabled={isApproving}
                      className="text-green-600 border-green-200 hover:bg-green-50 cursor-pointer"
                    >
                      {isApproving ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                      ) : (
                        <FileCheck className="h-4 w-4" />
                      )}
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReject}
                      disabled={isRejecting}
                      className="text-red-600 border-red-200 hover:bg-red-50 cursor-pointer"
                    >
                      {isRejecting ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                      ) : (
                        <FileX className="h-4 w-4" />
                      )}
                      Reject
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {/* Upload info section */}
            <TableRow>
              <TableCell className="py-2 text-gray-500 text-sm font-medium w-1/3">
                <div className="flex items-center gap-2">Uploaded by:</div>
              </TableCell>
              <TableCell className="py-2">
                <Badge variant="primary-ghost">
                  {document.uploaded_by_name}
                </Badge>
              </TableCell>
            </TableRow>

            {/* Upload Date */}
            <TableRow>
              <TableCell className="py-2 text-gray-500 text-sm font-medium w-1/3">
                <div className="flex items-center gap-2">Upload date:</div>
              </TableCell>
              <TableCell className="py-2">
                <div className="flex items-center gap-4 text-sm">
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">
                      {formatDate(document.uploaded_at)}
                    </span>
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatTime(document.uploaded_at)}</span>
                  </Badge>
                </div>
              </TableCell>
            </TableRow>

            {(documentStatus === "Approved" || documentStatus === "Rejected") &&
              approvedByName && (
                <>
                  {/* Approved/Rejected by row */}
                  <TableRow>
                    <TableCell className="py-2 text-gray-500 text-sm font-medium w-1/3">
                      {documentStatus === "Approved"
                        ? "Approved by:"
                        : "Rejected by:"}
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex items-center gap-4 text-sm">
                        <Badge variant="primary-ghost">{approvedByName}</Badge>
                        {approvedAt && (
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1 text-xs"
                          >
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(approvedAt)}</span>
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Approval/Rejection notes row - only show if notes exist */}
                  {approvalNotes && (
                    <TableRow>
                      <TableCell className="py-2 text-gray-500 text-sm font-medium w-1/3 align-top">
                        {documentStatus === "Approved"
                          ? "Approval notes:"
                          : "Rejection notes:"}
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="text-gray-700 text-sm leading-relaxed bg-gray-50 rounded-md">
                          {approvalNotes}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )}

            {/* Notes section */}
            <TableRow>
              <TableCell className="py-2 text-gray-500 text-sm font-medium w-1/3 align-top">
                Notes:
              </TableCell>
              <TableCell className="py-2">
                <div className="text-gray-700 text-sm leading-relaxed bg-gray-50  rounded-md">
                  {notes ? notes : "No notes available"}
                </div>
              </TableCell>
            </TableRow>

            {/* Expiry date section */}
            <TableRow>
              <TableCell className="py-2 text-gray-500 text-sm font-medium w-1/3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Expires on:</span>
                </div>
              </TableCell>
              <TableCell className="py-2">
                <Badge
                  variant={expiryDate ? "secondary" : "outline"}
                  className={cn(
                    "flex items-center gap-1",
                    expiryDate
                      ? "bg-orange-100 text-orange-700"
                      : "text-gray-500"
                  )}
                >
                  <Calendar className="h-4 w-4" />
                  <span>
                    {expiryDate ? formatDate(expiryDate) : "Not Mentioned"}
                  </span>
                </Badge>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
      {viewerData.isOpen && viewerData.documentUrl && (
        <DocumentViewerModal
          isOpen={viewerData.isOpen}
          onClose={handleCloseViewer}
          documentUrl={viewerData.documentUrl}
          document={viewerData.document!}
        />
      )}
    </Card>
  );
};

export default DocumentCard;
