// src/app/admin/automation-campaigns/[campaignId]/page.tsx
"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useGetCampaignByIdQuery,
  useGetCampaignStatsQuery,
  useGetEnrolledLeadsQuery,
  usePauseCampaignMutation,
  useResumeCampaignMutation,
  useDeleteCampaignMutation,
} from "@/redux/slices/campaignsApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Pause,
  Play,
  Trash2,
  Loader2,
  Users,
  Send,
  AlertCircle,
} from "lucide-react";
import { useNotifications } from "@/components/common/NotificationSystem";

const CampaignDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.campaignId as string;

  const { showSuccess, showError, showConfirm } = useNotifications();

  // State
  const [currentPage, setCurrentPage] = useState(1);

  // API Queries
  const {
    data: campaignData,
    isLoading: isCampaignLoading,
    refetch: refetchCampaign,
  } = useGetCampaignByIdQuery(campaignId);

  const { data: statsData, isLoading: isStatsLoading } =
    useGetCampaignStatsQuery(campaignId);

  const { data: leadsData, isLoading: isLeadsLoading } =
    useGetEnrolledLeadsQuery({
      campaignId,
      page: currentPage,
      limit: 20,
    });

  // Mutations
  const [pauseCampaign, { isLoading: isPausing }] = usePauseCampaignMutation();
  const [resumeCampaign, { isLoading: isResuming }] =
    useResumeCampaignMutation();
  const [deleteCampaign, { isLoading: isDeleting }] =
    useDeleteCampaignMutation();

  const campaign = campaignData?.campaign;

  // Handlers
  const handlePause = async () => {
    showConfirm({
      title: "Pause Campaign?",
      description:
        "This will stop new enrollments. Pending messages will remain but won't execute.",
      confirmText: "Pause",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          await pauseCampaign(campaignId).unwrap();
          showSuccess("Campaign paused successfully");
          refetchCampaign();
        } catch (error) {
          showError("Failed to pause campaign");
          console.error(error);
        }
      },
    });
  };

  const handleResume = async () => {
    showConfirm({
      title: "Resume Campaign?",
      description:
        "This will restart enrollments and pending jobs will execute.",
      confirmText: "Resume",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          await resumeCampaign(campaignId).unwrap();
          showSuccess("Campaign resumed successfully");
          refetchCampaign();
        } catch (error) {
          showError("Failed to resume campaign");
          console.error(error);
        }
      },
    });
  };

  const handleDelete = async () => {
    showConfirm({
      title: "Delete Campaign?",
      description: `Are you sure you want to delete "${campaign?.campaign_name}"? This will cancel all pending jobs and cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive", // if your showConfirm supports variant
      onConfirm: async () => {
        try {
          await deleteCampaign(campaignId).unwrap();
          showSuccess("Campaign deleted successfully");
          router.push("/admin/automation-campaigns");
        } catch (error) {
          showError("Failed to delete campaign");
          console.error(error);
        }
      },
    });
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Status badge
  const getStatusBadge = (status: string) => {
    const styles = {
      active: "bg-green-100 text-green-800",
      paused: "bg-yellow-100 text-yellow-800",
      deleted: "bg-red-100 text-red-800",
    };

    return (
      <Badge className={styles[status as keyof typeof styles] || ""}>
        {status}
      </Badge>
    );
  };

  // Enrollment status badge
  const getEnrollmentStatusBadge = (status: string) => {
    const styles = {
      active: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      opted_out: "bg-gray-100 text-gray-800",
    };

    return (
      <Badge className={styles[status as keyof typeof styles] || ""}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  // Loading State
  if (isCampaignLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Campaign not found</p>
            <Button
              onClick={() => router.push("/admin/automation-campaigns")}
              className="mt-4"
            >
              Back to Campaigns
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.push("/admin/automation-campaigns")}
            className="mb-2 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Campaign Details</h1>
        </div>
        <div className="flex gap-2">
          {campaign.status === "active" ? (
            <Button
              variant="outline"
              onClick={handlePause}
              disabled={isPausing}
            >
              {isPausing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Pause className="h-4 w-4 mr-2" />
              )}
              Pause
            </Button>
          ) : campaign.status === "paused" ? (
            <Button
              variant="outline"
              onClick={handleResume}
              disabled={isResuming}
            >
              {isResuming ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Resume
            </Button>
          ) : null}
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Campaign Info Card */}
      <Card>
        <CardContent className="">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6">
            {/* Campaign Name */}
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Campaign Name
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {campaign.campaign_name || "N/A"}
              </div>
            </div>

            {/* Campaign Type */}
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Campaign Type
              </div>
              <div className="text-lg font-semibold text-gray-900 capitalize">
                {campaign.campaign_type || "N/A"}
              </div>
            </div>

            {/* Status */}
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Status
              </div>
              <div>{getStatusBadge(campaign.status || "unknown")}</div>
            </div>

            {/* Created Date */}
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Created Date
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {campaign.created_at ? formatDate(campaign.created_at) : "N/A"}
              </div>
            </div>

            {/* Created By */}
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Created By
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {campaign.created_by || "N/A"}
              </div>
            </div>

            {/* Campaign ID */}
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Campaign ID
              </div>
              <div className="text-sm font-mono text-gray-900">
                {campaign.campaign_id || "N/A"}
              </div>
            </div>

            {/* Send Time */}
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Send Time
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {campaign.send_time || "N/A"}
              </div>
            </div>

            {/* Message Limit */}
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Message Limit
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {campaign.message_limit
                  ? `${campaign.message_limit} per lead`
                  : "N/A"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Total Enrollments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
              <Skeleton className="h-20" />
            ) : (
              <>
                <div className="text-4xl font-bold mb-4">
                  {statsData?.enrollments?.total ||
                    campaign.enrolled_leads ||
                    0}
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Active</div>
                    <div className="text-xl font-semibold text-blue-600">
                      {statsData?.enrollments?.active || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Completed</div>
                    <div className="text-xl font-semibold text-green-600">
                      {statsData?.enrollments?.completed || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Criteria Not Matched</div>
                    <div className="text-xl font-semibold text-gray-600">
                      {statsData?.enrollments?.criteria_not_matched || 0}
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Send className="h-5 w-5 mr-2" />
              Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
              <Skeleton className="h-20" />
            ) : (
              <>
                <div className="text-4xl font-bold mb-4">
                  {(statsData?.messages?.sent || 0) +
                    (statsData?.messages?.pending || 0)}
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Sent</div>
                    <div className="text-xl font-semibold text-green-600">
                      {statsData?.messages?.sent || campaign.messages_sent || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Pending</div>
                    <div className="text-xl font-semibold text-yellow-600">
                      {statsData?.messages?.pending ||
                        campaign.messages_pending ||
                        0}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Failed</div>
                    <div className="text-xl font-semibold text-red-600">
                      {statsData?.messages?.failed || 0}
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Campaign Schedule Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Schedule Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="">
            {campaign.templates && campaign.templates.length > 0 ? (
              campaign.templates.map((template, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <div className="w-4 h-4 rounded-full bg-indigo-600" />
                    </div>
                    {index < campaign.templates.length - 1 && (
                      <div className="w-0.5 h-5 bg-gray-300 ml-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-md">
                          {template.template_name || "Unnamed Template"}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Sequence: {template.sequence_order || index + 1}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {template.custom_date ||
                            `Day ${template.scheduled_day || index + 1}`}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center">
                No templates configured
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Enrolled Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Enrolled Leads</CardTitle>
        </CardHeader>
        <CardContent>
          {isLeadsLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead ID</TableHead>
                    <TableHead>Lead Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Messages Sent</TableHead>
                    <TableHead>Current Sequence</TableHead>
                    <TableHead>Enrolled At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!leadsData?.enrollments ||
                  leadsData.enrollments.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-8 text-gray-500"
                      >
                        No enrolled leads found
                      </TableCell>
                    </TableRow>
                  ) : (
                    leadsData.enrollments.map((lead) => (
                      <TableRow key={lead.lead_id}>
                        <TableCell className="font-mono text-sm">
                          {lead.lead_id || "N/A"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {lead.lead_name || "N/A"}
                        </TableCell>
                        <TableCell>{lead.email || "N/A"}</TableCell>
                        <TableCell>
                          {getEnrollmentStatusBadge(
                            lead.enrollment_status || "unknown"
                          )}
                        </TableCell>
                        <TableCell>{lead.messages_sent || 0}</TableCell>
                        <TableCell>{lead.current_sequence || 0}</TableCell>
                        <TableCell>
                          {lead.enrolled_at
                            ? formatDateTime(lead.enrolled_at)
                            : "N/A"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {leadsData &&
                leadsData.pagination &&
                leadsData.pagination.pages > 1 && (
                  <div className="flex justify-between items-center mt-4">
                    <p className="text-sm text-gray-600">
                      Showing 1 to{" "}
                      {Math.min(
                        leadsData.pagination.limit,
                        leadsData.pagination.total
                      )}{" "}
                      of {leadsData.pagination.total} entries
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                      >
                        Previous
                      </Button>
                      <span className="px-4 py-2 text-sm">{currentPage}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === leadsData.pagination.pages}
                        onClick={() => setCurrentPage((p) => p + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CampaignDetailsPage;
