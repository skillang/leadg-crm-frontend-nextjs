// src/components/calling/CallControls.tsx
"use client";

import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Phone,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MessageSquare,
  NotebookPen,
} from "lucide-react";
import type { RootState } from "@/redux/store";
import {
  setCallInProgress,
  setCallError,
  setCallSuccess,
} from "@/redux/slices/tataTeliSlice";
import { useClickToCallMutation } from "@/redux/slices/tataTeliApi";
import { CallValidation } from "@/models/types/tatatTeli";
import { Lead } from "@/models/types/lead";
import { useNotifications } from "../../common/NotificationSystem";

// ✅ ADD THESE IMPORTS
import { useGetActiveStagesQuery } from "@/redux/slices/stagesApi";
import { useGetActiveStatusesQuery } from "@/redux/slices/statusesApi";
import {
  useUpdateLeadStageMutation,
  useUpdateLeadMutation,
} from "@/redux/slices/leadsApi";
import { useCreateNoteMutation } from "@/redux/slices/notesApi";
import { StatusSelect } from "@/components/common/StatusSelect";
import { StageSelect } from "@/components/common/StageSelect";
import { useStageUtils } from "@/components/common/StageDisplay";

interface CallControlsProps {
  leadDetails: Lead; // Lead details from API
  validation: CallValidation;
  // ✅ ADD REFETCH PROP
  refetch?: () => void;
}

// Define interface for API error handling
interface CallApiError {
  message?: string;
  data?: {
    detail?: string;
  };
}

