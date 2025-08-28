// src/components/admin/dashboard/FilterInfoCard.tsx

"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

interface FilterInfoCardProps {
  applied: boolean;
  scope: string;
  userCount: number;
  userIds: string[];
  agentIds: string[];
}

export function FilterInfoCard({
  applied,
  scope,
  userCount,
  userIds,
  agentIds,
}: FilterInfoCardProps) {
  return (
    <Card className="border">
      <CardHeader>
        <CardTitle>Filter Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <span>Filters Applied:</span>
          <Badge variant={applied ? "success" : "destructive"}>
            {applied ? "Yes" : "No"}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span>Scope:</span>
          <span className="font-medium capitalize">
            {scope.replace("_", " ")}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span>User Count:</span>
          <Badge variant="outline" className="flex items-center space-x-1">
            <Users className="h-3 w-3" />
            <span>{userCount}</span>
          </Badge>
        </div>

        {userIds.length > 0 && (
          <div className="space-y-1">
            <span className="font-medium">User IDs:</span>
            <div className="flex flex-wrap gap-1">
              {userIds.map((id) => (
                <Badge key={id} variant="secondary" className="text-xs">
                  {id}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {agentIds.length > 0 && (
          <div className="space-y-1">
            <span className="font-medium">Agent IDs:</span>
            <div className="flex flex-wrap gap-1">
              {agentIds.map((id) => (
                <Badge key={id} variant="secondary" className="text-xs">
                  {id}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
