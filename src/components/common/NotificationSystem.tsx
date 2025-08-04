// src/components/common/NotificationSystem.tsx
"use client";

import * as React from "react";
import { createContext, useContext, useState, useCallback } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, CheckCircle, AlertCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

// ✅ AUDIO: Audio functionality integrated directly
type AudioType = "success" | "error" | "warning" | "confirm";

class IntegratedAudioService {
  private audioCache: Map<AudioType, HTMLAudioElement> = new Map();
  private config = { volume: 0.5, enabled: true };
  private isInitialized = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.loadPreferences();
      this.preloadAudio();
    }
  }

  private loadPreferences(): void {
    try {
      const saved = localStorage.getItem("leadg_audio_config");
      if (saved) this.config = { ...this.config, ...JSON.parse(saved) };
    } catch {
      /* ignore */
    }
  }

  private savePreferences(): void {
    try {
      localStorage.setItem("leadg_audio_config", JSON.stringify(this.config));
    } catch {
      /* ignore */
    }
  }

  private async preloadAudio(): Promise<void> {
    const audioFiles: Record<AudioType, string> = {
      success: "/assets/audio/success.wav",
      error: "/assets/audio/error.wav",
      warning: "/assets/audio/showWarning.wav",
      confirm: "/assets/audio/showConfirm.wav",
    };

    Object.entries(audioFiles).forEach(([type, path]) => {
      try {
        const audio = new Audio(path);
        audio.volume = this.config.volume;
        audio.preload = "auto";
        this.audioCache.set(type as AudioType, audio);
      } catch {
        console.warn(`Failed to load audio: ${type}`);
      }
    });

    this.isInitialized = true;
  }

  public async playSound(type: AudioType): Promise<void> {
    if (!this.config.enabled || !this.isInitialized) return;

    try {
      const audio = this.audioCache.get(type);
      if (audio) {
        audio.currentTime = 0;
        audio.volume = this.config.volume;
        await audio.play();
      }
    } catch {
      // Audio blocked by browser - fail silently
    }
  }

  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    this.savePreferences();
  }

  public setVolume(volume: number): void {
    this.config.volume = Math.max(0, Math.min(1, volume));
    this.audioCache.forEach((audio) => {
      audio.volume = this.config.volume;
    });
    this.savePreferences();
  }

  public getConfig() {
    return { ...this.config };
  }
}

// ✅ AUDIO: Create audio service instance
const audioService = new IntegratedAudioService();

// ✅ UPDATED: Added warning to notification types
type NotificationType = "success" | "error" | "warning";

interface Toast {
  id: string;
  title?: string;
  description: string;
  type: NotificationType;
  duration?: number;
}

interface ConfirmDialogOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

interface PromptDialogOptions {
  title: string;
  description: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  required?: boolean;
  multiline?: boolean;
  onConfirm: (value: string) => void | Promise<void>;
  onCancel?: () => void;
}

// ✅ UPDATED: Added showWarning to the interface
interface NotificationContextType {
  // Toast notifications
  toasts: Toast[];
  showToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;

  // Confirmation dialogs
  showConfirm: (options: ConfirmDialogOptions) => void;

  // Prompt dialogs
  showPrompt: (options: PromptDialogOptions) => void;

