// src/components/timeline/TimelineItem.tsx

"use client";

import React, { JSX } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  Users,
  FileText,
  CheckSquare,
  Paperclip,
  UserPlus,
  Settings,
  Activity,
  StickyNote,
  Upload,
  Download,
  MessageSquare,
  CalendarX,
  MessageCircle,
  Bell,
  LogIn,
  LogOut,
  Plus,
  Edit,
  Trash,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  TimelineActivity,
  getActivityTypeConfig,
  formatActivityTypeLabel,
} from "@/models/types/timeline";
import { cn } from "@/lib/utils";
import { twoTileDateTime } from "@/utils/formatDate";

interface TimelineItemProps {
  activity: TimelineActivity;
  isLast?: boolean;
}

// Helper function to safely convert unknown values to strings
const safeString = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  return String(value);
};

// Helper function to check if a value is a non-empty string
const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

const TimelineItem: React.FC<TimelineItemProps> = ({ activity }) => {
  // Get activity type configuration using the new dynamic system
  const typeConfig = getActivityTypeConfig(activity.activity_type);

  // Get formatted label directly from activity_type
  const formattedLabel = formatActivityTypeLabel(activity.activity_type);

  // Complete icon mapping for all Lucide React icons used
  const getIcon = (iconName: string) => {
    const iconMap: Record<
      string,
      React.ComponentType<React.SVGProps<SVGSVGElement>>
    > = {
      Phone,
      Mail,
      Users,
      FileText,
      CheckSquare,
      Paperclip,
      ArrowRight,
      UserPlus,
      Settings,
      Activity,
      StickyNote,
      Upload,
      Download,
      MessageSquare,
      Calendar,
      CalendarX,
      MessageCircle,
      Bell,
      LogIn,
      LogOut,
      Plus,
      Edit,
      Trash,
      CheckCircle,
      XCircle,
      User,
      Clock,
    };

    return iconMap[iconName] || Activity;
  };

  const IconComponent = getIcon(typeConfig.icon || "Activity");

  // const { date, time } = formatTimestamp(activity.timestamp);

  const { dateText, timeText } = twoTileDateTime(activity.timestamp);
  // Format metadata for display
  const getMetadataInfo = () => {
    if (!activity.metadata || Object.keys(activity.metadata).length === 0) {
      return null;
    }

    const metadata = activity.metadata;
    const info: JSX.Element[] = [];

    // Handle stage changes
    if (
      isNonEmptyString(metadata.stage_from) &&
      isNonEmptyString(metadata.stage_to)
    ) {
      info.push(
        <div
          key="stage"
          className="flex items-center gap-2 text-sm text-gray-600"
        >
          <span className="font-medium">Changed:</span>
          <span className="inline-flex items-center gap-2">
            <span className="px-2 py-1 bg-orange-100 text-orange-600 rounded text-xs font-medium">
              {metadata.stage_from}
            </span>
            <ArrowRight className="h-3 w-3" />
            <span className="px-2 py-1 bg-green-100 text-green-600 rounded text-xs font-medium">
              {metadata.stage_to}
            </span>
          </span>
        </div>
      );
    }

    // Handle reassignment metadata
    if (
      isNonEmptyString(metadata.assigned_from) &&
      isNonEmptyString(metadata.assigned_to)
    ) {
      info.push(
        <div key="reassignment_by" className="text-sm text-gray-600">
          <span className="font-medium">Reassigned by:</span>{" "}
          {/* {metadata.reassigned_by || "System"} */}
        </div>
      );
      info.push(
        <div key="reassignment_to" className="text-sm text-gray-600">
          <span className="font-medium">Reassigned to:</span>{" "}
          {metadata.assigned_to}
        </div>
      );
    }

    // Handle task metadata
    if (isNonEmptyString(metadata.task_title)) {
      info.push(
        <div key="task" className="text-sm text-gray-600">
          <span className="font-medium">Task:</span> &quot;{metadata.task_title}
          &quot;
        </div>
      );
    }

    if (isNonEmptyString(metadata.task_type)) {
      info.push(
        <div key="task_type" className="text-sm text-gray-600">
          <span className="font-medium">Type:</span> {metadata.task_type}
        </div>
      );
    }

    // Handle document metadata
    if (isNonEmptyString(metadata.file_name)) {
      info.push(
        <div
          key="file"
          className="flex items-center gap-2 text-sm text-gray-600"
        >
          <span className="font-medium">File:</span>
          <div className="flex items-center gap-2">
            {metadata.file_names && Array.isArray(metadata.file_names) ? (
              metadata.file_names.map((fileName: string, index: number) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-primary-700 rounded text-xs"
                >
                  <FileText className="h-3 w-3" />
                  {String(fileName)}
                </span>
              ))
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-primary-700 rounded text-xs">
                <FileText className="h-3 w-3" />
                {metadata.file_name}
              </span>
            )}
          </div>
        </div>
      );
    }

    if (isNonEmptyString(metadata.document_type)) {
      info.push(
        <div key="document_type" className="text-sm text-gray-600">
          <span className="font-medium">Document:</span>{" "}
          {metadata.document_type}
        </div>
      );
    }

    // Handle note metadata
    if (isNonEmptyString(metadata.note_preview)) {
      info.push(
        <div key="note" className="text-sm text-gray-600">
          <span className="font-medium">Note:</span> &quot;
          {metadata.note_preview}&quot;
          {/* {metadata.note_length && (
            <button className="ml-2 text-blue-600 text-xs hover:underline">
              Read more
            </button>
          )} */}
        </div>
      );
    }

    // Handle call metadata
    if (metadata.duration !== undefined && metadata.duration !== null) {
      const duration = safeString(metadata.duration);
      if (duration) {
        info.push(
          <div key="duration" className="text-sm text-gray-600">
            <span className="font-medium">Duration:</span> {duration}
          </div>
        );
      }
    }

    if (isNonEmptyString(metadata.call_summary)) {
      info.push(
        <div key="summary" className="text-sm text-gray-600">
          <span className="font-medium">Summary:</span> {metadata.call_summary}
        </div>
      );
    }

    // Handle email metadata
    if (isNonEmptyString(metadata.email_subject)) {
      info.push(
        <div key="subject" className="text-sm text-gray-600">
          <span className="font-medium">Subject:</span> {metadata.email_subject}
        </div>
      );
    }

    if (isNonEmptyString(metadata.sent_via)) {
      info.push(
        <div key="sent_via" className="text-sm text-gray-600">
          <span className="font-medium">Sent via:</span> {metadata.sent_via}
        </div>
      );
    }

    if (metadata.opened !== undefined) {
      info.push(
        <div key="opened" className="text-sm text-gray-600">
          <span className="font-medium">Opened:</span>{" "}
          {metadata.opened ? `Yes (${metadata.open_count || 1} times)` : "No"}
        </div>
      );
    }

    // Handle additional metadata fields with safe string conversion
    if (metadata.priority && isNonEmptyString(metadata.priority)) {
      info.push(
        <div key="priority" className="text-sm text-gray-600">
          <span className="font-medium">Priority:</span> {metadata.priority}
        </div>
      );
    }

    if (metadata.status && isNonEmptyString(metadata.status)) {
      info.push(
        <div key="status" className="text-sm text-gray-600">
          <span className="font-medium">Status:</span> {metadata.status}
        </div>
      );
    }

    // Handle assigned_to metadata
    if (isNonEmptyString(metadata.assigned_to_name)) {
      info.push(
        <div key="assigned_to" className="text-sm text-gray-600">
          <span className="font-medium">Assigned to:</span>{" "}
          {metadata.assigned_to_name}
        </div>
      );
    }

    return info.length > 0 ? info : null;
  };

  const metadataInfo = getMetadataInfo();

  return (
    <div className="relative">
      <div className="flex items-start gap-4 pb-6">
        {/* Activity Content */}
        <div className="flex-1 min-w-0">
          <Card className="border-gray-200 py-3">
            <CardContent className="">
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  {/* Blue colored title with icon */}
                  <div className="flex items-center gap-2 mb-1">
                    <IconComponent className={cn("h-5 w-5, text-blue-500")} />
                    <h4 className={cn("font-semibold text-blue-500")}>
                      {formattedLabel}
                    </h4>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {activity.description}
                  </p>
                </div>

                {/* Date and Time on the right */}
                <div className="flex items-end text-sm gap-2">
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <Calendar className="h-3 w-3" />
                    <span>{dateText}</span>
                  </Badge>
                  <Badge
                    variant="outline"
                    className="flex items-center gap-1 mt-1"
                  >
                    <Clock className="h-3 w-3" />
                    <span>{timeText}</span>
                  </Badge>
                </div>
              </div>

              {/* Metadata */}
              {metadataInfo && (
                <div className="space-y-2 mb-3 p-2 bg-gray-50 rounded-md">
                  {metadataInfo}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center text-sm text-gray-500 pt-2 border-t border-gray-100 gap-2">
                <span>Done By: </span>
                <Badge className="flex items-center gap-1 bg-blue-100 text-blue-600">
                  {activity.performed_by_name}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TimelineItem;
