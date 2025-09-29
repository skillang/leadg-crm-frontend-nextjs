// src/app/my-leads/[leadId]/page.tsx - Updated with Email Integration

"use client";

import React, { useCallback, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Phone, Mail, Pen, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useGetLeadDetailsQuery,
  useUpdateLeadStageMutation,
} from "@/redux/slices/leadsApi";
import { useGetActiveStagesQuery } from "@/redux/slices/stagesApi";
import { useNotifications } from "@/components/common/NotificationSystem";
import {
  // StageDisplay,
  useStageUtils,
} from "@/components/common/StageDisplay";
import WhatsAppButton from "@/components/communication/whatsapp/WhatsAppButton";
import WhatsAppModal from "@/components/communication/whatsapp/WhatsAppModal";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/redux/store";
import { useGetActiveStatusesQuery } from "@/redux/slices/statusesApi";
import { useUpdateLeadMutation } from "@/redux/slices/leadsApi";
import NotesContainer from "@/components/lead-details/notes/NotesContainer";
import DocumentsContainer from "@/components/lead-details/documents/DocumentsContainer";
import TimelineContainer from "@/components/lead-details/timeline/TimelineContainer";
import ContactsContainer from "@/components/lead-details/contacts/ContactsContainer";
import { formatContactDate, formatDate } from "@/utils/formatDate";
import { StatusSelect } from "@/components/common/StatusSelect";
import { StageSelect } from "@/components/common/StageSelect";
import {
  // getPriorityColor,
  LEAD_DETAIL_TABS,
  type TabDefinition,
} from "@/constants/leadDetailsConfig";
// ✅ ADD EMAIL IMPORTS
import { openEmailDialog } from "@/redux/slices/emailSlice";
import EmailDialog from "@/components/communication/email/EmailDialog";
import TataTeliModal from "@/components/communication/calling/TataTeliModal";
import { openModal as openCallModal } from "@/redux/slices/tataTeliSlice";
import TasksContainer from "@/components/lead-details/tasks/TasksContainer";
import EditLeadModal from "@/components/leads/EditLeadModal";

