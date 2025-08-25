// src/components/documents/DocumentViewerModal.tsx

"use client";

import React, { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  RotateCw,
} from "lucide-react";
import { Document } from "@/models/types/documents";
import { Document as PDFDocument, Page, pdfjs } from "react-pdf";
import { getFileIconForDocument } from "@/utils/getFileIconForDocument";
import { useAdminAccess } from "@/hooks/useAdminAccess";

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentUrl: string;
  document: Document | null;
}

const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  documentUrl,
  document,
}) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAdmin } = useAdminAccess();

  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      setLoading(false);
      setError(null);
    },
    []
  );

  const onDocumentLoadError = useCallback((error: unknown) => {
    console.error("PDF load error:", error);
    setError("Failed to load PDF");
    setLoading(false);
  }, []);

  const goToPrevPage = useCallback(() => {
    setPageNumber((page) => Math.max(1, page - 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setPageNumber((page) => Math.min(numPages || 1, page + 1));
  }, [numPages]);

  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(2.5, prev + 0.25));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((prev) => Math.max(0.5, prev - 0.25));
  }, []);

  const rotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  const resetView = useCallback(() => {
    setScale(1.0);
    setRotation(0);
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const openInNewTab = useCallback(() => {
    window.open(documentUrl, "_blank", "noopener,noreferrer");
  }, [documentUrl]);

  const handlePageInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const page = parseInt(e.target.value);
      if (page >= 1 && page <= (numPages || 1)) {
        setPageNumber(page);
      }
    },
    [numPages]
  );

  // Early return if document is not provided
  if (!document) {
    return null;
  }
  // Check file type
  const isPDF = document?.filename?.toLowerCase().endsWith(".pdf") || false;
  const isImage = document?.filename
    ? /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(
        document.filename.toLowerCase()
      )
    : false;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] gap-2 max-h-[95vh] overflow-y-auto p-0">
        {/* Header */}
        <DialogHeader className="flex flex-column items-start justify-between pb-2 border-b shrink-0">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="min-w-0 flex-1">
              <div className="flex gap-2">
                {getFileIconForDocument(document.mime_type, 24, 24)}
                <DialogTitle className="text-lg font-semibold text-gray-900 truncate">
                  {document.filename}
                </DialogTitle>
              </div>

              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-sm text-gray-500">
                  {formatFileSize(document.file_size)}
                </span>
                <span className="text-gray-300">•</span>
                <Badge variant="outline" className="text-xs">
                  {document.document_type}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 w-full shrink-0">
            {isPDF && numPages && (
              <div className="flex items-center gap-2 mr-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={zoomOut}
                  disabled={scale <= 0.5}
                  title="Zoom out"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-600 min-w-16 text-center font-medium">
                  {Math.round(scale * 100)}%
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={zoomIn}
                  disabled={scale >= 2.5}
                  title="Zoom in"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={rotate}
                  title="Rotate 90°"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetView}
                  title="Reset view"
                  className="text-xs px-2"
                >
                  Reset
                </Button>
              </div>
            )}
            {isAdmin && (
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
            )}
          </div>
        </DialogHeader>

        {/* PDF Controls */}
        {isPDF && numPages && !loading && !error && (
          <div className="flex items-center justify-center gap-4 bg-gray-50/50 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Page</span>
              <input
                type="number"
                value={pageNumber}
                onChange={handlePageInputChange}
                className="w-16 px-2 py-1 text-sm border rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={1}
                max={numPages || 1}
              />
              <span className="text-sm text-gray-600">of {numPages}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={pageNumber >= (numPages || 1)}
              className="flex items-center gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto border-2 bg-gray-100">
          {isPDF ? (
            <div className="flex justify-center items-start min-h-full overflow-hidden p-3">
              {loading && (
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading PDF...</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center justify-center h-96">
                  <div className="text-center bg-white rounded-lg p-8 shadow-sm border">
                    <FileText className="h-16 w-16 text-red-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Failed to load PDF
                    </h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <Button
                      onClick={openInNewTab}
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open in New Tab
                    </Button>
                  </div>
                </div>
              )}

              <div className="bg-white shadow-lg">
                <PDFDocument
                  file={documentUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading=""
                  error=""
                >
                  <Page
                    pageNumber={pageNumber}
                    scale={scale}
                    rotate={rotation}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    className="shadow-md"
                  />
                </PDFDocument>
              </div>
            </div>
          ) : isImage ? (
            <div className="flex justify-center items-center min-h-full p-6">
              <div className="bg-white shadow-lg rounded-lg overflow-hidden max-w-full max-h-full">
                <img
                  src={documentUrl}
                  alt={document?.filename || "Document preview"}
                  className="max-w-full max-h-[70vh] object-contain"
                  style={{
                    transform: `scale(${scale}) rotate(${rotation}deg)`,
                    transformOrigin: "center",
                    transition: "transform 0.2s ease-in-out",
                  }}
                  onError={(e) => {
                    console.error("Image load error:", e);
                    setError("Failed to load image");
                  }}
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center bg-white rounded-lg p-8 shadow-sm border">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Preview not available
                </h3>
                <p className="text-gray-600 mb-4">
                  This file type cannot be previewed in the browser.
                </p>
                <Button
                  onClick={openInNewTab}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open in New Tab
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentViewerModal;
