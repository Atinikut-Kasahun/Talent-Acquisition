import { useCallback, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";

export type ToastVariant = "success" | "info" | "warning" | "error";

export interface ToastData {
  id: number;
  title: string;
  message?: string;
  variant: ToastVariant;
  icon?: LucideIcon;
  duration: number;
}

type ShowToastOptions = {
  title: string;
  message?: string;
  variant?: ToastVariant;
  icon?: LucideIcon;
  duration?: number;
};

/**
 * Shared toast hook — one toast at a time, auto-dismissing, with variant-based
 * styling. Use alongside <Toast /> from "./Toast". Each dashboard/page keeps
 * its own instance (no global provider needed for this app's scale).
 */
export function useToast() {
  const [toast, setToast] = useState<ToastData | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idRef = useRef(0);

  const showToast = useCallback((opts: ShowToastOptions) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const id = ++idRef.current;
    const duration = opts.duration ?? 4500;
    setToast({
      id,
      title: opts.title,
      message: opts.message,
      variant: opts.variant ?? "success",
      icon: opts.icon,
      duration,
    });
    timeoutRef.current = setTimeout(() => {
      setToast((t) => (t?.id === id ? null : t));
    }, duration);
  }, []);

  const dismiss = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setToast(null);
  }, []);

  return { toast, showToast, dismiss };
}
