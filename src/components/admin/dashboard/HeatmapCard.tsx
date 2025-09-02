// src/components/admin/dashboard/HeatmapCard.tsx
// Hourly intensity heatmap visualization component

"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Activity, Clock, TrendingUp, Info } from "lucide-react";
import { HourlyHeatmapData } from "@/models/types/callDashboard";

interface HeatmapCardProps {
  data: HourlyHeatmapData;
  loading?: boolean;
  className?: string;
  title?: string;
}

export function HeatmapCard({
  data,
  loading = false,
  className,
  title = "Hourly Activity Heatmap",
}: HeatmapCardProps) {
  // Get intensity-based background color
  const getIntensityColor = (intensity: number, isActive: boolean) => {
    if (!isActive) return "bg-gray-50 border-gray-100";

    // Create intensity-based color scale
    const alpha = Math.min(intensity, 1.0);

    if (alpha === 0) return "bg-gray-50 border-gray-100";
    if (alpha <= 0.2) return "bg-blue-50 border-blue-100";
    if (alpha <= 0.4) return "bg-blue-100 border-blue-200";
    if (alpha <= 0.6) return "bg-blue-200 border-blue-300";
    if (alpha <= 0.8) return "bg-blue-400 border-blue-500";
    return "bg-blue-600 border-blue-700";
  };

  // Get text color based on intensity
  const getTextColor = (intensity: number, isActive: boolean) => {
    if (!isActive) return "text-gray-400";

    if (intensity <= 0.6) return "text-gray-700";
    return "text-white";
  };

  // Format success rate for display
  const formatSuccessRate = (rate: number) => {
    return rate > 0 ? `${rate.toFixed(1)}%` : "0%";
  };

  if (loading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardHeader className="space-y-2">
          <div className="h-6 w-48 bg-muted rounded"></div>
          <div className="h-4 w-32 bg-muted rounded"></div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.data?.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>{title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No heatmap data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>{title}</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {data.total_active_hours} active hours
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Peak: {data.best_hour.hour}:00
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Call intensity by hour • Max: {data.max_calls} calls
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Heatmap Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">24-Hour Activity Pattern</p>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <span>Low</span>
              <div className="flex space-x-1">
                <div className="w-3 h-3 bg-gray-50 border rounded"></div>
                <div className="w-3 h-3 bg-blue-50 border rounded"></div>
                <div className="w-3 h-3 bg-blue-100 border rounded"></div>
                <div className="w-3 h-3 bg-blue-200 border rounded"></div>
                <div className="w-3 h-3 bg-blue-400 border rounded"></div>
                <div className="w-3 h-3 bg-blue-600 border rounded"></div>
              </div>
              <span>High</span>
            </div>
          </div>

          {/* Heatmap Grid - 6 columns x 4 rows for 24 hours */}
          <TooltipProvider>
            <div className="grid grid-cols-6 gap-2">
              {data.data.map((hourData) => {
                const intensityColor = getIntensityColor(
                  hourData.intensity,
                  hourData.is_active
                );
                const textColor = getTextColor(
                  hourData.intensity,
                  hourData.is_active
                );

                return (
                  <Tooltip key={hourData.hour}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "relative p-3 rounded-lg border transition-all duration-200 cursor-pointer hover:scale-105",
                          intensityColor,
                          hourData.hour === data.best_hour.hour &&
                            "ring-2 ring-green-400"
                        )}
                      >
                        <div className="text-center space-y-1">
                          <p className={cn("text-xs font-medium", textColor)}>
                            {hourData.display}
                          </p>
                          <p className={cn("text-lg font-bold", textColor)}>
                            {hourData.call_count}
                          </p>
                          {hourData.is_active && (
                            <p className={cn("text-xs", textColor)}>
                              {formatSuccessRate(hourData.success_rate)}
                            </p>
                          )}
                        </div>

                        {/* Best hour indicator */}
                        {hourData.hour === data.best_hour.hour && (
                          <div className="absolute -top-1 -right-1">
                            <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                          </div>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-1">
                        <p className="font-medium">
                          {hourData.display} -{" "}
                          {(hourData.hour + 1).toString().padStart(2, "0")}:00
                        </p>
                        <div className="text-xs space-y-1">
                          <p>Total Calls: {hourData.call_count}</p>
                          <p>Answered: {hourData.answered_count}</p>
                          <p>
                            Success Rate:{" "}
                            {formatSuccessRate(hourData.success_rate)}
                          </p>
                          <p>
                            Intensity: {(hourData.intensity * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Peak Hour</p>
            <div className="flex items-center justify-center space-x-1 mt-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="font-bold text-green-600">
                {data.best_hour.hour}:00
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatSuccessRate(data.best_hour.success_rate)} success
            </p>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">Active Hours</p>
            <p className="text-lg font-bold mt-1">{data.total_active_hours}</p>
            <p className="text-xs text-muted-foreground">of 24 hours</p>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">Peak Volume</p>
            <p className="text-lg font-bold mt-1">{data.max_calls}</p>
            <p className="text-xs text-muted-foreground">calls/hour</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Info className="h-3 w-3" />
            <span>Hover over hours for details</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Best performing hour</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default HeatmapCard;
