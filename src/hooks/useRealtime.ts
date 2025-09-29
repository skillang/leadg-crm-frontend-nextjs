// src/hooks/useRealtime.ts
import { useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import {
  setConnectionStatus,
  setUnreadCount,
  updateUnreadCounts,
  clearUnreadCounts,
} from "@/redux/slices/whatsappSlice";
import {
  type RealtimeNotification,
  type NewMessageNotification,
  type MarkReadNotification,
  type ConnectionStatus,
} from "@/models/types/whatsapp";
import { useAppDispatch } from "@/redux/hooks";

interface UseRealtimeReturn {
  connectionStatus: ConnectionStatus;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
}

const useRealtime = (): UseRealtimeReturn => {
  const dispatch = useAppDispatch();
  const { connectionStatus, isConnected } = useSelector(
    (state: RootState) => state.whatsapp
  );

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 1000; // 1 second

  const getAuthToken = useCallback(() => {
    return localStorage.getItem("token");
  }, []);

  const getSSEUrl = useCallback(() => {
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
    return `${API_BASE_URL}/realtime/stream`; // ✅ Correct port 8000
  }, []);

  const handleRealtimeEvent = useCallback(
    (event: MessageEvent) => {
      try {
        const notification: RealtimeNotification = JSON.parse(event.data);

        console.log("📡 Real-time event received:", notification);

        switch (notification.type) {
          case "new_whatsapp_message":
            {
              const msgNotification =
                notification as unknown as NewMessageNotification;
              // Turn icon green - new unread message
              dispatch(
                setUnreadCount({
                  leadId: msgNotification.lead_id,
                  count: msgNotification.unread_count,
                })
              );

              // Show browser notification
              if (Notification.permission === "granted") {
                new Notification(
                  `New WhatsApp from ${msgNotification.lead_name}`,
                  {
                    body: msgNotification.message_preview,
                    icon: "/whatsapp-icon.png",
                    tag: msgNotification.lead_id,
                  }
                );
              }

              console.log(
                `🟢 Lead ${msgNotification.lead_id} has new message - icon should turn GREEN`
              );
            }
            break;

          case "lead_marked_read":
            {
              const readNotification =
                notification as unknown as MarkReadNotification;
              // Turn icon grey - no unread messages
              dispatch(
                setUnreadCount({
                  leadId: readNotification.lead_id,
                  count: 0,
                })
              );

              console.log(
                `🔘 Lead ${readNotification.lead_id} marked as read - icon should turn GREY`
              );
            }
            break;

          case "unread_leads_sync":
            {
              // Initial sync of all unread leads
              const unreadLeads = notification.data.unread_leads as string[];
              const unreadCounts: { [leadId: string]: number } = {};

              unreadLeads.forEach((leadId) => {
                unreadCounts[leadId] = 1; // At least 1 unread message
              });

              dispatch(updateUnreadCounts(unreadCounts));
              console.log("🔄 Synced unread leads:", unreadLeads);
            }
            break;

          case "connected":
            {
              dispatch(setConnectionStatus("connected"));
              reconnectAttemptsRef.current = 0; // Reset reconnect attempts
              console.log("✅ SSE connection established");
            }
            break;

          case "heartbeat":
            {
              // Keep connection alive - no action needed
              console.log("💓 SSE heartbeat received");
            }
            break;

          case "error":
            {
              console.error("❌ SSE error received:", notification.data);
              dispatch(setConnectionStatus("error"));
            }
            break;

          default:
            console.log("📡 Unknown real-time event:", notification);
        }
      } catch (error) {
        console.error("Error parsing real-time notification:", error);
      }
    },
    [dispatch]
  );

  const connect = useCallback(() => {
    const token = getAuthToken();

    if (!token) {
      console.warn("No auth token available for SSE connection");
      return;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      dispatch(setConnectionStatus("connecting"));

      const sseUrl = getSSEUrl();
      const eventSource = new EventSource(sseUrl);

      eventSource.onopen = () => {
        console.log("🔗 SSE connection opened");
        dispatch(setConnectionStatus("connected"));
        reconnectAttemptsRef.current = 0;
      };

      eventSource.onmessage = handleRealtimeEvent;

      eventSource.onerror = (error) => {
        console.error("❌ SSE connection error:", error);
        dispatch(setConnectionStatus("error"));

        // Auto-reconnect with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay =
            baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current);

          console.log(
            `🔄 Attempting reconnect in ${delay}ms (attempt ${
              reconnectAttemptsRef.current + 1
            }/${maxReconnectAttempts})`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        } else {
          console.error("🚫 Max reconnection attempts reached");
          dispatch(setConnectionStatus("disconnected"));
        }
      };

      eventSourceRef.current = eventSource;
    } catch (error) {
      console.error("Failed to create SSE connection:", error);
      dispatch(setConnectionStatus("error"));
    }
  }, [getSSEUrl, getAuthToken, handleRealtimeEvent, dispatch]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    dispatch(setConnectionStatus("disconnected"));
    dispatch(clearUnreadCounts());

    console.log("🔌 SSE connection disconnected");
  }, [dispatch]);

  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(connect, 1000); // Wait 1 second before reconnecting
  }, [connect, disconnect]);

  // Request notification permission on first use
  useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        console.log("🔔 Notification permission:", permission);
      });
    }
  }, []);

  // Auto-connect when hook is first used
  useEffect(() => {
    const token = getAuthToken();
    if (token && connectionStatus === "disconnected") {
      connect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect, connectionStatus, getAuthToken]);

  // Handle page visibility changes (reconnect when tab becomes active)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        connectionStatus === "disconnected"
      ) {
        console.log("🔄 Page became visible, reconnecting SSE...");
        connect();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [connect, connectionStatus]);

  return {
    connectionStatus,
    isConnected,
    connect,
    disconnect,
    reconnect,
  };
};

export default useRealtime;
