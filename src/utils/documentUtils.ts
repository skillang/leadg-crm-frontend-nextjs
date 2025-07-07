// src/utils/documentUtils.ts

import { Document } from "@/models/types/documents";

/**
 * Format file size in human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * Get file extension from filename
 */
export const getFileExtension = (filename: string): string => {
  return filename
    .slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2)
    .toLowerCase();
};

/**
 * Check if file is an image
 */
export const isImageFile = (mimeType: string): boolean => {
  return mimeType.startsWith("image/");
};

/**
 * Check if file is a PDF
 */
export const isPdfFile = (mimeType: string): boolean => {
  return mimeType === "application/pdf";
};

/**
 * Check if file is a document (Word, etc.)
 */
export const isDocumentFile = (mimeType: string): boolean => {
  return (
    mimeType.includes("word") ||
    mimeType.includes("document") ||
    mimeType.includes("text")
  );
};

/**
 * Get appropriate icon class for file type
 */
export const getFileIconClass = (mimeType: string): string => {
  if (isPdfFile(mimeType)) return "text-red-600";
  if (isImageFile(mimeType)) return "text-purple-600";
  if (isDocumentFile(mimeType)) return "text-blue-600";
  return "text-gray-600";
};

/**
 * Check if document is expired
 */
export const isDocumentExpired = (document: Document): boolean => {
  if (!document.expiry_date) return false;
  const expiryDate = new Date(document.expiry_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return expiryDate < today;
};

/**
 * Check if document expires soon (within 30 days)
 */
export const isDocumentExpiringSoon = (document: Document): boolean => {
  if (!document.expiry_date) return false;
  const expiryDate = new Date(document.expiry_date);
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  return expiryDate >= today && expiryDate <= thirtyDaysFromNow;
};

/**
 * Get status badge color for document
 */
export const getStatusBadgeColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case "approved":
      return "bg-green-100 text-green-800 border-green-200";
    case "rejected":
      return "bg-red-100 text-red-800 border-red-200";
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

/**
 * Filter documents by type
 */
export const filterDocumentsByType = (
  documents: Document[],
  type: string
): Document[] => {
  if (!type || type === "all") return documents;
  return documents.filter(
    (doc) => doc.document_type.toLowerCase() === type.toLowerCase()
  );
};

/**
 * Filter documents by status
 */
export const filterDocumentsByStatus = (
  documents: Document[],
  status: string
): Document[] => {
  if (!status || status === "all") return documents;
  return documents.filter(
    (doc) => doc.status.toLowerCase() === status.toLowerCase()
  );
};

/**
 * Sort documents by upload date (newest first)
 */
export const sortDocumentsByDate = (
  documents: Document[],
  ascending: boolean = false
): Document[] => {
  return [...documents].sort((a, b) => {
    const dateA = new Date(a.uploaded_at).getTime();
    const dateB = new Date(b.uploaded_at).getTime();
    return ascending ? dateA - dateB : dateB - dateA;
  });
};

/**
 * Sort documents by file size
 */
export const sortDocumentsBySize = (
  documents: Document[],
  ascending: boolean = false
): Document[] => {
  return [...documents].sort((a, b) => {
    return ascending ? a.file_size - b.file_size : b.file_size - a.file_size;
  });
};

/**
 * Search documents by filename or notes
 */
export const searchDocuments = (
  documents: Document[],
  searchTerm: string
): Document[] => {
  if (!searchTerm.trim()) return documents;

  const term = searchTerm.toLowerCase();
  return documents.filter(
    (doc) =>
      doc.filename.toLowerCase().includes(term) ||
      doc.notes.toLowerCase().includes(term) ||
      doc.document_type.toLowerCase().includes(term)
  );
};

/**
 * Calculate document statistics
 */
export const calculateDocumentStats = (documents: Document[]) => {
  const stats = {
    total: documents.length,
    approved: documents.filter((doc) => doc.status === "Approved").length,
    pending: documents.filter((doc) => doc.status === "Pending").length,
    rejected: documents.filter((doc) => doc.status === "Rejected").length,
    totalSize: documents.reduce((sum, doc) => sum + doc.file_size, 0),
    expired: documents.filter(isDocumentExpired).length,
    expiringSoon: documents.filter(isDocumentExpiringSoon).length,
    byType: {} as Record<string, number>,
    recentUploads: 0,
  };

  // Count by document type
  documents.forEach((doc) => {
    stats.byType[doc.document_type] =
      (stats.byType[doc.document_type] || 0) + 1;
  });

  // Count recent uploads (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  stats.recentUploads = documents.filter(
    (doc) => new Date(doc.uploaded_at) >= sevenDaysAgo
  ).length;

  return stats;
};

/**
 * Validate file before upload
 */
export const validateFileForUpload = (
  file: File
): { isValid: boolean; error?: string } => {
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
    return {
      isValid: false,
      error: `File size must be less than ${formatFileSize(maxSize)}`,
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error:
        "File type not supported. Please upload PDF, Word, Image, or Text files.",
    };
  }

  return { isValid: true };
};

/**
 * Generate download filename with timestamp
 */
export const generateDownloadFilename = (
  originalFilename: string,
  leadId?: string
): string => {
  const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const extension = getFileExtension(originalFilename);
  const baseName = originalFilename.replace(`.${extension}`, "");

  if (leadId) {
    return `${leadId}_${baseName}_${timestamp}.${extension}`;
  }

  return `${baseName}_${timestamp}.${extension}`;
};

/**
 * Create document preview URL (if backend supports it)
 */
export const createDocumentPreviewUrl = (
  documentId: string,
  baseUrl?: string
): string => {
  const base =
    baseUrl || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
  return `${base}/documents/${documentId}/preview`;
};

/**
 * Group documents by status
 */
export const groupDocumentsByStatus = (
  documents: Document[]
): Record<string, Document[]> => {
  return documents.reduce((groups, doc) => {
    const status = doc.status;
    if (!groups[status]) {
      groups[status] = [];
    }
    groups[status].push(doc);
    return groups;
  }, {} as Record<string, Document[]>);
};

/**
 * Group documents by type
 */
export const groupDocumentsByType = (
  documents: Document[]
): Record<string, Document[]> => {
  return documents.reduce((groups, doc) => {
    const type = doc.document_type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(doc);
    return groups;
  }, {} as Record<string, Document[]>);
};

/**
 * Get unique uploaders from documents
 */
export const getUniqueUploaders = (documents: Document[]): string[] => {
  const uploaders = new Set(documents.map((doc) => doc.uploaded_by_name));
  return Array.from(uploaders);
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000)
    return `${Math.floor(diffInSeconds / 86400)} days ago`;

  return date.toLocaleDateString();
};
