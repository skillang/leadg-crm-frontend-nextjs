// src/components/whatsapp/ChatHistoryTab.tsx
"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useAppDispatch } from "@/redux/hooks";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, Loader2 } from "lucide-react";
import { useGetChatHistoryQuery } from "@/redux/slices/whatsappApi";
import {
  initializeChatHistory,
  setUnreadCount,
  resetChatPagination,
  // setLoadingHistory,
  // setChatError,
  // addChatMessage,
} from "@/redux/slices/whatsappSlice";
import useWhatsApp from "@/hooks/useWhatsApp";

const ChatHistoryTab: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    sendChatMessage,
    currentLead,
    hasUnreadMessages,
    chatHistory,
    chatPagination,
    loadMoreMessages,
    isLoadingHistory,
  } = useWhatsApp();

  // Message input state
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [hasViewedMessages, setHasViewedMessages] = useState(false);

  // Track the current lead ID to only reset when lead actually changes
  const [currentLeadId, setCurrentLeadId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Only fetch if we don't have data for this lead OR if it's a new lead
  const shouldSkip =
    !currentLead?.leadId ||
    (isInitialized &&
      currentLead.leadId === currentLeadId &&
      chatHistory.length > 0);

  // Initial fetch - get first batch of messages using existing RTK Query
  const {
    data: initialChatData,
    isLoading: isLoadingInitial,
    error: chatQueryError,
    refetch: refetchChatHistory,
  } = useGetChatHistoryQuery(
    {
      leadId: currentLead?.leadId || "",
      limit: chatPagination.messagesPerBatch,
      offset: 0,
      autoMarkRead: true,
    },
    {
      skip: shouldSkip,
    }
  );

  // Only reset and initialize when lead actually changes
  useEffect(() => {
    if (currentLead?.leadId && currentLead.leadId !== currentLeadId) {
      console.log(
        `🔄 Lead changed from ${currentLeadId} to ${currentLead.leadId}, resetting chat`
      );

      // Reset state for new lead
      setHasViewedMessages(false);
      setCurrentLeadId(currentLead.leadId);
      setIsInitialized(false);

      // Reset pagination only when lead changes
      dispatch(resetChatPagination());
    }
  }, [currentLead?.leadId, currentLeadId, dispatch]);

  // Initialize chat history when data loads
  useEffect(() => {
    if (
      initialChatData?.success &&
      initialChatData.messages &&
      currentLead?.leadId &&
      !isInitialized
    ) {
      console.log(
        `📥 Initializing chat history for lead ${currentLead.leadId}`
      );

      dispatch(
        initializeChatHistory({
          messages: initialChatData.messages,
          totalMessages: initialChatData.total_messages || 0,
          messagesPerBatch: chatPagination.messagesPerBatch,
        })
      );

      dispatch(
        setUnreadCount({
          leadId: currentLead.leadId,
          count: initialChatData.unread_count,
        })
      );

      setIsInitialized(true);
    }
  }, [
    initialChatData,
    dispatch,
    currentLead?.leadId,
    chatPagination.messagesPerBatch,
    isInitialized,
  ]);

  // Mark messages as read when user views the tab
  useEffect(() => {
    if (initialChatData?.success && !hasViewedMessages && currentLead?.leadId) {
      setHasViewedMessages(true);

      const markAsRead = async () => {
        try {
          const token = localStorage.getItem("token");
          if (!token) return;

          const API_BASE_URL =
            process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

          await fetch(
            `${API_BASE_URL}/notifications/whatsapp/${currentLead.leadId}/mark-read`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          dispatch(
            setUnreadCount({
              leadId: currentLead.leadId,
              count: 0,
            })
          );
        } catch (error) {
          console.error("Failed to mark messages as read:", error);
        }
      };

      markAsRead();
    }
  }, [initialChatData, hasViewedMessages, currentLead?.leadId, dispatch]);

  // Auto-scroll to top when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current && chatHistory.length > 0) {
      // Only auto-scroll for new messages (when it's not pagination)
      if (chatPagination.currentOffset === chatPagination.messagesPerBatch) {
        setTimeout(() => {
          if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = 0; // Scroll to top for newest messages
          }
        }, 100);
      }
    }
  }, [
    chatHistory.length,
    chatPagination.currentOffset,
    chatPagination.messagesPerBatch,
  ]);

  // Load more messages using Redux
  const handleLoadMoreMessages = useCallback(async () => {
    if (!currentLead?.leadId) return;

    // Save current scroll position before loading more
    const currentScrollHeight = scrollAreaRef.current?.scrollHeight || 0;

    await loadMoreMessages(currentLead.leadId);

    // After loading, maintain scroll position relative to the new content
    setTimeout(() => {
      if (scrollAreaRef.current) {
        const newScrollHeight = scrollAreaRef.current.scrollHeight;
        const scrollDifference = newScrollHeight - currentScrollHeight;
        scrollAreaRef.current.scrollTop = scrollDifference;
      }
    }, 100);
  }, [currentLead?.leadId, loadMoreMessages]);

  // Send message handler
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentLead?.leadId || isSending) return;

    try {
      setIsSending(true);

      // Send the message
      await sendChatMessage(currentLead.leadId, newMessage.trim());

      // Clear input
      setNewMessage("");

      // Scroll to top after sending (since newest messages are at top)
      setTimeout(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = 0;
        }
      }, 100);
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleRetry = () => {
    refetchChatHistory();
  };

  // Convert RTK Query error to string
  const getErrorMessage = () => {
    if (chatQueryError) {
      if ("status" in chatQueryError) {
        return `API Error: ${chatQueryError.status}`;
      } else if ("message" in chatQueryError) {
        return chatQueryError.message;
      }
      return "Failed to load chat history";
    }
    return null;
  };

  // 🔧 FIXED: Proper message sorting
  // Sort messages by timestamp to ensure correct chronological order
  // Newest messages should appear at the top of the chat
  const sortedMessages = [...chatHistory].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  if (isLoadingInitial || isLoadingHistory) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-3">Loading chat history...</span>
      </div>
    );
  }

  const errorMessage = getErrorMessage();
  if (errorMessage) {
    return (
      <div className="text-center py-8 text-red-600">
        <p>Error loading chat history: {errorMessage}</p>
        <Button variant="outline" onClick={handleRetry} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col border rounded-lg">
      {/* Chat Header with Total Messages Count */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50 dark:bg-gray-900 rounded-t-lg">
        <div className="flex items-center">
          <MessageCircle className="h-5 w-5 text-green-600 mr-2" />
          <div>
            <h3 className="font-medium">{currentLead?.name}</h3>
            <p className="text-sm text-gray-500">{currentLead?.phoneNumber}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {/* Total Messages Count */}
          <div className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded-full">
            <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
              {chatPagination.totalMessages}{" "}
              {chatPagination.totalMessages === 1 ? "message" : "messages"}
            </span>
          </div>
          {hasUnreadMessages(currentLead?.leadId || "") && (
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
          )}
        </div>
      </div>

      {/* Message Input - At the top */}
      <div className="p-4 border-b bg-gray-50 dark:bg-gray-900">
        <div className="flex space-x-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isSending}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Messages Area - Newest at top */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {/* Messages - Newest first (properly sorted) */}
          {sortedMessages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No messages yet. Start a conversation!</p>
            </div>
          ) : (
            sortedMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.direction === "outgoing"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-lg ${
                    message.direction === "outgoing"
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs opacity-70">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                    {message.direction === "outgoing" && (
                      <span className="text-xs opacity-70">
                        {message.status === "sent"
                          ? "✓"
                          : message.status === "delivered"
                          ? "✓✓"
                          : message.status === "read"
                          ? "✓✓"
                          : "⏳"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {/* Load More Button - At the top for older messages */}
        {chatPagination.hasMoreMessages && (
          <div className="text-center pb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadMoreMessages}
              disabled={chatPagination.isLoadingMore}
              className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900 border-blue-200 dark:border-blue-800"
            >
              {chatPagination.isLoadingMore ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading older messages...
                </>
              ) : (
                <>
                  Load older messages (
                  {Math.max(
                    0,
                    chatPagination.totalMessages - chatHistory.length
                  )}{" "}
                  remaining)
                </>
              )}
            </Button>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default ChatHistoryTab;
