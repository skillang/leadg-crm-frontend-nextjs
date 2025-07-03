// src/components/documents/DocumentCard.tsx

"use client";

import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FileText,
  Download,
  Edit,
  Trash,
  Calendar,
  Clock,
  User,
  FileCheck,
  FileX,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Document } from "@/models/types/documents";
import {
  useDeleteDocumentMutation,
  useDownloadDocumentMutation,
  useApproveDocumentMutation,
  useRejectDocumentMutation,
} from "@/redux/slices/documentsApi";
import { useAppSelector } from "@/redux/hooks";
import { selectIsAdmin } from "@/redux/selectors";
import { useDocumentNotifications } from "@/hooks/useNotificationHelpers";
import { cn } from "@/lib/utils";

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
  const notifications = useDocumentNotifications();
  const [deleteDocument, { isLoading: isDeleting }] =
    useDeleteDocumentMutation();
  const [downloadDocument, { isLoading: isDownloading }] =
    useDownloadDocumentMutation();
  const [approveDocument, { isLoading: isApproving }] =
    useApproveDocumentMutation();
  const [rejectDocument, { isLoading: isRejecting }] =
    useRejectDocumentMutation();

  const handleDelete = async () => {
    notifications.confirmDocumentDelete(document.filename, async () => {
      try {
        await deleteDocument(document.id).unwrap();
        notifications.deleted(document.filename);
        // console.log("Document deleted successfully");
      } catch (error) {
        console.error("Failed to delete document:", error);
        notifications.deleteError("document");
      }
    });
  };

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

      notifications.downloaded(document.filename);
      // console.log("Document downloaded successfully");
    } catch (error) {
      console.error("Failed to download document:", error);
      notifications.downloadError();
    }
  };

  const handleApprove = async () => {
    if (!isAdmin) return;

    notifications.promptForApproval(
      document.filename,
      async (notes: string) => {
        try {
          await approveDocument({
            documentId: document.id,
            approvalData: { approval_notes: notes || "Approved" },
          }).unwrap();
          notifications.documentApproved(document.filename);
          // console.log("Document approved successfully");
        } catch (error) {
          console.error("Failed to approve document:", error);
          notifications.error("Failed to approve document. Please try again.");
        }
      }
    );
  };

  const handleReject = async () => {
    if (!isAdmin) return;

    notifications.promptForRejection(
      document.filename,
      async (reason: string) => {
        try {
          await rejectDocument({
            documentId: document.id,
            rejectionData: { approval_notes: reason },
          }).unwrap();
          notifications.documentRejected(document.filename);
        } catch (error) {
          notifications.error("Failed to reject document. Please try again.");
          console.error("Failed to reject document:", error);
        }
      }
    );
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
        return {
          icon: <CheckCircle className="h-3 w-3" />,
          className: "bg-green-100 text-green-800 border-green-200",
        };
      case "Rejected":
        return {
          icon: <XCircle className="h-3 w-3" />,
          className: "bg-red-100 text-red-800 border-red-200",
        };
      case "Pending":
        return {
          icon: <AlertCircle className="h-3 w-3" />,
          className: "bg-yellow-100 text-yellow-800 border-yellow-200",
        };
      default:
        return {
          icon: <AlertCircle className="h-3 w-3" />,
          className: "bg-gray-100 text-gray-800 border-gray-200",
        };
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes("pdf")) {
      return <FileText className="h-6 w-6 text-red-600" />;
    } else if (mimeType.includes("image")) {
      return <FileText className="h-6 w-6 text-purple-600" />;
    } else if (mimeType.includes("word") || mimeType.includes("document")) {
      return <FileText className="h-6 w-6 text-blue-600" />;
    } else {
      return <FileText className="h-6 w-6 text-gray-600" />;
    }
  };

  // Safe property access with fallbacks
  const documentStatus = (document as any).status || "Pending";
  const approvalNotes = (document as any).approval_notes;
  const notes = (document as any).notes;
  const expiryDate = (document as any).expiry_date;
  const approvedByName = (document as any).approved_by_name;
  const approvedAt = (document as any).approved_at;

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
            {getFileIcon(document.mime_type)}
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
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-100"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            <Download className="h-4 w-4 text-gray-600" />
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
        {/* Status section */}
        <div className="flex items-center justify-between">
          <Badge
            variant="secondary"
            className={cn("text-sm px-3 py-1 gap-1", statusBadge.className)}
          >
            {statusBadge.icon}
            {documentStatus}
          </Badge>

          {/* Admin approval actions for pending documents */}
          {isAdmin && documentStatus === "Pending" && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleApprove}
                disabled={isApproving}
                className="text-green-600 border-green-200 hover:bg-green-50"
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
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                {isRejecting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                ) : (
                  <FileX className="h-4 w-4" />
                )}
                Reject
              </Button>
            </div>
          )}
        </div>

        {/* Upload info section */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-500">
              <User className="h-4 w-4" />
              <span>Uploaded by:</span>
            </div>
            <p className="font-medium text-gray-900 pl-6">
              {document.uploaded_by_name}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-500">
              <Calendar className="h-4 w-4" />
              <span>Upload date:</span>
            </div>
            <div className="flex items-center gap-2 pl-6">
              <span className="font-medium text-gray-900">
                {formatDate(document.uploaded_at)}
              </span>
              <Clock className="h-3 w-3 text-gray-400" />
              <span className="text-gray-600">
                {formatTime(document.uploaded_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Approval info for approved/rejected documents */}
        {(documentStatus === "Approved" || documentStatus === "Rejected") &&
          approvedByName && (
            <div className="p-3 bg-gray-50 rounded-md space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {documentStatus === "Approved"
                    ? "Approved by:"
                    : "Rejected by:"}
                </span>
                <span className="font-medium text-gray-900">
                  {approvedByName}
                </span>
              </div>
              {approvedAt && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Date:</span>
                  <span className="text-gray-900">
                    {formatDate(approvedAt)}
                  </span>
                </div>
              )}
              {approvalNotes && (
                <div className="text-sm">
                  <span className="text-gray-600">Notes:</span>
                  <p className="mt-1 text-gray-900">{approvalNotes}</p>
                </div>
              )}
            </div>
          )}

        {/* Notes section */}
        {notes && (
          <div className="space-y-2">
            <span className="text-sm text-gray-700 font-medium">Notes:</span>
            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
              {notes}
            </p>
          </div>
        )}

        {/* Expiry date section */}
        {expiryDate && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">Expires on:</span>
            <span className="font-medium text-gray-900">
              {formatDate(expiryDate)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentCard;