  // Convenience methods
  showSuccess: (description: string, title?: string) => void;
  showError: (description: string, title?: string) => void;
  showWarning: (description: string, title?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<
    (ConfirmDialogOptions & { isOpen: boolean }) | null
  >(null);
  const [promptDialog, setPromptDialog] = useState<
    (PromptDialogOptions & { isOpen: boolean }) | null
  >(null);
  const [promptValue, setPromptValue] = useState("");
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

  // Toast functions
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast = { ...toast, id };

      setToasts((prev) => [...prev, newToast]);

      // ✅ AUDIO: Play sound based on toast type
      audioService.playSound(toast.type as AudioType);

      const duration = toast.duration ?? 5000;
      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  // Confirmation dialog
  const showConfirm = useCallback((options: ConfirmDialogOptions) => {
    setConfirmDialog({ ...options, isOpen: true });
    // ✅ AUDIO: Play confirm sound
    audioService.playSound("confirm");
  }, []);

  const handleConfirm = async () => {
    if (!confirmDialog) return;

    setIsConfirmLoading(true);
    try {
      await confirmDialog.onConfirm();
      setConfirmDialog(null);
    } catch (error) {
      console.error("Confirmation action failed:", error);
    } finally {
      setIsConfirmLoading(false);
    }
  };

  const handleConfirmCancel = () => {
    if (confirmDialog?.onCancel) {
      confirmDialog.onCancel();
    }
    setConfirmDialog(null);
  };

  // Prompt dialog
  const showPrompt = useCallback((options: PromptDialogOptions) => {
    setPromptValue(options.defaultValue || "");
    setPromptDialog({ ...options, isOpen: true });
    // ✅ AUDIO: Play confirm sound for prompts too
    audioService.playSound("confirm");
  }, []);

  const handlePromptConfirm = async () => {
    if (!promptDialog) return;

    if (promptDialog.required && !promptValue.trim()) {
      return;
    }

    setIsConfirmLoading(true);
    try {
      await promptDialog.onConfirm(promptValue);
      setPromptDialog(null);
      setPromptValue("");
    } catch (error) {
      console.error("Prompt action failed:", error);
    } finally {
      setIsConfirmLoading(false);
    }
  };

  const handlePromptCancel = () => {
    if (promptDialog?.onCancel) {
      promptDialog.onCancel();
    }
    setPromptDialog(null);
    setPromptValue("");
  };

  // Convenience methods for different notification types
  const showSuccess = useCallback(
    (description: string, title?: string) => {
      showToast({ type: "success", description, title });
    },
    [showToast]
  );

  const showError = useCallback(
    (description: string, title?: string) => {
      showToast({ type: "error", description, title });
    },
    [showToast]
  );

  // ✅ NEW: Added showWarning method
  const showWarning = useCallback(
    (description: string, title?: string) => {
      showToast({ type: "warning", description, title });
    },
    [showToast]
  );

  // ✅ UPDATED: Added showWarning to context value
  const contextValue: NotificationContextType = {
    toasts,
    showToast,
    removeToast,
    showConfirm,
    showPrompt,
    showSuccess,
    showError,
    showWarning,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <ToastContainer />

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <AlertDialog
          open={confirmDialog.isOpen}
          onOpenChange={() => setConfirmDialog(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
              <AlertDialogDescription>
                {confirmDialog.description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={handleConfirmCancel}
                disabled={isConfirmLoading}
              >
                {confirmDialog.cancelText || "Cancel"}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirm}
                disabled={isConfirmLoading}
                className={cn(
                  confirmDialog.variant === "destructive" &&
                    "bg-red-600 hover:bg-red-700"
                )}
              >
                {isConfirmLoading
                  ? "Processing..."
                  : confirmDialog.confirmText || "Confirm"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Prompt Dialog */}
      {promptDialog && (
        <AlertDialog
          open={promptDialog.isOpen}
          onOpenChange={() => setPromptDialog(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{promptDialog.title}</AlertDialogTitle>
              <AlertDialogDescription>
                {promptDialog.description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label htmlFor="prompt-input" className="sr-only">
                Input value
              </Label>
              {promptDialog.multiline ? (
                <Textarea
                  id="prompt-input"
                  value={promptValue}
                  onChange={(e) => setPromptValue(e.target.value)}
                  placeholder={promptDialog.placeholder}
                  required={promptDialog.required}
                />
              ) : (
                <Input
                  id="prompt-input"
                  value={promptValue}
                  onChange={(e) => setPromptValue(e.target.value)}
                  placeholder={promptDialog.placeholder}
                  required={promptDialog.required}
                />
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={handlePromptCancel}
                disabled={isConfirmLoading}
              >
                {promptDialog.cancelText || "Cancel"}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handlePromptConfirm}
                disabled={
                  isConfirmLoading ||
                  (promptDialog.required && !promptValue.trim())
                }
              >
                {isConfirmLoading
                  ? "Processing..."
                  : promptDialog.confirmText || "Confirm"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </NotificationContext.Provider>
  );
}

// Toast Container Component
function ToastContainer() {
  const { toasts } = useNotifications();

  return (
    <div className="fixed top-4 right-4 z-70 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

// Individual Toast Component
function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useNotifications();

  // ✅ UPDATED: Added warning icon and styles
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
  };

  const styles = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
  };

  const Icon = icons[toast.type];

  return (
    <Alert
      className={cn(
        "animate-in slide-in-from-top-2 duration-300 shadow-lg",
        styles[toast.type]
      )}
    >
      <Icon className="h-4 w-4" />

      <div className="flex-1 min-w-0">
        <div className="flex">
          {toast.title && <AlertTitle>{toast.title}</AlertTitle>}
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-1 ml-auto flex-shrink-0 opacity-70 hover:opacity-100"
            onClick={() => removeToast(toast.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <AlertDescription>{toast.description}</AlertDescription>
      </div>
    </Alert>
  );
}

// Hook to use notifications
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}

// ✅ AUDIO: Export audio control functions for optional advanced usage
export const notificationAudio = {
  setEnabled: (enabled: boolean) => audioService.setEnabled(enabled),
  setVolume: (volume: number) => audioService.setVolume(volume),
  getConfig: () => audioService.getConfig(),
  playSound: (type: AudioType) => audioService.playSound(type),
};
