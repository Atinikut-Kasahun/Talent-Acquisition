import { useState, useEffect, useRef, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";
import ApplicantProfileDrawer from "./ApplicantProfileDrawer";
import { authFetch } from "../../../utils/authFetch";

const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  `${import.meta.env.VITE_API_URL}/api`;

// ── Types ───────────────────────────────────────────────────────────────────
interface JobPosting {
  id: string;
  title: string;
  department?: string;
}

interface Application {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  status: string;
  is_starred: boolean;
  created_at: string;
  job_posting: JobPosting | null;
  linkedin_url?: string | null;
  portfolio_url?: string | null;
  cover_letter?: string | null;
  notes?: string | null;
  media?: { collection_name: string; original_url: string }[];
}

interface PaginatedResponse {
  data: Application[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

// ── Status config ───────────────────────────────────────────────────────────
type StatusKey =
  | "new"
  | "reviewing"
  | "shortlisted"
  | "written_exam"
  | "technical_exam"
  | "interviewed"
  | "offered"
  | "rejected"
  | "withdrawn";

const STATUS_CONFIG: Record<
  StatusKey,
  { label: string; bg: string; text: string; dot: string }
> = {
  new: {
    label: "New",
    bg: "bg-blue-50 dark:bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  reviewing: {
    label: "Reviewing",
    bg: "bg-purple-50 dark:bg-purple-500/10",
    text: "text-purple-600 dark:text-purple-400",
    dot: "bg-purple-500",
  },
  shortlisted: {
    label: "Shortlisted",
    bg: "bg-amber-50 dark:bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  written_exam: {
    label: "Written Exam",
    bg: "bg-indigo-50 dark:bg-indigo-500/10",
    text: "text-indigo-600 dark:text-indigo-400",
    dot: "bg-indigo-500",
  },
  technical_exam: {
    label: "Technical Exam",
    bg: "bg-teal-50 dark:bg-teal-500/10",
    text: "text-teal-600 dark:text-teal-400",
    dot: "bg-teal-500",
  },
  interviewed: {
    label: "Interviewed",
    bg: "bg-cyan-50 dark:bg-cyan-500/10",
    text: "text-cyan-600 dark:text-cyan-400",
    dot: "bg-cyan-500",
  },
  offered: {
    label: "Offered",
    bg: "bg-green-50 dark:bg-green-500/10",
    text: "text-green-600 dark:text-green-400",
    dot: "bg-green-500",
  },
  rejected: {
    label: "Rejected",
    bg: "bg-red-50 dark:bg-red-500/10",
    text: "text-red-500 dark:text-red-400",
    dot: "bg-red-500",
  },
  withdrawn: {
    label: "Withdrawn",
    bg: "bg-gray-100 dark:bg-gray-700/40",
    text: "text-gray-500 dark:text-gray-400",
    dot: "bg-gray-400",
  },
};

const STATUS_ORDER: StatusKey[] = [
  "new",
  "reviewing",
  "shortlisted",
  "written_exam",
  "technical_exam",
  "interviewed",
  "offered",
  "rejected",
  "withdrawn",
];

function getNextStatus(current: string): StatusKey | null {
  const idx = STATUS_ORDER.indexOf(current as StatusKey);
  if (idx === -1 || idx >= 4) return null; // Can't advance past 'offered'
  return STATUS_ORDER[idx + 1];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getPhotoUrl(app: Application): string | null {
  const photo = app.media?.find((m) => m.collection_name === "photo");
  return photo?.original_url || null;
}

function AvatarFallback({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const colors = [
    "bg-blue-500",
    "bg-purple-500",
    "bg-green-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-teal-500",
    "bg-indigo-500",
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div
      className={`${color} flex items-center justify-center w-10 h-10 rounded-full text-white text-sm font-semibold flex-shrink-0`}
    >
      {initials}
    </div>
  );
}

// ── Toast component ─────────────────────────────────────────────────────────
function Toast({
  visible,
  message,
  type,
}: {
  visible: boolean;
  message: string;
  type: "success" | "error";
}) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3.5
        bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700
        rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]
        transition-all duration-500 ease-out transform
        ${visible ? "translate-y-0 opacity-100 scale-100" : "translate-y-10 opacity-0 scale-95 pointer-events-none"}`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
          ${type === "success" ? "bg-green-50 dark:bg-green-500/10" : "bg-red-50 dark:bg-red-500/10"}`}
      >
        {type === "success" ? (
          <svg
            className="w-4 h-4 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : (
          <svg
            className="w-4 h-4 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        )}
      </div>
      <p className="text-sm font-medium text-gray-800 dark:text-white">
        {message}
      </p>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Main Component
// ═════════════════════════════════════════════════════════════════════════════
export default function ApplicantsTable() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Popover & menu state
  const [openStatusId, setOpenStatusId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [selectedApplicantId, setSelectedApplicantId] = useState<string | null>(null);
  const [starredOnly, setStarredOnly] = useState(false);

  // Enterprise UI State
  const [selectedApplicantIds, setSelectedApplicantIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"active" | "archived">("active");

  // Status filter popover
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [statusFilterSearch, setStatusFilterSearch] = useState("");
  const statusFilterRef = useRef<HTMLDivElement>(null);

  // Bulk Status Update State
  const [isBulkStatusMenuOpen, setIsBulkStatusMenuOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [pendingTargetStatus, setPendingTargetStatus] = useState<StatusKey | null>(null);
  const [bulkStatusLoading, setBulkStatusLoading] = useState(false);

  // Delete Modal State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | "bulk" | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Toast
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success" as "success" | "error",
  });

  const statusRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000);
  };

  // ── Click outside to close popovers ─────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setOpenStatusId(null);
      }
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
      if (statusFilterRef.current && !statusFilterRef.current.contains(e.target as Node)) {
        setIsStatusFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Fetch applications ──────────────────────────────────────────────────
  const fetchApplications = useCallback(async (p: number, search: string, status: string, isArchived: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL(`${API_URL}/admin/applications`);
      url.searchParams.append("page", p.toString());
      if (search) url.searchParams.append("search", search);
      if (status && status !== "all") url.searchParams.append("status", status);
      url.searchParams.append("is_archived", isArchived ? "1" : "0");

      const res = await authFetch(url.toString());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: PaginatedResponse = await res.json();
      setApplications(data.data);
      setLastPage(data.last_page);
      setTotal(data.total);
      setPage(data.current_page);
    } catch (err: any) {
      setError(err.message || "Failed to load applicants");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications(page, debouncedSearch, statusFilter, viewMode === "archived");
  }, [page, debouncedSearch, statusFilter, viewMode, fetchApplications]);

  // ── Update status ───────────────────────────────────────────────────────
  const updateStatus = async (appId: string, newStatus: StatusKey) => {
    setUpdatingId(appId);
    setOpenStatusId(null);
    setOpenMenuId(null);
    try {
      const res = await authFetch(
        `${API_URL}/admin/applications/${appId}/status`,
        {
          method: "PUT",
          body: JSON.stringify({ status: newStatus }),
        }
      );
      if (!res.ok) throw new Error("Failed to update");
      // Update locally
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
      );
      const cfg = STATUS_CONFIG[newStatus];
      showToast(`Status changed to "${cfg.label}"`, "success");
    } catch {
      showToast("Failed to update status", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Move to next stage ──────────────────────────────────────────────────
  const moveToNextStage = (app: Application) => {
    const next = getNextStatus(app.status);
    if (next) {
      updateStatus(app.id, next);
    } else {
      showToast("Cannot advance further", "error");
    }
  };

  // ── Reject ──────────────────────────────────────────────────────────────
  const rejectApplication = (app: Application) => {
    if (app.status === "rejected") {
      showToast("Already rejected", "error");
      return;
    }
    updateStatus(app.id, "rejected");
  };

  // ── Bulk Selection Helpers ──────────────────────────────────────────────
  const toggleSelect = (id: string) => {
    const next = new Set(selectedApplicantIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedApplicantIds(next);
  };

  const toggleSelectAll = (isAllSelected: boolean, displayed: Application[]) => {
    if (isAllSelected) {
      setSelectedApplicantIds(new Set());
    } else {
      setSelectedApplicantIds(new Set(displayed.map(a => a.id)));
    }
  };

  const openBulkStatusModal = (status: StatusKey) => {
    setPendingTargetStatus(status);
    setIsBulkStatusMenuOpen(false);
    setIsConfirmModalOpen(true);
  };

  const submitBulkStatusUpdate = async () => {
    if (!pendingTargetStatus || selectedApplicantIds.size === 0) return;
    setBulkStatusLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/applications/bulk-status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          application_ids: Array.from(selectedApplicantIds),
          status: pendingTargetStatus,
        }),
      });

      if (!res.ok) throw new Error("Failed to bulk update status");
      const data = await res.json();
      
      // Update local state
      setApplications(prev => prev.map(app => 
        selectedApplicantIds.has(app.id) && app.status !== pendingTargetStatus 
          ? { ...app, status: pendingTargetStatus } 
          : app
      ));

      if (data.skipped_count > 0) {
        showToast(`Updated ${data.updated_count} applicants to "${STATUS_CONFIG[pendingTargetStatus].label}"; ${data.skipped_count} were already in this stage.`, "success");
      } else {
        showToast(`Successfully updated ${data.updated_count} applicants to "${STATUS_CONFIG[pendingTargetStatus].label}".`, "success");
      }
      
      setSelectedApplicantIds(new Set());
      setIsConfirmModalOpen(false);
      setPendingTargetStatus(null);
    } catch (err) {
      showToast("Failed to process bulk update", "error");
    } finally {
      setBulkStatusLoading(false);
    }
  };

  const handleBulkAction = (action: string) => {
    if (action === "email") showToast(`Batch email sent to ${selectedApplicantIds.size} candidates`, "success");
    if (action === "export") showToast(`Exported ${selectedApplicantIds.size} candidates`, "success");
    if (action === "archive" || action === "restore") {
      executeBulkArchive(action === "archive");
    }
    if (action === "delete") {
      setDeleteTargetId("bulk");
      setDeleteInput("");
      setDeleteConfirmOpen(true);
    }
  };

  const executeBulkArchive = async (archive: boolean) => {
    setBulkStatusLoading(true);
    try {
      const res = await authFetch(`${API_URL}/admin/applications/bulk-archive`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          application_ids: Array.from(selectedApplicantIds),
          is_archived: archive,
        }),
      });
      if (!res.ok) throw new Error("Failed to process");
      const data = await res.json();
      showToast(data.message, "success");
      fetchApplications(page, debouncedSearch, statusFilter, viewMode === "archived");
      setSelectedApplicantIds(new Set());
    } catch (err) {
      showToast("Action failed", "error");
    } finally {
      setBulkStatusLoading(false);
    }
  };

  const executeDelete = async () => {
    if (deleteInput !== "DELETE") {
      showToast("Please type DELETE to confirm", "error");
      return;
    }
    setDeleteLoading(true);
    try {
      let res;
      if (deleteTargetId === "bulk") {
        res = await authFetch(`${API_URL}/admin/applications/bulk-delete`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ application_ids: Array.from(selectedApplicantIds) }),
        });
      } else {
        res = await authFetch(`${API_URL}/admin/applications/${deleteTargetId}`, {
          method: "DELETE",
        });
      }
      if (!res.ok) throw new Error("Delete failed");
      showToast("Deletion successful", "success");
      setDeleteConfirmOpen(false);
      fetchApplications(page, debouncedSearch, statusFilter, viewMode === "archived");
      setSelectedApplicantIds(new Set());
    } catch (err) {
      showToast("Failed to delete", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Header cell helper ──────────────────────────────────────────────────
  const thClass =
    "px-5 py-4 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 uppercase tracking-wider sticky top-0 bg-white dark:bg-[#1A1C23] z-10 shadow-sm";
  
  const tdPadding = density === "compact" ? "py-2.5" : "py-4";

  // ═══════════════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════════════
  const displayedApps = starredOnly ? applications.filter((a) => a.is_starred) : applications;
  const isAllSelected = displayedApps.length > 0 && selectedApplicantIds.size === displayedApps.length;

  return (
    <>
      {/* ── Control Bar & Bulk Actions ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        {/* Left: Filters & Search */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              placeholder="Search applicants..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 w-64"
            />
          </div>
          
          {/* ── Status Filter Popover ────────────────────────────── */}
          <div ref={statusFilterRef} className="relative">
            <button
              onClick={() => { setIsStatusFilterOpen(v => !v); setStatusFilterSearch(""); }}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${
                statusFilter !== "all"
                  ? "bg-[#FCEE23]/10 border-[#FCEE23] text-gray-900 dark:text-white"
                  : "bg-white dark:bg-white/[0.03] border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-gray-400 hover:border-gray-300"
              }`}
            >
              {statusFilter !== "all" && STATUS_CONFIG[statusFilter as StatusKey] ? (
                <>
                  <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[statusFilter as StatusKey].dot}`} />
                  {STATUS_CONFIG[statusFilter as StatusKey].label}
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" /></svg>
                  All Statuses
                </>
              )}
              <svg className={`w-3.5 h-3.5 ml-0.5 transition-transform text-gray-400 ${isStatusFilterOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>

            {isStatusFilterOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 rounded-xl border border-gray-100 dark:border-white/[0.08] bg-white dark:bg-[#1A1C23] shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Internal search */}
                <div className="p-2 border-b border-gray-100 dark:border-white/[0.06]">
                  <div className="relative">
                    <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input
                      type="text"
                      placeholder="Search stages..."
                      value={statusFilterSearch}
                      onChange={e => setStatusFilterSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.06] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FCEE23] text-gray-700 dark:text-gray-300"
                    />
                  </div>
                </div>

                {/* All statuses option */}
                <div className="p-1.5">
                  <button
                    onClick={() => { setStatusFilter("all"); setPage(1); setIsStatusFilterOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      statusFilter === "all"
                        ? "bg-gray-50 dark:bg-white/[0.06]"
                        : "hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-gradient-to-br from-blue-500 to-purple-500" />
                      <span className="font-medium text-gray-700 dark:text-gray-200">All Statuses</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 font-medium tabular-nums">{applications.length}</span>
                      {statusFilter === "all" && <svg className="w-3.5 h-3.5 text-[#FCEE23]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                  </button>

                  <div className="my-1.5 border-t border-gray-100 dark:border-white/[0.05]" />

                  {/* Stage options */}
                  {STATUS_ORDER
                    .filter(s => STATUS_CONFIG[s].label.toLowerCase().includes(statusFilterSearch.toLowerCase()))
                    .map(status => {
                      const count = applications.filter(a => a.status === status).length;
                      const cfg = STATUS_CONFIG[status];
                      const isActive = statusFilter === status;
                      return (
                        <button
                          key={status}
                          onClick={() => { setStatusFilter(status); setPage(1); setIsStatusFilterOpen(false); }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                            isActive ? "bg-gray-50 dark:bg-white/[0.06]" : "hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                            <span className={`font-medium ${isActive ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                              {cfg.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium tabular-nums px-1.5 py-0.5 rounded-md ${
                              count === 0 
                                ? "text-gray-300 dark:text-gray-600" 
                                : `${cfg.bg} ${cfg.text}`
                            }`}>{count}</span>
                            {isActive && <svg className="w-3.5 h-3.5 text-[#FCEE23]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>}
                          </div>
                        </button>
                      );
                    })
                  }
                  {STATUS_ORDER.filter(s => STATUS_CONFIG[s].label.toLowerCase().includes(statusFilterSearch.toLowerCase())).length === 0 && (
                    <p className="text-center text-xs text-gray-400 py-4">No stages match &ldquo;{statusFilterSearch}&rdquo;</p>
                  )}
                </div>

                {/* Clear filter footer */}
                {statusFilter !== "all" && (
                  <div className="px-3 py-2 border-t border-gray-100 dark:border-white/[0.06]">
                    <button onClick={() => { setStatusFilter("all"); setPage(1); setIsStatusFilterOpen(false); }} className="w-full text-center text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                      Clear filter
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Segmented Control: Active vs Archived ────────────────────── */}
          <div className="flex bg-gray-100/80 dark:bg-[#111217] p-1 rounded-lg">
            <button
              onClick={() => { setViewMode("active"); setPage(1); }}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                viewMode === "active"
                  ? "bg-white dark:bg-[#1A1C23] text-gray-900 dark:text-white shadow-sm ring-1 ring-gray-200/50 dark:ring-white/[0.05]"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => { setViewMode("archived"); setPage(1); }}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                viewMode === "archived"
                  ? "bg-[#FCEE23] text-gray-900 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              Archived
            </button>
          </div>
        </div>

        {/* Right: Actions & Density */}
        <div className="flex items-center gap-3">
          {selectedApplicantIds.size > 0 ? (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300 mr-2">
                {selectedApplicantIds.size} selected
              </span>
              <div className="relative">
                <button 
                  onClick={() => setIsBulkStatusMenuOpen(!isBulkStatusMenuOpen)} 
                  className={`px-3 py-1.5 border text-sm font-medium rounded-lg transition inline-flex items-center gap-1.5 ${isBulkStatusMenuOpen ? "bg-[#FCEE23] border-[#FCEE23] text-gray-900" : "bg-white dark:bg-white/[0.03] border-gray-200 dark:border-white/[0.08] text-gray-700 dark:text-gray-300 hover:border-[#FCEE23] hover:text-gray-900"}`}
                >
                  Status
                  <svg className={`w-4 h-4 transition-transform ${isBulkStatusMenuOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {isBulkStatusMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsBulkStatusMenuOpen(false)} />
                    <div className="absolute top-full right-0 mt-2 w-48 rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-[#1A1C23] py-1.5 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Change Status</div>
                      {STATUS_ORDER.map(status => (
                        <button
                          key={status}
                          onClick={() => openBulkStatusModal(status)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.05] flex items-center gap-2 transition-colors"
                        >
                          <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[status].dot}`} />
                          {STATUS_CONFIG[status].label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <button onClick={() => handleBulkAction('email')} className="px-3 py-1.5 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 transition">Email</button>
              <button onClick={() => handleBulkAction('export')} className="px-3 py-1.5 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 transition">Export</button>
              <button 
                onClick={() => handleBulkAction(viewMode === 'active' ? 'archive' : 'restore')} 
                className="px-3 py-1.5 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 transition"
              >
                {viewMode === 'active' ? 'Archive' : 'Restore'}
              </button>
              <button onClick={() => handleBulkAction('delete')} className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 text-sm font-medium rounded-lg hover:bg-red-100 transition">Delete</button>
            </div>
          ) : (
            <>
              <button onClick={() => handleBulkAction('export')} className="inline-flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Export CSV
              </button>
              <div className="flex bg-gray-100 dark:bg-white/[0.03] p-1 rounded-lg border border-gray-200 dark:border-white/[0.05]">
                <button onClick={() => setDensity("comfortable")} className={`p-1.5 rounded-md transition ${density === "comfortable" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`} title="Comfortable padding">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
                <button onClick={() => setDensity("compact")} className={`p-1.5 rounded-md transition ${density === "compact" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`} title="Compact padding">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className={`overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.05] transition-colors ${viewMode === "archived" ? "bg-slate-50 dark:bg-white/[0.02]" : "bg-white dark:bg-[#1A1C23]"}`}>
        <div className="max-w-full overflow-x-auto max-h-[700px] overflow-y-auto scrollbar-hide">
          <Table>
            {/* ── Header ──────────────────────────────────────────────── */}
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className={`${thClass} w-12 px-5`}>
                  <input 
                    type="checkbox" 
                    checked={isAllSelected} 
                    ref={input => {
                      if (input) {
                        input.indeterminate = displayedApps.length > 0 && selectedApplicantIds.size > 0 && selectedApplicantIds.size < displayedApps.length;
                      }
                    }}
                    onChange={() => toggleSelectAll(isAllSelected, displayedApps)} 
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-transparent text-[#FCEE23] accent-[#FCEE23] focus:ring-[#FCEE23] cursor-pointer transition-colors opacity-50 hover:opacity-100" 
                  />
                </TableCell>
                <TableCell isHeader className={thClass}>Name</TableCell>
                <TableCell isHeader className={thClass}>Applied For</TableCell>
                <TableCell isHeader className={thClass}>Email</TableCell>
                <TableCell isHeader className={thClass}>Applied On</TableCell>
                <TableCell isHeader className={thClass}>Status</TableCell>
                <TableCell isHeader className={thClass}>Actions</TableCell>
              </TableRow>
            </TableHeader>

            {/* ── Body ────────────────────────────────────────────────── */}
            {loading ? (
              <TableBody>
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-7 w-7 border-2 border-gray-200 border-t-yellow-400" />
                      <span className="text-sm text-gray-400">
                        Loading applicants…
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            ) : error ? (
              <TableBody>
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <svg
                        className="w-8 h-8 text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                        />
                      </svg>
                      <p className="text-sm text-gray-400">{error}</p>
                      <button
                        onClick={() => fetchApplications(page, debouncedSearch, statusFilter, viewMode === "archived")}
                        className="text-xs font-medium px-4 py-1.5 rounded-lg bg-yellow-400 text-gray-900 hover:bg-yellow-500 transition"
                      >
                        Retry
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            ) : displayedApps.length === 0 ? (
              <TableBody>
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      {starredOnly ? (
                        <>
                          <div className="w-12 h-12 rounded-full bg-yellow-50 dark:bg-yellow-500/10 flex items-center justify-center mb-2">
                            <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                          </div>
                          <p className="text-base font-semibold text-gray-900 dark:text-white">No shortlisted candidates</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm text-center">Open a profile and click the star icon to build your shortlist.</p>
                          <button onClick={() => setStarredOnly(false)} className="mt-2 text-sm font-medium text-yellow-600 hover:text-yellow-700">View all applicants</button>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-white/[0.03] flex items-center justify-center mb-2">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                          </div>
                          <p className="text-base font-semibold text-gray-900 dark:text-white">No applicants found</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm text-center">We couldn't find anyone matching your current filters and search query.</p>
                          {(searchQuery || statusFilter !== "all") && (
                            <button onClick={() => { setSearchQuery(""); setStatusFilter("all"); setPage(1); }} className="mt-2 text-sm font-medium text-yellow-600 hover:text-yellow-700">Clear all filters</button>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            ) : (
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {displayedApps.map((app) => {
                  const fullName = `${app.first_name} ${app.last_name}`;
                  const photoUrl = getPhotoUrl(app);
                  const statusKey = (app.status || "new") as StatusKey;
                  const statusCfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.new;
                  const isHovered = hoveredRowId === app.id;
                  const isSelected = selectedApplicantIds.has(app.id);

                  return (
                    <TableRow
                      key={app.id}
                      className={`group relative transition-all duration-200 ${isSelected ? "row-selected" : "hover:bg-gray-50/50 dark:hover:bg-white/[0.02]"}`}
                      // @ts-ignore
                      onMouseEnter={() => setHoveredRowId(app.id)}
                      onMouseLeave={() => setHoveredRowId(null)}
                    >
                      {/* ── Checkbox ───────────────────────────────────── */}
                      <TableCell className={`${tdPadding} px-5`}>
                        <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => toggleSelect(app.id)}
                            className={`w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-transparent text-[#FCEE23] accent-[#FCEE23] focus:ring-[#FCEE23] cursor-pointer transition-all duration-200 ${!isSelected ? "opacity-40 group-hover:opacity-100" : "opacity-100"}`} 
                          />
                        </div>
                      </TableCell>

                      {/* ── Name ───────────────────────────────────────── */}
                      <TableCell className={`px-5 ${tdPadding} sm:px-6 text-start`}>
                        <div className="flex items-center gap-3">
                          {photoUrl ? (
                            <img
                              src={photoUrl}
                              alt={fullName}
                              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                          ) : (
                            <AvatarFallback name={fullName} />
                          )}
                          <div className="min-w-0">
                            <span className="block font-medium text-gray-800 text-sm dark:text-white/90 truncate">
                              {fullName}
                            </span>
                            {app.phone && (
                              <span className="block text-xs text-gray-500 truncate">
                                {app.phone}
                              </span>
                            )}
                          </div>

                          {/* ── Row hover quick actions ─────────────────── */}
                          <div
                            className={`ml-auto flex items-center gap-1 transition-all duration-200 ${
                              isHovered && !isSelected
                                ? "opacity-100 translate-x-0"
                                : "opacity-0 translate-x-2 pointer-events-none"
                            }`}
                          >
                            <button
                              onClick={(e) => { e.stopPropagation(); moveToNextStage(app); }}
                              title="Move to next stage"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10 transition"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                            </button>
                            <a
                              href={`mailto:${app.email}`}
                              title={`Email ${fullName}`}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            </a>
                          </div>
                        </div>
                      </TableCell>

                      {/* ── Applied For ────────────────────────────────── */}
                      <TableCell className={`px-4 ${tdPadding} text-gray-600 text-start text-sm dark:text-gray-300 font-medium`}>
                        {app.job_posting?.title || "—"}
                      </TableCell>

                      {/* ── Email ──────────────────────────────────────── */}
                      <TableCell className={`px-4 ${tdPadding} text-start`}>
                        <a 
                          href={`mailto:${app.email}`}
                          className="truncate block max-w-[180px] text-sm text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {app.email}
                        </a>
                      </TableCell>

                      {/* ── Applied On ─────────────────────────────────── */}
                      <TableCell className={`px-4 ${tdPadding} text-gray-500 text-start text-sm dark:text-gray-400 whitespace-nowrap`}>
                        {formatDate(app.created_at)}
                      </TableCell>

                      {/* ── Status Badge ───────────────────────────────── */}
                      <TableCell className={`px-4 ${tdPadding} text-start`}>
                        <div
                          className="relative inline-block"
                          ref={openStatusId === app.id ? statusRef : null}
                        >
                          <button
                            onClick={() =>
                              setOpenStatusId(
                                openStatusId === app.id ? null : app.id
                              )
                            }
                            disabled={updatingId === app.id}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all
                              ${statusCfg.bg} ${statusCfg.text}
                              hover:ring-2 hover:ring-offset-1 hover:ring-gray-200 dark:hover:ring-gray-600
                              ${updatingId === app.id ? "opacity-50 cursor-wait" : "cursor-pointer"}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`}
                            />
                            {updatingId === app.id
                              ? "Updating…"
                              : statusCfg.label}
                            <svg
                              className="w-3 h-3 opacity-50"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>

                          {/* Status popover */}
                          {openStatusId === app.id && (
                            <div className="absolute left-0 z-50 mt-2 w-40 rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800 py-1.5 animate-in fade-in slide-in-from-top-1">
                              {STATUS_ORDER.map((sk) => {
                                const cfg = STATUS_CONFIG[sk];
                                const isActive = statusKey === sk;
                                return (
                                  <button
                                    key={sk}
                                    onClick={() => updateStatus(app.id, sk)}
                                    className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-xs transition
                                      ${isActive ? "bg-gray-50 dark:bg-gray-700/50 font-semibold" : "hover:bg-gray-50 dark:hover:bg-gray-700/30"}
                                      ${cfg.text}`}
                                  >
                                    <span
                                      className={`w-2 h-2 rounded-full ${cfg.dot}`}
                                    />
                                    {cfg.label}
                                    {isActive && (
                                      <svg
                                        className="w-3 h-3 ml-auto"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* ── Actions (Three-dot menu) ───────────────────── */}
                      <TableCell className={`px-4 ${tdPadding} text-start`}>
                        <div
                          className="relative"
                          ref={openMenuId === app.id ? menuRef : null}
                        >
                          <button
                            onClick={() =>
                              setOpenMenuId(
                                openMenuId === app.id ? null : app.id
                              )
                            }
                            className="flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-200 transition"
                            aria-label="Actions"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <circle cx="5" cy="12" r="1.5" />
                              <circle cx="12" cy="12" r="1.5" />
                              <circle cx="19" cy="12" r="1.5" />
                            </svg>
                          </button>

                          {/* Actions dropdown */}
                          {openMenuId === app.id && (
                            <div className="absolute right-0 z-50 mt-1 w-48 rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800 py-1.5">
                              {/* View Profile */}
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setSelectedApplicantId(app.id);
                                }}
                                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700 transition"
                              >
                                <svg
                                  className="w-4 h-4 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.8}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                  />
                                </svg>
                                View Profile
                              </button>

                              {/* Move to Next Stage */}
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  moveToNextStage(app);
                                }}
                                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700 transition"
                              >
                                <svg
                                  className="w-4 h-4 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.8}
                                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                                  />
                                </svg>
                                Move to Next Stage
                              </button>

                              {/* Send Email */}
                              <a
                                href={`mailto:${app.email}`}
                                onClick={() => setOpenMenuId(null)}
                                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700 transition"
                              >
                                <svg
                                  className="w-4 h-4 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.8}
                                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                  />
                                </svg>
                                Send Email
                              </a>

                              {/* Divider */}
                              <div className="my-1 border-t border-gray-100 dark:border-gray-700" />

                              {/* Reject */}
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  rejectApplication(app);
                                }}
                                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.8}
                                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                                  />
                                </svg>
                                Reject Application
                              </button>

                              {/* Archive / Restore */}
                              <button
                                onClick={async () => {
                                  setOpenMenuId(null);
                                  try {
                                    const res = await authFetch(`${API_URL}/admin/applications/${app.id}/archive`, { method: "PATCH" });
                                    if (!res.ok) throw new Error("Failed");
                                    fetchApplications(page, debouncedSearch, statusFilter, viewMode === "archived");
                                    showToast(viewMode === "active" ? "Archived candidate" : "Restored candidate", "success");
                                  } catch (err) {
                                    showToast("Failed to update archive status", "error");
                                  }
                                }}
                                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700 transition"
                              >
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                                {viewMode === "active" ? "Archive" : "Restore"}
                              </button>

                              <div className="my-1 border-t border-gray-100 dark:border-gray-700" />

                              {/* Delete */}
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setDeleteTargetId(app.id);
                                  setDeleteInput("");
                                  setDeleteConfirmOpen(true);
                                }}
                                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-500 dark:hover:bg-red-900/20 transition"
                              >
                                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                Delete Application
                              </button>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            )}
          </Table>
        </div>

        {/* ── Pagination ────────────────────────────────────────────────── */}
        {!loading && !error && applications.length > 0 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 dark:border-white/[0.05]">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing page{" "}
              <span className="font-medium text-gray-700 dark:text-gray-200">
                {page}
              </span>{" "}
              of{" "}
              <span className="font-medium text-gray-700 dark:text-gray-200">
                {lastPage}
              </span>{" "}
              &middot;{" "}
              <span className="font-medium text-gray-700 dark:text-gray-200">
                {total}
              </span>{" "}
              applicants
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 px-3.5 py-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                disabled={page >= lastPage}
                className="inline-flex items-center gap-1 px-3.5 py-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition"
              >
                Next
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Drawer */}
      <ApplicantProfileDrawer
        applicationId={selectedApplicantId}
        onClose={() => setSelectedApplicantId(null)}
        onStatusChange={(id, newStatus) => {
          setApplications(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
        }}
      />

      {/* ── High-End Delete Confirmation Modal ───────────────────────── */}
      {deleteConfirmOpen && (() => {
        let title = "Confirm Deletion";
        let subTitle = "";
        
        if (deleteTargetId === "bulk") {
          const count = selectedApplicantIds.size;
          const names = applications.filter(a => selectedApplicantIds.has(a.id)).map(a => `${a.first_name} ${a.last_name}`);
          
          if (count <= 3) {
            title = `Permanently delete ${names.join(", ")}?`;
          } else {
            title = `Permanently delete ${count} selected applicants?`;
          }
          subTitle = `This action is permanent and will soft-delete the record for audit compliance. To verify, please type `;
        } else if (deleteTargetId) {
          const app = applications.find(a => a.id === deleteTargetId);
          title = `Permanently delete ${app?.first_name} ${app?.last_name}?`;
          subTitle = `This action is permanent and will soft-delete the record for audit compliance. To verify, please type `;
        }

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={() => setDeleteConfirmOpen(false)} />
            <div className="relative bg-white dark:bg-[#1A1C23] w-full max-w-md p-6 rounded-2xl shadow-2xl border border-gray-100 dark:border-white/[0.1] animate-in zoom-in-95 duration-200">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mb-4 text-red-600 dark:text-red-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  {subTitle}<strong className="text-red-600 dark:text-red-500">DELETE</strong> below.
                </p>
                
                <div className="w-full mb-6">
                  <input
                    type="text"
                    placeholder="Type DELETE"
                    value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-center font-mono text-gray-900 dark:text-white bg-transparent focus:outline-none focus:ring-2 focus:ring-red-500 uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal"
                  />
                </div>

                <div className="flex w-full gap-3">
                  <button
                    onClick={() => setDeleteConfirmOpen(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 dark:bg-white/[0.05] text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-colors"
                  >
                    Review Selection
                  </button>
                  <button
                    onClick={executeDelete}
                    disabled={deleteInput !== "DELETE" || deleteLoading}
                    className="flex-1 flex justify-center items-center px-4 py-2 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleteLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "Delete Record"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Toast */}
      <Toast visible={toast.visible} message={toast.message} type={toast.type} />

      {/* Bulk Status Confirmation Modal */}
      {isConfirmModalOpen && pendingTargetStatus && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={() => !bulkStatusLoading && setIsConfirmModalOpen(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="mb-6">
              <div className="w-12 h-12 rounded-full bg-yellow-50 dark:bg-[#FCEE23]/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#FCEE23]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Confirm Status Update</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                You are about to change the status of <strong className="text-gray-900 dark:text-gray-200">{selectedApplicantIds.size} applicant{selectedApplicantIds.size !== 1 && 's'}</strong> to <strong className="text-gray-900 dark:text-gray-200">"{STATUS_CONFIG[pendingTargetStatus].label}"</strong>.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button 
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={bulkStatusLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FCEE23] disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button 
                onClick={submitBulkStatusUpdate}
                disabled={bulkStatusLoading}
                className="inline-flex items-center justify-center min-w-[100px] px-4 py-2 text-sm font-semibold text-gray-900 bg-[#FCEE23] border border-transparent rounded-lg hover:bg-[#e5d820] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FCEE23] disabled:opacity-70 transition"
              >
                {bulkStatusLoading ? (
                  <svg className="animate-spin h-5 w-5 text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  "Confirm Update"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
