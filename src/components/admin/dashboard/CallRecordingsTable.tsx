// src/components/admin/CallRecordingsTable.tsx
// Call recordings table with direct playback functionality (no reason popup)

"use client";

import React, { useState, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Pause,
  Square,
  Volume2,
  VolumeX,
  Download,
  Eye,
  MoreHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  PhoneCall,
  PhoneOff,
  PhoneIncoming,
  PhoneOutgoing,
  Clock,
  Calendar,
  Mic,
  MicOff,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// Types
import {
  CallRecord,
  SortState,
  PaginationState,
} from "@/models/types/callDashboard";
import { usePlayRecordingMutation } from "../../../redux/slices/callDashboardApi";

interface CallRecordingsTableProps {
  data: CallRecord[];
  loading?: boolean;
  onSortChange?: (sort: SortState) => void;
  sortState?: SortState;
  pagination?: PaginationState;
  onPageChange?: (page: number) => void;
  className?: string;
}

// Audio player state
interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
}

// Audio player component
function AudioPlayer({ url, onClose }: { url: string; onClose: () => void }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
  });

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (audioState.isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const handleVolumeChange = (value: number) => {
    if (audioRef.current) {
      audioRef.current.volume = value;
      setAudioState((prev) => ({
        ...prev,
        volume: value,
        isMuted: value === 0,
      }));
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      const newMuted = !audioState.isMuted;
      audioRef.current.muted = newMuted;
      setAudioState((prev) => ({ ...prev, isMuted: newMuted }));
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed bottom-4 right-4 bg-background border rounded-lg shadow-lg p-4 min-w-[300px] z-50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Call Recording</span>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ✕
        </Button>
      </div>

      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setAudioState((prev) => ({
              ...prev,
              currentTime: audioRef.current!.currentTime,
            }));
          }
        }}
        onDurationChange={() => {
          if (audioRef.current) {
            setAudioState((prev) => ({
              ...prev,
              duration: audioRef.current!.duration,
            }));
          }
        }}
        onPlay={() => setAudioState((prev) => ({ ...prev, isPlaying: true }))}
        onPause={() => setAudioState((prev) => ({ ...prev, isPlaying: false }))}
        onEnded={() => setAudioState((prev) => ({ ...prev, isPlaying: false }))}
      />

      <div className="space-y-3">
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-1">
          <div
            className="bg-blue-600 h-1 rounded-full transition-all duration-300"
            style={{
              width: `${
                audioState.duration
                  ? (audioState.currentTime / audioState.duration) * 100
                  : 0
              }%`,
            }}
          />
        </div>

        {/* Time display */}
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTime(audioState.currentTime)}</span>
          <span>{formatTime(audioState.duration)}</span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center space-x-2">
          <Button variant="outline" size="sm" onClick={togglePlayPause}>
            {audioState.isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={handleStop}>
            <Square className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={toggleMute}>
            {audioState.isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
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
  const [playRecording] = usePlayRecordingMutation();
  const [activeAudioUrl, setActiveAudioUrl] = useState<string | null>(null);
  const [isLoadingRecording, setIsLoadingRecording] = useState<string | null>(
    null
  );

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

  // Handle direct recording playback without reason popup
  const handlePlayRecording = async (callId: string, userId: string) => {
    try {
      setIsLoadingRecording(callId);

      // Use a default reason since it's still required by the backend for logging
      const defaultReason = "Admin playback - direct access";

      const response = await playRecording({
        call_id: callId,
        user_id: userId,
        reason: defaultReason,
      }).unwrap();

      if (response.success && response.recording_url) {
        setActiveAudioUrl(response.recording_url);
      }
    } catch (error) {
      console.error("Failed to play recording:", error);
      // You could add a toast notification here
    } finally {
      setIsLoadingRecording(null);
    }
  };

  // Get call status styling
  const getCallStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "answered":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Answered
          </Badge>
        );
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
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mic className="h-5 w-5" />
            <span>Call Recordings</span>
            {data.length > 0 && (
              <Badge variant="secondary">{data.length} recordings</Badge>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <div className="border rounded-md">
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
                            onClick={() =>
                              handlePlayRecording(call.call_id, call.user_id)
                            }
                            disabled={isLoadingRecording === call.call_id}
                            className="flex items-center space-x-1"
                          >
                            {isLoadingRecording === call.call_id ? (
                              <>
                                <div className="h-3 w-3 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                                <span>Loading...</span>
                              </>
                            ) : (
                              <>
                                <Play className="h-3 w-3" />
                                <span>Play</span>
                              </>
                            )}
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
                              <DropdownMenuItem>
                                <Download className="mr-2 h-4 w-4" />
                                Download Recording
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
          </div>

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

      {/* Audio Player */}
      {activeAudioUrl && (
        <AudioPlayer
          url={activeAudioUrl}
          onClose={() => setActiveAudioUrl(null)}
        />
      )}
    </>
  );
}

export default CallRecordingsTable;