export default function LeadDetailsPage() {
  const dispatch = useDispatch(); // ✅ ADD DISPATCH
  const [activeTab, setActiveTab] = useState("tasks");
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const params = useParams();
  const router = useRouter();
  // const searchParams = useSearchParams();
  const leadId = params?.leadId as string;

  const {
    data: leadDetails,
    isLoading,
    error,
    refetch,
  } = useGetLeadDetailsQuery(leadId);
  const { data: stagesData, isLoading: stagesLoading } =
    useGetActiveStagesQuery({});
  const [updateStage] = useUpdateLeadStageMutation();
  const { getStageDisplayName } = useStageUtils();
  const { data: statusesData, isLoading: statusesLoading } =
    useGetActiveStatusesQuery({});
  const [updateLead] = useUpdateLeadMutation();
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const { showSuccess, showError } = useNotifications();

  // 🔥 REPLACE your existing handleBack function with this:
  const handleBack = useCallback(() => {
    // Try to get stored page info
    const previousPageInfo = sessionStorage.getItem("leadsPageInfo");
    if (previousPageInfo) {
      try {
        const pageInfo = JSON.parse(previousPageInfo);
        const params = new URLSearchParams();

        params.set("page", pageInfo.page.toString());
        params.set("limit", pageInfo.limit.toString());

        // Add filters if they exist
        if (pageInfo.stage && pageInfo.stage !== "all")
          params.set("stage", pageInfo.stage);
        if (pageInfo.status && pageInfo.status !== "all")
          params.set("status", pageInfo.status);
        if (pageInfo.category && pageInfo.category !== "all")
          params.set("category", pageInfo.category);
        if (pageInfo.source && pageInfo.source !== "all")
          params.set("source", pageInfo.source);
        if (pageInfo.search) params.set("search", pageInfo.search);

        const backUrl = `/my-leads?${params.toString()}`;
        // console.log("🔄 Navigating to stored page info:", backUrl);

        // Clear the stored info
        sessionStorage.removeItem("leadsPageInfo");

        // Navigate using router.push
        router.push(backUrl);
        return;
      } catch (error) {
        console.error("Failed to parse stored page info:", error);
      }
    }

    // Fallback: use browser back
    // console.log("🔄 Using browser back navigation");
    router.back();
  }, [router]);

  const handleCall = () => {
    if (!leadDetails?.leadId && !leadDetails?.id) {
      showError("No lead ID available", "Error");
      return;
    }

    // Dispatch Tata Teli modal
    dispatch(
      openCallModal({
        leadId: leadDetails.leadId || leadDetails.id,
      })
    );
  };

  const handleEditLead = () => {
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
  };

  // ✅ UPDATED EMAIL HANDLER
  const handleEmail = () => {
    if (leadId) {
      dispatch(openEmailDialog(leadId));
    } else {
      showError("No lead ID available", "Error");
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!leadDetails || newStatus === leadDetails.status) return;

    setIsUpdatingStatus(true);
    try {
      await updateLead({
        lead_id: leadDetails.leadId,
        leadData: {
          status: newStatus,
        },
      }).unwrap();

      const selectedStatus = statusesData?.statuses.find(
        (s) => s.name === newStatus
      );
      const statusDisplayName = selectedStatus?.display_name || newStatus;

      showSuccess(
        `${leadDetails.name}'s status updated to "${statusDisplayName}"`,
        "Lead Status updated successfully!"
      );

      refetch();
    } catch (err: unknown) {
      const error = err as {
        message?: string;
        data?: { detail?: { msg: string }[] | string };
      };

      let errorMessage = "Failed to update status";
      if (error?.data?.detail) {
        if (Array.isArray(error.data.detail)) {
          errorMessage = error.data.detail
            .map((e: { msg: string }) => e.msg)
            .join(", ");
        } else if (typeof error.data.detail === "string") {
          errorMessage = error.data.detail;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }

      showError(`Failed to update status: ${errorMessage}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Create data for WhatsApp components
  const whatsappLeadData = leadDetails
    ? {
        id: leadDetails.leadId,
        leadId: leadDetails.leadId,
        name: leadDetails.name,
        phoneNumber: leadDetails.phoneNumber,
        email: leadDetails.email,
      }
    : null;

  const whatsappUserData = currentUser
    ? {
        id: currentUser.id,
        firstName: currentUser.first_name,
        lastName: currentUser.last_name,
        email: currentUser.email,
      }
    : null;

  // Stage change handler using Select with StageDisplay
  const handleStageChange = async (
    newStage: string,
    options?: { automation_approved?: boolean }
  ) => {
    if (!leadDetails || newStage === leadDetails.stage) return;

    setIsUpdatingStage(true);
    try {
      await updateStage({
        leadId: leadDetails.leadId,
        stage: newStage,
        automation_approved: options?.automation_approved,
      }).unwrap();

      const stageDisplayName = getStageDisplayName(newStage);

      showSuccess(
        `${leadDetails.name}'s stage updated to "${stageDisplayName}"`,
        "Lead Stage updated successfully!"
      );

      refetch();
    } catch (err: unknown) {
      const error = err as {
        message?: string;
        data?: { detail?: { msg: string }[] | string };
      };

      let errorMessage = "Failed to update stage";
      if (error?.data?.detail) {
        if (Array.isArray(error.data.detail)) {
          errorMessage = error.data.detail
            .map((e: { msg: string }) => e.msg)
            .join(", ");
        } else if (typeof error.data.detail === "string") {
          errorMessage = error.data.detail;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }

      showError(`Failed to update stage: ${errorMessage}`);
    } finally {
      setIsUpdatingStage(false);
    }
  };

  // Loading state
  if (isLoading || stagesLoading || statusesLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading lead details...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !leadDetails) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Lead Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The lead you are looking for does not exist or has been removed.
          </p>
          <Button onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case "timeline":
        return (
          <div className="md:p-6 p-3">
            <TimelineContainer leadId={leadDetails.leadId} />
          </div>
        );
      case "tasks":
        return (
          <div className="md:p-6 p-3">
            <TasksContainer leadId={leadDetails.leadId} />
          </div>
        );
      case "notes":
        return (
          <div className="md:p-6 p-3">
            <NotesContainer leadId={leadDetails.leadId} />
          </div>
        );
      case "documents":
        return (
          <div className="md:p-6 p-3">
            <DocumentsContainer leadId={leadDetails.leadId} />
          </div>
        );
      case "activity":
        return (
          <div className="md:p-6 p-3">
            <h3 className="text-lg font-semibold mb-4">Activity Log Content</h3>
            <p className="text-gray-600">
              Activity log entries will be displayed here...
            </p>
            <h2 className="text-lg font-semibold my-10 text-center text-red-600 bg-red-200 rounded-md">
              ⚠️ Coming soon ⚠️
            </h2>
          </div>
        );
      case "contacts":
        return (
          <div className="md:p-6 p-3">
            <ContactsContainer leadId={leadDetails.leadId} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto space-y-2 md:space-y-6">
        {/* Top Header */}
        <div className="flex items-center">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Button variant="ghost" onClick={handleBack} className="p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span>My leads</span>
            <span>
              <ChevronRight size={18} />
            </span>
            <span className="text-blue-600 font-medium">
              {leadDetails.name}
            </span>
          </div>
        </div>

        {/* Lead Header - Top Bar */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={handleEditLead}
                >
                  <Pen className="h-4 w-4 text-gray-600" />
                </Button>
                <h1 className="text-2xl font-bold">{leadDetails.name}</h1>
                {/* {leadDetails.priority && (
                  <Badge
                    className={`text-sm ${getPriorityColor(
                      leadDetails.priority
                    )}`}
                  >
                    {leadDetails.priority.charAt(0).toUpperCase() +
                      leadDetails.priority.slice(1)}{" "}
                    Priority
                  </Badge>
                )} */}
              </div>
            </div>

            <div className="flex items-end flex-wrap gap-2">
              {/* Stage Dropdown using Select with StageDisplay */}
              <div className="relative">
                <StageSelect
                  value={leadDetails.stage}
                  onValueChange={handleStageChange}
                  stages={stagesData?.stages || []}
                  disabled={isUpdatingStage}
                  isLoading={stagesLoading}
                  placeholder="Select stage"
                  className="w-[160px]"
                />
                {isUpdatingStage && (
                  <div className="absolute top-full left-0 mt-1 p-2 bg-blue-100 border border-blue-200 rounded text-xs text-blue-600 z-10">
                    Updating stage...
                  </div>
                )}
              </div>

              <div className="relative">
                <StatusSelect
                  value={leadDetails.status || "active"}
                  onValueChange={handleStatusChange}
                  statuses={statusesData?.statuses || []}
                  disabled={isUpdatingStatus}
                  isLoading={statusesLoading}
                  placeholder="Select status"
                  className="w-[160px]"
                />
                {isUpdatingStatus && (
                  <div className="absolute top-full left-0 mt-1 p-2 bg-green-100 border border-green-200 rounded text-xs text-green-600 z-10">
                    Updating status...
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <Button
                onClick={handleCall}
                // className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Phone className="mr-2 h-4 w-4" />
                Call
              </Button>
              {/* ✅ UPDATED MAIL BUTTON */}
              <Button
                onClick={handleEmail}
                // className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Mail className="mr-2 h-4 w-4" />
                Mail
              </Button>
              {/* WhatsApp Button */}
              {whatsappLeadData && whatsappUserData && (
                <WhatsAppButton
                  lead={whatsappLeadData}
                  user={whatsappUserData}
                  disabled={!leadDetails.phoneNumber}
                />
              )}
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Overview (Fixed) */}
          <div className="col-span-12 md:col-span-5">
            <Card>
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableBody>
                    <TableRow className="border-b">
                      <TableCell className="font-medium text-gray-500 py-3 px-6 w-1/3">
                        Name:
                      </TableCell>
                      <TableCell className="py-3 px-6">
                        <span className="text-gray-900">
                          {leadDetails.name}
                        </span>
                      </TableCell>
                    </TableRow>

                    <TableRow className="border-b">
                      <TableCell className="font-medium text-gray-500 py-3 px-6">
                        Lead ID:
                      </TableCell>
                      <TableCell className="py-3 px-6">
                        <span className="text-gray-900">
                          {leadDetails.leadId}
                        </span>
                      </TableCell>
                    </TableRow>

                    <TableRow className="border-b">
                      <TableCell className="font-medium text-gray-500 py-3 px-6">
                        Phone number:
                      </TableCell>
                      <TableCell className="py-3 px-6">
                        <span className="text-gray-900">
                          {leadDetails.phoneNumber || "Not provided"}
                        </span>
                      </TableCell>
                    </TableRow>

                    <TableRow className="border-b">
                      <TableCell className="font-medium text-gray-500 py-3 px-6">
                        Email:
                      </TableCell>
                      <TableCell className="py-3 px-6">
                        <span className="text-gray-900">
                          {leadDetails.email || "Not provided"}
                        </span>
                      </TableCell>
                    </TableRow>

                    <TableRow className="border-b">
                      <TableCell className="font-medium text-gray-500 py-3 px-6">
                        Lead Category:
                      </TableCell>
                      <TableCell className="py-3 px-6">
                        <span className="text-gray-900">
                          {leadDetails.leadCategory || "Not provided"}
                        </span>
                      </TableCell>
                    </TableRow>

                    <TableRow className="border-b">
                      <TableCell className="font-medium text-gray-500 py-3 px-6">
                        Age
                      </TableCell>
                      <TableCell className="py-3 px-6">
                        <span className="text-gray-900">
                          {leadDetails.age || "Not specified"}
                        </span>
                      </TableCell>
                    </TableRow>

                    <TableRow className="border-b">
                      <TableCell className="font-medium text-gray-500 py-3 px-6">
                        Date of birth
                      </TableCell>
                      <TableCell className="py-3 px-6">
                        <span className="text-gray-900">
                          {(leadDetails.date_of_birth as string) ||
                            "Not specified"}
                        </span>
                      </TableCell>
                    </TableRow>

                    <TableRow className="border-b">
                      <TableCell className="font-medium text-gray-500 py-3 px-6">
                        Experience
                      </TableCell>
                      <TableCell className="py-3 px-6">
                        <span className="text-gray-900">
                          {leadDetails.experience || "Not specified"}
                        </span>
                      </TableCell>
                    </TableRow>

                    <TableRow className="border-b">
                      <TableCell className="font-medium text-gray-500 py-3 px-6">
                        Country of interest:
                      </TableCell>
                      <TableCell className="py-3 px-6">
                        <span className="text-gray-900">
                          {leadDetails.countryOfInterest || "Not specified"}
                        </span>
                      </TableCell>
                    </TableRow>

                    <TableRow className="border-b">
                      <TableCell className="font-medium text-gray-500 py-3 px-6">
                        Course level:
                      </TableCell>
                      <TableCell className="py-3 px-6">
                        <span className="text-gray-900">
                          {leadDetails.courseLevel || "Not specified"}
                        </span>
                      </TableCell>
                    </TableRow>

                    <TableRow className="border-b">
                      <TableCell className="font-medium text-gray-500 py-3 px-6">
                        Nationality:
                      </TableCell>
                      <TableCell className="py-3 px-6">
                        <span className="text-gray-900">
                          {leadDetails.nationality || "Not Specified"}
                        </span>
                      </TableCell>
                    </TableRow>

                    <TableRow className="border-b">
                      <TableCell className="font-medium text-gray-500 py-3 px-6">
                        Current Location:
                      </TableCell>
                      <TableCell className="py-3 px-6">
                        <span className="text-gray-900">
                          {leadDetails.current_location || "Not Specified"}
                        </span>
                      </TableCell>
                    </TableRow>

                    <TableRow className="border-b">
                      <TableCell className="font-medium text-gray-500 py-3 px-6">
                        Source:
                      </TableCell>
                      <TableCell className="py-3 px-6">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900 capitalize">
                            {leadDetails.source}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>

                    <TableRow className="border-b">
                      <TableCell className="font-medium text-gray-500 py-3 px-6">
                        Assigned to:
                      </TableCell>
                      <TableCell className="py-3 px-6">
                        <span className="text-gray-900">
                          {leadDetails.assignedToName || "Unassigned"}
                        </span>
                      </TableCell>
                    </TableRow>

                    <TableRow className="border-b">
                      <TableCell className="font-medium text-gray-500 py-3 px-6">
                        Co-Assigned to:
                      </TableCell>
                      <TableCell className="py-3 px-6">
                        <span className="text-gray-900">
                          {Array.isArray(leadDetails.coAssigneesNames) &&
                          leadDetails.coAssigneesNames.length > 0
                            ? leadDetails.coAssigneesNames.map(
                                (name: string, idx: number) => (
                                  <span key={idx}>
                                    {name}
                                    {idx <
                                    leadDetails.coAssigneesNames.length - 1
                                      ? ", "
                                      : ""}
                                  </span>
                                )
                              )
                            : "Unassigned"}
                        </span>
                      </TableCell>
                    </TableRow>

                    <TableRow className="border-b">
                      <TableCell className="font-medium text-gray-500 py-3 px-6">
                        Created on:
                      </TableCell>
                      <TableCell className="py-3 px-6">
                        <span className="text-gray-900">
                          {formatDate(leadDetails.createdAt)}
                        </span>
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell className="font-medium text-gray-500 py-3 px-6">
                        Last contacted:
                      </TableCell>
                      <TableCell className="py-3 px-6">
                        <span className="text-gray-900">
                          {leadDetails.lastContacted
                            ? formatContactDate(leadDetails.lastContacted)
                            : "Never contacted"}
                        </span>
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell className="font-medium text-gray-500 py-3 px-6">
                        Last updated at:
                      </TableCell>
                      <TableCell className="py-3 px-6">
                        <span className="text-gray-900">
                          {leadDetails.updatedAt
                            ? formatContactDate(leadDetails.updatedAt)
                            : "Never updated"}
                        </span>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Tags Card */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                {leadDetails.tags.length > 0 ? (
                  leadDetails.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      className="bg-blue-100 text-blue-800 text-sm me-2 mb-2"
                    >
                      {tag}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-gray-700">
                    This lead currently has no tags
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Extra Info Card */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Extra Info</CardTitle>
              </CardHeader>
              <CardContent>
                {leadDetails.notes ? (
                  <ul className="list-disc pl-5 space-y-1">
                    {leadDetails.notes.split("•").map((line, index) => {
                      const trimmedLine = line.trim();
                      return trimmedLine ? (
                        <li key={index} className="text-gray-900">
                          {trimmedLine}
                        </li>
                      ) : null;
                    })}
                  </ul>
                ) : (
                  <span className="text-gray-700 text-sm">
                    No extra info was given while lead creation
                  </span>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Tabbed Interface */}
          <div className="col-span-12 md:col-span-7 flex flex-col gap-4">
            {/* Call Statistics Card - Add this after the Extra Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Call Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                {leadDetails!.callStats!.user_calls!.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableCell className="font-medium">User</TableCell>
                          <TableCell className="font-medium text-center">
                            Total
                          </TableCell>
                          <TableCell className="font-medium text-center">
                            Answered
                          </TableCell>
                          <TableCell className="font-medium text-center">
                            Missed
                          </TableCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {leadDetails!.callStats!.user_calls.map(
                          (userCall, index) => (
                            <TableRow
                              key={userCall.user_id || index}
                              className="border-b"
                            >
                              <TableCell className="">
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {userCall.user_name}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className=" text-center">
                                <Badge variant="primary-ghost">
                                  {userCall.total || 0}
                                </Badge>
                              </TableCell>
                              <TableCell className=" text-center">
                                <Badge variant="success-light">
                                  {userCall.answered}
                                </Badge>
                              </TableCell>
                              <TableCell className=" text-center">
                                <Badge variant="destructive-light">
                                  {userCall.missed}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No Call data to display
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              {/* Tab Navigation */}
              <div className="border-b overflow-x-auto ">
                <div className="flex space-x-8 px-6 over">
                  {LEAD_DETAIL_TABS.map((tab: TabDefinition) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                        activeTab === tab.id
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="min-h-[600px] overflow-hidden">
                {renderTabContent()}
              </div>
            </Card>
          </div>
        </div>
      </div>
      <TataTeliModal />
      <WhatsAppModal />
      <EmailDialog />
      <EditLeadModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        lead={leadId ? leadDetails : null}
      />
    </div>
  );
}
