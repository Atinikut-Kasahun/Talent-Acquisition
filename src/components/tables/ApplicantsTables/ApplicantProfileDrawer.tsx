import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { authFetch } from "../../../utils/authFetch";
import { useToast } from "../../ui/toast/useToast";
import Toast from "../../ui/toast/Toast";

const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  `${import.meta.env.VITE_API_URL}/api`;

// ── Types ────────────────────────────────────────────────────────────────────
export interface DrawerApplication {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  status: string;
  is_starred: boolean;
  created_at: string;
  reviewed_at?: string | null;
  referred_by?: string | null;
  linkedin_url?: string | null;
  portfolio_url?: string | null;
  cover_letter?: string | null;
  notes?: string | null;
  answers?: Record<string, string> | null;
  resume_url?: string | null;
  photo_url?: string | null;
  certifications_list?: { name: string; file_name: string; url: string; mime_type: string; size: string }[];
  activity_log?: { id: number; description: string; causer: string; properties: any; created_at: string }[];
  job_posting?: { id: string; title: string; department?: string } | null;
  reviewer?: { id: number; name: string } | null;
  media?: { collection_name: string; original_url: string }[];
}

type StatusKey = "new" | "reviewing" | "shortlisted" | "written_exam" | "technical_exam" | "interviewed" | "offered" | "rejected" | "withdrawn";

const STATUS_CONFIG: Record<StatusKey, { label: string; bg: string; text: string; dot: string; ring: string }> = {
  new:           { label: "New",           bg: "bg-blue-50   dark:bg-blue-500/10",   text: "text-blue-600   dark:text-blue-400",   dot: "bg-blue-500",   ring: "ring-blue-200"   },
  reviewing:     { label: "Reviewing",     bg: "bg-purple-50 dark:bg-purple-500/10", text: "text-purple-600 dark:text-purple-400", dot: "bg-purple-500", ring: "ring-purple-200" },
  shortlisted:   { label: "Shortlisted",   bg: "bg-amber-50  dark:bg-amber-500/10",  text: "text-amber-600  dark:text-amber-400",  dot: "bg-amber-500",  ring: "ring-amber-200"  },
  written_exam:  { label: "Written Exam",  bg: "bg-indigo-50 dark:bg-indigo-500/10", text: "text-indigo-600 dark:text-indigo-400", dot: "bg-indigo-500", ring: "ring-indigo-200" },
  technical_exam:{ label: "Technical Exam",bg: "bg-teal-50   dark:bg-teal-500/10",   text: "text-teal-600   dark:text-teal-400",   dot: "bg-teal-500",   ring: "ring-teal-200"   },
  interviewed:   { label: "Interviewed",   bg: "bg-cyan-50   dark:bg-cyan-500/10",   text: "text-cyan-600   dark:text-cyan-400",   dot: "bg-cyan-500",   ring: "ring-cyan-200"   },
  offered:       { label: "Offered",       bg: "bg-green-50  dark:bg-green-500/10",  text: "text-green-600  dark:text-green-400",  dot: "bg-green-500",  ring: "ring-green-200"  },
  rejected:      { label: "Rejected",      bg: "bg-red-50    dark:bg-red-500/10",    text: "text-red-500    dark:text-red-400",    dot: "bg-red-500",    ring: "ring-red-200"    },
  withdrawn:     { label: "Withdrawn",     bg: "bg-gray-100  dark:bg-gray-700/40",   text: "text-gray-500   dark:text-gray-400",   dot: "bg-gray-400",   ring: "ring-gray-200"   },
};

const STATUS_ORDER: StatusKey[] = ["new", "reviewing", "shortlisted", "written_exam", "technical_exam", "interviewed", "offered", "rejected", "withdrawn"];

function getNextStatus(current: string): StatusKey | null {
  const idx = STATUS_ORDER.indexOf(current as StatusKey);
  if (idx === -1 || idx >= 4) return null;
  return STATUS_ORDER[idx + 1];
}



