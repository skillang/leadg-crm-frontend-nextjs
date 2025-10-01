// src/app/campaigns/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useGetCampaignsQuery,
  useDeleteCampaignMutation,
  usePauseCampaignMutation,
  useResumeCampaignMutation,
  Campaign,
} from "@/redux/slices/campaignsApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Search,
  Mail,
  MessageSquare,
  Loader2,
  Eye,
  Trash2,
  Play,
  Pause,
} from "lucide-react";
import CreateCampaignModal from "@/components/admin/CreateCampaignModal";
import { useNotifications } from "@/components/common/NotificationSystem";

const AutomationCampaignPage = () => {
  const router = useRouter();

  const { showSuccess, showError, showConfirm } = useNotifications();

  // State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // API queries
  const {
    data: campaignsData,
    isLoading,
    refetch,
  } = useGetCampaignsQuery({
    campaign_type:
      typeFilter !== "all" ? (typeFilter as "whatsapp" | "email") : undefined,
    status:
      statusFilter !== "all"
        ? (statusFilter as "active" | "paused")
        : undefined,
    page: currentPage,
    limit: 20,
  });

  // Mutations
  const [deleteCampaign, { isLoading: isDeleting }] =
    useDeleteCampaignMutation();
  const [pauseCampaign, { isLoading: isPausing }] = usePauseCampaignMutation();
  const [resumeCampaign, { isLoading: isResuming }] =
    useResumeCampaignMutation();

  // Handlers
  const handleViewDetails = (campaignId: string) => {
    router.push(`/admin/automation-campaigns/${campaignId}`);
  };

  const handlePauseCampaign = async (campaign: Campaign) => {
    showConfirm({
      title: "Pause Campaign?",
      description: `Are you sure you want to pause "${campaign.campaign_name}"? This will stop new enrollments.`,
      confirmText: "Pause",
      cancelText: "Cancel",
      variant: "destructive",
      onConfirm: async () => {
        try {
          await pauseCampaign(campaign.campaign_id).unwrap();
          showSuccess("Campaign paused successfully");
          refetch();
        } catch (error) {
          showError("Failed to pause campaign");
          console.error(error);
        }
      },
    });
  };

  const handleResumeCampaign = async (campaign: Campaign) => {
    await showConfirm({
      title: "Resume Campaign?",
      description: `Are you sure you want to resume "${campaign.campaign_name}"? This will restart enrollments.`,
      confirmText: "Resume",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          await resumeCampaign(campaign.campaign_id).unwrap();
          showSuccess("Campaign resumed successfully");
          refetch();
        } catch (error) {
          showError("Failed to resume campaign");
          console.error(error);
        }
      },
    });
  };

  const handleDeleteCampaign = async (campaign: Campaign) => {
    showConfirm({
      title: "Delete Campaign?",
      description: `Are you sure you want to delete "${campaign?.campaign_name}"? This will cancel all pending jobs and cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
      onConfirm: async () => {
        try {
          await deleteCampaign(campaign.campaign_id).unwrap();
          showSuccess("Campaign deleted successfully");
          refetch();
        } catch (error) {
          showError("Failed to delete campaign");
          console.error(error);
        }
      },
    });
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    refetch();
  };

  // Filter campaigns by search query
  const filteredCampaigns =
    campaignsData?.campaigns.filter((campaign) =>
      campaign.campaign_name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get status badge
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

  // Get type icon
  const getTypeIcon = (type: string) => {
    return type === "whatsapp" ? (
      <MessageSquare className="h-4 w-4 inline mr-1" />
    ) : (
      <Mail className="h-4 w-4 inline mr-1" />
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-row justify-between items-center">
        <h1 className="text-3xl font-bold mb-2">
          Automation Campaign Dashboard
        </h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Campaign
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Type:</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Status:</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Search:</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Button onClick={handleApplyFilters} className="mb-0">
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Enrolled Leads</TableHead>
                    <TableHead>Messages Sent</TableHead>
                    <TableHead>Messages Pending</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCampaigns.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-8 text-gray-500"
                      >
                        No campaigns found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCampaigns.map((campaign) => (
                      <TableRow key={campaign.campaign_id}>
                        <TableCell className="font-medium">
                          {campaign.campaign_name}
                        </TableCell>
                        <TableCell>
                          {getTypeIcon(campaign.campaign_type)}
                          {campaign.campaign_type}
                        </TableCell>
                        <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                        <TableCell className="text-center">
                          {campaign.enrolled_leads || 0}
                        </TableCell>
                        <TableCell className="text-center">
                          {campaign.messages_sent || 0}
                        </TableCell>
                        <TableCell className="text-center">
                          {campaign.messages_pending || 0}
                        </TableCell>
                        <TableCell>{formatDate(campaign.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleViewDetails(campaign.campaign_id)
                              }
                            >
                              <Eye />
                              View
                            </Button>

                            {campaign.status === "active" ? (
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => handlePauseCampaign(campaign)}
                                disabled={isPausing}
                              >
                                {isPausing ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Pause className="h-4 w-4" />
                                )}
                              </Button>
                            ) : campaign.status === "paused" ? (
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => handleResumeCampaign(campaign)}
                                disabled={isResuming}
                              >
                                {isResuming ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Play />
                                )}
                              </Button>
                            ) : null}

                            <Button
                              size="icon"
                              variant="destructive"
                              onClick={() => handleDeleteCampaign(campaign)}
                            >
                              <Trash2 />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {campaignsData && campaignsData.pagination.pages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <p className="text-sm text-gray-600">
                Showing page {campaignsData.pagination.page} of{" "}
                {campaignsData.pagination.pages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === campaignsData.pagination.pages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Campaign Modal */}
      <CreateCampaignModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          refetch();
        }}
      />
    </div>
  );
};

export default AutomationCampaignPage;
