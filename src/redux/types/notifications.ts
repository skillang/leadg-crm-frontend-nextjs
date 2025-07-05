// src/redux/types/notifications.ts - Keep it simple
export type NotificationType = "success" | "error";

export interface Toast {
  id: string;
  title?: string;
  description: string;
  type: NotificationType;
  duration?: number;
}

export interface ConfirmDialogOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}
