// src/components/common/AudioPlayer.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  ExternalLink,
} from "lucide-react";

// Types for AudioPlayer component
interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
}

interface CallInfo {
  agent_name?: string;
  client_number?: string;
  date?: string;
  time?: string;
  call_id?: string;
}

interface AudioPlayerProps {
  url: string;
  callInfo?: CallInfo;
  onClose: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  url,
  callInfo,
  onClose,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
  });
  const [loadingError, setLoadingError] = useState(false);

  // Reset audio state when URL changes (switching between recordings)
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setAudioState((prev) => ({ ...prev, isPlaying: false, currentTime: 0 }));
      setLoadingError(false);
    }
  }, [url]);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (audioState.isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch((error) => {
          console.error("Playback error:", error);
          setLoadingError(true);
        });
      }
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
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
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed bottom-4 right-4 bg-background border rounded-lg shadow-lg p-4 min-w-[320px] max-w-[400px] z-50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <div className="font-medium text-sm">Call Recording</div>
          {callInfo && (
            <div className="text-xs text-muted-foreground">
              {callInfo.agent_name} → {callInfo.client_number}
              <br />
              {callInfo.date} at {callInfo.time}
            </div>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ✕
        </Button>
      </div>

      {loadingError ? (
        <div className="text-center py-4">
          <div className="text-red-500 text-sm mb-2">
            Failed to load recording
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(url, "_blank")}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in New Tab
          </Button>
        </div>
      ) : (
        <>
          <audio
            ref={audioRef}
            src={url || undefined}
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
            onPlay={() =>
              setAudioState((prev) => ({ ...prev, isPlaying: true }))
            }
            onPause={() =>
              setAudioState((prev) => ({ ...prev, isPlaying: false }))
            }
            onEnded={() =>
              setAudioState((prev) => ({ ...prev, isPlaying: false }))
            }
            onError={() => setLoadingError(true)}
            onLoadStart={() => setLoadingError(false)}
          />

          <div className="space-y-3">
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
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
        </>
      )}
    </div>
  );
};

export default AudioPlayer;
