// // src/components/whatsapp/MessageHistory.tsx
// "use client";

// import React, { useEffect, useRef, useState } from "react";
// import { Button } from "@/components/ui/button";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import {
//   RefreshCw,
//   MessageSquare,
//   User,
//   Wifi,
//   WifiOff,
//   Check,
// } from "lucide-react";
// import { cn } from "@/lib/utils";

// interface WhatsAppMessage {
//   id: string;
//   message_id: string;
//   direction: "incoming" | "outgoing";
//   message_type: "text" | "template" | "document" | "image" | "audio" | "video";
//   content: string;
//   timestamp: string;
//   status: "sent" | "delivered" | "read" | "failed" | "pending";
//   is_read: boolean;
//   sent_by_name: string | null;
// }

// interface MessageHistoryData {
//   success: boolean;
//   lead_id: string;
//   lead_name: string;
//   phone_number: string;
//   messages: WhatsAppMessage[];
//   total_messages: number;
//   unread_count: number;
//   last_activity: string;
//   pagination: null | any;
// }

// interface MessageHistoryProps {
//   leadId: string;
//   isEnabled: boolean;
// }

// const MessageHistory: React.FC<MessageHistoryProps> = ({
//   leadId,
//   isEnabled,
// }) => {
//   const scrollAreaRef = useRef<HTMLDivElement>(null);
//   const messagesEndRef = useRef<HTMLDivElement>(null);
//   const [newMessageAlert, setNewMessageAlert] = useState(false);
//   const [connectionStatus, setConnectionStatus] = useState<
//     "connected" | "connecting" | "disconnected"
//   >("connecting");

//   const formatTime = (timestamp: string) => {
//     const date = new Date(timestamp);
//     const now = new Date();
//     const diffTime = Math.abs(now.getTime() - date.getTime());
//     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

//     if (diffDays === 1) {
//       return date.toLocaleTimeString([], {
//         hour: "2-digit",
//         minute: "2-digit",
//       });
//     } else if (diffDays <= 7) {
//       return date.toLocaleDateString([], {
//         weekday: "short",
//         hour: "2-digit",
//         minute: "2-digit",
//       });
//     } else {
//       return date.toLocaleDateString([], {
//         month: "short",
//         day: "numeric",
//         hour: "2-digit",
//         minute: "2-digit",
//       });
//     }
//   };

//   const formatMessageContent = (message: WhatsAppMessage) => {
//     if (message.message_type === "template") {
//       return message.content;
//     }
//     return message.content;
//   };

//   const getMessageTypeIcon = (type: string) => {
//     switch (type) {
//       case "template":
//         return "📄";
//       case "image":
//         return "🖼️";
//       case "document":
//         return "📎";
//       case "audio":
//         return "🎵";
//       case "video":
//         return "🎥";
//       default:
//         return null;
//     }
//   };

//   const getConnectionIcon = () => {
//     switch (connectionStatus) {
//       case "connected":
//         return <Wifi className="h-3 w-3 text-green-600" />;
//       case "connecting":
//         return (
//           <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
//         );
//       case "disconnected":
//         return <WifiOff className="h-3 w-3 text-red-600" />;
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className="flex flex-col items-center justify-center py-12 space-y-4">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
//         <p className="text-sm text-muted-foreground">
//           Loading message history...
//         </p>
//       </div>
//     );
//   }

//   if (!messageHistory || !messageHistory.success) {
//     return (
//       <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
//         <MessageSquare className="h-12 w-12 text-muted-foreground" />
//         <div>
//           <h3 className="font-medium text-foreground">No Message History</h3>
//           <p className="text-sm text-muted-foreground mt-1">
//             No WhatsApp messages found for this lead.
//           </p>
//         </div>
//         <Button variant="outline" onClick={forceRefresh} size="sm">
//           <RefreshCw className="h-4 w-4 mr-2" />
//           Refresh
//         </Button>
//       </div>
//     );
//   }

//   const { lead_name, phone_number } = messageHistory;

