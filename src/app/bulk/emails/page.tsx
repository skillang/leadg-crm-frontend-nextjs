// src/app/bulk-email/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import {
  setBulkEmailNameFilter,
  setBulkEmailStageFilter,
  setBulkEmailStatusFilter,
  clearBulkEmailFilters,
  toggleLeadForBulkEmail,
  selectAllLeadsForBulkEmail,
  clearBulkEmailSelection,
  resetBulkEmailForm,
  setSelectedTemplate,
  setSenderPrefix,
  setIsScheduled,
  setScheduledDateTime,
  setError,
} from "@/redux/slices/emailSlice";
import { useGetLeadsQuery, useGetMyLeadsQuery } from "@/redux/slices/leadsApi";
import {
  useGetEmailTemplatesQuery,
  useSendBulkEmailMutation,
} from "@/redux/slices/emailApi";
import { useNotifications } from "@/components/common/NotificationSystem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  Send,
  Users,
  Filter,
  X,
  Calendar,
  Loader2,
  CheckSquare,
  Square,
  AlertCircle,
} from "lucide-react";
import { format, parseISO } from "date-fns";

const BulkEmailPage: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const {
    bulkEmailFilters,
    selectedLeadsForBulk,
    selectedTemplateKey,
    selectedSenderPrefix,
    isScheduled,
    scheduledDateTime,
    error,
  } = useSelector((state: RootState) => state.email);

  const [customScheduleDate, setCustomScheduleDate] = useState("");
  const [customScheduleTime, setCustomScheduleTime] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const { showSuccess, showError } = useNotifications();
  const isAdmin = user?.role === "admin";

  // Initialize filters with default values
  React.useEffect(() => {
    if (!bulkEmailFilters.stage) {
      dispatch(setBulkEmailStageFilter("all"));
    }
    if (!bulkEmailFilters.status) {
      dispatch(setBulkEmailStatusFilter("all"));
    }
  }, []);

  // API queries
  const { data: leadsData, isLoading: leadsLoading } = isAdmin
    ? useGetLeadsQuery({
        page: currentPage,
        limit: 50,
        search: bulkEmailFilters.name,
        lead_status:
          bulkEmailFilters.status !== "all"
            ? bulkEmailFilters.status
            : undefined,
        // Add stage filter when available in API
      })
    : useGetMyLeadsQuery({
        page: currentPage,
        limit: 50,
        search: bulkEmailFilters.name,
        lead_status:
          bulkEmailFilters.status !== "all"
            ? bulkEmailFilters.status
            : undefined,
      });

  const { data: templates, isLoading: templatesLoading } =
    useGetEmailTemplatesQuery();
  const [sendBulkEmail, { isLoading: sendingEmail }] =
    useSendBulkEmailMutation();

  const leads = Array.isArray(leadsData) ? leadsData : leadsData?.leads || [];
  const totalLeads = Array.isArray(leadsData)
    ? leadsData.length
    : leadsData?.total || 0;

  useEffect(() => {
    if (isScheduled && customScheduleDate && customScheduleTime) {
      const dateTimeString = `${customScheduleDate}T${customScheduleTime}:00`;
      dispatch(setScheduledDateTime(dateTimeString));
    } else {
      dispatch(setScheduledDateTime(""));
    }
  }, [isScheduled, customScheduleDate, customScheduleTime, dispatch]);

  const handleSelectAllLeads = () => {
    if (selectedLeadsForBulk.length === leads.length) {
      dispatch(clearBulkEmailSelection());
    } else {
      dispatch(selectAllLeadsForBulkEmail(leads.map((lead) => lead.id)));
    }
  };

  const handleSendBulkEmail = async () => {
    if (selectedLeadsForBulk.length === 0) {
      dispatch(setError("Please select at least one lead"));
      return;
    }

    if (!selectedTemplateKey) {
      dispatch(setError("Please select an email template"));
      return;
    }

    try {
      const emailData = {
        lead_ids: selectedLeadsForBulk,
        template_key: selectedTemplateKey,
        sender_email_prefix: selectedSenderPrefix,
        ...(isScheduled &&
          scheduledDateTime && { scheduled_time: scheduledDateTime }),
      };

      await sendBulkEmail(emailData).unwrap();
      showSuccess(
        `${isScheduled ? "Scheduled" : "Sent"} bulk email to ${
          selectedLeadsForBulk.length
        } leads!`
      );
      dispatch(resetBulkEmailForm());
      setCustomScheduleDate("");
      setCustomScheduleTime("");
    } catch (error: any) {
      const errorMessage = error?.data?.detail || "Failed to send bulk email";
      dispatch(setError(errorMessage));
      showError(errorMessage);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      New: "bg-blue-100 text-blue-800",
      Contacted: "bg-yellow-100 text-yellow-800",
      Qualified: "bg-green-100 text-green-800",
      Proposal: "bg-purple-100 text-purple-800",
      Negotiation: "bg-orange-100 text-orange-800",
      "Closed Won": "bg-green-100 text-green-800",
      "Closed Lost": "bg-red-100 text-red-800",
    };

    return (
      <Badge
        className={`${
          variants[status as keyof typeof variants] ||
          "bg-gray-100 text-gray-800"
        } border-0`}
      >
        {status}
      </Badge>
    );
  };

  const getStageBadge = (stage: string) => {
    const variants = {
      Lead: "bg-blue-100 text-blue-800",
      Prospect: "bg-yellow-100 text-yellow-800",
      Opportunity: "bg-green-100 text-green-800",
      Customer: "bg-purple-100 text-purple-800",
    };

    return (
      <Badge
        variant="outline"
        className={
          variants[stage as keyof typeof variants] ||
          "bg-gray-100 text-gray-800"
        }
      >
        {stage}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bulk Email</h1>
          <p className="text-muted-foreground">
            Send emails to multiple leads at once
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-gray-500" />
          <span className="text-sm text-gray-600">
            {selectedLeadsForBulk.length} of {totalLeads} selected
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filters and Lead Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Search by Name</Label>
                  <Input
                    placeholder="Enter lead name..."
                    value={bulkEmailFilters.name}
                    onChange={(e) =>
                      dispatch(setBulkEmailNameFilter(e.target.value))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stage</Label>
                  <Select
                    value={bulkEmailFilters.stage}
                    onValueChange={(value) =>
                      dispatch(setBulkEmailStageFilter(value))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All stages" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All stages</SelectItem>
                      <SelectItem value="Lead">Lead</SelectItem>
                      <SelectItem value="Prospect">Prospect</SelectItem>
                      <SelectItem value="Opportunity">Opportunity</SelectItem>
                      <SelectItem value="Customer">Customer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={bulkEmailFilters.status}
                    onValueChange={(value) =>
                      dispatch(setBulkEmailStatusFilter(value))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="Contacted">Contacted</SelectItem>
                      <SelectItem value="Qualified">Qualified</SelectItem>
                      <SelectItem value="Proposal">Proposal</SelectItem>
                      <SelectItem value="Negotiation">Negotiation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => dispatch(clearBulkEmailFilters())}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lead Selection Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Select Leads</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllLeads}
                    className="flex items-center gap-2"
                  >
                    {selectedLeadsForBulk.length === leads.length ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                    {selectedLeadsForBulk.length === leads.length
                      ? "Deselect All"
                      : "Select All"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => dispatch(clearBulkEmailSelection())}
                    disabled={selectedLeadsForBulk.length === 0}
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {leadsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : leads.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Select</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Stage</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Contacted</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedLeadsForBulk.includes(lead.id)}
                              onCheckedChange={() =>
                                dispatch(toggleLeadForBulkEmail(lead.id))
                              }
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {lead.name}
                          </TableCell>
                          <TableCell>{lead.email}</TableCell>
                          <TableCell>{getStageBadge(lead.stage)}</TableCell>
                          <TableCell>{getStatusBadge(lead.status)}</TableCell>
                          <TableCell>
                            {lead.lastContacted
                              ? format(
                                  parseISO(lead.lastContacted),
                                  "MMM dd, yyyy"
                                )
                              : "Never"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No leads found matching your filters
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Email Composition */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Compose Bulk Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="template">Email Template *</Label>
                <Select
                  value={selectedTemplateKey}
                  onValueChange={(value) =>
                    dispatch(setSelectedTemplate(value))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templatesLoading ? (
                      <div className="p-2 text-center">
                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                      </div>
                    ) : (
                      templates?.templates?.map((template, index) => (
                        <SelectItem key={index} value={template.key}>
                          {template.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sender">Sender Email Prefix</Label>
                <Select
                  value={selectedSenderPrefix}
                  onValueChange={(value) => dispatch(setSenderPrefix(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="noreply">noreply</SelectItem>
                    <SelectItem value="support">support</SelectItem>
                    <SelectItem value="partnerships">partnerships</SelectItem>
                    <SelectItem value="school.connect">
                      school.connect
                    </SelectItem>
                    <SelectItem value="outreach">outreach</SelectItem>
                    <SelectItem value="marketing">marketing</SelectItem>
                    <SelectItem value="admin">admin</SelectItem>
                    <SelectItem value="nhr">nhr</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="schedule"
                    checked={isScheduled}
                    onCheckedChange={(checked) =>
                      dispatch(setIsScheduled(checked as boolean))
                    }
                  />
                  <Label htmlFor="schedule" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Schedule for later
                  </Label>
                </div>

                {isScheduled && (
                  <div className="space-y-3 p-4 bg-gray-50 rounded-md">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={customScheduleDate}
                        onChange={(e) => setCustomScheduleDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time">Time</Label>
                      <Input
                        id="time"
                        type="time"
                        value={customScheduleTime}
                        onChange={(e) => setCustomScheduleTime(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t">
                <div className="text-sm text-gray-600 mb-4">
                  Ready to send to{" "}
                  <strong>{selectedLeadsForBulk.length}</strong> lead
                  {selectedLeadsForBulk.length !== 1 ? "s" : ""}
                </div>

                <Button
                  onClick={handleSendBulkEmail}
                  disabled={
                    sendingEmail ||
                    selectedLeadsForBulk.length === 0 ||
                    !selectedTemplateKey
                  }
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {sendingEmail ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  {isScheduled ? "Schedule Bulk Email" : "Send Bulk Email"}
                </Button>
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  onClick={() => dispatch(resetBulkEmailForm())}
                  className="w-full"
                >
                  Reset Form
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BulkEmailPage;
