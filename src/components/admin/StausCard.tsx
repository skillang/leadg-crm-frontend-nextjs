// src/components/admin/StatusCard.tsx

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  Crown,
  Users,
  Calendar,
  User,
} from "lucide-react";
import { Status } from "@/models/types/status";

interface StatusCardProps {
  status: Status;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onDelete: (status: Status) => void;
  onToggle: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isProcessing: boolean;
}

const StatusCard: React.FC<StatusCardProps> = ({
  status,
  isFirst,
  isLast,
  onEdit,
  onDelete,
  onToggle,
  onMoveUp,
  onMoveDown,
  isProcessing,
}) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card
      className={`transition-all duration-200 hover:shadow-md ${
        !status.is_active ? "opacity-60" : ""
      }`}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          {/* Left section - Status info */}
          <div className="flex items-center space-x-4 flex-1">
            {/* Color indicator */}
            <div
              className="w-4 h-4 rounded-full border-2 border-gray-200"
              style={{ backgroundColor: status.color }}
              title={`Color: ${status.color}`}
            />

            {/* Status details */}
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {status.display_name}
                </h3>
                {status.is_default && (
                  <Badge variant="secondary" className="flex items-center">
                    <Crown className="w-3 h-3 mr-1" />
                    Default
                  </Badge>
                )}
                <Badge
                  variant={status.is_active ? "default" : "secondary"}
                  className={
                    status.is_active ? "bg-green-100 text-green-800" : ""
                  }
                >
                  {status.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                  {status.name}
                </span>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {status.lead_count} leads
                </div>
                <div className="flex items-center">
                  <span className="text-xs">Order: {status.sort_order}</span>
                </div>
              </div>

              {status.description && (
                <p className="text-sm text-gray-600 mt-2">
                  {status.description}
                </p>
              )}

              {/* Metadata */}
              <div className="flex items-center space-x-4 text-xs text-gray-500 mt-3">
                <div className="flex items-center">
                  <User className="w-3 h-3 mr-1" />
                  Created by {status.created_by}
                </div>
                <div className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatDate(status.created_at)}
                </div>
                {status.updated_at && (
                  <div className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    Updated {formatDate(status.updated_at)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right section - Actions */}
          <div className="flex items-center space-x-2">
            {/* Status preview badge */}
            <Badge
              style={{
                backgroundColor: status.color,
                color: "#ffffff",
              }}
              className="mr-4"
            >
              {status.display_name}
            </Badge>

            {/* Move buttons */}
            <div className="flex flex-col space-y-1">
              <Button
                variant="outline"
                size="sm"
                onClick={onMoveUp}
                disabled={isFirst || isProcessing}
                className="h-6 w-6 p-0"
              >
                <ArrowUp className="w-3 h-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onMoveDown}
                disabled={isLast || isProcessing}
                className="h-6 w-6 p-0"
              >
                <ArrowDown className="w-3 h-3" />
              </Button>
            </div>

            {/* Actions menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isProcessing}>
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Status
                </DropdownMenuItem>

                <DropdownMenuItem onClick={onToggle}>
                  {status.is_active ? (
                    <>
                      <ToggleLeft className="w-4 h-4 mr-2" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <ToggleRight className="w-4 h-4 mr-2" />
                      Activate
                    </>
                  )}
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => onDelete(status)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Status
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatusCard;
