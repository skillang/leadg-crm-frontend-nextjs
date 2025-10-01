// src/app/campaigns/CreateCampaignModal.tsx
"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Trash2 } from "lucide-react";
import {
  useCreateCampaignMutation,
  CreateCampaignRequest,
} from "@/redux/slices/campaignsApi";
import { useGetSourcesQuery } from "@/redux/slices/sourcesApi";
import { useNotifications } from "@/components/common/NotificationSystem";
import WhatsAppTemplateSelect from "@/components/communication/whatsapp/WhatsAppTemplateSelect";
import { StageSelect } from "../common/StageSelect";
import { useGetActiveStagesQuery } from "@/redux/slices/stagesApi";
import { useGetEmailTemplatesQuery } from "@/redux/slices/emailApi";

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface TemplateEntry {
  template_id: string;
  template_name: string;
  sequence_order: number;
  custom_date?: string;
}

interface SchedulePreviewItem {
  template_name: string;
  send_date: string;
  sequence: number;
}

const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  // Form State
  const [campaignName, setCampaignName] = useState("");
  const [campaignType, setCampaignType] = useState<"whatsapp" | "email">(
    "whatsapp"
  );
  const [sendToAll, setSendToAll] = useState(false);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [useCustomDates, setUseCustomDates] = useState(false);
  const [campaignDuration, setCampaignDuration] = useState("");
  const [messageLimit, setMessageLimit] = useState("");
  const [sendTime, setSendTime] = useState("12:00");
  const [sendOnWeekends, setSendOnWeekends] = useState(true);
  const [templates, setTemplates] = useState<TemplateEntry[]>([]);
  const [schedulePreview, setSchedulePreview] = useState<SchedulePreviewItem[]>(
    []
  );
  const [showPreview, setShowPreview] = useState(false);

  const { showSuccess, showError } = useNotifications();

  // API Hooks
  const [createCampaign, { isLoading: isCreating }] =
    useCreateCampaignMutation();
  const { data: sourcesData } = useGetSourcesQuery({});
  const { data: stagesData } = useGetActiveStagesQuery({});
  const { data: emailTemplatesData, isLoading: emailTemplatesLoading } =
    useGetEmailTemplatesQuery();

  // Stage Management
  const addStageField = () => {
    setSelectedStages([...selectedStages, ""]);
  };

  const removeStageField = (index: number) => {
    setSelectedStages(selectedStages.filter((_, i) => i !== index));
  };

  const updateStage = (index: number, value: string) => {
    const updated = [...selectedStages];
    updated[index] = value;
    setSelectedStages(updated);
  };

  // Source Management
  const addSourceField = () => {
    setSelectedSources([...selectedSources, ""]);
  };

  const removeSourceField = (index: number) => {
    setSelectedSources(selectedSources.filter((_, i) => i !== index));
  };

  const updateSource = (index: number, value: string) => {
    const updated = [...selectedSources];
    updated[index] = value;
    setSelectedSources(updated);
  };

  // Template Management
  const addTemplate = () => {
    setTemplates([
      ...templates,
      {
        template_id: "",
        template_name: "",
        sequence_order: templates.length + 1,
        custom_date: useCustomDates ? "" : undefined,
      },
    ]);
  };

  const removeTemplate = (index: number) => {
    const updated = templates
      .filter((_, i) => i !== index)
      .map((t, i) => ({ ...t, sequence_order: i + 1 }));
    setTemplates(updated);
  };

  const updateTemplate = (index: number, field: string, value: string) => {
    setTemplates((prev) => {
      const newTemplates = [...prev];
      newTemplates[index] = { ...newTemplates[index], [field]: value };
      return newTemplates;
    });
  };

  // Validation
  const validateForm = () => {
    if (!campaignName.trim()) {
      showError("", "Campaign name is required");
      return false;
    }
    if (!campaignType) {
      showError("", "Campaign type is required");
      return false;
    }
    if (!sendToAll && selectedStages.filter(Boolean).length === 0) {
      showError("", "Please select at least one stage or enable 'Send to All'");
      return false;
    }
    if (!useCustomDates && !campaignDuration) {
      showError("", "Campaign duration is required");
      return false;
    }
    if (!messageLimit) {
      showError("", "Message limit is required");
      return false;
    }
    if (templates.length === 0) {
      showError("", "Please add at least one template");
      return false;
    }
    if (templates.some((t) => !t.template_id || !t.template_name)) {
      showError("", "Please fill all template fields");
      return false;
    }
    if (useCustomDates && templates.some((t) => !t.custom_date)) {
      showError("", "Please set custom dates for all templates");
      return false;
    }
    return true;
  };

  // Handle Create
  const handleCreate = async () => {
    if (!validateForm()) return;

    const payload: CreateCampaignRequest = {
      campaign_name: campaignName,
      campaign_type: campaignType,
      send_to_all: sendToAll,
      stage_ids: sendToAll ? [] : selectedStages.filter(Boolean),
      source_ids: selectedSources.filter(Boolean),
      use_custom_dates: useCustomDates,
      campaign_duration_days: useCustomDates
        ? undefined
        : parseInt(campaignDuration),
      message_limit: parseInt(messageLimit),
      send_time: sendTime,
      send_on_weekends: sendOnWeekends,
      templates: templates.map((t) => ({
        template_id: t.template_id,
        template_name: t.template_name,
        sequence_order: t.sequence_order,
        ...(useCustomDates && t.custom_date
          ? { custom_date: t.custom_date }
          : {}),
      })),
    };

    try {
      const response = await createCampaign(payload).unwrap();
      showSuccess(response.message || "", "Campaign created successfully");

      // Show preview modal
      setSchedulePreview(response.schedule_preview || []);
      setShowPreview(true);
    } catch (error: unknown) {
      showError("Failed to create campaign");
      console.error(error);
    }
  };

  // Handle Preview Close and Success
  const handlePreviewClose = () => {
    setShowPreview(false);
    resetForm();
    onSuccess();
  };

  // Reset Form
  const resetForm = () => {
    setCampaignName("");
    setCampaignType("whatsapp");
    setSendToAll(false);
    setSelectedStages([]);
    setSelectedSources([]);
    setUseCustomDates(false);
    setCampaignDuration("");
    setMessageLimit("");
    setSendTime("12:00");
    setSendOnWeekends(true);
    setTemplates([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <>
      {/* Main Create Modal - Single Dialog */}
      <Dialog open={isOpen && !showPreview} onOpenChange={handleClose}>
        <DialogContent
          className="max-w-7xl w-[95vw] max-h-[95vh] h-[95vh] flex flex-col overflow-y-auto"
          style={{ minWidth: "85%" }}
        >
          <DialogHeader>
            <DialogTitle className="text-2xl">Create New Campaign</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6">
            {/* Section 1: Campaign Basic Information */}
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <h3 className="text-lg font-semibold">
                Campaign Basic Information
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="campaignName">
                    Campaign Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="campaignName"
                    placeholder="Enter campaign name"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="campaignType">
                    Campaign Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={campaignType}
                    onValueChange={(v) =>
                      setCampaignType(v as "whatsapp" | "email")
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select campaign type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Section 2: Target Audience */}
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Target Audience</h3>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="sendToAll"
                    checked={sendToAll}
                    onCheckedChange={setSendToAll}
                  />
                  <Label htmlFor="sendToAll">Send to All Leads</Label>
                </div>
              </div>

              {/* Stages - Using StageSelect Component */}
              {!sendToAll && (
                <div className="space-y-2">
                  <Label>Select Stage</Label>
                  {selectedStages.map((stage, index) => (
                    <div key={index} className="flex gap-2">
                      <StageSelect
                        value={stage}
                        onValueChange={(v) => updateStage(index, v || "")}
                        stages={stagesData?.stages || []}
                        showLabel={false}
                        placeholder="Select stage"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeStageField(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addStageField}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Stage
                  </Button>
                </div>
              )}

              {/* Sources */}
              {!sendToAll && (
                <div className="space-y-2">
                  <Label>Select Source</Label>
                  {selectedSources.map((source, index) => (
                    <div key={index} className="flex gap-2">
                      <Select
                        value={source}
                        onValueChange={(v) => updateSource(index, v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                        <SelectContent>
                          {sourcesData?.sources.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeSourceField(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSourceField}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Source
                  </Button>
                </div>
              )}
              {sendToAll && (
                <p className="text-sm text-gray-600">
                  This automation will be set for all the leads in the system
                </p>
              )}
            </div>

            {/* Section 3: Campaign Scheduling */}
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Campaign Scheduling</h3>
                <div className="flex items-center space-x-2 mt-6">
                  <Switch
                    id="sendOnWeekends"
                    checked={sendOnWeekends}
                    onCheckedChange={setSendOnWeekends}
                  />
                  <Label htmlFor="sendOnWeekends">Send on Weekends</Label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {!useCustomDates && (
                  <div>
                    <Label htmlFor="duration">
                      Campaign Duration (Days){" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="duration"
                      type="number"
                      placeholder="e.g., 7"
                      value={campaignDuration}
                      onChange={(e) => setCampaignDuration(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="messageLimit">
                    Message Limit per Lead{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="messageLimit"
                    type="number"
                    placeholder="e.g., 3"
                    value={messageLimit}
                    onChange={(e) => setMessageLimit(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="sendTime">Send Time</Label>
                  <Input
                    id="sendTime"
                    type="time"
                    value={sendTime}
                    onChange={(e) => setSendTime(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="useCustomDates"
                    checked={useCustomDates}
                    onCheckedChange={setUseCustomDates}
                  />
                  <Label htmlFor="useCustomDates">Use Custom Dates</Label>
                </div>
              </div>
            </div>

            {/* Section 4: Select Templates */}
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <h3 className="text-lg font-semibold">Select Templates</h3>

              <div className="space-y-4">
                {templates.map((template, index) => (
                  <div
                    key={index}
                    className="flex gap-2 items-start p-4 border rounded bg-white"
                  >
                    <div className="w-16">
                      <Label>Seq</Label>
                      <Input
                        value={template.sequence_order}
                        disabled
                        className="mt-1 text-center"
                      />
                    </div>

                    {/* WhatsApp Template Select */}
                    {campaignType === "whatsapp" && (
                      <div className="flex-1">
                        <WhatsAppTemplateSelect
                          value={template.template_name}
                          onValueChange={(value) => {
                            updateTemplate(index, "template_id", value);
                            updateTemplate(index, "template_name", value);
                          }}
                          showLabel={true}
                          label="WhatsApp Template"
                          required={true}
                        />
                      </div>
                    )}

                    {/* Email Template Select */}
                    {campaignType === "email" && (
                      <div className="flex-1">
                        <Label>
                          Email Template <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={template.template_id || ""}
                          onValueChange={(value) => {
                            console.log("Selected value:", value);
                            updateTemplate(index, "template_id", value);
                            updateTemplate(index, "template_name", value);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select email template" />
                          </SelectTrigger>
                          <SelectContent
                            position="popper" // ← Add this
                            sideOffset={5} // ← And this
                          >
                            {emailTemplatesLoading ? (
                              <div className="p-2 text-center">
                                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                              </div>
                            ) : (
                              emailTemplatesData?.templates?.map(
                                (emailTemplate, idx) => (
                                  <SelectItem
                                    key={`${idx}`}
                                    value={emailTemplate.key}
                                  >
                                    {emailTemplate.name}
                                  </SelectItem>
                                )
                              )
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {useCustomDates && (
                      <div className="flex-1">
                        <Label>
                          Send Date <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="date"
                          value={template.custom_date || ""}
                          onChange={(e) =>
                            updateTemplate(index, "custom_date", e.target.value)
                          }
                          className="mt-1"
                        />
                      </div>
                    )}

                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeTemplate(index)}
                      className="mt-6"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addTemplate}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Template
                </Button>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-between mt-6 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isCreating}
              className="bg-green-600 hover:bg-green-700"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                "Create Campaign"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Preview Modal */}
      <Dialog open={showPreview} onOpenChange={handlePreviewClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Campaign Created Successfully!</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <p className="text-green-800 font-medium">
                Campaign &quot;{campaignName}&quot; has been created and{" "}
                {schedulePreview.length > 0
                  ? `enrolled ${schedulePreview.length} leads`
                  : "is ready to go"}
                !
              </p>
            </div>

            {schedulePreview.length > 0 && (
              <>
                <h4 className="font-semibold">Schedule Preview:</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {schedulePreview.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded"
                    >
                      <div>
                        <p className="font-medium">{item.template_name}</p>
                        <p className="text-sm text-gray-600">
                          Sequence: {item.sequence}
                        </p>
                      </div>
                      <p className="text-sm text-gray-700">{item.send_date}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end mt-4">
            <Button onClick={handlePreviewClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreateCampaignModal;
