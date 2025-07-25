// src/components/emails/EmailDialog.tsx
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import {
  closeEmailDialog,
  setActiveTab,
  setSelectedTemplate,
  setSenderPrefix,
  setIsScheduled,
  setScheduledDateTime,
  setError,
} from "@/redux/slices/emailSlice";
import {
  useGetEmailTemplatesQuery,
  useSendEmailToLeadMutation,
  useGetLeadEmailHistoryQuery,
} from "@/redux/slices/emailApi";
import { useGetLeadsQuery, useGetMyLeadsQuery } from "@/redux/slices/leadsApi";
import { useNotifications } from "@/components/common/NotificationSystem";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Mail,
  User,
  Clock,
  Send,
  Calendar,
  Phone,
  MapPin,
  Building,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { format, parseISO } from "date-fns";

const EmailDialog: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const {
    emailDialogOpen,
    currentLeadId,
    activeTab,
    selectedTemplateKey,
    selectedSenderPrefix,
    isScheduled,
    scheduledDateTime,
    error,
  } = useSelector((state: RootState) => state.email);

  const [customScheduleDate, setCustomScheduleDate] = useState("");
  const [customScheduleTime, setCustomScheduleTime] = useState("");
  const [currentLead, setCurrentLead] = useState<any>(null);

  const { showSuccess, showError } = useNotifications();
  const isAdmin = user?.role === "admin";

  // API queries - Get leads to find the specific lead
  const { data: leadsData } = isAdmin
    ? useGetLeadsQuery({ limit: 1000 }, { skip: !currentLeadId })
    : useGetMyLeadsQuery({ limit: 1000 }, { skip: !currentLeadId });

  const { data: templates, isLoading: templatesLoading } =
    useGetEmailTemplatesQuery();
  const { data: emailHistory, isLoading: historyLoading } =
    useGetLeadEmailHistoryQuery(
      { leadId: currentLeadId || "", page: 1, limit: 10 },
      { skip: !currentLeadId }
    );

  // Send email mutation
  const [sendEmail, { isLoading: sendingEmail }] = useSendEmailToLeadMutation();

  // Find current lead from the fetched data
  React.useEffect(() => {
    if (currentLeadId && leadsData) {
      const leads = Array.isArray(leadsData)
        ? leadsData
        : leadsData?.leads || [];
      const lead = leads.find(
        (l: any) => l.id === currentLeadId || l.leadId === currentLeadId
      );
      setCurrentLead(lead);
    }
  }, [currentLeadId, leadsData]);

  useEffect(() => {
    if (isScheduled && customScheduleDate && customScheduleTime) {
      const dateTimeString = `${customScheduleDate}T${customScheduleTime}:00`;
      dispatch(setScheduledDateTime(dateTimeString));
    } else {
      dispatch(setScheduledDateTime(""));
    }
  }, [isScheduled, customScheduleDate, customScheduleTime, dispatch]);

  const handleClose = () => {
    dispatch(closeEmailDialog());
    setCustomScheduleDate("");
    setCustomScheduleTime("");
  };

  const handleSendEmail = async () => {
    if (!currentLeadId || !selectedTemplateKey) {
      dispatch(setError("Please select a template"));
      return;
    }

    try {
      const emailData = {
        template_key: selectedTemplateKey,
        sender_email_prefix: selectedSenderPrefix,
        ...(isScheduled &&
          scheduledDateTime && { scheduled_time: scheduledDateTime }),
      };

      await sendEmail({ leadId: currentLeadId, data: emailData }).unwrap();
      showSuccess(
        isScheduled
          ? "Email scheduled successfully!"
          : "Email sent successfully!"
      );
      handleClose();
    } catch (error: any) {
      const errorMessage = error?.data?.detail || "Failed to send email";
      dispatch(setError(errorMessage));
      showError(errorMessage);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      sent: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      pending: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-gray-100 text-gray-800",
    };

    return (
      <Badge
        className={`${variants[status as keyof typeof variants]} border-0`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <Dialog open={emailDialogOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Communication
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(value) => dispatch(setActiveTab(value as any))}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="send" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Send Email
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Mail History
            </TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-4">
            {!currentLead ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Lead Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">
                        Name
                      </Label>
                      <p className="font-medium">{currentLead.name}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">
                        Email
                      </Label>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <p>{currentLead.email}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">
                        Phone
                      </Label>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <p>
                          {currentLead.contact ||
                            currentLead.phoneNumber ||
                            "Not provided"}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">
                        Location
                      </Label>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <p>{currentLead.current_location || "Not provided"}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">
                        Stage
                      </Label>
                      <Badge variant="outline">{currentLead.stage}</Badge>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">
                        Status
                      </Label>
                      <Badge variant="outline">{currentLead.status}</Badge>
                    </div>
                  </div>

                  {currentLead.lastContacted && (
                    <div className="pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        Last contacted:{" "}
                        {format(
                          parseISO(currentLead.lastContacted),
                          "PPP at p"
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Send Email Tab */}
          <TabsContent value="send" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Compose Email</CardTitle>
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
                    onValueChange={(value) =>
                      dispatch(setSelectedTemplate(value))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an email template" />
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
                      <SelectItem value="support">support</SelectItem>
                      <SelectItem value="partnerships">partnerships</SelectItem>
                      <SelectItem value="school.connect">
                        school.connect
                      </SelectItem>
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
                    <Label
                      htmlFor="schedule"
                      className="flex items-center gap-2"
                    >
                      <Calendar className="h-4 w-4" />
                      Schedule for later
                    </Label>
                  </div>

                  {isScheduled && (
                    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-md">
                      <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={customScheduleDate}
                          onChange={(e) =>
                            setCustomScheduleDate(e.target.value)
                          }
                          min={new Date().toISOString().split("T")[0]}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="time">Time</Label>
                        <Input
                          id="time"
                          type="time"
                          value={customScheduleTime}
                          onChange={(e) =>
                            setCustomScheduleTime(e.target.value)
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSendEmail}
                    disabled={sendingEmail || !selectedTemplateKey}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {sendingEmail ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Mail className="mr-2 h-4 w-4" />
                    )}
                    {isScheduled ? "Schedule Email" : "Send Email"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Email History</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {historyLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : emailHistory?.emails?.length ? (
                    <div className="space-y-3">
                      {emailHistory.emails.map((email) => (
                        <div
                          key={email.email_id}
                          className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(email.status)}
                                <span className="font-medium">
                                  {email.template_name}
                                </span>
                                {getStatusBadge(email.status)}
                              </div>
                              <div className="text-sm text-gray-600">
                                From: {email.sender_email}
                              </div>
                              <div className="text-sm text-gray-500">
                                Created:{" "}
                                {format(parseISO(email.created_at), "PPP at p")}
                              </div>
                              {email.scheduled_time && (
                                <div className="text-sm text-blue-600">
                                  Scheduled:{" "}
                                  {format(
                                    parseISO(email.scheduled_time),
                                    "PPP at p"
                                  )}
                                </div>
                              )}
                              {email.sent_time && (
                                <div className="text-sm text-green-600">
                                  Sent:{" "}
                                  {format(
                                    parseISO(email.sent_time),
                                    "PPP at p"
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No email history found for this lead
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default EmailDialog;
