// Updated WhatsAppMessageModal component with smart messaging

import React, { useState, useEffect } from "react";
import { SmartWhatsAppService } from "../../services/smartWhatsAppService";
import { WhatsAppService } from "../../services/whatsappService";
import { WHATSAPP_TEMPLATES } from "../../config/whatsappConfig";

interface WhatsAppMessageModalProps {
  contact: {
    id: string;
    name: string;
    phone: string;
    isNewLead?: boolean;
    isTrial?: boolean;
  };
  isOpen: boolean;
  onClose: () => void;
}

const WhatsAppMessageModal: React.FC<WhatsAppMessageModalProps> = ({
  contact,
  isOpen,
  onClose,
}) => {
  const [messageType, setMessageType] = useState<
    "smart" | "template" | "freeform"
  >("smart");
  const [selectedTemplate, setSelectedTemplate] = useState("lead_new");
  const [customMessage, setCustomMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [conversationStatus, setConversationStatus] = useState<any>(null);
  const [recommendedApproach, setRecommendedApproach] = useState<any>(null);

  useEffect(() => {
    if (isOpen && contact.phone) {
      checkConversationStatus();
      getRecommendedApproach();
    }
  }, [isOpen, contact.phone]);

  const checkConversationStatus = async () => {
    try {
      const status = await WhatsAppService.checkConversationValidity(
        contact.phone
      );
      setConversationStatus(status);
    } catch (error) {
      console.error("Error checking conversation status:", error);
    }
  };

  const getRecommendedApproach = async () => {
    try {
      const approach = await SmartWhatsAppService.getRecommendedApproach(
        contact.phone
      );
      setRecommendedApproach(approach);
    } catch (error) {
      console.error("Error getting recommended approach:", error);
    }
  };

  const handleSendSmartMessage = async () => {
    setLoading(true);
    setResult(null);

    try {
      let response;

      switch (messageType) {
        case "smart":
          // 🎯 SMART MESSAGING - Automatically chooses best approach
          if (contact.isNewLead) {
            response = await SmartWhatsAppService.sendWelcomeToNewLead(
              contact.phone,
              contact.name
            );
          } else if (contact.isTrial) {
            response = await SmartWhatsAppService.sendTrialWelcome(
              contact.phone
            );
          } else {
            response = await SmartWhatsAppService.sendFollowUp(
              contact.phone,
              customMessage,
              contact.name
            );
          }
          break;

        case "template":
          // 🔒 FORCE TEMPLATE - Guaranteed delivery
          response = await SmartWhatsAppService.sendTemplateMessage(
            contact.phone,
            contact.name,
            selectedTemplate === "lead_new" ? "new_lead" : "trial"
          );
          break;

        case "freeform":
          // ⚠️ FREE-FORM - Only works in 24-hour window
          response = await WhatsAppService.sendTextMessage({
            contact: contact.phone,
            message: customMessage,
          });
          break;
      }

      setResult(response);

      if (response.success) {
        // Auto-close modal on success
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const getQuickActions = () => {
    return [
      {
        label: "🎉 Welcome New Lead",
        action: () =>
          SmartWhatsAppService.sendWelcomeToNewLead(
            contact.phone,
            contact.name
          ),
        description: "Send welcome template to new lead",
      },
      {
        label: "🚀 Trial Welcome",
        action: () => SmartWhatsAppService.sendTrialWelcome(contact.phone),
        description: "Send trial welcome template",
      },
      {
        label: "📞 Smart Follow-up",
        action: () =>
          SmartWhatsAppService.sendFollowUp(
            contact.phone,
            `Hi ${contact.name}, following up on your interest in our services. How can we help you today?`,
            contact.name
          ),
        description:
          "Intelligent follow-up (template or free-form based on conversation status)",
      },
    ];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              WhatsApp Message - {contact.name}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Lead Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-md">
            <p>
              <strong>Name:</strong> {contact.name}
            </p>
            <p>
              <strong>Phone:</strong> {contact.phone}
            </p>
            {contact.isNewLead && (
              <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                New Lead
              </span>
            )}
            {contact.isTrial && (
              <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs ml-2">
                Trial User
              </span>
            )}
          </div>

          {/* Conversation Status */}
          {recommendedApproach && (
            <div
              className={`mb-6 p-4 rounded-md ${
                recommendedApproach.canSendFreeform
                  ? "bg-green-50 border border-green-200"
                  : "bg-yellow-50 border border-yellow-200"
              }`}
            >
              <h3 className="font-semibold mb-2">
                {recommendedApproach.canSendFreeform
                  ? "✅ Active Conversation"
                  : "⚠️ Template Required"}
              </h3>
              <p className="text-sm">{recommendedApproach.reason}</p>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">
              🚀 Quick Actions (Recommended)
            </h3>
            <div className="grid gap-3">
              {getQuickActions().map((action, index) => (
                <button
                  key={index}
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const response = await action.action();
                      setResult(response);
                    } catch (error) {
                      setResult({
                        success: false,
                        error:
                          error instanceof Error
                            ? error.message
                            : String(error),
                      });
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="p-3 border border-gray-300 rounded-md hover:bg-gray-50 text-left disabled:bg-gray-100"
                >
                  <div className="font-medium">{action.label}</div>
                  <div className="text-sm text-gray-600">
                    {action.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Manual Message Options */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">
              📝 Manual Message
            </h3>

            {/* Message Type Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setMessageType("smart")}
                  className={`p-2 text-sm rounded ${
                    messageType === "smart"
                      ? "bg-blue-100 border-2 border-blue-500"
                      : "bg-gray-100 border border-gray-300"
                  }`}
                >
                  🧠 Smart
                </button>
                <button
                  onClick={() => setMessageType("template")}
                  className={`p-2 text-sm rounded ${
                    messageType === "template"
                      ? "bg-green-100 border-2 border-green-500"
                      : "bg-gray-100 border border-gray-300"
                  }`}
                >
                  📋 Template
                </button>
                <button
                  onClick={() => setMessageType("freeform")}
                  className={`p-2 text-sm rounded ${
                    messageType === "freeform"
                      ? "bg-yellow-100 border-2 border-yellow-500"
                      : "bg-gray-100 border border-gray-300"
                  }`}
                >
                  ✍️ Free-form
                </button>
              </div>
            </div>

            {/* Template Selection */}
            {messageType === "template" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Template
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="lead_new">lead_new - Welcome New Lead</option>
                  <option value="trial">trial - Trial Welcome</option>
                </select>
              </div>
            )}

            {/* Custom Message */}
            {(messageType === "freeform" || messageType === "smart") && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Message{" "}
                  {messageType === "freeform" &&
                    !recommendedApproach?.canSendFreeform && (
                      <span className="text-red-600">
                        (⚠️ May fail - use template instead)
                      </span>
                    )}
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Enter your message..."
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-md"
                />
              </div>
            )}

            <button
              onClick={handleSendSmartMessage}
              disabled={
                loading || (messageType === "freeform" && !customMessage)
              }
              className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading
                ? "Sending..."
                : `Send ${
                    messageType === "smart"
                      ? "Smart"
                      : messageType === "template"
                      ? "Template"
                      : "Free-form"
                  } Message`}
            </button>
          </div>

          {/* Result */}
          {result && (
            <div
              className={`p-4 rounded-md ${
                result.success
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <h3 className="font-semibold mb-2">
                {result.success
                  ? "✅ Message Sent Successfully!"
                  : "❌ Message Failed"}
              </h3>
              <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppMessageModal;
