// src/components/emails/EmailTemplates.tsx
"use client";

import React from "react";
import {
  useGetEmailTemplatesQuery,
  useTestCmsConnectionQuery,
} from "@/redux/slices/emailApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText,
  Mail,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";

const EmailTemplates: React.FC = () => {
  const { data: templates, isLoading, refetch } = useGetEmailTemplatesQuery();
  const {
    data: connectionTest,
    isLoading: testLoading,
    refetch: testConnection,
  } = useTestCmsConnectionQuery();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Templates</h1>
          <p className="text-muted-foreground">
            Manage your email templates from CMS
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => testConnection()}>
            {testLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Test Connection
          </Button>
          <Button onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Templates
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            CMS Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {connectionTest ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-green-700">Connected to CMS</span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="text-red-700">Connection status unknown</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Templates List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Available Templates ({templates?.total || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : templates?.templates?.length ? (
              <div className="grid gap-4">
                {templates.templates.map((template) => (
                  <div
                    key={template.key}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{template.name}</h3>
                          <Badge
                            variant={
                              template.is_active ? "default" : "secondary"
                            }
                          >
                            {template.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        {template.subject && (
                          <p className="text-sm text-gray-600">
                            Subject: {template.subject}
                          </p>
                        )}
                        {template.description && (
                          <p className="text-sm text-gray-500">
                            {template.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 font-mono">
                          {template.key}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No email templates found</p>
                <p className="text-sm mt-2">Check your CMS connection</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailTemplates;
