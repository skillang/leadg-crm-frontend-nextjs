// src/components/documents/DocumentStats.tsx

"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Upload,
  Download,
  Users,
} from "lucide-react";

interface DocumentStatsProps {
  stats: {
    total_documents?: number;
    pending_documents?: number;
    approved_documents?: number;
    rejected_documents?: number;
    total_size?: number;
    recent_uploads?: number;
    unique_uploaders?: number;
  };
  isLoading?: boolean;
  className?: string;
}

const DocumentStats: React.FC<DocumentStatsProps> = ({
  stats,
  isLoading = false,
  className = "",
}) => {
  // Safely extract stats with default values
  const safeStats = {
    total_documents: stats?.total_documents || 0,
    pending_documents: stats?.pending_documents || 0,
    approved_documents: stats?.approved_documents || 0,
    rejected_documents: stats?.rejected_documents || 0,
    total_size: stats?.total_size || 0,
    recent_uploads: stats?.recent_uploads || 0,
    unique_uploaders: stats?.unique_uploaders || 0,
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // Calculate approval rate
  const approvalRate =
    safeStats.total_documents > 0
      ? Math.round(
          (safeStats.approved_documents / safeStats.total_documents) * 100
        )
      : 0;

  const statsItems = [
    {
      label: "Total Documents",
      value: safeStats.total_documents,
      icon: <FileText className="h-5 w-5" />,
      className: "bg-blue-50 border-blue-200 text-blue-700",
      description: "All uploaded documents",
    },
    {
      label: "Pending Review",
      value: safeStats.pending_documents,
      icon: <Clock className="h-5 w-5" />,
      className: "bg-yellow-50 border-yellow-200 text-yellow-700",
      description: "Awaiting approval",
    },
    {
      label: "Approved",
      value: safeStats.approved_documents,
      icon: <CheckCircle className="h-5 w-5" />,
      className: "bg-green-50 border-green-200 text-green-700",
      description: `${approvalRate}% approval rate`,
    },
    {
      label: "Rejected",
      value: safeStats.rejected_documents,
      icon: <XCircle className="h-5 w-5" />,
      className: "bg-red-50 border-red-200 text-red-700",
      description: "Needs attention",
    },
  ];

  const additionalStats = [
    {
      label: "Storage Used",
      value: formatFileSize(safeStats.total_size),
      icon: <Download className="h-4 w-4" />,
      className: "bg-purple-50 border-purple-200 text-purple-700",
    },
    {
      label: "Recent Uploads",
      value: safeStats.recent_uploads,
      icon: <Upload className="h-4 w-4" />,
      className: "bg-indigo-50 border-indigo-200 text-indigo-700",
      description: "Last 7 days",
    },
    {
      label: "Active Users",
      value: safeStats.unique_uploaders,
      icon: <Users className="h-4 w-4" />,
      className: "bg-teal-50 border-teal-200 text-teal-700",
      description: "Document uploaders",
    },
  ];

  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 ${className}`}>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statsItems.map((item, index) => (
          <Card
            key={index}
            className={`transition-colors border ${item.className}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium opacity-80">{item.label}</p>
                  <p className="text-2xl font-bold mt-1">{item.value}</p>
                  {item.description && (
                    <p className="text-xs opacity-70 mt-1">
                      {item.description}
                    </p>
                  )}
                </div>
                <div className="opacity-60">{item.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {additionalStats.map((item, index) => (
          <Card
            key={index}
            className={`transition-colors border ${item.className}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="opacity-60">{item.icon}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium opacity-80">{item.label}</p>
                  <p className="text-lg font-semibold">{item.value}</p>
                  {item.description && (
                    <p className="text-xs opacity-70">{item.description}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions or Alerts */}
      {safeStats.pending_documents > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">
                  Action Required
                </p>
                <p className="text-yellow-700">
                  {safeStats.pending_documents} document
                  {safeStats.pending_documents !== 1 ? "s" : ""}
                  {safeStats.pending_documents === 1 ? " is" : " are"} waiting
                  for approval
                </p>
              </div>
              <button className="text-yellow-700 hover:text-yellow-800 text-sm font-medium">
                Review Now →
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DocumentStats;