//   if (!messages || messages.length === 0) {
//     return (
//       <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
//         <MessageSquare className="h-12 w-12 text-muted-foreground" />
//         <div>
//           <h3 className="font-medium text-foreground">No Messages Yet</h3>
//           <p className="text-sm text-muted-foreground mt-1">
//             Start the conversation by sending a message to {lead_name}.
//           </p>
//         </div>
//         <Button variant="outline" onClick={forceRefresh} size="sm">
//           <RefreshCw className="h-4 w-4 mr-2" />
//           Refresh
//         </Button>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-4">
//       {/* Header with Stats and Connection Status */}
//       <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
//         <div className="space-y-1">
//           <h3 className="font-medium text-foreground flex items-center">
//             <MessageSquare className="mr-2 h-4 w-4" />
//             Conversation with {lead_name}
//           </h3>
//           <div className="flex items-center space-x-4 text-sm text-muted-foreground">
//             <span>
//               {phone_number} • {totalMessages} messages
//             </span>
//             {unreadCount > 0 && (
//               <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
//                 {unreadCount} unread
//               </span>
//             )}
//             <div className="flex items-center space-x-1">
//               {getConnectionIcon()}
//               <span className="text-xs">
//                 {connectionStatus === "connected" && "Live"}
//                 {connectionStatus === "connecting" && "Syncing..."}
//                 {connectionStatus === "disconnected" && "Offline"}
//               </span>
//             </div>
//           </div>
//         </div>
//         <div className="flex items-center space-x-2">
//           {newMessageAlert && (
//             <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full text-xs font-medium animate-pulse">
//               New message!
//             </div>
//           )}
//           <Button
//             variant="ghost"
//             onClick={forceRefresh}
//             size="sm"
//             disabled={isFetching}
//           >
//             <RefreshCw
//               className={cn("h-4 w-4", isFetching && "animate-spin")}
//             />
//           </Button>
//         </div>
//       </div>

//       {/* Messages Container */}
//       <div className="border rounded-lg bg-white dark:bg-gray-950">
//         <ScrollArea className="h-[500px] p-4" ref={scrollAreaRef}>
//           <div className="space-y-3">
//             {messages.map((message, index) => {
//               const isOutgoing = message.direction === "outgoing";
//               const icon = getMessageTypeIcon(message.message_type);

//               return (
//                 <div
//                   key={message.id}
//                   className={cn(
//                     "flex",
//                     isOutgoing ? "justify-end" : "justify-start"
//                   )}
//                 >
//                   <div
//                     className={cn(
//                       "max-w-[70%] rounded-lg px-3 py-2 text-sm shadow-sm transition-all duration-300",
//                       isOutgoing
//                         ? "bg-green-500 text-white rounded-br-sm"
//                         : "bg-gray-100 dark:bg-gray-800 text-foreground rounded-bl-sm"
//                     )}
//                   >
//                     {/* Message Type Icon */}
//                     {icon && (
//                       <div className="mb-1">
//                         <span className="text-xs opacity-75">{icon}</span>
//                       </div>
//                     )}

//                     {/* Message Content */}
//                     <div className="break-words">
//                       {formatMessageContent(message)}
//                     </div>

//                     {/* Message Metadata */}
//                     <div
//                       className={cn(
//                         "flex items-center justify-between mt-1 text-xs",
//                         isOutgoing ? "text-green-100" : "text-muted-foreground"
//                       )}
//                     >
//                       <div className="flex items-center space-x-2">
//                         <Check className="h-3 w-3" />
//                         <span>{formatTime(message.timestamp)}</span>
//                       </div>

//                       {/* Sender Name for Outgoing Messages */}
//                       {isOutgoing && message.sent_by_name && (
//                         <div className="flex items-center space-x-1">
//                           <User className="h-3 w-3" />
//                           <span className="truncate max-w-20">
//                             {message.sent_by_name}
//                           </span>
//                         </div>
//                       )}
//                     </div>

//                     {/* Status for Outgoing Messages */}
//                     {isOutgoing && (
//                       <div className="text-right">
//                         <span
//                           className={cn(
//                             "text-xs",
//                             message.status === "delivered" ||
//                               message.status === "read"
//                               ? "text-green-100"
//                               : message.status === "failed"
//                               ? "text-red-200"
//                               : "text-green-200"
//                           )}
//                         >
//                           {message.status === "sent" && "Sent"}
//                           {message.status === "delivered" && "Delivered"}
//                           {message.status === "read" && "Read"}
//                           {message.status === "failed" && "Failed"}
//                           {message.status === "pending" && "Sending..."}
//                         </span>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               );
//             })}
//             <div ref={messagesEndRef} />
//           </div>
//         </ScrollArea>
//       </div>

//       {/* Footer Info */}
//       <div className="text-center">
//         <p className="text-xs text-muted-foreground">
//           {hasNewMessages && (
//             <span className="text-green-600 font-medium">● </span>
//           )}
//           Total of {totalMessages} messages • Last activity:{" "}
//           {lastActivity && formatTime(lastActivity)}
//           {isDetecting && <span className="text-green-600 ml-2">● Live</span>}
//         </p>
//       </div>
//     </div>
//   );
// };

// export default MessageHistory;
