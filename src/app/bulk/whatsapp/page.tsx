// src/app/bulk/whatsapp/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import {
  setBulkWhatsappNameFilter,
  setBulkWhatsappStageFilter,
  setBulkWhatsappStatusFilter,
  clearBulkWhatsappFilters,
  toggleLeadForBulkWhatsapp,
  selectAllLeadsForBulkWhatsapp,
  clearBulkWhatsappSelection,
  resetBulkWhatsappForm,
  setBulkJobName,
  setBulkMessageType,
  setBulkSelectedTemplate,
  setBulkMessageContent,
  setBulkIsScheduled,
  setBulkScheduledDateTime,
  setBulkBatchSize,
  setBulkDelayBetweenMessages,
  setBulkError,
} from "@/redux/slices/whatsappSlice";
import { useGetLeadsQuery, useGetMyLeadsQuery } from "@/redux/slices/leadsApi";
import { StageSelect } from "@/components/common/StageSelect";
import { StatusSelect } from "@/components/common/StatusSelect";
import { useGetActiveStagesQuery } from "@/redux/slices/stagesApi";
import { useGetActiveStatusesQuery } from "@/redux/slices/statusesApi";
import {
  useGetTemplatesQuery,
  useCreateBulkWhatsAppJobMutation,
  useGetBulkWhatsAppJobsQuery,
  useGetBulkWhatsAppStatsQuery,
  useCancelBulkWhatsAppJobMutation,
  // useGetActiveWhatsAppJobsQuery,
} from "@/redux/slices/whatsappApi";
import { useNotifications } from "@/components/common/NotificationSystem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  Send,
  Users,
  Filter,
  X,
  Calendar as CalendarIcon,
  Loader2,
  CheckSquare,
  Square,
  AlertCircle,
  Clock,
  Phone,
  History,
  BarChart3,
  PlayCircle,
  StopCircle,
  RefreshCw,
  TrendingUp,
  Activity,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { useAdminAccess } from "@/hooks/useAdminAccess";

interface BulkJobRequestData {
  job_name: string;
  message_type: "template" | "text";
  lead_ids: string[];
  batch_size: number;
  delay_between_messages: number;
  template_name?: string;
  message_content?: string;
  scheduled_time?: string;
}

