// src/hooks/useStages.ts

import { useMemo } from "react";
import {
  useGetActiveStagesQuery,
  useGetStagesQuery,
  useGetDefaultStageNameQuery,
} from "@/redux/slices/stagesApi";
import { Stage } from "@/models/types/stage";

export interface UseStagesReturn {
  // Active stages for dropdowns and selections
  activeStages: Stage[];
  stageOptions: Array<{ value: string; label: string }>;

  // All stages data
  allStages: Stage[];

  // Loading states
  isLoading: boolean;
  isError: boolean;
  error: unknown;

  // Default stage information
  defaultStageName: string;
  defaultStage: Stage | undefined;

  // Helper functions
  getStageById: (id: string) => Stage | undefined;
  getStageByName: (name: string) => Stage | undefined;
  getStageColor: (stageName: string) => string;
  getStageDisplayName: (stageName: string) => string;

  // Stats
  totalActiveStages: number;
  totalStages: number;
}

export const useStages = (): UseStagesReturn => {
  // Fetch active stages (for dropdowns and general use)
  const {
    data: activeStagesData,
    isLoading: activeLoading,
    isError: activeError,
    error: activeErrorData,
  } = useGetActiveStagesQuery({ include_lead_count: true });

  // Fetch all stages (for admin purposes)
  const { data: allStagesData, isLoading: allLoading } = useGetStagesQuery({
    include_lead_count: true,
    active_only: false,
  });

  // Fetch default stage name
  const { data: defaultStageName = "" } = useGetDefaultStageNameQuery();

  // Memoized derived data
  const activeStages = useMemo(
    () => activeStagesData?.stages || [],
    [activeStagesData]
  );

  const allStages = useMemo(() => allStagesData?.stages || [], [allStagesData]);

  const stageOptions = useMemo(
    () =>
      activeStages.map((stage) => ({
        value: stage.name,
        label: stage.display_name,
      })),
    [activeStages]
  );

  const defaultStage = useMemo(
    () => activeStages.find((stage) => stage.is_default),
    [activeStages]
  );

  // Helper functions
  const getStageById = useMemo(
    () =>
      (id: string): Stage | undefined =>
        allStages.find((stage) => stage.id === id),
    [allStages]
  );

  const getStageByName = useMemo(
    () =>
      (name: string): Stage | undefined =>
        allStages.find((stage) => stage.name === name),
    [allStages]
  );

  const getStageColor = useMemo(
    () =>
      (stageName: string): string => {
        const stage = getStageByName(stageName);
        return stage?.color || "#6B7280";
      },
    [getStageByName]
  );

  const getStageDisplayName = useMemo(
    () =>
      (stageName: string): string => {
        const stage = getStageByName(stageName);
        return stage?.display_name || stageName;
      },
    [getStageByName]
  );

  return {
    // Data
    activeStages,
    stageOptions,
    allStages,

    // Loading states
    isLoading: activeLoading || allLoading,
    isError: activeError,
    error: activeErrorData,

    // Default stage
    defaultStageName,
    defaultStage,

    // Helper functions
    getStageById,
    getStageByName,
    getStageColor,
    getStageDisplayName,

    // Stats
    totalActiveStages: activeStagesData?.active_count || 0,
    totalStages: allStagesData?.total || 0,
  };
};

// Additional hook for stage-related UI components
export const useStageColors = () => {
  const { allStages } = useStages();

  return useMemo(() => {
    const stageColorMap = new Map<string, string>();
    allStages.forEach((stage) => {
      stageColorMap.set(stage.name, stage.color);
    });
    return stageColorMap;
  }, [allStages]);
};

// Hook for stage validation
export const useStageValidation = () => {
  const { activeStages } = useStages();

  const isValidStage = useMemo(
    () =>
      (stageName: string): boolean =>
        activeStages.some((stage) => stage.name === stageName),
    [activeStages]
  );

  const getValidStages = useMemo(
    () => () => activeStages.map((stage) => stage.name),
    [activeStages]
  );

  return {
    isValidStage,
    getValidStages,
    validStageNames: activeStages.map((stage) => stage.name),
  };
};
