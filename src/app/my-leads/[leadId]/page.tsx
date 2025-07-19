// src/app/my-leads/[leadId]/page.tsx - CORRECTED WITH StageDisplay

"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Phone,
  Mail,
  User,
  Target,
  Calendar,
  Building2,
  Tag,
  FileText,
  Clock,
  Globe,
  GraduationCap,
  Briefcase,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useGetLeadDetailsQuery,
  useUpdateLeadStageMutation,
  useDeleteLeadMutation,
} from "@/redux/slices/leadsApi";
import { useGetActiveStagesQuery } from "@/redux/slices/stagesApi";
import { useNotifications } from "@/components/common/NotificationSystem";
import { StageDisplay, useStageUtils } from "@/components/common/StageDisplay"; // 🔥 Using StageDisplay
import EditLeadModal from "@/components/leads/EditLeadModal";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { Lead } from "@/models/types/lead";

export default function LeadDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params?.leadId as string;

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);

  const {
    data: leadDetails,
    isLoading,
    error,
    refetch,
  } = useGetLeadDetailsQuery(leadId);
  const { data: stagesData, isLoading: stagesLoading } =
    useGetActiveStagesQuery({});
  const [updateStage] = useUpdateLeadStageMutation();
  const [deleteLead] = useDeleteLeadMutation();
  const { getStageDisplayName } = useStageUtils();

  const { showSuccess, showError, showConfirm } = useNotifications();

  const handleBack = () => {
    router.push("/my-leads");
  };

  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  const handleDelete = async () => {
    if (!leadDetails) return;

    // const confirmed = await showConfirm(
    //   "Delete Lead",
    //   `Are you sure you want to delete "${leadDetails.name}"? This action cannot be undone.`,
    //   "Delete",
    //   "destructive"
    // );

    // if (!confirmed) return;

    try {
      await deleteLead(leadDetails.leadId).unwrap();
      showSuccess(`Lead "${leadDetails.name}" has been deleted successfully.`);
      router.push("/my-leads");
    } catch (error: unknown) {
      const errorMessage =
        (error as any)?.data?.detail ||
        (error as any)?.message ||
        "Failed to delete lead";
      showError(`Failed to delete lead: ${errorMessage}`);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800 border-green-200";
    if (score >= 60) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (score >= 40) return "bg-orange-100 text-orange-800 border-orange-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  if (isLoading || stagesLoading) {
    return (
      <div className="container mx-auto py-6">
        <LoadingSpinner message="Loading lead details..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="text-red-600 mb-4">
            <Target className="h-12 w-12 mx-auto mb-2" />
            <h2 className="text-xl font-semibold">Failed to load lead</h2>
            <p className="text-gray-600 mt-2">
              {(error as any)?.data?.detail || "Unable to fetch lead details"}
            </p>
          </div>
          <Button onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // 🔥 CORRECTED: Stage change handler using Select with StageDisplay
  const handleStageChange = async (newStage: string) => {
    if (!leadDetails || newStage === leadDetails.stage) return;

    setIsUpdatingStage(true);
    try {
      // Create Lead object from leadDetails
      const currentLead: Lead = {
        id: leadDetails.leadId,
        leadId: leadDetails.leadId,
        name: leadDetails.name,
        email: leadDetails.email,
        contact: leadDetails.phoneNumber,
        phoneNumber: leadDetails.phoneNumber,
        source: leadDetails.source,
        stage: leadDetails.stage,
        leadScore: leadDetails.leadScore,
        status: leadDetails.status || "active",
        assignedTo: leadDetails.assignedTo || "",
        assignedToName: leadDetails.assignedToName || "",
        coAssignees: [],
        coAssigneesNames: [],
        isMultiAssigned: false,
        assignmentMethod: leadDetails.assignmentMethod || "manual",
        age: leadDetails.age,
        experience: leadDetails.experience,
        nationality: leadDetails.nationality,
        courseLevel: leadDetails.courseLevel || "",
        countryOfInterest: leadDetails.countryOfInterest || "",
        notes: leadDetails.notes || "",
        createdAt: leadDetails.createdAt,
        updatedAt: leadDetails.updatedAt,
        lastContacted: null,
        leadCategory: leadDetails.leadCategory || "",
        tags: leadDetails.tags || [],
        priority: leadDetails.priority || "medium",
      };

      await updateStage({
        leadId: leadDetails.leadId,
        stage: newStage,
        currentLead: currentLead,
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

  if (!leadDetails) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="text-gray-600 mb-4">
            <User className="h-12 w-12 mx-auto mb-2" />
            <h2 className="text-xl font-semibold">Lead not found</h2>
            <p className="text-gray-600 mt-2">
              The lead you're looking for doesn't exist or has been removed.
            </p>
          </div>
          <Button onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Create Lead object for EditLeadModal
  const editLead: Lead = {
    id: leadDetails.leadId,
    leadId: leadDetails.leadId,
    name: leadDetails.name,
    email: leadDetails.email,
    contact: leadDetails.phoneNumber,
    phoneNumber: leadDetails.phoneNumber,
    source: leadDetails.source,
    stage: leadDetails.stage,
    leadScore: leadDetails.leadScore,
    status: leadDetails.status || "active",
    assignedTo: leadDetails.assignedTo || "",
    assignedToName: leadDetails.assignedToName || "",
    coAssignees: [],
    coAssigneesNames: [],
    isMultiAssigned: false,
    assignmentMethod: leadDetails.assignmentMethod || "manual",
    age: leadDetails.age,
    experience: leadDetails.experience,
    nationality: leadDetails.nationality,
    courseLevel: leadDetails.courseLevel || "",
    countryOfInterest: leadDetails.countryOfInterest || "",
    notes: leadDetails.notes || "",
    createdAt: leadDetails.createdAt,
    updatedAt: leadDetails.updatedAt,
    lastContacted: null,
    leadCategory: leadDetails.leadCategory || "",
    tags: leadDetails.tags || [],
    priority: leadDetails.priority || "medium",
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Button variant="ghost" onClick={handleBack} className="p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span>My leads</span>
            <span>/</span>
            <span className="text-blue-600 font-medium">
              {leadDetails.name}
            </span>
          </div>
        </div>
      </div>

      {/* Lead Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{leadDetails.name}</h1>

              {leadDetails.priority && (
                <Badge
                  className={`text-sm ${getPriorityColor(
                    leadDetails.priority
                  )}`}
                >
                  {leadDetails.priority.charAt(0).toUpperCase() +
                    leadDetails.priority.slice(1)}{" "}
                  Priority
                </Badge>
              )}

              {leadDetails.tags &&
                leadDetails.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    className="bg-blue-100 text-blue-800 text-sm"
                  >
                    {tag}
                  </Badge>
                ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 🔥 CORRECTED: Stage Dropdown using Select with StageDisplay */}
            <div className="relative">
              {stagesData?.stages?.length ? (
                <Select
                  value={leadDetails.stage}
                  onValueChange={handleStageChange}
                  disabled={isUpdatingStage}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue>
                      <StageDisplay
                        stageName={leadDetails.stage}
                        size="sm"
                        showColor={true}
                      />
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {stagesData.stages.map((stage) => (
                      <SelectItem key={stage.id} value={stage.name}>
                        <StageDisplay
                          stageName={stage.name}
                          size="sm"
                          showColor={true}
                        />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center justify-center w-[160px] h-8">
                  <span className="text-sm text-gray-500">
                    Loading stages...
                  </span>
                </div>
              )}
              {isUpdatingStage && (
                <div className="absolute top-full left-0 mt-1 p-2 bg-blue-100 border border-blue-200 rounded text-xs text-blue-600 z-10">
                  Updating stage...
                </div>
              )}
            </div>

            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Lead Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Email
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{leadDetails.email}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Phone
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{leadDetails.phoneNumber}</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Lead Score
                  </label>
                  <div className="mt-1">
                    <Badge
                      className={`${getScoreColor(
                        leadDetails.leadScore
                      )} text-lg px-3 py-1`}
                    >
                      {leadDetails.leadScore}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Source
                  </label>
                  <div className="mt-1">
                    <Badge variant="outline" className="text-sm">
                      {leadDetails.source}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Current Stage
                  </label>
                  <div className="mt-1">
                    {/* 🔥 CORRECTED: Using StageDisplay for consistent display */}
                    <StageDisplay
                      stageName={leadDetails.stage}
                      size="md"
                      showColor={true}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Additional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {leadDetails.countryOfInterest && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Country of Interest
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        {leadDetails.countryOfInterest}
                      </span>
                    </div>
                  </div>
                )}
                {leadDetails.courseLevel && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Course Level
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <GraduationCap className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{leadDetails.courseLevel}</span>
                    </div>
                  </div>
                )}
                {leadDetails.age && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Age
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{leadDetails.age} years</span>
                    </div>
                  </div>
                )}
                {leadDetails.experience && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Experience
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <Briefcase className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{leadDetails.experience}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {leadDetails.notes ? (
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {leadDetails.notes}
                </p>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  No notes available
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Timeline & Stats */}
        <div className="space-y-6">
          {/* Assignment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Assigned To
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium">
                    {leadDetails.assignedToName ||
                      leadDetails.assignedTo ||
                      "Unassigned"}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Assignment Method
                </label>
                <div className="mt-1">
                  <Badge variant="outline" className="text-xs">
                    {leadDetails.assignmentMethod || "Manual"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Created
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {new Date(leadDetails.createdAt).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Last Updated
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {new Date(leadDetails.updatedAt).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Department & Category */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Classification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {leadDetails.leadCategory && (
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Department
                  </label>
                  <div className="mt-1">
                    <Badge variant="outline" className="text-sm">
                      {leadDetails.leadCategory}
                    </Badge>
                  </div>
                </div>
              )}
              {leadDetails.leadCategory && (
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Category
                  </label>
                  <div className="mt-1">
                    <Badge variant="outline" className="text-sm">
                      {leadDetails.leadCategory}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          {leadDetails.tags && leadDetails.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {leadDetails.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <EditLeadModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        lead={editLead}
      />
    </div>
  );
}
