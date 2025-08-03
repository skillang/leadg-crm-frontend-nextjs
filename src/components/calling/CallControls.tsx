// src/components/calling/CallControls.tsx
"use client";

import React from "react";
import { useSelector, useDispatch } from "react-redux";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Phone,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";
import type { RootState } from "@/redux/store";
import {
  setCallNotes,
  setCallPurpose,
  setCallPriority,
  setCallInProgress,
  setCallError,
  setCallSuccess,
} from "@/redux/slices/tataTeliSlice";
import { useClickToCallMutation } from "@/redux/slices/tataTeliApi";
import { CallValidation } from "@/models/types/tatatTeli";
import { Lead } from "@/models/types/lead";
import { useNotifications } from "../common/NotificationSystem";

interface CallControlsProps {
  leadDetails: Lead; // Lead details from API
  validation: CallValidation;
}

// Define interface for API error handling
interface CallApiError {
  message?: string;
  data?: {
    detail?: string;
  };
}

// Priority options
const PRIORITY_OPTIONS = [
  { value: "normal", label: "Normal Priority" },
  { value: "high", label: "High Priority" },
  { value: "low", label: "Low Priority" },
];

const CallControls: React.FC<CallControlsProps> = ({ validation }) => {
  const dispatch = useDispatch();
  const {
    callNotes,
    callPurpose,
    callPriority,
    isCallInProgress,
    callError,
    currentLeadId,
  } = useSelector((state: RootState) => state.tataTeli);

  // Click to call mutation
  const [clickToCall] = useClickToCallMutation();
  const { showSuccess, showError } = useNotifications();

  const handleMakeCall = async () => {
    if (!currentLeadId) return;

    dispatch(setCallInProgress(true));

    try {
      await clickToCall({
        lead_id: currentLeadId,
        notes: callNotes || undefined,
        call_purpose: callPurpose || undefined,
        priority: callPriority || undefined,
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
      {/* Lead Summary */}
      {/* <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <User className="mr-2 h-5 w-5" />
            Calling: {leadDetails.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Phone Number</p>
              <p className="font-medium">
                {validation.leadPhone ||
                  leadDetails.phoneNumber ||
                  leadDetails.contact ||
                  "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Lead ID</p>
              <p className="font-medium">{leadDetails.leadId}</p>
            </div>
          </div>
        </CardContent>
      </Card> */}

      {/* Call Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <MessageSquare className="mr-2 h-5 w-5" />
            Call Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Call Purpose - Changed to Input field */}
          <div className="space-y-2">
            <Label htmlFor="callPurpose">Call Purpose (Optional)</Label>
            <Input
              id="callPurpose"
              type="text"
              placeholder="Enter call purpose (e.g., Sales Follow-up, Initial Contact, Documentation)"
              value={callPurpose || ""}
              onChange={(e) => dispatch(setCallPurpose(e.target.value))}
            />
          </div>

          {/* Priority - No default selection */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority (Optional)</Label>
            <Select
              value={callPriority || ""}
              onValueChange={(value) => dispatch(setCallPriority(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority (optional)" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Call Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this call..."
              value={callNotes}
              onChange={(e) => dispatch(setCallNotes(e.target.value))}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Make Call Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleMakeCall}
          disabled={!canMakeCall}
          size="lg"
          className="px-8 py-3 "
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
  );
};

export default CallControls;
