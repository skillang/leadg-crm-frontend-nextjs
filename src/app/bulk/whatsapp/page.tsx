// src/app/bulk/whatsapp/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import {
  setBulkWhatsappStageFilter,
  setBulkWhatsappStatusFilter,
} from "@/redux/slices/whatsappSlice";
import { useGetLeadsQuery, useGetMyLeadsQuery } from "@/redux/slices/leadsApi";
import {
  useGetBulkWhatsAppJobsQuery,
  useGetBulkWhatsAppStatsQuery,
  useCancelBulkWhatsAppJobMutation,
  // useGetActiveWhatsAppJobsQuery,
} from "@/redux/slices/whatsappApi";
import { useNotifications } from "@/components/common/NotificationSystem";
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
  Users,
  Loader2,
  History,
  BarChart3,
  PlayCircle,
  StopCircle,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import StatsCard from "@/components/custom/cards/StatsCard";

const BulkWhatsAppPage: React.FC = () => {
  const dispatch = useDispatch();
  const { bulkWhatsappFilters, selectedLeadsForBulk } = useSelector(
    (state: RootState) => state.whatsapp
  );

  const [currentPage] = useState(1);
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
  const { data: leadsData } = isAdmin ? adminLeadsQuery : userLeadsQuery;

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

  const totalLeads = Array.isArray(leadsData)
    ? leadsData.length
    : leadsData?.total || 0;

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

  const getJobStatusBadge = (status: string) => {
    const variants = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      cancelled: "success-light",
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
    <div className="space-y-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-4">
        {/* Statistics Cards */}
        <div className="lg:col-span-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <StatsCard
              title="Total Jobs"
              value={statsData?.stats?.total_jobs || 0}
              icon={<BarChart3 className="h-8 w-8 text-blue-600" />}
              // isLoading={isloading}
            />

            <StatsCard
              title="Messages Sent"
              value={statsData?.stats?.total_messages_sent || 0}
              icon={<TrendingUp className="h-8 w-8 text-green-500" />}
              // isLoading={isloading}
            />

            <StatsCard
              title="Success Rate"
              value={statsData?.stats?.success_rate || 0}
              icon={<TrendingUp className="h-8 w-8 text-purple-500" />}
              // isLoading={isloading}
            />

            <StatsCard
              title="Active Jobs"
              value={statsData?.stats?.active_jobs || 0}
              icon={<PlayCircle className="h-8 w-8 text-orange-500" />}
              // isLoading={isloading}
            />
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
                            <Badge variant="outline">{job.template_name}</Badge>
                          </TableCell>
                          <TableCell>{getJobStatusBadge(job.status)}</TableCell>
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
                                    width: `${job.progress_percentage || 0}%`,
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
                              <p>Job is not pending / processing / scheduled</p>
                            )}
                          </TableCell>
                        </TableRow>
                      )) || []}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No jobs found. Create your first WhatsApp job in the Send
                    Message tab.
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

export default BulkWhatsAppPage;
