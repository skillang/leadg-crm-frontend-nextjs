// src/components/documents/DocumentViewerModal.tsx

"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, X, ExternalLink, Eye } from "lucide-react";
import { Document } from "@/models/types/documents";
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import "@cyntler/react-doc-viewer/dist/index.css";

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentUrl: string;
  document: Document;
}

const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  documentUrl,
  document,
}) => {
  // Prepare document for viewer
  const documents = [
    {
      uri: documentUrl,
      fileName: document.filename,
    },
  ];

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "Rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Open in new tab as fallback
  const openInNewTab = () => {
    window.open(documentUrl, "_blank", "noopener,noreferrer");
  };

  return (
    // max-w-7xl h-[95vh]
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* Header */}
      <DialogHeader className="flex flex-row items-center justify-between p-4 pb-2 border-b shrink-0">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <FileText className="h-6 w-6 text-gray-600 shrink-0" />
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-lg font-semibold text-gray-900 truncate">
              {document.filename}
            </DialogTitle>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-sm text-gray-500">
                {formatFileSize(document.file_size)}
              </span>
              <span className="text-gray-300">•</span>
              <Badge variant="outline" className="text-xs">
                {document.document_type}
              </Badge>
              <span className="text-gray-300">•</span>
              <Badge
                className={`text-xs ${getStatusBadgeColor(document.status)}`}
              >
                {document.status}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={openInNewTab}
            className="flex items-center gap-2"
            title="Open in new tab"
          >
            <ExternalLink className="h-4 w-4" />
            New Tab
          </Button>
        </div>
      </DialogHeader>
      <DialogContent className="  overflow-auto p-0 ">
        {/* Content */}
        <div className="flex-1 ">
          {/* Document Viewer */}
          <div className="h-full p-4">
            <DocViewer
              documents={documents}
              pluginRenderers={DocViewerRenderers}
              config={{
                header: {
                  disableHeader: true, // We have our own header
                  disableFileName: true,
                  retainURLParams: false,
                },
                csvDelimiter: ",",
                pdfVerticalScrollByDefault: true,
                pdfZoom: {
                  defaultZoom: 1.1,
                  zoomJump: 0.2,
                },
                loadingRenderer: {
                  showLoadingTimeout: 1000, // Show loading after 1 second
                },
              }}
              style={{
                height: "100%",
                width: "100%",
              }}
              theme={{
                primary: "#3b82f6",
                secondary: "#e5e7eb",
                tertiary: "#f3f4f6",
                textPrimary: "#111827",
                textSecondary: "#6b7280",
                textTertiary: "#9ca3af",
                disableThemeScrollbar: false,
              }}
            />
          </div>
        </div>
      </DialogContent>
      <DialogFooter>
        {/* Footer */}
        <div className="border-t p-3 bg-gray-50 shrink-0">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <span>
                Uploaded by:{" "}
                <strong className="text-gray-900">
                  {document.uploaded_by_name}
                </strong>
              </span>
              <span className="text-gray-300">•</span>
              <span>
                {new Date(document.uploaded_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              {document.notes && (
                <>
                  <span className="text-gray-300">•</span>
                  <span title={document.notes} className="truncate max-w-xs">
                    Notes: {document.notes}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 text-blue-600">
              <Eye className="h-4 w-4" />
              <span className="font-medium">View Only Mode</span>
            </div>
          </div>
        </div>
      </DialogFooter>
    </Dialog>
  );
};

export default DocumentViewerModal;
