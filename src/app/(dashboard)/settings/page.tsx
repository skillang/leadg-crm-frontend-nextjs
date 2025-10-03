"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  TestTube,
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Send,
  Smartphone,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import useFcmToken from "@/hooks/useFcmToken";

interface NotificationState {
  permission: NotificationPermission;
  isEnabled: boolean;
  isSupported: boolean;
}

export default function SettingsPage() {
  const { token, notificationPermissionStatus } = useFcmToken();
  const [notificationState, setNotificationState] = useState<NotificationState>(
    {
      permission: "default",
      isEnabled: false,
      isSupported: false,
    }
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingFCM, setIsSendingFCM] = useState(false);

  // Check notification support and current permission on component mount
  useEffect(() => {
    const checkNotificationSupport = () => {
      const isSupported = "Notification" in window;
      const permission = isSupported ? Notification.permission : "denied";
      const isEnabled = permission === "granted";

      setNotificationState({
        permission,
        isEnabled,
        isSupported,
      });
    };

    checkNotificationSupport();
  }, []);

  // Sync with FCM hook state
  useEffect(() => {
    if (notificationPermissionStatus) {
      setNotificationState((prev) => ({
        ...prev,
        permission: notificationPermissionStatus,
        isEnabled: notificationPermissionStatus === "granted",
      }));
    }
  }, [notificationPermissionStatus]);

  // Handle notification permission toggle
  const handleNotificationToggle = async (enabled: boolean) => {
    if (!notificationState.isSupported) {
      toast.error("Notifications are not supported in this browser");
      return;
    }

    setIsLoading(true);

    try {
      if (enabled) {
        // Request permission
        const permission = await Notification.requestPermission();

        if (permission === "granted") {
          setNotificationState((prev) => ({
            ...prev,
            permission: "granted",
            isEnabled: true,
          }));
          toast.success("Notifications enabled successfully!");
        } else {
          setNotificationState((prev) => ({
            ...prev,
            permission: permission,
            isEnabled: false,
          }));
          toast.error("Notification permission was denied");
        }
      } else {
        // Note: We can't programmatically revoke permission, user has to do it manually
        toast.info(
          "To disable notifications, please use your browser settings"
        );
      }
    } catch (error) {
      console.error("Error handling notification permission:", error);
      toast.error("Failed to change notification settings");
    } finally {
      setIsLoading(false);
    }
  };

  // Send test notification using native Web API
  const sendLocalTestNotification = () => {
    if (notificationState.permission !== "granted") {
      toast.error("Please enable notifications first");
      return;
    }

    try {
      // Create notification
      const notification = new Notification("LeadG CRM - Local Test", {
        body: "This is a local test notification from your LeadG CRM settings!",
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: "leadg-local-test",
        requireInteraction: false,
      });

      // Handle notification click
      notification.onclick = () => {
        window.focus();
        notification.close();
        toast.success("Local notification clicked!");
      };

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      toast.success("Local test notification sent!");
    } catch (error) {
      console.error("Error sending local notification:", error);
      toast.error("Failed to send local test notification");
    }
  };

  // Send test notification via Firebase FCM API
  const sendFCMTestNotification = async () => {
    if (!token) {
      toast.error(
        "FCM token not available. Please enable notifications first."
      );
      return;
    }

    if (notificationState.permission !== "granted") {
      toast.error("Please enable notifications first");
      return;
    }

    setIsSendingFCM(true);

    try {
      const response = await fetch("/send-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: token,
          title: "LeadG CRM - FCM Test",
          message: "This is a Firebase Cloud Messaging test from LeadG CRM!",
          link: "/dashboard",
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("FCM test notification sent successfully!");
        console.log("FCM notification sent:", data);
      } else {
        toast.error("Failed to send FCM notification");
        console.error("FCM error:", data.error);
      }
    } catch (error) {
      console.error("Error sending FCM notification:", error);
      toast.error("Failed to send FCM test notification");
    } finally {
      setIsSendingFCM(false);
    }
  };

  // Get status badge component
  const getStatusBadge = () => {
    if (!notificationState.isSupported) {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="w-3 h-3" />
          Not Supported
        </Badge>
      );
    }

    switch (notificationState.permission) {
      case "granted":
        return (
          <Badge variant="default" className="gap-1 bg-green-500">
            <CheckCircle className="w-3 h-3" />
            Enabled
          </Badge>
        );
      case "denied":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="w-3 h-3" />
            Denied
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="gap-1">
            <AlertTriangle className="w-3 h-3" />
            Not Set
          </Badge>
        );
    }
  };

  // Get FCM token status badge
  const getFCMTokenBadge = () => {
    if (token) {
      return (
        <Badge variant="default" className="gap-1 bg-blue-500">
          <CheckCircle className="w-3 h-3" />
          Token Ready
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary" className="gap-1">
          <XCircle className="w-3 h-3" />
          No Token
        </Badge>
      );
    }
  };

  return (
    <div className="container mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="w-8 h-8" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your LeadG CRM preferences and notification settings
        </p>
      </div>

      {/* Notification Settings Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Configure how you receive notifications from LeadG CRM
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Browser Support Status */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Browser Support</h3>
              <p className="text-sm text-muted-foreground">
                {notificationState.isSupported
                  ? "Your browser supports web notifications"
                  : "Your browser doesn't support web notifications"}
              </p>
            </div>
            {getStatusBadge()}
          </div>

          {/* FCM Token Status */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Firebase Cloud Messaging</h3>
              <p className="text-sm text-muted-foreground">
                {token
                  ? `FCM Token: ${token.substring(0, 20)}...`
                  : "FCM token not available"}
              </p>
            </div>
            {getFCMTokenBadge()}
          </div>

          {/* Notification Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="notifications" className="text-base font-medium">
                Enable Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive browser notifications for important updates and new
                leads
              </p>
            </div>
            <Switch
              id="notifications"
              checked={notificationState.isEnabled}
              onCheckedChange={handleNotificationToggle}
              disabled={!notificationState.isSupported || isLoading}
            />
          </div>

          {/* Test Notifications Section */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Test Notifications</h3>

            {/* Local Test Notification */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-blue-500" />
                <div>
                  <h4 className="font-medium">Local Browser Test</h4>
                  <p className="text-sm text-muted-foreground">
                    Test native browser notifications (local only)
                  </p>
                </div>
              </div>
              <Button
                onClick={sendLocalTestNotification}
                disabled={notificationState.permission !== "granted"}
                variant="outline"
                className="gap-2"
              >
                <TestTube className="w-4 h-4" />
                Test Local
              </Button>
            </div>

            {/* FCM Test Notification */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-green-500" />
                <div>
                  <h4 className="font-medium">Firebase FCM Test</h4>
                  <p className="text-sm text-muted-foreground">
                    Test Firebase Cloud Messaging via API
                  </p>
                </div>
              </div>
              <Button
                onClick={sendFCMTestNotification}
                disabled={
                  !token ||
                  notificationState.permission !== "granted" ||
                  isSendingFCM
                }
                variant="outline"
                className="gap-2"
              >
                {isSendingFCM ? (
                  <>
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Test FCM
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Status Information */}
          {notificationState.permission === "denied" && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-orange-800">
                    Notifications Blocked
                  </h4>
                  <p className="text-sm text-orange-700 mt-1">
                    To enable notifications, click the notification icon in your
                    browsers address bar or go to Settings → Privacy and
                    Security → Notifications and allow notifications for this
                    site.
                  </p>
                </div>
              </div>
            </div>
          )}

          {notificationState.permission === "granted" && token && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-800">
                    Notifications Ready
                  </h4>
                  <p className="text-sm text-green-700 mt-1">
                    You will receive notifications for new leads, task
                    reminders, and important updates. Both local and Firebase
                    Cloud Messaging are configured properly.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
