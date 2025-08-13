// Your existing formatDate function (keep as is)
export function formatDate(dateString: string): string {
  if (!dateString) return "Not available";
  return new Date(dateString).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ✅ NEW: More precise time calculations
export function getTimeSinceContact(lastContactedDate: string): string {
  if (!lastContactedDate) return "Never";

  const now = new Date();
  const lastContact = new Date(lastContactedDate);
  const diffInMinutes = Math.floor(
    (now.getTime() - lastContact.getTime()) / (1000 * 60)
  );
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  return `${Math.floor(diffInDays / 30)} months ago`;
}

// ✅ NEW: Contact status color helper
export function getContactBadgeColor(lastContactedDate: string): string {
  if (!lastContactedDate) return "bg-gray-100 text-gray-600";

  const now = new Date();
  const lastContact = new Date(lastContactedDate);
  const diffInDays = Math.floor(
    (now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffInDays === 0) return "bg-green-100 text-green-700";
  if (diffInDays <= 3) return "bg-blue-100 text-blue-700";
  if (diffInDays <= 7) return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-700";
}

// ✅ NEW: Smart format - show only time ago if less than 24h, otherwise show date + time ago
export function formatContactDate(lastContactedDate: string): string {
  if (!lastContactedDate) return "Never contacted";

  const now = new Date();
  const lastContact = new Date(lastContactedDate);
  const diffInMinutes = Math.floor(
    (now.getTime() - lastContact.getTime()) / (1000 * 60)
  );
  const diffInHours = Math.floor(diffInMinutes / 60);

  // If less than 24 hours, show only time ago
  if (diffInHours < 24) {
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
    return `${diffInHours}h ago`;
  }

  // If 24+ hours, show date + time ago
  const formatted = formatDate(lastContactedDate);
  const timeAgo = getTimeSinceContact(lastContactedDate);
  return `${formatted} (${timeAgo})`;
}

// ✅ NEW: Format time with AM/PM
export function formatTime(dateString: string): string {
  if (!dateString) return "Not available";
  return new Date(dateString).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// ✅ NEW: Format date and time together
export function formatDateTime(dateString: string): string {
  if (!dateString) return "Not available";
  const date = new Date(dateString);
  return `${date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })} at ${date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })}`;
}

// ✅ NEW: Get contact urgency level
export function getContactUrgency(lastContactedDate: string): string {
  if (!lastContactedDate) return "never";

  const now = new Date();
  const lastContact = new Date(lastContactedDate);
  const diffInHours = Math.floor(
    (now.getTime() - lastContact.getTime()) / (1000 * 60 * 60)
  );
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInHours < 1) return "just_contacted";
  if (diffInHours < 24) return "recent";
  if (diffInDays <= 3) return "normal";
  if (diffInDays <= 7) return "needs_attention";
  return "urgent";
}

// ✅ NEW: Check if contact is overdue (for follow-up purposes)
export function isContactOverdue(
  lastContactedDate: string,
  followUpDays: number = 7
): boolean {
  if (!lastContactedDate) return true;

  const now = new Date();
  const lastContact = new Date(lastContactedDate);
  const diffInDays = Math.floor(
    (now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24)
  );

  return diffInDays > followUpDays;
}

// ✅ NEW: Two-tile date/time formatting for notes and activities
export function twoTileDateTime(dateString: string): {
  dateText: string;
  timeText: string;
} {
  if (!dateString) {
    return {
      dateText: "Unknown",
      timeText: "Unknown",
    };
  }

  const date = new Date(dateString);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();

  if (isToday) {
    return {
      dateText: "Today",
      timeText: date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    };
  } else {
    return {
      dateText: date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
      }),
      timeText: date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    };
  }
}
