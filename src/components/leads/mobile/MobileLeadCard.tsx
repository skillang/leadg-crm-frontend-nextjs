// src/components/leads/MobileLeadCard.tsx
import React from "react";
import { Lead } from "@/models/types/lead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { StageSelect } from "@/components/common/StageSelect";
import { StatusSelect } from "@/components/common/StatusSelect";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import {
  useUpdateLeadStageMutation,
  useUpdateLeadMutation,
} from "@/redux/slices/leadsApi";
import { useGetActiveStagesQuery } from "@/redux/slices/stagesApi";
import { useGetActiveStatusesQuery } from "@/redux/slices/statusesApi";
import { useNotifications } from "@/components/common/NotificationSystem";
import { openEmailDialog } from "@/redux/slices/emailSlice";
import { openModal } from "@/redux/slices/whatsappSlice";
import { openModal as openCallModal } from "@/redux/slices/tataTeliSlice";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

interface MobileLeadCardProps {
  lead: Lead;
  className?: string;
  router?: AppRouterInstance;
}

export const MobileLeadCard: React.FC<MobileLeadCardProps> = ({
  lead,
  className = "",
  router,
}) => {
  const dispatch = useDispatch();
  const { showSuccess, showError } = useNotifications();
  const currentUser = useSelector((state: RootState) => state.auth.user);

  // Stage management
  const [updateStage, { isLoading: stageLoading }] =
    useUpdateLeadStageMutation();
  const { data: stagesData, isLoading: stagesDataLoading } =
    useGetActiveStagesQuery({});

  // Status management
  const [updateLeadStatus, { isLoading: statusLoading }] =
    useUpdateLeadMutation();
  const { data: statusesData, isLoading: statusesDataLoading } =
    useGetActiveStatusesQuery({});

  // Handle stage change
  const handleStageChange = async (newStage: string) => {
    if (newStage === lead.stage) return;

    try {
      await updateStage({
        leadId: lead.id,
        stage: newStage,
        currentLead: lead,
      }).unwrap();

      const selectedStage = stagesData?.stages.find((s) => s.name === newStage);
      const stageDisplayName = selectedStage?.display_name || newStage;

      showSuccess(
        `${lead.name}'s stage updated to "${stageDisplayName}"`,
        "Lead Stage updated successfully!"
      );
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

      showError(`Failed to update ${lead.name}'s stage: ${errorMessage}`);
    }
  };

  // Handle status change
  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === lead.status) return;

    try {
      await updateLeadStatus({
        lead_id: lead.id,
        status: newStatus,
        currentLead: lead,
      }).unwrap();

      const selectedStatus = statusesData?.statuses.find(
        (s) => s.name === newStatus
      );
      const statusDisplayName = selectedStatus?.display_name || newStatus;

      showSuccess(
        `${lead.name}'s status updated to "${statusDisplayName}"`,
        "Lead Status updated successfully!"
      );
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

      showError(`Failed to update ${lead.name}'s status: ${errorMessage}`);
    }
  };

  const handleCardClick = () => {
    if (router) {
      router.push(`/my-leads/${lead.id}`);
    }
  };

  // Contact actions
  const handleCall = () => {
    if (!currentUser) {
      showError("User data not available", "Error");
      return;
    }

    // Dispatch Tata Teli modal
    dispatch(
      openCallModal({
        leadId: lead.leadId || lead.id,
      })
    );
  };

  const handleEmail = () => {
    if (lead.id) {
      dispatch(openEmailDialog(lead.id));
    } else {
      showError("No lead ID available", "Error");
    }
  };

  const handleWhatsApp = () => {
    if (!lead.phoneNumber && !lead.contact) {
      showError("No phone number available for this lead", "No Phone Number");
      return;
    }

    const whatsappLeadData = {
      id: lead.id,
      leadId: lead.id,
      name: lead.name,
      phoneNumber: lead.phoneNumber || lead.contact || "",
      email: lead.email,
    };

    const whatsappUserData = currentUser
      ? {
          id: currentUser.id,
          firstName: currentUser.first_name,
          lastName: currentUser.last_name,
          email: currentUser.email,
        }
      : null;

    if (whatsappUserData) {
      dispatch(
        openModal({
          lead: whatsappLeadData,
          user: whatsappUserData,
        })
      );
    } else {
      showError("User data not available", "Error");
    }
  };

  return (
    <Card
      className={`w-full bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-0  ${className}`}
    >
      <CardContent className="p-0">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="lead-details" className="border-0">
            <AccordionTrigger className="px-4 hover:no-underline hover:bg-gray-50 rounded-t-lg">
              <div className="flex items-center justify-between w-full pr-2">
                <h3 className="font-semibold text-lg text-gray-900 truncate text-left">
                  {lead.name}
                </h3>
                {/* Quick action button - visible on main view */}
                {/* <Button
                  size="sm"
                  variant="outline"
                  className="h-6 w-6 p-2 ml-2 hover:bg-blue-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardClick();
                  }}
                >
                  <ArrowRight className="h-4 w-4 " />
                </Button> */}
              </div>
            </AccordionTrigger>

            <AccordionContent className="px-4 space-y-2">
              {/* Status Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 font-medium min-w-[48px]">
                  Status:
                </span>
                <div className="flex-1 relative">
                  {statusesDataLoading ? (
                    <div className="h-8 w-full bg-gray-200 rounded animate-pulse" />
                  ) : (
                    <StatusSelect
                      value={lead.status}
                      onValueChange={handleStatusChange}
                      statuses={statusesData?.statuses || []}
                      disabled={statusLoading}
                      isLoading={statusesDataLoading}
                      placeholder="Select status"
                      className="w-full"
                      showLabel={false}
                    />
                  )}

                  {statusLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    </div>
                  )}
                </div>
              </div>

              {/* Stage Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 font-medium min-w-[45px]">
                  Stage:
                </span>
                <div className="flex-1 relative">
                  {stagesDataLoading ? (
                    <div className="h-8 w-full bg-gray-200 rounded animate-pulse" />
                  ) : (
                    <StageSelect
                      value={lead.stage}
                      onValueChange={handleStageChange}
                      stages={stagesData?.stages || []}
                      disabled={stageLoading}
                      isLoading={stagesDataLoading}
                      placeholder="Select stage"
                      className="w-full"
                      showLabel={false}
                    />
                  )}

                  {stageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Section */}
              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 font-medium">
                    Contact:
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0 border-slate-500/25 hover:bg-slate-500/10"
                      onClick={handleCall}
                    >
                      <Image
                        src="/assets/icons/call-icon.svg"
                        alt="Call"
                        width={14}
                        height={14}
                      />
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0 border-slate-500/25 hover:bg-slate-500/10"
                      onClick={handleEmail}
                    >
                      <Image
                        src="/assets/icons/email-icon.svg"
                        alt="Email"
                        width={14}
                        height={14}
                      />
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0 border-slate-500/25 hover:bg-slate-500/10"
                      onClick={handleWhatsApp}
                    >
                      <Image
                        src="/assets/icons/whatsapp-icon.svg"
                        alt="WhatsApp"
                        width={14}
                        height={14}
                      />
                    </Button>
                  </div>
                </div>
              </div>

              {/* View Details Button */}
              <div className="pt-2 border-t border-gray-100">
                <Button
                  variant="outline"
                  className="w-full text-sm"
                  onClick={handleCardClick}
                >
                  View Full Details
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};
