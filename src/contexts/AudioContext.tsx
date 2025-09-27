// src/contexts/AudioContext.tsx
"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import AudioPlayer from "@/components/common/AudioPlayer";

// Types for AudioContext
interface CallInfo {
  agent_name?: string;
  client_number?: string;
  date?: string;
  time?: string;
  call_id?: string;
}

interface AudioData {
  url: string;
  callInfo?: CallInfo;
}

interface AudioContextType {
  // State
  isPlayerVisible: boolean;
  currentAudio: AudioData | null;

  // Actions
  playAudio: (audioData: AudioData) => void;
  stopAudio: () => void;
  closePlayer: () => void;
}

// Create the context
const AudioContext = createContext<AudioContextType | undefined>(undefined);

// AudioProvider component
interface AudioProviderProps {
  children: ReactNode;
}

export const AudioProvider: React.FC<AudioProviderProps> = ({ children }) => {
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<AudioData | null>(null);

  // Play audio function - starts new audio or switches to different audio
  const playAudio = (audioData: AudioData) => {
    console.log("🎵 Playing audio globally:", audioData.url);
    setCurrentAudio(audioData);
    setIsPlayerVisible(true);
  };

  // Stop audio function - stops current audio but keeps player visible
  const stopAudio = () => {
    console.log("⏹️ Stopping audio globally");
    // Note: Actual audio stopping is handled by AudioPlayer component
    // This is just for external control if needed
  };

  // Close player function - hides the floating player completely
  const closePlayer = () => {
    console.log("❌ Closing audio player globally");
    setIsPlayerVisible(false);
    setCurrentAudio(null);
  };

  const contextValue: AudioContextType = {
    // State
    isPlayerVisible,
    currentAudio,

    // Actions
    playAudio,
    stopAudio,
    closePlayer,
  };

  return (
    <AudioContext.Provider value={contextValue}>
      {children}

      {/* Global Floating Audio Player */}
      {isPlayerVisible && currentAudio && (
        <AudioPlayer
          url={currentAudio.url}
          callInfo={currentAudio.callInfo}
          onClose={closePlayer}
        />
      )}
    </AudioContext.Provider>
  );
};

// Hook to use the AudioContext
export const useAudio = (): AudioContextType => {
  const context = useContext(AudioContext);

  if (context === undefined) {
    throw new Error("useAudio must be used within an AudioProvider");
  }

  return context;
};

// Export the context for advanced usage (if needed)
export { AudioContext };
