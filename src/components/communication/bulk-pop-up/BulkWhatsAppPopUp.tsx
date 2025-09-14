import React, { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MessageSquare,
  Calendar as CalendarIcon,
  Loader2,
  AlertCircle,
  Clock,
  Users,
  EyeOff,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
// Import your RTK queries and mutations
import {
  useGetTemplatesQuery,
  useCreateBulkWhatsAppJobMutation,
} from "@/redux/slices/whatsappApi";
import TemplatePreview from "../whatsapp/TemplatePreview";

interface BulkJobRequestData {
  job_name: string;
  message_type: "template" | "text";
  lead_ids: string[];
  batch_size: number;
  delay_between_messages: number;
  template_name?: string;
  message_content?: string;
  scheduled_time?: string;
}

interface BulkWhatsAppPopUpProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLeadIds: string[]; // Array of selected lead IDs from the table
}

const BulkWhatsAppPopUp: React.FC<BulkWhatsAppPopUpProps> = ({
  isOpen,
  onClose,
  selectedLeadIds,
}) => {
  // Local state for the popup
  const [bulkJobName, setBulkJobName] = useState("");
  const [bulkMessageType, setBulkMessageType] = useState<"template" | "text">(
    "template"
  );
  const [bulkSelectedTemplate, setBulkSelectedTemplate] = useState("");
  const [bulkMessageContent, setBulkMessageContent] = useState("");
  const [bulkIsScheduled, setBulkIsScheduled] = useState(false);
  const [bulkScheduledDateTime, setBulkScheduledDateTime] = useState("");
  const [bulkBatchSize, setBulkBatchSize] = useState(10);
  const [bulkDelayBetweenMessages, setBulkDelayBetweenMessages] = useState(2);
  const [bulkError, setBulkError] = useState("");

  // Date/time state
  const [customScheduleTime, setCustomScheduleTime] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // RTK Query hooks
  const { data: templates, isLoading: templatesLoading } =
    useGetTemplatesQuery();
  const [createBulkJob, { isLoading: isCreatingJob }] =
    useCreateBulkWhatsAppJobMutation();
  const selectedTemplateData = templates?.find(
    (template) =>
      template.template_name === bulkSelectedTemplate ||
      template.name === bulkSelectedTemplate
  );

  // Handle scheduling - SIMPLIFIED (backend handles timezone conversion)
  useEffect(() => {
    if (bulkIsScheduled && selectedDate && customScheduleTime) {
      const year = selectedDate.getFullYear();
      const month = (selectedDate.getMonth() + 1).toString().padStart(2, "0");
      const day = selectedDate.getDate().toString().padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;
      const dateTimeString = `${dateString} ${customScheduleTime}:00`;
      setBulkScheduledDateTime(dateTimeString);
    } else {
      setBulkScheduledDateTime("");
    }
  }, [bulkIsScheduled, selectedDate, customScheduleTime]);

  // Handle form submission
  const handleSendBulkWhatsApp = async () => {
    if (selectedLeadIds.length === 0) {
      setBulkError("Please select at least one lead");
      return;
    }

    if (!bulkJobName.trim()) {
      setBulkError("Please enter a job name");
      return;
    }

    if (bulkMessageType === "template" && !bulkSelectedTemplate) {
      setBulkError("Please select a WhatsApp template");
      return;
    }

    if (bulkMessageType === "text" && !bulkMessageContent.trim()) {
      setBulkError("Please enter message content");
      return;
    }

    try {
      const requestData: BulkJobRequestData = {
        job_name: bulkJobName,
        message_type: bulkMessageType,
        lead_ids: selectedLeadIds,
        batch_size: bulkBatchSize,
        delay_between_messages: bulkDelayBetweenMessages,
      };

      if (bulkMessageType === "template") {
        requestData.template_name = bulkSelectedTemplate || undefined;
      } else {
        requestData.message_content = bulkMessageContent;
      }

      if (bulkIsScheduled && bulkScheduledDateTime) {
        requestData.scheduled_time = bulkScheduledDateTime;
      }

      const result = await createBulkJob(requestData).unwrap();

      // Success - close popup and show success message
      onClose();
      // You can add a toast notification here
      console.log(
        `${bulkIsScheduled ? "Scheduled" : "Created"} WhatsApp job for ${
          result.total_recipients
        } leads! Job ID: ${result.job_id}`
      );
    } catch (error: unknown) {
      const errorMessage =
        error &&
        typeof error === "object" &&
        "data" in error &&
        error.data &&
        typeof error.data === "object" &&
        "detail" in error.data
          ? String(error.data.detail)
          : "Failed to create WhatsApp job";
      setBulkError(errorMessage);
    }
  };

  const handleReset = () => {
    setBulkJobName("");
    setBulkMessageType("template");
    setBulkSelectedTemplate("");
    setBulkMessageContent("");
    setBulkIsScheduled(false);
    setBulkScheduledDateTime("");
    setBulkBatchSize(10);
    setBulkDelayBetweenMessages(2);
    setBulkError("");
    setCustomScheduleTime("");
    setSelectedDate(undefined);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Compose Bulk WhatsApp
          </DialogTitle>
          <DialogDescription>
            Send WhatsApp messages to {selectedLeadIds.length} selected lead
            {selectedLeadIds.length !== 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-4 w-4" />
              Selected Leads: {selectedLeadIds.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {bulkError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{bulkError}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="jobName">Job Name *</Label>
              <Input
                id="jobName"
                placeholder="e.g., Weekly Follow-up Campaign"
                value={bulkJobName}
                onChange={(e) => setBulkJobName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="messageType">Message Type</Label>
              <Select
                value={bulkMessageType}
                onValueChange={(value: "template" | "text") =>
                  setBulkMessageType(value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="template">WhatsApp Template</SelectItem>
                  <SelectItem value="text">Custom Text Message</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {bulkMessageType === "template" ? (
              <div className="flex justify-between items-end">
                <div className="space-y-2">
                  <Label htmlFor="template">WhatsApp Template *</Label>
                  <Select
                    value={bulkSelectedTemplate || ""}
                    onValueChange={setBulkSelectedTemplate}
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
                        templates?.map((template, index) => (
                          <SelectItem
                            key={index}
                            value={
                              template.template_name || template.name || ""
                            }
                          >
                            {template.display_name ||
                              template.name ||
                              "Unnamed Template"}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {bulkMessageType === "template" && selectedTemplateData && (
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsPreviewMode(!isPreviewMode)}
                    >
                      {isPreviewMode ? (
                        <>
                          <EyeOff className="mr-2 h-4 w-4" />
                          Hide Preview
                        </>
                      ) : (
                        <>
                          <Eye className="mr-2 h-4 w-4" />
                          Show Preview
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="messageContent">Message Content *</Label>
                <Textarea
                  id="messageContent"
                  placeholder="Enter your custom message here. You can use {lead_name} for personalization."
                  value={bulkMessageContent}
                  onChange={(e) => setBulkMessageContent(e.target.value)}
                  rows={4}
                />
                <p className="text-sm text-muted-foreground">
                  Use {"{lead_name}"} to personalize messages
                </p>
              </div>
            )}

            {selectedTemplateData &&
              isPreviewMode &&
              bulkMessageType === "template" && (
                <TemplatePreview
                  template={selectedTemplateData}
                  parameters={{ lead_name: "[Lead Name]" }}
                />
              )}

            <Separator />

            {/* Batch Settings */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Batch Size: {bulkBatchSize}</Label>
                <Slider
                  value={[bulkBatchSize]}
                  onValueChange={(value) => setBulkBatchSize(value[0])}
                  max={50}
                  min={1}
                  step={1}
                />
                <p className="text-sm text-muted-foreground">
                  Number of messages to send simultaneously
                </p>
              </div>

              <div className="space-y-2">
                <Label>
                  Delay Between Messages: {bulkDelayBetweenMessages}s
                </Label>
                <Slider
                  value={[bulkDelayBetweenMessages]}
                  onValueChange={(value) =>
                    setBulkDelayBetweenMessages(value[0])
                  }
                  max={10}
                  min={1}
                  step={1}
                />
                <p className="text-sm text-muted-foreground">
                  Delay in seconds between each message
                </p>
              </div>
            </div>

            <Separator />

            {/* Scheduling */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="schedule"
                  checked={bulkIsScheduled}
                  onCheckedChange={(checked) =>
                    setBulkIsScheduled(checked as boolean)
                  }
                />
                <Label htmlFor="schedule" className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Schedule for later
                </Label>
              </div>

              {bulkIsScheduled && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-md border">
                  {/* Date Picker with Calendar */}
                  <div className="space-y-2">
                    <Label>Select Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !selectedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? (
                            format(selectedDate, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Time Picker */}
                  <div className="space-y-2">
                    <Label htmlFor="time">Select Time</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {/* Hour Selector */}
                      <Select
                        value={customScheduleTime.split(":")[0] || ""}
                        onValueChange={(hour) => {
                          const minute =
                            customScheduleTime.split(":")[1] || "00";
                          setCustomScheduleTime(`${hour}:${minute}`);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Hour" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, i) => (
                            <SelectItem
                              key={i}
                              value={i.toString().padStart(2, "0")}
                            >
                              {i.toString().padStart(2, "0")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Minute Selector */}
                      <Select
                        value={customScheduleTime.split(":")[1] || ""}
                        onValueChange={(minute) => {
                          const hour = customScheduleTime.split(":")[0] || "00";
                          setCustomScheduleTime(`${hour}:${minute}`);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Minute" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 60 }, (_, i) => (
                            <SelectItem
                              key={i}
                              value={i.toString().padStart(2, "0")}
                            >
                              {i.toString().padStart(2, "0")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Display Selected Date/Time */}
                  {selectedDate && customScheduleTime && (
                    <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                      <div className="flex items-center gap-2 text-blue-700">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Scheduled for:{" "}
                          {format(selectedDate, "EEEE, MMMM do, yyyy")} at{" "}
                          {customScheduleTime}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Helper Text */}
                  <div className="text-xs text-gray-500">
                    Backend automatically handles timezone conversion to UTC
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t">
              <div className="text-sm text-gray-600 mb-4">
                Ready to message <strong>{selectedLeadIds.length}</strong> lead
                {selectedLeadIds.length !== 1 ? "s" : ""}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSendBulkWhatsApp}
                  disabled={
                    isCreatingJob ||
                    selectedLeadIds.length === 0 ||
                    !bulkJobName.trim() ||
                    (bulkMessageType === "template" && !bulkSelectedTemplate) ||
                    (bulkMessageType === "text" && !bulkMessageContent.trim())
                  }
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isCreatingJob ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <MessageSquare className="mr-2 h-4 w-4" />
                  )}
                  {bulkIsScheduled
                    ? "Schedule WhatsApp Job"
                    : "Create WhatsApp Job"}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={isCreatingJob}
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

export default BulkWhatsAppPopUp;
