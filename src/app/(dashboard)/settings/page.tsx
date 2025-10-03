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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Users,
  RefreshCw,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import useFcmToken from "@/hooks/useFcmToken";
import {
  useRegisterFcmTokenMutation,
  useUpdateFcmTokenMutation,
  useRemoveFcmTokenMutation,
  useSendTestNotificationMutation,
  useGetFcmTokenStatusQuery,
  useGetMyFcmStatusQuery,
  useGetFirebaseStatusQuery,
  getDeviceInfo,
  isValidFcmToken,
} from "@/redux/slices/fcmApi";

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

  // Test notification form states
  const [testTitle, setTestTitle] = useState("LeadG Test Notification");
  const [testMessage, setTestMessage] = useState(
    "Testing FCM setup from settings!"
  );
  const [targetUserEmail, setTargetUserEmail] = useState("");

  // Redux mutations and queries
  const [registerToken, { isLoading: isRegistering }] =
    useRegisterFcmTokenMutation();
  const [updateToken, { isLoading: isUpdating }] = useUpdateFcmTokenMutation();
  const [removeToken, { isLoading: isRemoving }] = useRemoveFcmTokenMutation();
  const [sendTestNotification, { isLoading: isSendingTest }] =
    useSendTestNotificationMutation();

  const { data: tokenStatus, refetch: refetchTokenStatus } =
    useGetFcmTokenStatusQuery();
  const { data: myFcmStatus, refetch: refetchMyStatus } =
    useGetMyFcmStatusQuery();
  const { data: firebaseStatus } = useGetFirebaseStatusQuery();

  // Check notification support on mount
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

  // Register token when it becomes available
  useEffect(() => {
    const registerTokenAutomatically = async () => {
      if (token && isValidFcmToken(token) && !tokenStatus?.has_token) {
        try {
          const result = await registerToken({
            fcm_token: token,
            device_info: getDeviceInfo(),
          }).unwrap();

          toast.success("FCM token registered automatically!");
          console.log("Auto-registered token:", result);
          refetchTokenStatus();
          refetchMyStatus();
        } catch (error) {
          console.error("Auto-registration error:", error);
        }
      }
    };

    registerTokenAutomatically();
  }, [token, tokenStatus, registerToken, refetchTokenStatus, refetchMyStatus]);

  // Handle notification permission toggle
  const handleNotificationToggle = async (enabled: boolean) => {
    if (!notificationState.isSupported) {
      toast.error("Notifications are not supported in this browser");
      return;
    }

    try {
      if (enabled) {
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
        toast.info(
          "To disable notifications, please use your browser settings"
        );
      }
    } catch (error) {
      console.error("Error handling notification permission:", error);
      toast.error("Failed to change notification settings");
    }
  };

  // Handle manual token registration
  const handleRegisterToken = async () => {
    if (!token) {
      toast.error("No FCM token available");
      return;
    }

    try {
      const result = await registerToken({
        fcm_token: token,
        device_info: getDeviceInfo(),
      }).unwrap();

      toast.success(result.message);
      refetchTokenStatus();
      refetchMyStatus();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to register token");
    }
  };

  // Handle token update
  const handleUpdateToken = async () => {
    if (!token) {
      toast.error("No FCM token available");
      return;
    }

    try {
      const result = await updateToken({
        fcm_token: token,
        device_info: getDeviceInfo(),
      }).unwrap();

      toast.success(result.message);
      refetchTokenStatus();
      refetchMyStatus();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update token");
    }
  };

  // Handle token removal
  const handleRemoveToken = async () => {
    try {
      const result = await removeToken().unwrap();
      toast.success(result.message || "Token removed successfully");
      refetchTokenStatus();
      refetchMyStatus();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to remove token");
    }
  };

  // Send local test notification
  const sendLocalTestNotification = () => {
    if (notificationState.permission !== "granted") {
      toast.error("Please enable notifications first");
      return;
    }

    try {
      const notification = new Notification("LeadG CRM - Local Test", {
        body: "This is a local test notification from your LeadG CRM settings!",
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: "leadg-local-test",
        requireInteraction: false,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        toast.success("Local notification clicked!");
      };

      setTimeout(() => {
        notification.close();
      }, 5000);

      toast.success("Local test notification sent!");
    } catch (error) {
      console.error("Error sending local notification:", error);
      toast.error("Failed to send local test notification");
    }
  };

  // Send FCM test notification to self
  const handleSendTestToSelf = async () => {
    if (!testTitle.trim() || !testMessage.trim()) {
      toast.error("Please enter both title and message");
      return;
    }

    try {
      const result = await sendTestNotification({
        title: testTitle,
        message: testMessage,
      }).unwrap();

      toast.success(result.message || "Test notification sent to yourself!");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to send test notification");
    }
  };

  // Send FCM test notification to specific user
  const handleSendTestToUser = async () => {
    if (!testTitle.trim() || !testMessage.trim() || !targetUserEmail.trim()) {
      toast.error("Please fill all fields (title, message, and email)");
      return;
    }

    try {
      const result = await sendTestNotification({
        user_email: targetUserEmail,
        title: testTitle,
        message: testMessage,
      }).unwrap();

      toast.success(
        result.message || `Test notification sent to ${targetUserEmail}!`
      );
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to send test notification");
    }
  };

  // Get status badge
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
    if (tokenStatus?.has_token || myFcmStatus?.has_fcm_token) {
      return (
        <Badge variant="default" className="gap-1 bg-blue-500">
          <CheckCircle className="w-3 h-3" />
          Token Registered
        </Badge>
      );
    } else if (token) {
      return (
        <Badge variant="secondary" className="gap-1">
          <AlertTriangle className="w-3 h-3" />
          Token Not Registered
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
    <div className="container mx-auto py-6">
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

          {/* Firebase Status */}
          {firebaseStatus && (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">Firebase Status</h3>
                <p className="text-sm text-muted-foreground">
                  {firebaseStatus.message}
                </p>
              </div>
              <Badge
                variant={
                  firebaseStatus.firebase_initialized ? "default" : "secondary"
                }
                className={
                  firebaseStatus.firebase_initialized
                    ? "gap-1 bg-green-500"
                    : "gap-1"
                }
              >
                <CheckCircle className="w-3 h-3" />
                {firebaseStatus.firebase_initialized
                  ? "Initialized"
                  : "Not Ready"}
              </Badge>
            </div>
          )}

          {/* FCM Token Status */}
          <div className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Firebase Cloud Messaging</h3>
                {myFcmStatus && (
                  <p className="text-sm text-muted-foreground">
                    {myFcmStatus.user_email} • {myFcmStatus.device_info}
                  </p>
                )}
                {token && (
                  <p className="text-xs text-muted-foreground mt-1 font-mono">
                    {token.substring(0, 40)}...
                  </p>
                )}
              </div>
              {getFCMTokenBadge()}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleRegisterToken}
                disabled={!token || isRegistering}
                size="sm"
                variant="outline"
              >
                {isRegistering ? "Registering..." : "Register Token"}
              </Button>
              <Button
                onClick={handleUpdateToken}
                disabled={!token || isUpdating}
                size="sm"
                variant="outline"
              >
                {isUpdating ? "Updating..." : "Update Token"}
              </Button>
              <Button
                onClick={handleRemoveToken}
                disabled={isRemoving}
                size="sm"
                variant="destructive"
              >
                {isRemoving ? "Removing..." : "Remove Token"}
              </Button>
              <Button
                onClick={() => {
                  refetchTokenStatus();
                  refetchMyStatus();
                  toast.success("Status refreshed");
                }}
                size="sm"
                variant="ghost"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
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
              disabled={!notificationState.isSupported}
            />
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
                    browser's address bar or go to Settings → Privacy and
                    Security → Notifications.
                  </p>
                </div>
              </div>
            </div>
          )}

          {myFcmStatus?.has_fcm_token && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-800">
                    Notifications Ready
                  </h4>
                  <p className="text-sm text-green-700 mt-1">
                    FCM token registered at{" "}
                    {new Date(myFcmStatus.token_registered_at).toLocaleString()}
                    . You'll receive notifications for new leads and updates.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Notifications Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5" />
            Test Notifications
          </CardTitle>
          <CardDescription>
            Send test notifications to verify your setup
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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

          {/* FCM Test Form */}
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-green-500" />
              <h4 className="font-medium">Firebase FCM Test</h4>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="test-title">Notification Title</Label>
                <Input
                  id="test-title"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  placeholder="Enter notification title"
                />
              </div>

              <div>
                <Label htmlFor="test-message">Notification Message</Label>
                <Textarea
                  id="test-message"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Enter notification message"
                  rows={3}
                />
              </div>

              {/* Send to Self */}
              <Button
                onClick={handleSendTestToSelf}
                disabled={isSendingTest || !myFcmStatus?.has_fcm_token}
                className="w-full gap-2"
              >
                {isSendingTest ? (
                  <>
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Test to Myself
                  </>
                )}
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or send to another user
                  </span>
                </div>
              </div>

              {/* Send to Specific User */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>Send notification to a specific user</span>
                </div>

                <div>
                  <Label htmlFor="target-email">Target User Email</Label>
                  <Input
                    id="target-email"
                    type="email"
                    value={targetUserEmail}
                    onChange={(e) => setTargetUserEmail(e.target.value)}
                    placeholder="user@example.com"
                  />
                </div>

                <Button
                  onClick={handleSendTestToUser}
                  disabled={isSendingTest}
                  variant="secondary"
                  className="w-full gap-2"
                >
                  {isSendingTest ? (
                    <>
                      <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Test to User
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Info Message */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              Test notifications will be sent via Firebase Cloud Messaging. Make
              sure the target user has FCM token registered.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