function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, photoUrl, size = "md" }: { name: string; photoUrl?: string | null; size?: "md" | "lg" }) {
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const colors = ["bg-blue-500","bg-purple-500","bg-green-500","bg-orange-500","bg-pink-500","bg-teal-500","bg-indigo-500"];
  const color = colors[name.charCodeAt(0) % colors.length];
  const sizeClass = size === "lg" ? "w-16 h-16 text-xl" : "w-10 h-10 text-sm";
  if (photoUrl) {
    return <img src={photoUrl} alt={name} className={`${sizeClass} rounded-full object-cover ring-2 ring-white dark:ring-gray-800 flex-shrink-0`} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />;
  }
  return (
    <div className={`${color} ${sizeClass} flex items-center justify-center rounded-full text-white font-semibold flex-shrink-0 ring-2 ring-white dark:ring-gray-800`}>
      {initials}
    </div>
  );
}

// ── Tab types ─────────────────────────────────────────────────────────────────
type Tab = "overview" | "documents" | "notes" | "activity";

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  applicationId: string | null;
  onClose: () => void;
  onStatusChange?: (id: string, newStatus: StatusKey) => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Drawer
// ═══════════════════════════════════════════════════════════════════════════════
export default function ApplicantProfileDrawer({ applicationId, onClose, onStatusChange }: Props) {
  const [app, setApp] = useState<DrawerApplication | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [localNotes, setLocalNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);
  const [docView, setDocView] = useState<"resume" | string>("resume");
  const [statusDropOpen, setStatusDropOpen] = useState(false);
  const { toast, showToast: showToastRaw, dismiss: dismissToast } = useToast();
  const [isStarred, setIsStarred] = useState(false);
  const [togglingstar, setTogglingstar] = useState(false);

  const showToast = (text: string, ok = true) => {
    showToastRaw({ title: ok ? "Success" : "Error", message: text, variant: ok ? "success" : "error" });
  };

  // ── Fetch full application detail ─────────────────────────────────────────
  const fetchDetail = useCallback(async (id: string) => {
    setLoading(true);
    setApp(null);
    setActiveTab("overview");
    try {
      const res = await authFetch(`${API_URL}/admin/applications/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: DrawerApplication = await res.json();
      setApp(data);
      setLocalNotes(data.notes || "");
      setIsStarred(!!data.is_starred);
    } catch {
      showToast("Failed to load applicant profile.", false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (applicationId) fetchDetail(applicationId);
  }, [applicationId, fetchDetail]);

  // ── Lock body scroll while open ───────────────────────────────────────────
  useEffect(() => {
    if (applicationId) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [applicationId]);

  // ── ESC to close ──────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // ── Status update ─────────────────────────────────────────────────────────
  const updateStatus = async (newStatus: StatusKey) => {
    if (!app) return;
    setStatusDropOpen(false);
    setUpdatingStatus(true);
    try {
      const res = await authFetch(`${API_URL}/admin/applications/${app.id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed");
      setApp((prev) => prev ? { ...prev, status: newStatus } : prev);
      onStatusChange?.(app.id, newStatus);
      showToast(`Status updated to "${STATUS_CONFIG[newStatus].label}"`, true);
      // Reload to refresh activity log
      setTimeout(() => fetchDetail(app.id), 600);
    } catch {
      showToast("Failed to update status.", false);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ── Save notes ────────────────────────────────────────────────────────────
  const saveNotes = async () => {
    if (!app) return;
    setSavingNotes(true);
    try {
      const res = await authFetch(`${API_URL}/admin/applications/${app.id}/notes`, {
        method: "POST",
        body: JSON.stringify({ notes: localNotes }),
      });
      if (!res.ok) throw new Error("Failed");
      setApp((prev) => prev ? { ...prev, notes: localNotes } : prev);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2500);
      showToast("Notes saved successfully.", true);
    } catch {
      showToast("Failed to save notes.", false);
    } finally {
      setSavingNotes(false);
    }
  };

  // ── Toggle star ───────────────────────────────────────────────────────────
  const toggleStar = async () => {
    if (!app || togglingstar) return;
    setTogglingstar(true);
    const newVal = !isStarred;
    setIsStarred(newVal); // optimistic update
    try {
      const res = await authFetch(`${API_URL}/admin/applications/${app.id}/star`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setIsStarred(!!data.is_starred);
      showToast(data.is_starred ? "⭐ Added to Shortlist" : "Removed from Shortlist", true);
    } catch {
      setIsStarred(!newVal); // revert on failure
      showToast("Failed to update star.", false);
    } finally {
      setTogglingstar(false);
    }
  };

  const isOpen = !!applicationId;
  const statusKey = (app?.status || "new") as StatusKey;
  const statusCfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.new;
  const fullName = app ? `${app.first_name} ${app.last_name}` : "";
  const nextStatus = app ? getNextStatus(app.status) : null;

  // ── Tab list ──────────────────────────────────────────────────────────────
  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: "overview",
      label: "Overview",
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    },
    {
      id: "documents",
      label: "Documents",
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>,
    },
    {
      id: "notes",
      label: "Notes",
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
    },
    {
      id: "activity",
      label: "Activity",
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    },
  ];

  const drawerContent = (
    <>
      {/* ── Backdrop ──────────────────────────────────────────────────────── */}
      <div
        className={`fixed inset-0 z-[999998] bg-gray-900/40 backdrop-blur-[2px] transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* ── Drawer panel ─────────────────────────────────────────────────── */}
      <div
        className={`fixed top-0 right-0 z-[999999] h-full w-full max-w-[860px] bg-white dark:bg-gray-900 shadow-2xl flex flex-col transition-transform duration-[350ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* ── Loading state ──────────────────────────────────────────────── */}
        {loading && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-10 h-10 rounded-full border-[3px] border-gray-100 border-t-[#FCEE23] animate-spin" />
            <p className="text-sm text-gray-400 font-medium">Loading profile…</p>
          </div>
        )}

        {!loading && app && (
          <>
            {/* ═══════════════════════════════════════════════════════════════
                PINNED HEADER
            ═══════════════════════════════════════════════════════════════ */}
            <div className="flex-shrink-0 border-b border-gray-100 dark:border-white/[0.06] bg-white dark:bg-gray-900">
              {/* Top bar: close + breadcrumb */}
              <div className="flex items-center justify-between px-6 pt-5 pb-4">
                <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 font-medium">
                  <span>Applicants</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  <span className="text-gray-700 dark:text-gray-300">{fullName}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-white/[0.06] dark:hover:text-gray-300 transition"
                    title="Print Profile"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  </button>
                  <button
                    onClick={toggleStar}
                    disabled={togglingstar}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 ${
                      isStarred
                        ? "text-yellow-400 bg-yellow-50 dark:bg-yellow-500/10 hover:bg-yellow-100 dark:hover:bg-yellow-500/20"
                        : "text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-500/10"
                    } ${togglingstar ? "opacity-50 cursor-not-allowed" : ""}`}
                    title={isStarred ? "Remove from Shortlist" : "Add to Shortlist"}
                    aria-label={isStarred ? "Remove from Shortlist" : "Add to Shortlist"}
                  >
                    <svg
                      className={`w-4 h-4 transition-transform duration-150 ${togglingstar ? "scale-90" : isStarred ? "scale-110" : "scale-100"}`}
                      fill={isStarred ? "currentColor" : "none"}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isStarred ? 0 : 2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>
                  <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1"></div>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-white/[0.06] dark:hover:text-gray-300 transition"
                    aria-label="Close profile"
                    title="Close"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>

              {/* Candidate identity + quick actions */}
              <div className="flex items-start gap-4 px-6 pb-5">
                <Avatar name={fullName} photoUrl={app.photo_url} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5 mb-1">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">{fullName}</h2>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusCfg.bg} ${statusCfg.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                      {statusCfg.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    {app.job_posting?.title || "—"}
                    {app.job_posting?.department && <span className="text-gray-400"> · {app.job_posting.department}</span>}
                  </p>

                  {/* Quick action bar */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Advance stage */}
                    {nextStatus && (
                      <button
                        onClick={() => updateStatus(nextStatus)}
                        disabled={updatingStatus}
                        className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-[#FCEE23] hover:bg-yellow-300 text-gray-900 text-sm font-semibold transition disabled:opacity-60 disabled:cursor-wait shadow-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                        Move to {STATUS_CONFIG[nextStatus].label}
                      </button>
                    )}

                    {/* Status picker */}
                    <div className="relative">
                      <button
                        onClick={() => setStatusDropOpen((v) => !v)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] text-gray-700 dark:text-gray-300 text-xs font-medium hover:bg-gray-50 dark:hover:bg-white/[0.07] transition"
                      >
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        Change Status
                      </button>
                      {statusDropOpen && (
                        <div className="absolute left-0 top-full mt-1.5 w-44 z-50 rounded-xl border border-gray-100 dark:border-white/[0.08] bg-white dark:bg-gray-800 shadow-xl py-1.5 animate-in fade-in slide-in-from-top-1">
                          {STATUS_ORDER.map((sk) => {
                            const cfg = STATUS_CONFIG[sk];
                            return (
                              <button
                                key={sk}
                                onClick={() => updateStatus(sk)}
                                className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-xs transition ${sk === statusKey ? "bg-gray-50 dark:bg-white/[0.06] font-semibold" : "hover:bg-gray-50 dark:hover:bg-white/[0.04]"} ${cfg.text}`}
                              >
                                <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                                {cfg.label}
                                {sk === statusKey && (
                                  <svg className="w-3 h-3 ml-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Email */}
                    <a
                      href={`mailto:${app.email}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] text-gray-700 dark:text-gray-300 text-xs font-medium hover:bg-gray-50 dark:hover:bg-white/[0.07] transition"
                    >
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      Send Email
                    </a>

                    {/* Reject */}
                    {app.status !== "rejected" && (
                      <button
                        onClick={() => updateStatus("rejected")}
                        disabled={updatingStatus}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-red-100 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 text-xs font-medium hover:bg-red-100 dark:hover:bg-red-500/20 transition disabled:opacity-60"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                        Reject
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Tabs ──────────────────────────────────────────────────── */}
              <div className="flex gap-0 px-6 border-t border-gray-100 dark:border-white/[0.06]">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all duration-150 -mb-px ${
                      activeTab === tab.id
                        ? "border-[#FCEE23] text-gray-900 dark:text-white"
                        : "border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                BODY — Two-column split
            ═══════════════════════════════════════════════════════════════ */}
            <div className="flex flex-1 overflow-hidden">
              {/* ── Left sidebar: metadata ─────────────────────────────── */}
              <aside className="w-64 flex-shrink-0 border-r border-gray-100 dark:border-white/[0.06] overflow-y-auto bg-gray-50/60 dark:bg-white/[0.015] p-5 space-y-5 scrollbar-hide">

                {/* Contact */}
                <section>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">Contact</h4>
                  <ul className="space-y-2.5">
                    <li className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      <a href={`mailto:${app.email}`} className="text-xs text-blue-500 hover:underline break-all">{app.email}</a>
                    </li>
                    {app.phone && (
                      <li className="flex items-start gap-2.5">
                        <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        <span className="text-xs text-gray-600 dark:text-gray-300">{app.phone}</span>
                      </li>
                    )}
                    {app.linkedin_url && (
                      <li className="flex items-start gap-2.5">
                        <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" /><circle cx="4" cy="4" r="2" /></svg>
                        <a href={app.linkedin_url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline break-all">LinkedIn Profile</a>
                      </li>
                    )}
                    {app.portfolio_url && (
                      <li className="flex items-start gap-2.5">
                        <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                        <a href={app.portfolio_url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline break-all">Portfolio</a>
                      </li>
                    )}
                  </ul>
                </section>

                {/* Application details */}
                <section>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">Application</h4>
                  <ul className="space-y-3">
                    <li>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-0.5">Applied For</p>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-200">{app.job_posting?.title || "—"}</p>
                    </li>
                    {app.job_posting?.department && (
                      <li>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-0.5">Department</p>
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-200">{app.job_posting.department}</p>
                      </li>
                    )}
                    <li>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-0.5">Applied On</p>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-200">{formatDate(app.created_at)}</p>
                    </li>
                    {app.referred_by && (
                      <li>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-0.5">Referred By</p>
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-200">{app.referred_by}</p>
                      </li>
                    )}
                    {app.reviewer && (
                      <li>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-0.5">Reviewed By</p>
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-200">{app.reviewer.name}</p>
                      </li>
                    )}
                  </ul>
                </section>

                {/* Pipeline progress */}
                <section>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">Pipeline Stage</h4>
                  <div className="flex flex-col gap-1.5">
                    {STATUS_ORDER.slice(0, 7).map((sk) => {
                      const cfg = STATUS_CONFIG[sk];
                      const isDone = STATUS_ORDER.indexOf(statusKey) >= STATUS_ORDER.indexOf(sk);
                      const isCurrent = statusKey === sk;
                      return (
                        <div key={sk} className="flex items-center gap-2">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${isDone ? cfg.dot : "bg-gray-100 dark:bg-white/[0.05]"} ${isCurrent ? "ring-2 ring-offset-1 " + cfg.ring : ""}`}>
                            {isDone && (
                              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            )}
                          </div>
                          <span className={`text-xs ${isCurrent ? "font-semibold " + cfg.text : isDone ? "text-gray-500 dark:text-gray-400" : "text-gray-300 dark:text-gray-600"}`}>{cfg.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </aside>

              {/* ── Main content area ──────────────────────────────────── */}
              <main className={`flex-1 p-6 scrollbar-hide ${activeTab === "documents" ? "overflow-hidden flex flex-col min-h-0" : "overflow-y-auto"}`}>

                {/* ── OVERVIEW TAB ─────────────────────────────────────── */}
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    {/* Cover letter */}
                    {app.cover_letter ? (
                      <section>
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                          Cover Letter
                        </h3>
                        <div className="bg-gray-50 dark:bg-white/[0.03] rounded-xl p-4 border border-gray-100 dark:border-white/[0.05]">
                          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{app.cover_letter}</p>
                        </div>
                      </section>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 px-6 text-center bg-gray-50/50 dark:bg-white/[0.02] rounded-xl border border-gray-100 dark:border-white/[0.05] border-dashed">
                        <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <p className="text-[15px] font-medium text-gray-900 dark:text-white mb-1">No Cover Letter</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">The applicant did not provide a cover letter.</p>
                      </div>
                    )}

                    {/* Application answers */}
                    {app.answers && Object.keys(app.answers).length > 0 && (
                      <section>
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          Application Answers
                        </h3>
                        <div className="space-y-4">
                          {Object.entries(app.answers).map(([q, a], idx) => {
                            let displayA = a;
                            // Clean up stringified certifications array
                            if (q === 'certifications' && typeof a === 'string') {
                              try {
                                const parsed = JSON.parse(a);
                                if (Array.isArray(parsed)) {
                                  displayA = parsed.join(', ');
                                }
                              } catch (e) {
                                // Ignore
                              }
                            }
                            
                            // Only render if there's an actual answer
                            if (!displayA || displayA === '[]') return null;

                            return (
                              <div key={idx} className="bg-gray-50/50 dark:bg-white/[0.02] rounded-xl p-6 border border-gray-100 dark:border-white/[0.05]">
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">{q.replace(/_/g, ' ')}</p>
                                <p className="text-[15px] text-slate-900 dark:text-slate-200 leading-relaxed">{displayA}</p>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    )}
                  </div>
                )}

                {/* ── DOCUMENTS TAB ────────────────────────────────────── */}
                {activeTab === "documents" && (
                  <div className="flex-1 min-h-0 flex flex-col gap-4">
                    {/* Tab selector: Resume vs Certifications */}
                    <div className="flex gap-2 flex-wrap">
                      {app.resume_url && (
                        <button
                          onClick={() => setDocView("resume")}
                          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition border ${docView === "resume" ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent" : "bg-white dark:bg-white/[0.04] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/[0.08] hover:bg-gray-50"}`}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          Resume / CV
                        </button>
                      )}
                      {(app.certifications_list || []).map((cert, idx) => (
                        <button
                          key={idx}
                          onClick={() => setDocView(`cert-${idx}`)}
                          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition border ${docView === `cert-${idx}` ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent" : "bg-white dark:bg-white/[0.04] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/[0.08] hover:bg-gray-50"}`}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                          {cert.name || cert.file_name}
                        </button>
                      ))}
                    </div>

                    {/* Document viewer */}
                    {(() => {
                      let viewUrl: string | null = null;
                      let isCert = false;
                      let certData: { name: string; file_name: string; url: string; mime_type: string; size: string } | null = null;

                      if (docView === "resume" && app.resume_url) {
                        viewUrl = app.resume_url;
                      } else if (docView.startsWith("cert-") && app.certifications_list) {
                        const idx = parseInt(docView.replace("cert-", ""));
                        certData = app.certifications_list[idx] || null;
                        viewUrl = certData?.url || null;
                        isCert = true;
                      }

                      if (!viewUrl) {
                        return (
                          <div className="flex flex-col items-center justify-center flex-1 py-16 text-center">
                            <svg className="w-12 h-12 text-gray-200 dark:text-gray-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                            <p className="text-sm text-gray-400">No documents uploaded.</p>
                          </div>
                        );
                      }

                      const isPdf = viewUrl.toLowerCase().includes(".pdf") || (certData?.mime_type || "").includes("pdf");

                      return (
                        <div className="doc-preview-container flex-1 flex flex-col min-h-0 rounded-xl border border-gray-100 dark:border-white/[0.06] overflow-hidden bg-gray-50 dark:bg-white/[0.02]">
                          {/* Toolbar */}
                          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-white/[0.06] bg-white dark:bg-gray-800">
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300 truncate">
                              {isCert ? (certData?.name || certData?.file_name) : "Resume / CV"}
                              {certData?.size && <span className="ml-2 text-gray-400">· {certData.size}</span>}
                            </span>
                            <a
                              href={viewUrl}
                              target="_blank"
                              rel="noreferrer"
                              download
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-semibold hover:opacity-90 transition"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                              Download
                            </a>
                          </div>
                          {/* Preview — overflow-hidden container, absolutely-positioned content, zero scrollbars */}
                          <div className="relative flex-1 min-h-0 overflow-hidden">
                            {isPdf ? (
                              <iframe
                                src={`${viewUrl}#toolbar=0&scrollbar=0&navpanes=0&view=FitH`}
                                className="absolute inset-0 w-full h-full border-0"
                                title="Document Preview"
                                scrolling="no"
                              />
                            ) : (
                              /* Image: overflow-hidden + object-contain = scales to fit, no scrollbars ever */
                              <div className="absolute inset-0 flex items-center justify-center p-4 bg-gray-50 dark:bg-white/[0.02] overflow-hidden">
                                <img
                                  src={viewUrl}
                                  alt="Document"
                                  className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg shadow-md"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* ── NOTES TAB ────────────────────────────────────────── */}
                {activeTab === "notes" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Internal Notes</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Private notes visible only to your team.</p>
                      </div>
                      <button
                        onClick={saveNotes}
                        disabled={savingNotes}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${notesSaved ? "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/20" : "bg-[#FCEE23] hover:bg-yellow-300 text-gray-900"} disabled:opacity-60`}
                      >
                        {savingNotes ? (
                          <>
                            <div className="w-3 h-3 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
                            Saving…
                          </>
                        ) : notesSaved ? (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                            Saved
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                            Save Notes
                          </>
                        )}
                      </button>
                    </div>
                    <textarea
                      value={localNotes}
                      onChange={(e) => setLocalNotes(e.target.value)}
                      placeholder="Add internal notes about this candidate — interview impressions, team feedback, follow-up reminders…"
                      rows={14}
                      className="w-full rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] px-4 py-3 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#FCEE23]/60 resize-none leading-relaxed transition"
                    />
                    <p className="text-xs text-gray-400">
                      {localNotes.length} character{localNotes.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                )}

                {/* ── ACTIVITY TAB ─────────────────────────────────────── */}
                {activeTab === "activity" && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-5 flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Audit Timeline
                    </h3>
                    {(app.activity_log || []).length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <svg className="w-10 h-10 text-gray-200 dark:text-gray-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <p className="text-sm text-gray-400">No activity recorded yet.</p>
                      </div>
                    ) : (
                      <div className="relative">
                        {/* Vertical line */}
                        <div className="absolute left-[18px] top-0 bottom-0 w-px bg-gray-100 dark:bg-white/[0.06]" />
                        <ul className="space-y-0">
                          {(app.activity_log || []).map((event, idx) => {
                            const isStatus = event.properties?.old_status || event.properties?.new_status;
                            const oldStatus = event.properties?.old_status as StatusKey | undefined;
                            const newStatus = event.properties?.new_status as StatusKey | undefined;
                            return (
                              <li key={event.id} className="relative flex gap-4 pb-6">
                                {/* Dot */}
                                <div className={`relative z-10 flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${idx === 0 ? "bg-[#FCEE23]" : "bg-gray-100 dark:bg-white/[0.06]"}`}>
                                  {isStatus ? (
                                    <svg className={`w-4 h-4 ${idx === 0 ? "text-gray-900" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
                                  ) : (
                                    <svg className={`w-4 h-4 ${idx === 0 ? "text-gray-900" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                  )}
                                </div>
                                {/* Content */}
                                <div className="flex-1 pt-1.5 min-w-0">
                                  <p className="text-sm text-gray-700 dark:text-gray-200 leading-snug">{event.description}</p>
                                  {isStatus && oldStatus && newStatus && (
                                    <div className="flex items-center gap-2 mt-1.5">
                                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_CONFIG[oldStatus]?.bg} ${STATUS_CONFIG[oldStatus]?.text}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[oldStatus]?.dot}`} />
                                        {STATUS_CONFIG[oldStatus]?.label}
                                      </span>
                                      <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_CONFIG[newStatus]?.bg} ${STATUS_CONFIG[newStatus]?.text}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[newStatus]?.dot}`} />
                                        {STATUS_CONFIG[newStatus]?.label}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[11px] text-gray-400 dark:text-gray-500">{formatDateTime(event.created_at)}</span>
                                    {event.causer !== "System" && (
                                      <>
                                        <span className="text-gray-200 dark:text-gray-700">·</span>
                                        <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{event.causer}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </main>
            </div>
          </>
        )}
      </div>

      {/* ── Toast ────────────────────────────────────────────────────────────── */}
      {toast && <Toast toast={toast} onDismiss={dismissToast} />}
    </>
  );

  if (!isOpen && !app) return null;
  return createPortal(drawerContent, document.body);
}
