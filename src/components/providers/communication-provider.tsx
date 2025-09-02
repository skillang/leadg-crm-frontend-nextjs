"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import {
  setConnectionStatus,
  setUnreadCount,
  updateUnreadCounts,
  // clearUnreadCounts,
} from "@/redux/slices/whatsappSlice";
import { useGetBulkUnreadStatusQuery } from "@/redux/slices/whatsappApi";
import {
  type RealtimeNotification,
  type NewMessageNotification,
  type MarkReadNotification,
  type ConnectionStatus,
} from "@/models/types/whatsapp";

// Communication Context Interface
interface CommunicationContextType {
  // WhatsApp specific
  getUnreadCount: (leadId: string) => number;
  hasUnreadMessages: (leadId: string) => boolean;
  markLeadAsRead: (leadId: string) => void;

  // Connection status
  connectionStatus: ConnectionStatus;
  isConnected: boolean;

  // Actions
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;

  // Future: Email, SMS, Call methods can be added here
}

const CommunicationContext = createContext<
  CommunicationContextType | undefined
>(undefined);

interface CommunicationProviderProps {
  children: React.ReactNode;
}

export const CommunicationProvider: React.FC<CommunicationProviderProps> = ({
  children,
}) => {
  const dispatch = useDispatch();
  const { connectionStatus, isConnected, unreadCounts } = useSelector(
    (state: RootState) => state.whatsapp
  );

  // SSE Connection Management
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 1000;

  // 🆕 Fetch initial unread counts on mount
  const {
    data: bulkUnreadData,
    // isLoading: isLoadingUnread,
    // error: unreadError,
  } = useGetBulkUnreadStatusQuery(undefined, {
    // Only fetch if user is logged in
    skip: !localStorage.getItem("token"),
  });

  // Initialize unread counts from API
  useEffect(() => {
    if (bulkUnreadData?.success && bulkUnreadData.unread_details) {
      const initialCounts: { [leadId: string]: number } = {};

      // Use unread_details instead of unread_leads since unread_leads is just an array of IDs
      bulkUnreadData.unread_details.forEach((lead) => {
        initialCounts[lead.lead_id] = lead.unread_count;
      });

      dispatch(updateUnreadCounts(initialCounts));
      console.log(
        "🔄 Initialized unread counts for",
        Object.keys(initialCounts).length,
        "leads"
      );
    }
  }, [bulkUnreadData, dispatch]);

  // Auth token management
  const getAuthToken = useCallback(() => {
    return localStorage.getItem("token");
  }, []);

  const getSSEUrl = useCallback(() => {
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
    return `${API_BASE_URL}/realtime/stream`;
  }, []);

  // Handle real-time events
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
              dispatch(
                setUnreadCount({
                  leadId: msgNotification.lead_id,
                  count: msgNotification.unread_count,
                })
              );

              // Show browser notification if permission granted
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
                `🟢 Lead ${msgNotification.lead_id} has new message - badge should turn GREEN`
              );
            }
            break;

          case "lead_marked_read":
            {
              const readNotification =
                notification as unknown as MarkReadNotification;
              dispatch(
                setUnreadCount({
                  leadId: readNotification.lead_id,
                  count: 0,
                })
              );

              console.log(
                `🔘 Lead ${readNotification.lead_id} marked as read - badge should turn GREY`
              );
            }
            break;

          case "unread_leads_sync":
            {
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
              reconnectAttemptsRef.current = 0;
              console.log("✅ SSE connection established");
            }
            break;

          case "heartbeat":
            // Keep connection alive - no action needed
            break;

          default:
            console.log("📡 Unknown notification type:", notification.type);
        }
      } catch (error) {
        console.error("Error parsing real-time event:", error);
      }
    },
    [dispatch]
  );

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      console.log("🔌 SSE connection closed");
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    dispatch(setConnectionStatus("disconnected"));
  }, [dispatch]);

  // SSE Connection Management
  const connect = useCallback(() => {
    const token = getAuthToken();
    if (!token) {
      console.warn("⚠️ No auth token available for SSE connection");
      return;
    }

    if (eventSourceRef.current) {
      console.log("🔌 SSE already connected, skipping");
      return;
    }

    try {
      dispatch(setConnectionStatus("connecting"));
      const url = `${getSSEUrl()}?token=${encodeURIComponent(token)}`;

      console.log("🔌 Connecting to SSE:", url);

      eventSourceRef.current = new EventSource(url);

      eventSourceRef.current.onopen = () => {
        console.log("✅ SSE connection opened");
        dispatch(setConnectionStatus("connected"));
        reconnectAttemptsRef.current = 0;
      };

      eventSourceRef.current.onmessage = handleRealtimeEvent;

      eventSourceRef.current.onerror = (error) => {
        console.error("❌ SSE connection error:", error);
        dispatch(setConnectionStatus("error"));

        // Auto-reconnect logic
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay =
            baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current);
          console.log(
            `🔄 Reconnecting in ${delay}ms (attempt ${
              reconnectAttemptsRef.current + 1
            })`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            disconnect();
            connect();
          }, delay);
        } else {
          console.error("💥 Max reconnection attempts reached");
          dispatch(setConnectionStatus("disconnected"));
        }
      };
    } catch (error) {
      console.error("Failed to establish SSE connection:", error);
      dispatch(setConnectionStatus("error"));
    }
  }, [getAuthToken, getSSEUrl, handleRealtimeEvent, dispatch, disconnect]);

  const reconnect = useCallback(() => {
    console.log("🔄 Manual reconnection triggered");
    disconnect();
    setTimeout(connect, 1000);
  }, [disconnect, connect]);

  // Auto-connect on mount and when auth token changes
  useEffect(() => {
    const token = getAuthToken();
    if (token && !eventSourceRef.current) {
      console.log("🚀 Auto-connecting SSE on mount");
      connect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect, getAuthToken]);

  // Request browser notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        console.log("🔔 Notification permission:", permission);
      });
    }
  }, []);

  // WhatsApp specific functions
  const getUnreadCount = useCallback(
    (leadId: string): number => {
      return unreadCounts[leadId] || 0;
    },
    [unreadCounts]
  );

  const hasUnreadMessages = useCallback(
    (leadId: string): boolean => {
      return (unreadCounts[leadId] || 0) > 0;
    },
    [unreadCounts]
  );

  const markLeadAsRead = useCallback(
    (leadId: string) => {
      dispatch(setUnreadCount({ leadId, count: 0 }));
    },
    [dispatch]
  );

  const contextValue: CommunicationContextType = {
    // WhatsApp
    getUnreadCount,
    hasUnreadMessages,
    markLeadAsRead,

    // Connection
    connectionStatus,
    isConnected,

    // Actions
    connect,
    disconnect,
    reconnect,
  };

  return (
    <CommunicationContext.Provider value={contextValue}>
      {children}
    </CommunicationContext.Provider>
  );
};

export const useCommunication = () => {
  const context = useContext(CommunicationContext);
  if (context === undefined) {
    throw new Error(
      "useCommunication must be used within a CommunicationProvider"
    );
  }
  return context;
};

export default CommunicationProvider;
