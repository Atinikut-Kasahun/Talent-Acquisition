import { Check, X as XIcon, Info, TriangleAlert } from "lucide-react";
import type { ToastData, ToastVariant } from "./useToast";

const VARIANT_STYLES: Record<
  ToastVariant,
  { iconBg: string; defaultIcon: typeof Check }
> = {
  success: { iconBg: "bg-emerald-500", defaultIcon: Check },
  error: { iconBg: "bg-red-500", defaultIcon: XIcon },
  info: { iconBg: "bg-blue-500", defaultIcon: Info },
  warning: { iconBg: "bg-amber-500", defaultIcon: TriangleAlert },
};

/**
 * Shared enterprise toast — clean elevated white card, solid semantic icon
 * badge, title/description hierarchy, no progress bar or extra chrome. Used
 * across the entire app (dashboards, tables, profile, chat) via the
 * `useToast` hook so every notification looks and behaves the same.
 */
export default function Toast({ toast, onDismiss }: { toast: ToastData; onDismiss: () => void }) {
  const style = VARIANT_STYLES[toast.variant];
  const Icon = toast.icon ?? style.defaultIcon;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-20 right-6 z-[9999] w-[380px] max-w-[calc(100vw-2rem)] rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-white/10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.18),0_4px_16px_-4px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.55)] animate-in fade-in slide-in-from-top-2 duration-300"
    >
      <div className="flex items-start gap-3.5 px-5 py-4">
        <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${style.iconBg}`}>
          <Icon className="w-[18px] h-[18px] text-white" strokeWidth={3} />
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-snug">{toast.title}</p>
          {toast.message && (
            <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">{toast.message}</p>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors shrink-0 -mr-1.5 -mt-1 p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
