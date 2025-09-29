"use client";

import React, { useState } from "react";
import {
  useGetBulkUnreadStatusQuery,
  useGetAdminNotificationOverviewQuery,
} from "@/redux/slices/whatsappApi";
import type {
  NotificationHistoryItem,
  UnreadLead,
} from "@/models/types/whatsapp";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Bell,
  MessageCircle,
  Clock,
  User,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Archive,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { UserActivity } from "@/models/types/notification";
import { useRouter } from "next/navigation";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import StatsCard from "@/components/custom/cards/StatsCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Filter,
  Search,
  MessageSquare,
  ArrowUp,
  ArrowDown,
  ExternalLink,
} from "lucide-react";
import { DateRangePicker, DateRange } from "@/components/ui/date-range-picker";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useGetNotificationHistoryQuery } from "@/redux/slices/whatsappApi";
import { useDispatch, useSelector } from "react-redux";
import {
  setNotificationHistoryDateFrom,
  setNotificationHistoryDateTo,
  setNotificationHistoryType,
  setNotificationHistorySearch,
  clearNotificationHistoryFilters,
} from "@/redux/slices/whatsappSlice";
import type { RootState } from "@/redux/store";
import ServerPagination from "@/components/common/ServerPagination";
import type { PaginationMeta } from "@/models/types/pagination";

interface NotificationTableRowProps {
  notification: NotificationHistoryItem;
}

