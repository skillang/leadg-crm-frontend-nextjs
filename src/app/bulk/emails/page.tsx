// src/app/bulk-email/page.tsx
"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Mail,
  History,
  BarChart3,
  RefreshCw,
  TrendingUp,
  Activity,
  Calendar,
  Loader2,
  User,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import StatsCard from "@/components/custom/cards/StatsCard";
import {
  useGetEmailStatsQuery,
  useGetScheduledEmailsQuery,
} from "@/redux/slices/emailApi";

const BulkEmailPage: React.FC = () => {
  const [emailsPage] = useState(1);
  const [emailsFilter, setEmailsFilter] = useState("all");

  // API queries for email history and stats
  const { data: statsData, isLoading: statsLoading } = useGetEmailStatsQuery();

  const {
    data: emailsData,
    isLoading: emailsLoading,
    refetch: refetchEmails,
  } = useGetScheduledEmailsQuery({
    page: emailsPage,
    limit: 20,
    status:
      emailsFilter !== "all"
        ? (emailsFilter as "pending" | "sent" | "failed" | "cancelled")
        : undefined,
  });

  const getEmailStatusBadge = (status: string) => {
    const variants = {
      pending: "bg-yellow-100 text-yellow-800",
      sent: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      cancelled: "bg-red-100 text-red-800",
    };

    return (
      <Badge
        className={`${
          variants[status as keyof typeof variants] ||
          "bg-gray-100 text-gray-800"
        } border-0`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Bulk Email History
          </h1>
          <p className="text-muted-foreground">
            View email statistics and manage email history
          </p>
          <Badge variant={"destructive"}>Page Under Construction</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4">
        {/* Statistics Cards */}
        <div className="lg:col-span-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <StatsCard
              title="Total Sent"
              value={statsData?.stats?.total_sent || 0}
              icon={<BarChart3 className="h-8 w-8 text-blue-600" />}
              isLoading={statsLoading}
            />

            <StatsCard
              title="Total Pending"
              value={statsData?.stats?.total_pending || 0}
              icon={<Calendar className="h-8 w-8 text-yellow-500" />}
              isLoading={statsLoading}
            />

            <StatsCard
              title="Success Rate"
              value={`${statsData?.stats?.success_rate || 0}%`}
              icon={<TrendingUp className="h-8 w-8 text-green-500" />}
              isLoading={statsLoading}
            />

            <StatsCard
              title="Total Failed"
              value={statsData?.stats?.total_failed || 0}
              icon={<Activity className="h-8 w-8 text-red-500" />}
              isLoading={statsLoading}
            />
          </div>
        </div>

        {/* Email History */}
        <div className="lg:col-span-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Email History
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={emailsFilter} onValueChange={setEmailsFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Emails</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchEmails()}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                {emailsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : emailsData?.emails && emailsData.emails.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email ID</TableHead>
                        <TableHead>Lead Name</TableHead>
                        <TableHead>Template</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Scheduled Time</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {emailsData?.emails?.map((email) => (
                        <TableRow key={email.email_id}>
                          <TableCell className="font-medium font-mono text-sm">
                            {email.email_id.slice(0, 8)}...
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {email.lead_name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {email.template_name}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getEmailStatusBadge(email.status)}
                          </TableCell>
                          <TableCell>
                            {email.scheduled_time ? (
                              <div className="text-sm">
                                <div>
                                  {format(
                                    parseISO(email.scheduled_time),
                                    "MMM dd, yyyy"
                                  )}
                                </div>
                                <div className="text-gray-500">
                                  {format(
                                    parseISO(email.scheduled_time),
                                    "HH:mm"
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">
                                Not scheduled
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>
                                {format(
                                  parseISO(email.created_at),
                                  "MMM dd, yyyy"
                                )}
                              </div>
                              <div className="text-gray-500">
                                {format(parseISO(email.created_at), "HH:mm")}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {email.status === "pending" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // You can implement cancel functionality here
                                  console.log("Cancel email:", email.email_id);
                                }}
                                className="flex items-center gap-1"
                              >
                                <Mail className="h-3 w-3" />
                                Cancel
                              </Button>
                            ) : (
                              <span className="text-gray-400 text-sm">
                                {email.status === "sent"
                                  ? "Completed"
                                  : email.status === "failed"
                                  ? "Failed"
                                  : "Cancelled"}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No emails found</p>
                    <p className="text-sm">
                      {emailsFilter !== "all"
                        ? `No ${emailsFilter} emails found. Try changing the filter.`
                        : "No emails have been sent yet. Start by creating your first bulk email campaign."}
                    </p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BulkEmailPage;
