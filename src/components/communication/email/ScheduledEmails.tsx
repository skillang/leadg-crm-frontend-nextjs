// src/components/emails/ScheduledEmails.tsx
"use client";

import React, { useState } from "react";
import {
  useGetScheduledEmailsQuery,
  useCancelScheduledEmailMutation,
} from "@/redux/slices/emailApi";
import { useNotifications } from "@/components/common/NotificationSystem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Calendar,
  Clock,
  Mail,
  X,
  Search,
  Filter,
  Loader2,
} from "lucide-react";
import { format, parseISO } from "date-fns";

const ScheduledEmails: React.FC = () => {
  const [currentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<
    "pending" | "sent" | "failed" | "cancelled"
  >("pending");
  const [searchTerm, setSearchTerm] = useState("");

  const { showSuccess, showError, showConfirm } = useNotifications();

  const { data: scheduledEmails, isLoading } = useGetScheduledEmailsQuery({
    page: currentPage,
    limit: 20,
    status: statusFilter,
  });

  const [cancelEmail, { isLoading: cancelling }] =
    useCancelScheduledEmailMutation();

  const handleCancelEmail = async (emailId: string, leadName: string) => {
    showConfirm({
      title: "Cancel Scheduled Email",
      description: `Are you sure you want to cancel this scheduled email to ${leadName}? This action cannot be undone.`,
      confirmText: "Cancel Email",
      variant: "destructive",
      onConfirm: async () => {
        try {
          await cancelEmail(emailId).unwrap();
          showSuccess("Email cancelled successfully");
        } catch (error: unknown) {
          const errorMessage =
            error &&
            typeof error === "object" &&
            "data" in error &&
            error.data &&
            typeof error.data === "object" &&
            "detail" in error.data
              ? String(error.data.detail)
              : "Failed to cancel email";
          showError(errorMessage);
        }
      },
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "bg-yellow-100 text-yellow-800",
      sent: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
    };

    return (
      <Badge
        className={`${variants[status as keyof typeof variants]} border-0`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredEmails =
    scheduledEmails?.emails?.filter(
      (email) =>
        email.lead_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.template_name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Scheduled Emails
          </h1>
          <p className="text-muted-foreground">
            Manage your scheduled email campaigns
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by lead name or template..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={statusFilter}
              onValueChange={(
                value: "pending" | "sent" | "failed" | "cancelled"
              ) => setStatusFilter(value)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Emails Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Scheduled Emails ({filteredEmails.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : filteredEmails.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead Name</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Scheduled Time</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmails.map((email) => (
                    <TableRow key={email.email_id}>
                      <TableCell className="font-medium">
                        {email.lead_name}
                      </TableCell>
                      <TableCell>{email.template_name}</TableCell>
                      <TableCell>{getStatusBadge(email.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          {format(parseISO(email.scheduled_time), "PPP at p")}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(parseISO(email.created_at), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        {email.status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() =>
                              handleCancelEmail(email.email_id, email.lead_name)
                            }
                            disabled={cancelling}
                          >
                            {cancelling ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <X className="h-4 w-4 mr-1" />
                            )}
                            Cancel
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No scheduled emails found</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScheduledEmails;