const NotificationTableRow: React.FC<NotificationTableRowProps> = ({
  notification,
}) => {
  const router = useRouter();
  const getDirectionIcon = (direction?: string) => {
    if (!direction) return null;

    return direction === "incoming" ? (
      <div className="flex items-center justify-center">
        <ArrowDown className="h-4 w-4 text-green-600" />
      </div>
    ) : (
      <div className="flex items-center justify-center">
        <ArrowUp className="h-4 w-4 text-blue-600" />
      </div>
    );
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      time: date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  // const formatReadAt = (readAt: string | null) => {
  //   if (!readAt) return "-";

  //   const date = new Date(readAt);
  //   return (
  //     <div className="text-xs text-gray-600">
  //       <div>
  //         {date.toLocaleDateString([], { month: "short", day: "numeric" })}
  //       </div>
  //       <div>
  //         {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
  //       </div>
  //     </div>
  //   );
  // };

  const handleViewLead = () => {
    if (notification.lead_id) {
      router.push(`/my-leads/${notification.lead_id}`);
    }
  };

  const timestamp = formatTimestamp(notification.timestamp);

  return (
    <TableRow className={`hover:bg-gray-100 `}>
      {/* Lead Name */}
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          <span>{notification.lead_name}</span>
        </div>
      </TableCell>

      {/* Lead ID */}
      <TableCell>
        <code className="text-xs bg-gray-100  rounded">
          {notification.lead_id || "-"}
        </code>
      </TableCell>

      {/* Message */}
      <TableCell className="max-w-xs">
        <div
          className="truncate text-sm text-gray-700"
          title={notification.message}
        >
          {notification.message}
        </div>
      </TableCell>

      {/* Direction */}
      <TableCell className="text-center">
        {getDirectionIcon(notification.direction)}
      </TableCell>

      {/* Timestamp */}
      <TableCell>
        <div className="text-sm">
          <div className="font-medium text-gray-900">{timestamp.date}</div>
          <div className="text-gray-500">{timestamp.time}</div>
        </div>
      </TableCell>

      {/* Actions */}
      <TableCell>
        <div className="flex items-center justify-center">
          {notification.lead_id ? (
            <Button
              size="sm"
              variant="outline"
              onClick={handleViewLead}
              className="text-xs"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View Lead
            </Button>
          ) : (
            <span className="text-gray-400 text-xs">No Lead ID</span>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};

export default function NotificationsPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("current");
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLimit, setHistoryLimit] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [tempFilters, setTempFilters] = useState({
    search: "",
    notification_type: "",
    date_range: undefined as DateRange | undefined,
  });
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Admin access control
  const { hasAccess: isAdmin } = useAdminAccess({
    title: "Admin Access",
    description: "Admin privileges required for full dashboard.",
  });

  const {
    data: unreadStatus,
    error: unreadError,
    isLoading: isLoadingUnread,
    refetch: refetchUnread,
  } = useGetBulkUnreadStatusQuery(undefined, {
    pollingInterval: autoRefresh ? 30000 : 0,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  // Only fetch admin data if user is admin
  const {
    data: adminOverview,
    error: adminError,
    isLoading: isLoadingAdmin,
    refetch: refetchAdmin,
  } = useGetAdminNotificationOverviewQuery(undefined, {
    skip: !isAdmin, // Skip this query if not admin
    pollingInterval: autoRefresh && isAdmin ? 30000 : 0,
    refetchOnFocus: isAdmin,
    refetchOnReconnect: isAdmin,
  });

  const historyFilters = useSelector(
    (state: RootState) => state.whatsapp.notificationHistoryFilters
  );

  // API queries
  const {
    data: historyData,
    isLoading: historyLoading,
    error: historyError,
  } = useGetNotificationHistoryQuery({
    ...historyFilters,
    page: historyPage,
    limit: historyLimit,
  });

  // Auto-refresh toggle
  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  // Manual refresh
  const handleManualRefresh = () => {
    refetchUnread();
    if (isAdmin) {
      refetchAdmin();
    }
  };

  // Format timestamp
  const formatLastActivity = (timestamp: string) => {
    try {
      return formatDistanceToNow(parseISO(timestamp), { addSuffix: true });
    } catch {
      return "Unknown time";
    }
  };

  // Handle lead click
  const handleLeadClick = (leadId: string) => {
    router.push(`/my-leads/${leadId}`);
  };

  const handleApplyFilters = () => {
    // Apply all temp filters to Redux state
    if (tempFilters.search) {
      dispatch(setNotificationHistorySearch(tempFilters.search));
    } else {
      dispatch(setNotificationHistorySearch(undefined));
    }

    if (
      tempFilters.notification_type &&
      tempFilters.notification_type !== "all"
    ) {
      dispatch(setNotificationHistoryType(tempFilters.notification_type));
    } else {
      dispatch(setNotificationHistoryType(undefined));
    }

    if (tempFilters.date_range?.from) {
      dispatch(
        setNotificationHistoryDateFrom(
          tempFilters.date_range.from.toISOString().split("T")[0]
        )
      );
    } else {
      dispatch(setNotificationHistoryDateFrom(undefined));
    }

    if (tempFilters.date_range?.to) {
      dispatch(
        setNotificationHistoryDateTo(
          tempFilters.date_range.to.toISOString().split("T")[0]
        )
      );
    } else {
      dispatch(setNotificationHistoryDateTo(undefined));
    }

    setHistoryPage(1);
    setShowFilters(false);
  };

  const handleClearHistoryFilters = () => {
    dispatch(clearNotificationHistoryFilters());
    setTempFilters({
      search: "",
      notification_type: "",
      date_range: undefined,
    });
    setHistoryPage(1);
    setShowFilters(false);
  };

  const handleTempFilterChange = (
    key: string,
    value: string | DateRange | undefined
  ) => {
    setTempFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleHistoryPageChange = (page: number) => {
    setHistoryPage(page);
  };

  const handleHistoryPageSizeChange = (size: number) => {
    setHistoryLimit(size);
    setHistoryPage(1);
  };

  // Initialize temp filters from Redux state
  React.useEffect(() => {
    setTempFilters({
      search: historyFilters.search || "",
      notification_type: historyFilters.notification_type || "",
      date_range:
        historyFilters.date_from && historyFilters.date_to
          ? {
              from: new Date(historyFilters.date_from),
              to: new Date(historyFilters.date_to),
            }
          : undefined,
    });
  }, [historyFilters]);

  // Get health status icon and color
  //   const getHealthIcon = (isHealthy: boolean) => {
  //     return isHealthy ? (
  //       <CheckCircle className="h-4 w-4 text-green-500" />
  //     ) : (
  //       <XCircle className="h-4 w-4 text-red-500" />
  //     );
  //   };

  // Get system health color
  //   const getSystemHealthColor = (health: string) => {
  //     switch (health) {
  //       case "healthy":
  //         return "text-green-600";
  //       case "warning":
  //         return "text-yellow-600";
  //       case "critical":
  //         return "text-red-600";
  //       default:
  //         return "text-gray-600";
  //     }
  //   };

  if (isLoadingUnread || (isAdmin && isLoadingAdmin)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading notifications...</span>
        </div>
      </div>
    );
  }

  if (unreadError || (isAdmin && adminError)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center text-red-500">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Failed to load notifications</p>
              <p className="text-sm text-gray-500 mt-2">
                Please try refreshing the page
              </p>
              <Button
                onClick={handleManualRefresh}
                variant="outline"
                className="mt-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasUnreadMessages =
    (unreadStatus ? unreadStatus?.unread_details?.length : 0) > 0;
  const hasUserActivity =
    (adminOverview ? adminOverview?.overview?.user_activity?.length : 0) > 0;

  return (
    <div className="container mx-auto ">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Bell className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600">
              {isAdmin
                ? "Admin dashboard for WhatsApp notifications"
                : "Your WhatsApp notifications and messages"}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            onClick={toggleAutoRefresh}
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? "" : ""}`} />
            Auto Refresh {autoRefresh ? "On" : "Off"}
          </Button>
          <Button onClick={handleManualRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="current" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Current Status
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Notification History
          </TabsTrigger>
        </TabsList>
        <TabsContent value="current">
          {/* Admin-only System Health Overview */}
          {/* {isAdmin && adminOverview && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>System Health</span>
              <Badge
                variant={
                  adminOverview.overview.system_health === "healthy"
                    ? "default"
                    : "destructive"
                }
                className={getSystemHealthColor(
                  adminOverview.overview.system_health
                )}
              >
                {adminOverview.overview.system_health.toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                {getHealthIcon(
                  adminOverview.overview.health_indicators
                    .realtime_connections_healthy
                )}
                <span className="text-sm">Realtime Connections</span>
              </div>
              <div className="flex items-center space-x-2">
                {getHealthIcon(
                  adminOverview.overview.health_indicators.database_responsive
                )}
                <span className="text-sm">Database</span>
              </div>
              <div className="flex items-center space-x-2">
                {getHealthIcon(
                  adminOverview.overview.health_indicators
                    .notification_backlog_normal
                )}
                <span className="text-sm">Notification Backlog</span>
              </div>
              <div className="flex items-center space-x-2">
                {getHealthIcon(
                  adminOverview.overview.health_indicators
                    .recent_activity_normal
                )}
                <span className="text-sm">Recent Activity</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )} */}

          {/* Statistics Overview - Different for Admin vs User */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {isAdmin && adminOverview ? (
              // Admin Stats
              <>
                <StatsCard
                  title="Total Unread"
                  value={
                    adminOverview.overview.notification_stats
                      .total_unread_messages
                  }
                  icon={<MessageCircle className="h-8 w-8 text-blue-600" />}
                  isLoading={isLoadingAdmin}
                />

                <StatsCard
                  title="Leads with Unread"
                  value={
                    adminOverview.overview.notification_stats.leads_with_unread
                  }
                  icon={<User className="h-8 w-8 text-green-600" />}
                  isLoading={isLoadingAdmin}
                />

                <StatsCard
                  title="Messages (24h)"
                  value={
                    adminOverview.overview.notification_stats
                      .recent_messages_24h
                  }
                  icon={<Clock className="h-8 w-8 text-purple-600" />}
                  isLoading={isLoadingAdmin}
                />
              </>
            ) : (
              // User Stats - based on their own unread status
              <>
                <StatsCard
                  title="Your Unread Leads"
                  value={unreadStatus?.total_unread_leads || 0}
                  icon={<MessageCircle className="h-8 w-8 text-blue-600" />}
                  isLoading={isLoadingUnread}
                />

                <StatsCard
                  title="Total Unread Messages"
                  value={
                    unreadStatus?.unread_details?.reduce(
                      (total, lead) => total + lead.unread_count,
                      0
                    ) || 0
                  }
                  icon={<Bell className="h-8 w-8 text-green-600" />}
                  isLoading={isLoadingUnread}
                />

                <StatsCard
                  title="Active Conversations"
                  value={unreadStatus?.unread_details?.length || 0}
                  icon={<User className="h-8 w-8 text-purple-600" />}
                  isLoading={isLoadingUnread}
                />
              </>
            )}
          </div>

          {/* Admin-only User Activity Table */}
          {isAdmin && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>User Activity</span>
                  {hasUserActivity && (
                    <Badge variant="secondary">
                      {adminOverview!.overview.user_activity.length} users
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!hasUserActivity ? (
                  <div className="text-center py-8">
                    <Archive className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium">
                      No unread WhatsApp messages by users
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User Email</TableHead>
                          <TableHead className="text-right">
                            Unread Leads
                          </TableHead>
                          <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {adminOverview!.overview.user_activity.map(
                          (user: UserActivity) => (
                            <TableRow
                              key={user._id}
                              className="hover:bg-gray-50"
                            >
                              <TableCell className="font-medium">
                                <div className="flex items-center space-x-2">
                                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                    <User className="h-4 w-4 text-gray-600" />
                                  </div>
                                  <span>{user._id}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge
                                  variant={
                                    user.unread_leads > 5
                                      ? "destructive"
                                      : user.unread_leads > 0
                                      ? "default"
                                      : "secondary"
                                  }
                                >
                                  {user.unread_leads}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {user.unread_leads > 0 ? (
                                  <div className="flex items-center justify-end space-x-1">
                                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                    <span className="text-sm text-yellow-600">
                                      Has Unread
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-end space-x-1">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span className="text-sm text-green-600">
                                      All Read
                                    </span>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Unread Messages List - Available for both Admin and User */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5" />
                <span>
                  {isAdmin
                    ? "All Unread Conversations"
                    : "Your Unread Conversations"}
                </span>
                {hasUnreadMessages && (
                  <Badge variant="destructive">
                    {unreadStatus!.total_unread_leads}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!hasUnreadMessages ? (
                <div className="text-center py-12">
                  <Bell className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    All caught up!
                  </h3>
                  <p className="text-gray-500">
                    {isAdmin
                      ? "No unread WhatsApp messages in the system."
                      : "You have no unread WhatsApp messages."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {unreadStatus!.unread_details.map((lead: UnreadLead) => (
                    <div
                      key={lead.lead_id}
                      className={`p-4 border rounded-lg hover:bg-gray-100 transition-colors`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <User className="h-6 w-6 text-gray-600" />
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {lead.lead_name}
                            </h4>
                            <p className="text-sm text-gray-500">
                              Lead ID: {lead.lead_id}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <Badge
                              variant={
                                lead.unread_count > 5
                                  ? "destructive"
                                  : "default"
                              }
                              className="mb-1"
                            >
                              {lead.unread_count} unread
                            </Badge>
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatLastActivity(lead.last_activity)}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLeadClick(lead.lead_id);
                            }}
                          >
                            View Chat
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <div className="space-y-6">
            {/* History Filters - Collapsible */}
            <Collapsible open={showFilters} onOpenChange={setShowFilters}>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Notification History
                  </h2>
                  <p className="text-gray-600">
                    View past WhatsApp notifications and communication events
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      {showFilters ? "Hide Filters" : "Show Filters"}
                    </Button>
                  </CollapsibleTrigger>
                  <Button
                    onClick={handleClearHistoryFilters}
                    variant="outline"
                    size="sm"
                    disabled={!Object.values(historyFilters).some(Boolean)}
                  >
                    Clear All
                  </Button>
                </div>
              </div>

              <CollapsibleContent>
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Filter className="h-5 w-5" />
                      Filter Notifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Search */}
                      <div className="space-y-2">
                        <Label htmlFor="search">Search by Lead Name</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            id="search"
                            placeholder="Enter lead name..."
                            value={tempFilters.search}
                            onChange={(e) =>
                              handleTempFilterChange("search", e.target.value)
                            }
                            className="pl-10"
                          />
                        </div>
                      </div>

                      {/* Notification Type */}
                      <div className="space-y-2">
                        <Label>Notification Type</Label>
                        <Select
                          value={tempFilters.notification_type || "all"}
                          onValueChange={(value) =>
                            handleTempFilterChange("notification_type", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All types" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="new_whatsapp_message">
                              WhatsApp Message
                            </SelectItem>
                            <SelectItem value="email_sent">
                              Email Sent
                            </SelectItem>
                            <SelectItem value="call_log">Call Log</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Date Range */}
                      <div className="space-y-2">
                        <Label>Date Range</Label>
                        <DateRangePicker
                          initialDateFrom={tempFilters.date_range?.from}
                          initialDateTo={tempFilters.date_range?.to}
                          onUpdate={({ range }) =>
                            handleTempFilterChange("date_range", range)
                          }
                          placeholder="Select date range"
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Apply Filters Button */}
                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => setShowFilters(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleApplyFilters}>
                        Apply Filters
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>

            {/* History Content - Table Format */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Notification History
                  {historyData?.summary && (
                    <Badge variant="secondary" className="ml-2">
                      {historyData.summary.total_notifications} total
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                      <p className="text-gray-600">
                        Loading notification history...
                      </p>
                    </div>
                  </div>
                ) : historyError ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <p className="text-red-600">
                      Failed to load notification history
                    </p>
                  </div>
                ) : !historyData?.notifications?.length ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium">
                      No notifications found
                    </p>
                    <p className="text-gray-400 text-sm">
                      Try adjusting your filters or check back later
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Table */}
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Lead Name</TableHead>
                            <TableHead>Lead ID</TableHead>
                            <TableHead>Message</TableHead>
                            <TableHead className="text-center">
                              Direction
                            </TableHead>
                            <TableHead>Timestamp</TableHead>
                            {/* <TableHead className="text-center">Read</TableHead>
                            <TableHead>Read At</TableHead> */}
                            <TableHead className="text-center">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {historyData.notifications.map((notification) => (
                            <NotificationTableRow
                              key={notification.id}
                              notification={notification}
                            />
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}

                {/* Pagination */}
                {historyData?.pagination &&
                  historyData.notifications.length > 0 && (
                    <div className="mt-6">
                      <ServerPagination
                        paginationMeta={
                          historyData.pagination as PaginationMeta
                        }
                        onPageChange={handleHistoryPageChange}
                        onPageSizeChange={handleHistoryPageSizeChange}
                        showResultsInfo={true}
                        showPageSizeSelector={true}
                        className="flex-row"
                      />
                    </div>
                  )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
