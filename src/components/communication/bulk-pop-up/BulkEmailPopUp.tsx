import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import {
  setSelectedTemplate,
  setSenderPrefix,
  setIsScheduled,
  setScheduledDateTime,
  setError,
  resetBulkEmailForm,
} from "@/redux/slices/emailSlice";
import {
  useGetEmailTemplatesQuery,
  useSendBulkEmailMutation,
} from "@/redux/slices/emailApi";
import { useNotifications } from "@/components/common/NotificationSystem";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Mail,
  Calendar,
  Send,
  Loader2,
  AlertCircle,
  Users,
} from "lucide-react";
import { useAppDispatch } from "@/redux/hooks";

interface BulkEmailPopUpProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLeadIds: string[]; // Array of selected lead IDs from the table
}

const BulkEmailPopUp: React.FC<BulkEmailPopUpProps> = ({
  isOpen,
  onClose,
  selectedLeadIds,
}) => {
  const dispatch = useAppDispatch();
  const {
    selectedTemplateKey,
    selectedSenderPrefix,
    isScheduled,
    scheduledDateTime,
    error,
  } = useSelector((state: RootState) => state.email);

  // Local state for custom date/time inputs
  const [customScheduleDate, setCustomScheduleDate] = useState("");
  const [customScheduleTime, setCustomScheduleTime] = useState("");

  const { showSuccess, showError } = useNotifications();

  // API queries
  const { data: templates, isLoading: templatesLoading } =
    useGetEmailTemplatesQuery();
  const [sendBulkEmail, { isLoading: sendingEmail }] =
    useSendBulkEmailMutation();

  // Update scheduled date time when custom inputs change
  useEffect(() => {
    if (isScheduled && customScheduleDate && customScheduleTime) {
      const dateTimeString = `${customScheduleDate}T${customScheduleTime}:00`;
      dispatch(setScheduledDateTime(dateTimeString));
    } else {
      dispatch(setScheduledDateTime(""));
    }
  }, [isScheduled, customScheduleDate, customScheduleTime, dispatch]);

  // Clear error when popup opens
  useEffect(() => {
    if (isOpen) {
      dispatch(setError(""));
    }
  }, [isOpen, dispatch]);

  const handleSendBulkEmail = async () => {
    if (selectedLeadIds.length === 0) {
      dispatch(setError("No leads selected"));
      return;
    }

    if (!selectedTemplateKey) {
      dispatch(setError("Please select an email template"));
      return;
    }

    try {
      const emailData = {
        lead_ids: selectedLeadIds,
        template_key: selectedTemplateKey,
        sender_email_prefix: selectedSenderPrefix,
        ...(isScheduled &&
          scheduledDateTime && { scheduled_time: scheduledDateTime }),
      };

      await sendBulkEmail(emailData).unwrap();
      showSuccess(
        `${isScheduled ? "Scheduled" : "Sent"} bulk email to ${
          selectedLeadIds.length
        } leads!`
      );
      handleClose();
    } catch (error: unknown) {
      const errorMessage =
        error &&
        typeof error === "object" &&
        "data" in error &&
        error.data &&
        typeof error.data === "object" &&
        "detail" in error.data
          ? String(error.data.detail)
          : "Failed to send bulk email";
      dispatch(setError(errorMessage));
      showError(errorMessage);
    }
  };

  const handleReset = () => {
    dispatch(resetBulkEmailForm());
    setCustomScheduleDate("");
    setCustomScheduleTime("");
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Compose Bulk Email
          </DialogTitle>
          <DialogDescription>
            Send emails to {selectedLeadIds.length} selected lead
            {selectedLeadIds.length !== 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-4 w-4" />
              Selected Leads: {selectedLeadIds.length}
            </CardTitle>
            <CardDescription>
              Selected Leads IDs: {selectedLeadIds}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="template">Email Template *</Label>
              <Select
                value={selectedTemplateKey}
                onValueChange={(value) => dispatch(setSelectedTemplate(value))}
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
                    templates?.templates?.map((template, index) => (
                      <SelectItem key={index} value={template.key}>
                        {template.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sender">Sender Email Prefix</Label>
              <Select
                value={selectedSenderPrefix}
                onValueChange={(value) => dispatch(setSenderPrefix(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="noreply">noreply</SelectItem>
                  <SelectItem value="partnerships">partnerships</SelectItem>
                  <SelectItem value="school.connect">school.connect</SelectItem>
                  <SelectItem value="outreach">outreach</SelectItem>
                  <SelectItem value="marketing">marketing</SelectItem>
                  <SelectItem value="admin">admin</SelectItem>
                  <SelectItem value="nhr">nhr</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="schedule"
                  checked={isScheduled}
                  onCheckedChange={(checked) =>
                    dispatch(setIsScheduled(checked as boolean))
                  }
                />
                <Label htmlFor="schedule" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Schedule for later
                </Label>
              </div>

              {isScheduled && (
                <div className="space-y-3 p-4 bg-gray-50 rounded-md">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={customScheduleDate}
                      onChange={(e) => setCustomScheduleDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={customScheduleTime}
                      onChange={(e) => setCustomScheduleTime(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t">
              <div className="text-sm text-gray-600 mb-4">
                Ready to send to <strong>{selectedLeadIds.length}</strong> lead
                {selectedLeadIds.length !== 1 ? "s" : ""}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSendBulkEmail}
                  disabled={
                    sendingEmail ||
                    selectedLeadIds.length === 0 ||
                    !selectedTemplateKey
                  }
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {sendingEmail ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  {isScheduled ? "Schedule Bulk Email" : "Send Bulk Email"}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={sendingEmail}
                >
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default BulkEmailPopUp;