const CallControls: React.FC<CallControlsProps> = ({
  validation,
  leadDetails,
  refetch,
}) => {
  const dispatch = useDispatch();
  const { isCallInProgress, callError, currentLeadId } = useSelector(
    (state: RootState) => state.tataTeli
  );

  // ✅ ADD STATE FOR UPDATING
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // ✅ ADD NOTES STATE
  const [noteTitle, setNoteTitle] = useState("");
  const [noteDescription, setNoteDescription] = useState("");
  const [isCreatingNote, setIsCreatingNote] = useState(false);

  // ✅ ADD QUERIES AND MUTATIONS
  const { data: stagesData, isLoading: stagesLoading } =
    useGetActiveStagesQuery({});
  const { data: statusesData, isLoading: statusesLoading } =
    useGetActiveStatusesQuery({});
  const [updateStage] = useUpdateLeadStageMutation();
  const [updateLead] = useUpdateLeadMutation();
  const [createNote] = useCreateNoteMutation();
  const { getStageDisplayName } = useStageUtils();

  // Click to call mutation
  const [clickToCall] = useClickToCallMutation();
  const { showSuccess, showError } = useNotifications();

  // ✅ ADD STAGE CHANGE HANDLER
  const handleStageChange = async (newStage: string) => {
    if (!leadDetails || newStage === leadDetails.stage) return;

    setIsUpdatingStage(true);
    try {
      await updateStage({
        leadId: leadDetails.leadId,
        stage: newStage,
      }).unwrap();

      const stageDisplayName = getStageDisplayName(newStage);
      showSuccess(
        `${leadDetails.name}'s stage updated to "${stageDisplayName}"`,
        "Lead Stage updated successfully!"
      );

      if (refetch) refetch();
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

  // ✅ ADD STATUS CHANGE HANDLER
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

      if (refetch) refetch();
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

  // ✅ ADD CREATE NOTE HANDLER
  const handleCreateNote = async () => {
    if (!noteTitle.trim()) {
      showError("Note title is required", "Missing Title");
      return;
    }

    if (!leadDetails?.leadId) {
      showError("Lead ID not found", "Error");
      return;
    }

    setIsCreatingNote(true);
    try {
      await createNote({
        leadId: leadDetails.leadId,
        noteData: {
          title: noteTitle.trim(),
          content: noteDescription.trim() || "",
          tags: [],
        },
      }).unwrap();

      showSuccess(`Note "${noteTitle}" created successfully`, "Note Created");

      // Clear form
      setNoteTitle("");
      setNoteDescription("");
    } catch (err: unknown) {
      const error = err as {
        message?: string;
        data?: { detail?: { msg: string }[] | string };
      };

      let errorMessage = "Failed to create note";
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

      showError(`Failed to create note: ${errorMessage}`);
    } finally {
      setIsCreatingNote(false);
    }
  };

  const handleMakeCall = async () => {
    if (!currentLeadId) return;

    dispatch(setCallInProgress(true));

    try {
      await clickToCall({
        lead_id: currentLeadId,
      }).unwrap();

      dispatch(setCallSuccess());
      showSuccess("Call initiated successfully!", "Call Initiated");
    } catch (error: unknown) {
      const callError = error as CallApiError;
      const errorMessage =
        callError?.message || callError?.data?.detail || "Failed to make call";
      dispatch(setCallError(errorMessage));
      showError(`Call failed because: ${errorMessage}`, "Call Failed ");
    }
  };

  const canMakeCall = validation.canCall === true && !isCallInProgress;

  const renderCallStatus = () => {
    if (isCallInProgress) {
      return (
        <Alert className="border-blue-200 bg-blue-50">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Initiating Call...</strong> Please wait while we connect
            your call.
          </AlertDescription>
        </Alert>
      );
    }

    if (callError) {
      return (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Call Failed:</strong> {callError}
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  };

  const renderValidationWarning = () => {
    if (validation.canCall === false) {
      return (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Cannot Make Call:</strong> Please resolve validation issues
            in the &quot;Validate&quot; tab first.
          </AlertDescription>
        </Alert>
      );
    }

    if (validation.canCall === null && !validation.isValidating) {
      return (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Validation Required:</strong> Please validate the call in
            the &quot;Validate&quot; tab first.
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  };

  return (
    <div className="space-y-4">
      {/* Call Status */}
      {renderCallStatus()}
      {renderValidationWarning()}
      <div className="flex  justify-between items-center gap-2">
        {/* Success State */}
        {!isCallInProgress && !callError && validation.canCall === true && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Ready to make call. Click &quot;Make Call&quot; to initiate the
              connection.
            </AlertDescription>
          </Alert>
        )}
        {/* Make Call Button - Moved to top */}
        <div className="flex justify-end">
          <Button
            onClick={handleMakeCall}
            disabled={!canMakeCall}
            size="lg"
            className="px-8 py-3"
          >
            {isCallInProgress ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Making Call...
              </>
            ) : (
              <>
                <Phone className="mr-2 h-5 w-5" />
                Make Call
              </>
            )}
          </Button>
        </div>
      </div>
      {/* Lead Updates Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <MessageSquare className="mr-2 h-5 w-5" />
            Lead Updates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* ✅ STAGE AND STATUS SELECTS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Stage Select */}
            <div className="space-y-2">
              <div className="relative">
                <StageSelect
                  value={leadDetails.stage}
                  onValueChange={handleStageChange}
                  stages={stagesData?.stages || []}
                  disabled={isUpdatingStage}
                  isLoading={stagesLoading}
                  placeholder="Select stage"
                  className="w-full"
                />
                {isUpdatingStage && (
                  <div className="absolute top-full left-0 mt-1 p-2 bg-blue-100 border border-blue-200 rounded text-xs text-blue-600 z-10">
                    Updating stage...
                  </div>
                )}
              </div>
            </div>

            {/* Status Select */}
            <div className="space-y-2">
              <div className="relative">
                <StatusSelect
                  value={leadDetails.status || "active"}
                  onValueChange={handleStatusChange}
                  statuses={statusesData?.statuses || []}
                  disabled={isUpdatingStatus}
                  isLoading={statusesLoading}
                  placeholder="Select status"
                  className="w-full"
                />
                {isUpdatingStatus && (
                  <div className="absolute top-full left-0 mt-1 p-2 bg-green-100 border border-green-200 rounded text-xs text-green-600 z-10">
                    Updating status...
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ✅ NEW: Notes Creation Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <NotebookPen className="mr-2 h-5 w-5" />
            Add Note
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Note Title */}
          <div className="space-y-2">
            <Label htmlFor="noteTitle">Note Title *</Label>
            <Input
              id="noteTitle"
              type="text"
              placeholder="Enter note title..."
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              disabled={isCreatingNote}
            />
          </div>

          {/* Note Description */}
          <div className="space-y-2">
            <Label htmlFor="noteDescription">Note Description (Optional)</Label>
            <Textarea
              id="noteDescription"
              placeholder="Add note description or details..."
              value={noteDescription}
              onChange={(e) => setNoteDescription(e.target.value)}
              rows={3}
              disabled={isCreatingNote}
            />
          </div>

          {/* Create Note Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleCreateNote}
              disabled={isCreatingNote || !noteTitle.trim()}
              size="sm"
              variant="outline"
            >
              {isCreatingNote ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <NotebookPen className="mr-2 h-4 w-4" />
                  Create Note
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CallControls;
