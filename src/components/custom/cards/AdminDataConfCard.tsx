// src/components/custom/cards/AdminDataConfCard.tsx

"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Users,
  Hash,
  Calendar,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Badge configuration interface
interface BadgeConfig {
  text: string;
  variant?:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "success-light"
    | "primary-ghost";
}

// Props interface
interface AdminDataConfCardProps {
  // Basic info
  title: string;
  subtitle?: string;
  description?: string;

  // Optional metadata
  createdBy?: string;
  createdAt?: string;
  leadCount?: number;
  nextNumber?: number;
  orderNumber?: number;

  // Visual
  color?: string; // For sidebar color (stages/status)
  isActive?: boolean;
  badges?: BadgeConfig[]; // Changed to array for multiple badges

  // Actions (callbacks)
  onEdit?: () => void;
  onDelete?: () => void;
  onActivate?: () => void;
  onDeactivate?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;

  // Action availability
  canEdit?: boolean;
  canDelete?: boolean;
  canReorder?: boolean;
  showReorderOutside?: boolean; // For stages/status - shows arrows outside dropdown

  // Loading and styling
  isLoading?: boolean;
  className?: string;
}

// Skeleton component for loading state
const AdminDataConfCardSkeleton: React.FC<{ className?: string }> = ({
  className,
}) => (
  <Card className={cn("hover:shadow-md transition-shadow", className)}>
    <CardHeader>
      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1">
          <Skeleton className="h-6 w-32" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-12" />
          </div>
        </div>
        <Skeleton className="h-8 w-8" />
      </div>
    </CardHeader>

    <CardContent className="space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-12" />
        </div>
        <div className="flex items-center gap-1">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>

      <div className="pt-2 border-t">
        <Skeleton className="h-3 w-24 mb-1" />
        <Skeleton className="h-3 w-32" />
      </div>
    </CardContent>
  </Card>
);

// Main component
const AdminDataConfCard: React.FC<AdminDataConfCardProps> = ({
  title,
  subtitle,
  description,
  createdBy,
  createdAt,
  leadCount,
  nextNumber,
  orderNumber,
  color,
  isActive = true,
  badges = [], // Default to empty array
  onEdit,
  onDelete,
  onActivate,
  onDeactivate,
  onMoveUp,
  onMoveDown,
  canEdit = true,
  canDelete = true,
  canReorder = false,
  showReorderOutside = false,
  isLoading = false,
  className,
}) => {
  // Show skeleton if loading
  if (isLoading) {
    return <AdminDataConfCardSkeleton className={className} />;
  }

  // Format date helper
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Check if any dropdown actions are available
  const hasDropdownActions =
    canEdit ||
    canDelete ||
    onActivate ||
    onDeactivate ||
    (canReorder && !showReorderOutside);

  return (
    <Card
      className={cn(
        "hover:shadow-md transition-all duration-200",
        color && "border-l-4",
        !isActive && "opacity-75",
        className
      )}
      style={color ? { borderLeftColor: color } : undefined}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-3 mb-2">
              <CardTitle
                className={cn(
                  "text-lg font-semibold",
                  !isActive && "text-gray-600"
                )}
              >
                {title}
              </CardTitle>

              {/* Color indicator for stages/status */}
              {color && (
                <div
                  className="w-4 h-4 rounded-full border-2 border-white shadow"
                  style={{ backgroundColor: color }}
                />
              )}
            </div>

            {/* Subtitle and Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {subtitle && (
                <Badge variant="outline" className="text-xs">
                  {subtitle}
                </Badge>
              )}
              {badges.map((badge, index) => (
                <Badge
                  key={index}
                  variant={badge.variant || "default"}
                  className="text-xs"
                >
                  {badge.text}
                </Badge>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            {/* Reorder buttons (outside dropdown for stages/status) */}
            {canReorder && showReorderOutside && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onMoveUp}
                  className="h-8 w-8 p-0"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onMoveDown}
                  className="h-8 w-8 p-0"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </>
            )}

            {/* Dropdown menu */}
            {hasDropdownActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {/* Edit */}
                  {canEdit && onEdit && (
                    <DropdownMenuItem onClick={onEdit}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  )}

                  {/* Activate/Deactivate */}
                  {(onActivate || onDeactivate) && (
                    <>
                      {canEdit && <DropdownMenuSeparator />}
                      {isActive && onDeactivate ? (
                        <DropdownMenuItem onClick={onDeactivate}>
                          <EyeOff className="mr-2 h-4 w-4" />
                          Deactivate
                        </DropdownMenuItem>
                      ) : (
                        onActivate && (
                          <DropdownMenuItem onClick={onActivate}>
                            <Eye className="mr-2 h-4 w-4" />
                            Activate
                          </DropdownMenuItem>
                        )
                      )}
                    </>
                  )}

                  {/* Reorder (inside dropdown) */}
                  {canReorder && !showReorderOutside && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={onMoveUp}>
                        <ChevronUp className="mr-2 h-4 w-4" />
                        Move Up
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={onMoveDown}>
                        <ChevronDown className="mr-2 h-4 w-4" />
                        Move Down
                      </DropdownMenuItem>
                    </>
                  )}

                  {/* Delete */}
                  {canDelete && onDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={onDelete}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Description */}
        {description && <p className="text-sm text-gray-600">{description}</p>}

        {/* Metrics row */}
        {(leadCount !== undefined ||
          nextNumber !== undefined ||
          orderNumber !== undefined) && (
          <div className="flex items-center justify-between text-sm">
            {leadCount !== undefined && (
              <div className="flex items-center gap-1 text-gray-600">
                <Users className="h-4 w-4" />
                <span>{leadCount} leads</span>
              </div>
            )}
            {nextNumber !== undefined && (
              <div className="flex items-center gap-1 text-gray-600">
                Next: <Hash className="h-4 w-4" />
                {nextNumber}
              </div>
            )}
            {orderNumber !== undefined && (
              <div className="flex items-center gap-1 text-gray-600">
                Order No: <Hash className="h-4 w-4" /> {orderNumber}
              </div>
            )}
          </div>
        )}

        {/* Created info footer */}
        {(createdBy || createdAt) && (
          <div className="pt-2 border-t text-xs text-gray-500">
            {createdBy && (
              <div className="flex items-center gap-1 mb-1">
                <User className="h-3 w-3" />
                <span>Created by {createdBy}</span>
              </div>
            )}
            {createdAt && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Created {formatDate(createdAt)}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminDataConfCard;
