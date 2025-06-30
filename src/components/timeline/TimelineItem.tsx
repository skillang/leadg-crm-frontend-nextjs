// src/components/timeline/TimelineItem.tsx

"use client";

import React, { JSX } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
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
  Calendar,
  Clock,
  User,
} from "lucide-react";
import {
  TimelineActivity,
  getActivityTypeConfig,
} from "@/models/types/timeline";
import { cn } from "@/lib/utils";

interface TimelineItemProps {
  activity: TimelineActivity;
  isLast?: boolean;
}

const TimelineItem: React.FC<TimelineItemProps> = ({
  activity,
  isLast = false,
}) => {
  // Get activity type configuration
  const typeConfig = getActivityTypeConfig(activity.activity_type);

  // Icon mapping
  const getIcon = (iconName: string) => {
    const iconMap: Record<string, React.ComponentType<any>> = {
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
    };

    return iconMap[iconName] || Activity;
  };

  const IconComponent = getIcon(typeConfig.icon || "Activity");

  // Color mapping for activity types
  const getActivityColors = (color: string) => {
    const colorMap: Record<
      string,
      { bg: string; border: string; icon: string }
    > = {
      blue: {
        bg: "bg-blue-50",
        border: "border-blue-200",
        icon: "text-blue-600",
      },
      green: {
        bg: "bg-green-50",
        border: "border-green-200",
        icon: "text-green-600",
      },
      purple: {
        bg: "bg-purple-50",
        border: "border-purple-200",
        icon: "text-purple-600",
      },
      orange: {
        bg: "bg-orange-50",
        border: "border-orange-200",
        icon: "text-orange-600",
      },
      yellow: {
        bg: "bg-yellow-50",
        border: "border-yellow-200",
        icon: "text-yellow-600",
      },
      red: { bg: "bg-red-50", border: "border-red-200", icon: "text-red-600" },
      indigo: {
        bg: "bg-indigo-50",
        border: "border-indigo-200",
        icon: "text-indigo-600",
      },
      pink: {
        bg: "bg-pink-50",
        border: "border-pink-200",
        icon: "text-pink-600",
      },
      gray: {
        bg: "bg-gray-50",
        border: "border-gray-200",
        icon: "text-gray-600",
      },
    };

    return colorMap[color] || colorMap.gray;
  };

  const colors = getActivityColors(typeConfig.color || "gray");

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday =
      date.toDateString() === new Date(now.getTime() - 86400000).toDateString();

    const timeStr = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    if (isToday) {
      return { date: "Today", time: timeStr };
    } else if (isYesterday) {
      return { date: "Yesterday", time: timeStr };
    } else {
      const dateStr = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
      return { date: dateStr, time: timeStr };
    }
  };

  const { date, time } = formatTimestamp(activity.timestamp);

  // Format metadata for display
  const getMetadataInfo = () => {
    if (!activity.metadata || Object.keys(activity.metadata).length === 0) {
      return null;
    }

    const metadata = activity.metadata;
    const info: JSX.Element[] = [];

    // Handle common metadata fields
    if (metadata.stage_from && metadata.stage_to) {
      info.push(
        <div
          key="stage"
          className="flex items-center gap-2 text-sm text-gray-600"
        >
          <ArrowRight className="h-3 w-3" />
          <span>
            <span className="font-medium">{metadata.stage_from}</span>
            {" → "}
            <span className="font-medium">{metadata.stage_to}</span>
          </span>
        </div>
      );
    }

    if (metadata.task_type) {
      info.push(
        <div key="task_type" className="text-sm text-gray-600">
          <span className="font-medium">Type:</span> {metadata.task_type}
        </div>
      );
    }

    if (metadata.document_type) {
      info.push(
        <div key="document_type" className="text-sm text-gray-600">
          <span className="font-medium">Document:</span>{" "}
          {metadata.document_type}
        </div>
      );
    }

    if (metadata.file_name) {
      info.push(
        <div key="file_name" className="text-sm text-gray-600">
          <span className="font-medium">File:</span> {metadata.file_name}
        </div>
      );
    }

    return info.length > 0 ? info : null;
  };

  const metadataInfo = getMetadataInfo();

  return (
    <div className="relative">
      {/* Timeline line */}
      {/* {!isLast && (
        <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-200" />
      )} */}

      <div className="flex items-start gap-4 pb-6">
        {/* Activity Icon */}
        {/* <div
          className={cn(
            "flex items-center justify-center w-12 h-12 rounded-full border-2 relative z-10",
            colors.bg,
            colors.border
          )}
        >
          <IconComponent className={cn("h-5 w-5", colors.icon)} />
        </div> */}

        {/* Activity Content */}
        <div className="flex-1 min-w-0">
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {activity.title}
                  </h4>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {activity.description}
                  </p>
                </div>

                {/* Activity Type Badge */}
                <Badge
                  variant="secondary"
                  className={cn(
                    "ml-3 text-xs font-medium px-2 py-1",
                    colors.bg,
                    colors.border,
                    colors.icon.replace("text-", "")
                  )}
                >
                  {typeConfig.label}
                </Badge>
              </div>

              {/* Metadata */}
              {metadataInfo && (
                <div className="space-y-2 mb-3 p-3 bg-gray-50 rounded-md">
                  {metadataInfo}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-4">
                  {/* Performed by */}
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>{activity.performed_by_name}</span>
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{date}</span>
                  </div>

                  {/* Time */}
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{time}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TimelineItem;
