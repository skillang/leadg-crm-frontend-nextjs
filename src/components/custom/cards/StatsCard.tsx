// src/components/custom/StatsCard.tsx

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string; // For trends like "+12% from last month"
  isLoading?: boolean;
  className?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  subtitle,
  isLoading = false,
  className,
}) => {
  if (isLoading) {
    return (
      <Card
        className={cn("transition-all duration-200 hover:shadow-md", className)}
      >
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Skeleton className="h-4 w-20 mb-3" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn("transition-all duration-200 hover:shadow-md", className)}
    >
      <CardContent className="px-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          <div className="flex-shrink-0 ml-4">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
