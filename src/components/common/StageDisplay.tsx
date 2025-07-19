// src/components/common/StageDisplay.tsx - FINAL VERSION

"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { useGetActiveStagesQuery } from "@/redux/slices/stagesApi";
import { Loader2 } from "lucide-react";

interface StageDisplayProps {
  stageName: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
  size?: "sm" | "md" | "lg";
  showColor?: boolean;
  className?: string;
}

export const StageDisplay: React.FC<StageDisplayProps> = ({
  stageName,
  variant = "secondary",
  size = "md",
  showColor = true,
  className = "",
}) => {
  const { data: stagesData, isLoading } = useGetActiveStagesQuery({});

  const stageConfig = stagesData?.stages.find(
    (stage) => stage.name === stageName
  );

  if (isLoading) {
    return (
      <div className="inline-flex items-center gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span className="text-xs text-gray-500">Loading...</span>
      </div>
    );
  }

  const displayName = stageConfig?.display_name || stageName;
  const stageColor = stageConfig?.color || "#6B7280";

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-0.5",
    lg: "text-base px-3 py-1",
  };

  const dynamicStyles =
    showColor && stageConfig
      ? {
          backgroundColor: `${stageColor}20`,
          borderColor: stageColor,
          color: stageColor,
        }
      : {};

  return (
    <Badge
      variant={variant}
      className={`${sizeClasses[size]} ${
        showColor ? "border-2" : ""
      } ${className}`}
      style={dynamicStyles}
    >
      {displayName}
    </Badge>
  );
};

interface StageColorDotProps {
  stageName: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const StageColorDot: React.FC<StageColorDotProps> = ({
  stageName,
  size = "md",
  className = "",
}) => {
  const { data: stagesData, isLoading } = useGetActiveStagesQuery({});

  const stageConfig = stagesData?.stages.find(
    (stage) => stage.name === stageName
  );
  const stageColor = stageConfig?.color || "#6B7280";

  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  if (isLoading) {
    return (
      <div
        className={`${sizeClasses[size]} bg-gray-200 rounded-full animate-pulse ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full ${className}`}
      style={{ backgroundColor: stageColor }}
      title={stageConfig?.display_name || stageName}
    />
  );
};

interface StageListProps {
  onStageSelect?: (stageName: string) => void;
  selectedStage?: string;
  className?: string;
}

export const StageList: React.FC<StageListProps> = ({
  onStageSelect,
  selectedStage,
  className = "",
}) => {
  const { data: stagesData, isLoading } = useGetActiveStagesQuery({});

  if (isLoading) {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  const stages = stagesData?.stages || [];

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {stages.map((stage) => (
        <button
          key={stage.id}
          onClick={() => onStageSelect?.(stage.name)}
          className={`
            inline-flex items-center gap-1 px-3 py-1 rounded-md text-sm border-2 transition-all
            ${
              selectedStage === stage.name
                ? "ring-2 ring-blue-500 ring-offset-1"
                : "hover:opacity-80"
            }
          `}
          style={{
            backgroundColor: `${stage.color}20`,
            borderColor: stage.color,
            color: stage.color,
          }}
        >
          <StageColorDot stageName={stage.name} size="sm" />
          {stage.display_name}
        </button>
      ))}
    </div>
  );
};

export const useStageUtils = () => {
  const { data: stagesData, isLoading } = useGetActiveStagesQuery({});

  const getStageDisplayName = (stageName: string): string => {
    const stage = stagesData?.stages.find((s) => s.name === stageName);
    return stage?.display_name || stageName;
  };

  const getStageColor = (stageName: string): string => {
    const stage = stagesData?.stages.find((s) => s.name === stageName);
    return stage?.color || "#6B7280";
  };

  const getAllStageNames = (): string[] => {
    return stagesData?.stages.map((s) => s.name) || [];
  };

  const isValidStage = (stageName: string): boolean => {
    return stagesData?.stages.some((s) => s.name === stageName) || false;
  };

  return {
    stagesData,
    isLoading,
    getStageDisplayName,
    getStageColor,
    getAllStageNames,
    isValidStage,
  };
};