const BulkWhatsAppPage: React.FC = () => {
  const dispatch = useDispatch();
  const {
    bulkWhatsappFilters,
    selectedLeadsForBulk,
    bulkJobName,
    bulkMessageType,
    bulkSelectedTemplate,
    bulkMessageContent,
    bulkIsScheduled,
    bulkScheduledDateTime,
    bulkBatchSize,
    bulkDelayBetweenMessages,
    bulkError,
  } = useSelector((state: RootState) => state.whatsapp);

  const [customScheduleTime, setCustomScheduleTime] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [currentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("send");
  const [jobsPage] = useState(1);
  const [jobsFilter, setJobsFilter] = useState("all");

  const { showSuccess, showError } = useNotifications();
  const { isAdmin } = useAdminAccess();

  // Initialize filters with default values
  useEffect(() => {
    if (!bulkWhatsappFilters.stage) {
      dispatch(setBulkWhatsappStageFilter("all"));
    }
    if (!bulkWhatsappFilters.status) {
      dispatch(setBulkWhatsappStatusFilter("all"));
    }
  }, [bulkWhatsappFilters.stage, bulkWhatsappFilters.status, dispatch]);

  // Prepare query parameters for leads
  const queryParams = {
    page: currentPage,
    limit: 50,
    search: bulkWhatsappFilters.name,
    stage:
      bulkWhatsappFilters.stage !== "all"
        ? bulkWhatsappFilters.stage
        : undefined,
    status:
      bulkWhatsappFilters.status !== "all"
        ? bulkWhatsappFilters.status
        : undefined,
  };

  // API queries for leads
  const adminLeadsQuery = useGetLeadsQuery(queryParams, {
    skip: !isAdmin,
    refetchOnMountOrArgChange: true,
  });

  const userLeadsQuery = useGetMyLeadsQuery(queryParams, {
    skip: isAdmin,
    refetchOnMountOrArgChange: true,
  });

  // Select the appropriate query result
  const { data: leadsData, isLoading: leadsLoading } = isAdmin
    ? adminLeadsQuery
    : userLeadsQuery;

  const { data: stagesData, isLoading: stagesLoading } =
    useGetActiveStagesQuery({});
  const { data: statusesData, isLoading: statusesLoading } =
    useGetActiveStatusesQuery({});

  // API queries for WhatsApp
  const { data: templates, isLoading: templatesLoading } =
    useGetTemplatesQuery();
  const [createBulkJob, { isLoading: isCreatingJob }] =
    useCreateBulkWhatsAppJobMutation();

  // History tab queries
  const {
    data: jobsData,
    isLoading: jobsLoading,
    refetch: refetchJobs,
  } = useGetBulkWhatsAppJobsQuery({
    page: jobsPage,
    per_page: 20,
    status: jobsFilter !== "all" ? jobsFilter : undefined,
  });

  const { data: statsData } = useGetBulkWhatsAppStatsQuery();
  const [cancelJob, { isLoading: isCancelling }] =
    useCancelBulkWhatsAppJobMutation();

  // Handle leads data properly
  const leads = Array.isArray(leadsData) ? leadsData : leadsData?.leads || [];
  const totalLeads = Array.isArray(leadsData)
    ? leadsData.length
    : leadsData?.total || 0;

  // Handle scheduling - SIMPLIFIED (backend handles timezone conversion)
  useEffect(() => {
    if (bulkIsScheduled && selectedDate && customScheduleTime) {
      const year = selectedDate.getFullYear();
      const month = (selectedDate.getMonth() + 1).toString().padStart(2, "0");
      const day = selectedDate.getDate().toString().padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;
      const dateTimeString = `${dateString} ${customScheduleTime}:00`;
      dispatch(setBulkScheduledDateTime(dateTimeString));
    } else {
      dispatch(setBulkScheduledDateTime(""));
    }
  }, [bulkIsScheduled, selectedDate, customScheduleTime, dispatch]);

  // Handle lead selection
  const handleSelectAllLeads = () => {
    if (selectedLeadsForBulk.length === leads.length) {
      dispatch(clearBulkWhatsappSelection());
    } else {
      dispatch(selectAllLeadsForBulkWhatsapp(leads.map((lead) => lead.id)));
    }
  };

  // Handle form submission
  const handleSendBulkWhatsApp = async () => {
    if (selectedLeadsForBulk.length === 0) {
      dispatch(setBulkError("Please select at least one lead"));
      return;
    }

    if (!bulkJobName.trim()) {
      dispatch(setBulkError("Please enter a job name"));
      return;
    }

    if (bulkMessageType === "template" && !bulkSelectedTemplate) {
      dispatch(setBulkError("Please select a WhatsApp template"));
      return;
    }

    if (bulkMessageType === "text" && !bulkMessageContent.trim()) {
      dispatch(setBulkError("Please enter message content"));
      return;
    }

    try {
      const requestData: BulkJobRequestData = {
        job_name: bulkJobName,
        message_type: bulkMessageType,
        lead_ids: selectedLeadsForBulk,
        batch_size: bulkBatchSize,
        delay_between_messages: bulkDelayBetweenMessages,
      };

      if (bulkMessageType === "template") {
        requestData.template_name = bulkSelectedTemplate || undefined;
      } else {
        requestData.message_content = bulkMessageContent;
      }

      if (bulkIsScheduled && bulkScheduledDateTime) {
        requestData.scheduled_time = bulkScheduledDateTime;
      }

      const result = await createBulkJob(requestData).unwrap();

      showSuccess(
        `${bulkIsScheduled ? "Scheduled" : "Created"} WhatsApp job for ${
          result.total_recipients
        } leads! Job ID: ${result.job_id}`
      );

      // Reset form and switch to history tab
      dispatch(resetBulkWhatsappForm());
      setCustomScheduleTime("");
      setSelectedDate(undefined);
      setActiveTab("history");
      refetchJobs();
    } catch (error: unknown) {
      const errorMessage =
        error &&
        typeof error === "object" &&
        "data" in error &&
        error.data &&
        typeof error.data === "object" &&
        "detail" in error.data
          ? String(error.data.detail)
          : "Failed to create WhatsApp job";
      dispatch(setBulkError(errorMessage));
      showError(errorMessage);
    }
  };

  // Handle job cancellation
  const handleCancelJob = async (jobId: string, jobName: string) => {
    try {
      await cancelJob({ jobId, reason: "Cancelled by user" }).unwrap();
      showSuccess(`Job "${jobName}" has been cancelled successfully`);
      refetchJobs();
    } catch (error) {
      showError(`Because of ${error}`, "Failed to cancel job");
    }
  };

  // Badge helpers
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

  const getJobStatusBadge = (status: string) => {
    const variants = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      cancelled: "bg-red-100 text-red-800",
      scheduled: "bg-purple-100 text-purple-800",
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bulk WhatsApp</h1>
          <p className="text-muted-foreground">
            Send WhatsApp messages to multiple leads and manage jobs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-gray-500" />
          <span className="text-sm text-gray-600">
            {selectedLeadsForBulk.length} of {totalLeads} selected
          </span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="send" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Send Message
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History & Stats
          </TabsTrigger>
        </TabsList>

        {/* Send Message Tab */}
        <TabsContent value="send" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Filters and Lead Selection */}
            <div className="lg:col-span-2 space-y-6">
              {/* Filters */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Lead Filters (Coming Soon)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Search by Name</Label>
                      <Input
                        placeholder="Enter lead name..."
                        value={bulkWhatsappFilters.name}
                        onChange={(e) =>
                          dispatch(setBulkWhatsappNameFilter(e.target.value))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <StageSelect
                        value={
                          bulkWhatsappFilters.stage === "all"
                            ? ""
                            : bulkWhatsappFilters.stage
                        }
                        onValueChange={(value) =>
                          dispatch(setBulkWhatsappStageFilter(value || "all"))
                        }
                        stages={stagesData?.stages || []}
                        disabled={stagesLoading}
                        isLoading={stagesLoading}
                        className="w-full"
                        showLabel={true}
                      />
                    </div>
                    <div className="space-y-2">
                      <StatusSelect
                        value={
                          bulkWhatsappFilters.status === "all"
                            ? ""
                            : bulkWhatsappFilters.status
                        }
                        onValueChange={(value) =>
                          dispatch(setBulkWhatsappStatusFilter(value || "all"))
                        }
                        statuses={statusesData?.statuses || []}
                        disabled={statusesLoading}
                        isLoading={statusesLoading}
                        className="w-full"
                        showLabel={true}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => dispatch(clearBulkWhatsappFilters())}
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
                        onClick={() => dispatch(clearBulkWhatsappSelection())}
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
                            <TableHead>Phone</TableHead>
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
                                  checked={selectedLeadsForBulk.includes(
                                    lead.id
                                  )}
                                  onCheckedChange={() =>
                                    dispatch(toggleLeadForBulkWhatsapp(lead.id))
                                  }
                                />
                              </TableCell>
                              <TableCell className="font-medium">
                                {lead.name}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4" />
                                  {lead.phoneNumber || "No phone"}
                                </div>
                              </TableCell>
                              <TableCell>{getStageBadge(lead.stage)}</TableCell>
                              <TableCell>
                                {getStatusBadge(lead.status)}
                              </TableCell>
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

            {/* Message Configuration */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Compose Bulk WhatsApp
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {bulkError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <div className="flex items-center gap-2 text-red-700">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">{bulkError}</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="jobName">Job Name *</Label>
                    <Input
                      id="jobName"
                      placeholder="e.g., Weekly Follow-up Campaign"
                      value={bulkJobName}
                      onChange={(e) => dispatch(setBulkJobName(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="messageType">Message Type</Label>
                    <Select
                      value={bulkMessageType}
                      onValueChange={(value: "template" | "text") =>
                        dispatch(setBulkMessageType(value))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="template">
                          WhatsApp Template
                        </SelectItem>
                        <SelectItem value="text">
                          Custom Text Message
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {bulkMessageType === "template" ? (
                    <div className="space-y-2">
                      <Label htmlFor="template">WhatsApp Template *</Label>
                      <Select
                        value={bulkSelectedTemplate || ""}
                        onValueChange={(value) =>
                          dispatch(setBulkSelectedTemplate(value))
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
                            templates?.map((template, index) => (
                              <SelectItem
                                key={index}
                                value={
                                  template.template_name || template.name || ""
                                }
                              >
                                {template.display_name ||
                                  template.name ||
                                  "Unnamed Template"}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="messageContent">Message Content *</Label>
                      <Textarea
                        id="messageContent"
                        placeholder="Enter your custom message here. You can use {lead_name} for personalization."
                        value={bulkMessageContent}
                        onChange={(e) =>
                          dispatch(setBulkMessageContent(e.target.value))
                        }
                        rows={4}
                      />
                      <p className="text-sm text-muted-foreground">
                        Use {"{lead_name}"} to personalize messages
                      </p>
                    </div>
                  )}

                  <Separator />

                  {/* Batch Settings */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Batch Size: {bulkBatchSize}</Label>
                      <Slider
                        value={[bulkBatchSize]}
                        onValueChange={(value) =>
                          dispatch(setBulkBatchSize(value[0]))
                        }
                        max={50}
                        min={1}
                        step={1}
                      />
                      <p className="text-sm text-muted-foreground">
                        Number of messages to send simultaneously
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Delay Between Messages: {bulkDelayBetweenMessages}s
                      </Label>
                      <Slider
                        value={[bulkDelayBetweenMessages]}
                        onValueChange={(value) =>
                          dispatch(setBulkDelayBetweenMessages(value[0]))
                        }
                        max={10}
                        min={1}
                        step={1}
                      />
                      <p className="text-sm text-muted-foreground">
                        Delay in seconds between each message
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Scheduling */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="schedule"
                        checked={bulkIsScheduled}
                        onCheckedChange={(checked) =>
                          dispatch(setBulkIsScheduled(checked as boolean))
                        }
                      />
                      <Label
                        htmlFor="schedule"
                        className="flex items-center gap-2"
                      >
                        <CalendarIcon className="h-4 w-4" />
                        Schedule for later
                      </Label>
                    </div>

                    {bulkIsScheduled && (
                      <div className="space-y-4 p-4 bg-gray-50 rounded-md border">
                        {/* Date Picker with Calendar */}
                        <div className="space-y-2">
                          <Label>Select Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !selectedDate && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {selectedDate ? (
                                  format(selectedDate, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        {/* Time Picker */}
                        <div className="space-y-2">
                          <Label htmlFor="time">Select Time</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {/* Hour Selector */}
                            <Select
                              value={customScheduleTime.split(":")[0] || ""}
                              onValueChange={(hour) => {
                                const minute =
                                  customScheduleTime.split(":")[1] || "00";
                                setCustomScheduleTime(`${hour}:${minute}`);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Hour" />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 24 }, (_, i) => (
                                  <SelectItem
                                    key={i}
                                    value={i.toString().padStart(2, "0")}
                                  >
                                    {i.toString().padStart(2, "0")}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            {/* Minute Selector */}
                            <Select
                              value={customScheduleTime.split(":")[1] || ""}
                              onValueChange={(minute) => {
                                const hour =
                                  customScheduleTime.split(":")[0] || "00";
                                setCustomScheduleTime(`${hour}:${minute}`);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Minute" />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 60 }, (_, i) => (
                                  <SelectItem
                                    key={i}
                                    value={i.toString().padStart(2, "0")}
                                  >
                                    {i.toString().padStart(2, "0")}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Display Selected Date/Time */}
                        {selectedDate && customScheduleTime && (
                          <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                            <div className="flex items-center gap-2 text-blue-700">
                              <Clock className="h-4 w-4" />
                              <span className="text-sm font-medium">
                                Scheduled for:{" "}
                                {format(selectedDate, "EEEE, MMMM do, yyyy")} at{" "}
                                {customScheduleTime}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Helper Text */}
                        <div className="text-xs text-gray-500">
                          Backend automatically handles timezone conversion to
                          UTC
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t">
                    <div className="text-sm text-gray-600 mb-4">
                      Ready to message{" "}
                      <strong>{selectedLeadsForBulk.length}</strong> lead
                      {selectedLeadsForBulk.length !== 1 ? "s" : ""}
                    </div>

                    <Button
                      onClick={handleSendBulkWhatsApp}
                      disabled={
                        isCreatingJob ||
                        selectedLeadsForBulk.length === 0 ||
                        !bulkJobName.trim() ||
                        (bulkMessageType === "template" &&
                          !bulkSelectedTemplate) ||
                        (bulkMessageType === "text" &&
                          !bulkMessageContent.trim())
                      }
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {isCreatingJob ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <MessageSquare className="mr-2 h-4 w-4" />
                      )}
                      {bulkIsScheduled
                        ? "Schedule WhatsApp Job"
                        : "Create WhatsApp Job"}
                    </Button>
                  </div>

                  <div className="pt-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        dispatch(resetBulkWhatsappForm());
                        setCustomScheduleTime("");
                        setSelectedDate(undefined);
                      }}
                      className="w-full"
                    >
                      Reset Form
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* History & Stats Tab */}
        <TabsContent value="history" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Statistics Cards */}
            <div className="lg:col-span-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Total Jobs
                        </p>
                        <p className="text-2xl font-bold">
                          {statsData?.stats?.total_jobs || 0}
                        </p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Messages Sent
                        </p>
                        <p className="text-2xl font-bold">
                          {statsData?.stats?.total_messages_sent || 0}
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Success Rate
                        </p>
                        <p className="text-2xl font-bold">
                          {statsData?.stats?.success_rate || 0}%
                        </p>
                      </div>
                      <Activity className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Active Jobs
                        </p>
                        <p className="text-2xl font-bold">
                          {statsData?.stats?.active_jobs || 0}
                        </p>
                      </div>
                      <PlayCircle className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Job History */}
            <div className="lg:col-span-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Job History
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Select value={jobsFilter} onValueChange={setJobsFilter}>
                        <SelectTrigger className="w-[150px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Jobs</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetchJobs()}
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
                    {jobsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : jobsData?.jobs && jobsData.jobs.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Job Name</TableHead>
                            <TableHead>Created By</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Template Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Recipients</TableHead>
                            <TableHead>Progress</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {jobsData?.jobs?.map((job) => (
                            <TableRow key={job.job_id}>
                              <TableCell className="font-medium">
                                {job.job_name}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {job.created_by_name}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {job.message_type === "template"
                                    ? "Template"
                                    : "Text"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {job.template_name}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {getJobStatusBadge(job.status)}
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div>
                                    {job.success_count || 0} /{" "}
                                    {job.total_recipients || 0} sent
                                  </div>
                                  {(job.failed_count || 0) > 0 && (
                                    <div className="text-red-600">
                                      {job.failed_count} failed
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="text-sm">
                                    {job.progress_percentage || 0}%
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-blue-600 h-2 rounded-full"
                                      style={{
                                        width: `${
                                          job.progress_percentage || 0
                                        }%`,
                                      }}
                                    ></div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div>
                                    {format(
                                      parseISO(job.created_at),
                                      "MMM dd, yyyy"
                                    )}
                                  </div>
                                  <div className="text-gray-500">
                                    {format(parseISO(job.created_at), "HH:mm")}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {job.status === "pending" ||
                                job.status === "processing" ||
                                job.status === "scheduled" ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleCancelJob(job.job_id, job.job_name)
                                    }
                                    disabled={isCancelling}
                                    className="flex items-center gap-1"
                                  >
                                    <StopCircle className="h-3 w-3" />
                                    Cancel
                                  </Button>
                                ) : (
                                  <p>
                                    Job is not pending / processing / scheduled
                                  </p>
                                )}
                              </TableCell>
                            </TableRow>
                          )) || []}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No jobs found. Create your first WhatsApp job in the
                        Send Message tab.
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BulkWhatsAppPage;
