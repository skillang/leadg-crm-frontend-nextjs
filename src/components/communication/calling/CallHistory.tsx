// src/components/calling/CallHistory.tsx
"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { History, Clock, Phone } from "lucide-react";
import { Lead } from "@/models/types/lead";

interface CallHistoryProps {
  leadDetails: Lead; // Lead details from API
}

const CallHistory: React.FC<CallHistoryProps> = ({ leadDetails }) => {
  return (
    <div className="space-y-6">
      {/* Coming Soon Placeholder */}
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
              <History className="h-8 w-8 text-slate-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Call History Coming Soon for {leadDetails.name}
              </h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                We are working on call history tracking. Soon you will be able
                to see:
              </p>
            </div>
            <div className="space-y-2 text-sm text-slate-600 max-w-md mx-auto">
              <div className="flex items-center justify-start space-x-2">
                <Clock className="h-4 w-4 text-slate-400" />
                <span>Call duration and timestamps</span>
              </div>
              <div className="flex items-center justify-start space-x-2">
                <Phone className="h-4 w-4 text-slate-400" />
                <span>Call status and outcomes</span>
              </div>
              <div className="flex items-center justify-start space-x-2">
                <History className="h-4 w-4 text-slate-400" />
                <span>Complete call timeline</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Future: Call History List will go here */}
      {/* This is where we'll add actual call history when backend is ready:
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Calls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {callHistory.map((call) => (
              <div key={call.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{call.purpose}</p>
                  <p className="text-sm text-muted-foreground">{call.date}</p>
                </div>
                <Badge variant={call.status === 'completed' ? 'default' : 'secondary'}>
                  {call.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      */}
    </div>
  );
};

export default CallHistory;
