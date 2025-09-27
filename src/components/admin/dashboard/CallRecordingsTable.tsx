// src/components/admin/CallRecordingsTable.tsx
// Call recordings table with direct playback functionality (no API calls needed)

"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Play,
  Download,
  Eye,
  MoreHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  Clock,
  Calendar,
  Mic,
  MicOff,
  User,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types
import {
  CallRecord,
  SortState,
  PaginationState,
  // CallInfo,
} from "@/models/types/callDashboard";
import { useAudio } from "@/contexts/AudioContext";

interface CallRecordingsTableProps {
  data: CallRecord[];
  loading?: boolean;
  onSortChange?: (sort: SortState) => void;
  sortState?: SortState;
  pagination?: PaginationState;
  onPageChange?: (page: number) => void;
  className?: string;
}

// Loading skeleton row
const LoadingRow = () => (
  <TableRow>
    {Array.from({ length: 8 }, (_, i) => (
      <TableCell key={i}>
        <div className="h-6 bg-muted animate-pulse rounded"></div>
      </TableCell>
    ))}
  </TableRow>
);

export function CallRecordingsTable({
  data,
  loading = false,
  onSortChange,
  sortState,
  pagination,
  onPageChange,
  className,
}: CallRecordingsTableProps) {
  const { playAudio } = useAudio();

  // Handle sort click
  const handleSort = (field: string) => {
    if (!onSortChange) return;

    const newDirection =
      sortState?.field === field && sortState?.direction === "asc"
        ? "desc"
        : "asc";

    onSortChange({ field, direction: newDirection });
  };

  // Get sort icon
  const getSortIcon = (field: string) => {
    if (sortState?.field !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortState.direction === "asc" ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };

  // Handle direct recording playback - no API call needed!
  const handlePlayRecording = (call: CallRecord) => {
    if (!call.recording_url) {
      console.error("No recording URL available");
      return;
    }

    console.log("🎵 Playing recording globally:", call.recording_url);

    playAudio({
      url: call.recording_url,
      callInfo: {
        agent_name: call.agent_name || call.user_name,
        client_number: call.client_number,
        date: call.date,
        time: call.time,
        call_id: call.call_id,
      },
    });
  };

  // Handle download recording
  const handleDownloadRecording = (call: CallRecord) => {
    if (!call.recording_url) return;

    const link = document.createElement("a");
    link.href = call.recording_url;
    link.download = `recording_${call.date}_${call.time}_${call.call_id}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get call status styling
  const getCallStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "answered":
        return <Badge variant="success-light">Answered</Badge>;
      case "missed":
        return <Badge variant="destructive">Missed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Get direction icon
  const getDirectionIcon = (direction: string) => {
    switch (direction?.toLowerCase()) {
      case "inbound":
        return <PhoneIncoming className="h-4 w-4 text-blue-600" />;
      case "outbound":
        return <PhoneOutgoing className="h-4 w-4 text-purple-600" />;
      default:
        return <PhoneCall className="h-4 w-4 text-gray-600" />;
    }
  };

  // Format duration
  const formatDuration = (seconds: number): string => {
    if (!seconds) return "0s";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  return (
    <>
      <div>
        <div className="flex items-center space-x-2">
          <Mic className="h-5 w-5" />
          <span>Call Recordings</span>
          {data.length > 0 && (
            <Badge variant="secondary">{data.length} recordings</Badge>
          )}
        </div>
      </div>
      <Card className={cn("w-full", className)}>
        <CardContent className="">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold"
                    onClick={() => handleSort("date")}
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    Date/Time
                    {getSortIcon("date")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold"
                    onClick={() => handleSort("user_name")}
                  >
                    <User className="h-4 w-4 mr-1" />
                    Agent
                    {getSortIcon("user_name")}
                  </Button>
                </TableHead>
                <TableHead>Client Number</TableHead>
                <TableHead className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold"
                    onClick={() => handleSort("call_duration")}
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    Duration
                    {getSortIcon("call_duration")}
                  </Button>
                </TableHead>
                <TableHead className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold"
                    onClick={() => handleSort("status")}
                  >
                    Status
                    {getSortIcon("status")}
                  </Button>
                </TableHead>
                <TableHead className="text-center">Direction</TableHead>
                <TableHead className="text-center">Recording</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                Array.from({ length: 5 }, (_, i) => <LoadingRow key={i} />)
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No call recordings available
                  </TableCell>
                </TableRow>
              ) : (
                data.map((call) => (
                  <TableRow
                    key={call.call_id}
                    className="transition-colors hover:bg-muted/50"
                  >
                    {/* Date/Time */}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-sm">{call.date}</div>
                        <div className="text-xs text-muted-foreground">
                          {call.time}
                        </div>
                      </div>
                    </TableCell>

                    {/* Agent */}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {call.agent_name || call.user_name}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {call.agent_number}
                        </div>
                      </div>
                    </TableCell>

                    {/* Client Number */}
                    <TableCell>
                      <div className="font-mono text-sm">
                        {call.client_number}
                      </div>
                      {call.circle && (
                        <div className="text-xs text-muted-foreground">
                          {call.circle.operator} - {call.circle.circle}
                        </div>
                      )}
                    </TableCell>

                    {/* Duration */}
                    <TableCell className="text-center">
                      <div className="space-y-1">
                        <div className="font-medium">
                          {formatDuration(call.call_duration)}
                        </div>
                        {call.answered_seconds > 0 && (
                          <div className="text-xs text-green-600">
                            {formatDuration(call.answered_seconds)} talk
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="text-center">
                      {getCallStatusBadge(call.status)}
                    </TableCell>

                    {/* Direction */}
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center space-x-1">
                        {getDirectionIcon(call.direction)}
                        <span className="text-xs capitalize">
                          {call.direction}
                        </span>
                      </div>
                    </TableCell>

                    {/* Recording - Direct Play Button */}
                    <TableCell className="text-center">
                      {call.recording_url ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePlayRecording(call)}
                          className="flex items-center space-x-1"
                        >
                          <Play className="h-3 w-3" />
                          <span>Play</span>
                        </Button>
                      ) : (
                        <div className="flex items-center justify-center space-x-1 text-muted-foreground">
                          <MicOff className="h-4 w-4" />
                          <span className="text-xs">No Recording</span>
                        </div>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {call.recording_url && (
                            <DropdownMenuItem
                              onClick={() => handleDownloadRecording(call)}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download Recording
                            </DropdownMenuItem>
                          )}
                          {call.recording_url && (
                            <DropdownMenuItem
                              onClick={() =>
                                window.open(call.recording_url!, "_blank")
                              }
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Open in New Tab
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages} (
                {pagination.total} total recordings)
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange?.(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange?.(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

export default CallRecordingsTable;
