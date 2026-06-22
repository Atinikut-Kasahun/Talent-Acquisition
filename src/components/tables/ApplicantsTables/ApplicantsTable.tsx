import { useState, useEffect, useRef, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";
import ApplicantProfileDrawer from "./ApplicantProfileDrawer";
import { authFetch, getAuthHeaders } from "../../../utils/authFetch";

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
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Fetch applications ──────────────────────────────────────────────────
  const fetchApplications = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(
        `${API_URL}/admin/applications?page=${p}`
      );
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
    fetchApplications(page);
  }, [page, fetchApplications]);

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

  // ── Header cell helper ──────────────────────────────────────────────────
  const thClass =
    "px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 uppercase";

  // ═══════════════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════════════
  const displayedApps = starredOnly ? applications.filter((a) => a.is_starred) : applications;

  return (
    <>
      {/* ── Starred filter chip ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setStarredOnly((v) => !v)}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${
            starredOnly
              ? "bg-yellow-400 border-yellow-400 text-gray-900 shadow-sm"
              : "bg-white dark:bg-white/[0.03] border-gray-200 dark:border-white/[0.08] text-gray-500 dark:text-gray-400 hover:border-yellow-400 hover:text-yellow-500"
          }`}
          title={starredOnly ? "Showing starred only — click to show all" : "Show starred candidates only"}
        >
          <svg
            className={`w-3.5 h-3.5 transition-colors ${starredOnly ? "text-gray-900" : "text-yellow-400"}`}
            fill={starredOnly ? "currentColor" : "none"}
            stroke={starredOnly ? "none" : "currentColor"}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          Shortlisted
          {starredOnly && (
            <span className="ml-1 bg-gray-900/20 text-gray-900 text-xs font-semibold px-1.5 py-0.5 rounded-full">
              {applications.filter((a) => a.is_starred).length}
            </span>
          )}
        </button>
        {starredOnly && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Showing {applications.filter((a) => a.is_starred).length} starred candidate{applications.filter((a) => a.is_starred).length !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            {/* ── Header ──────────────────────────────────────────────── */}
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className={thClass}>
                  Name
                </TableCell>
                <TableCell isHeader className={thClass}>
                  Applied For
                </TableCell>
                <TableCell isHeader className={thClass}>
                  Email
                </TableCell>
                <TableCell isHeader className={thClass}>
                  Applied On
                </TableCell>
                <TableCell isHeader className={thClass}>
                  Status
                </TableCell>
                <TableCell isHeader className={thClass}>
                  Actions
                </TableCell>
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
                        onClick={() => fetchApplications(page)}
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
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      {starredOnly ? (
                        <>
                          <svg className="w-8 h-8 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No starred candidates yet</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">Open a profile and click the ⭐ star to shortlist a candidate</p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-400">No applications found</p>
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
                  const statusCfg =
                    STATUS_CONFIG[statusKey] || STATUS_CONFIG.new;
                  const isHovered = hoveredRowId === app.id;

                  return (
                    <TableRow
                      key={app.id}
                      className="group relative"
                      // @ts-ignore - Custom onMouseEnter/onMouseLeave for hover state
                      onMouseEnter={() => setHoveredRowId(app.id)}
                      onMouseLeave={() => setHoveredRowId(null)}
                    >
                      {/* ── Name ───────────────────────────────────────── */}
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <div className="flex items-center gap-3">
                          {photoUrl ? (
                            <img
                              src={photoUrl}
                              alt={fullName}
                              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                              onError={(e) => {
                                (
                                  e.target as HTMLImageElement
                                ).style.display = "none";
                              }}
                            />
                          ) : (
                            <AvatarFallback name={fullName} />
                          )}
                          <div className="min-w-0">
                            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90 truncate">
                              {fullName}
                            </span>
                            {app.phone && (
                              <span className="block text-xs text-gray-400 truncate">
                                {app.phone}
                              </span>
                            )}
                          </div>

                          {/* ── Row hover quick actions ─────────────────── */}
                          <div
                            className={`ml-auto flex items-center gap-1 transition-all duration-200 ${
                              isHovered
                                ? "opacity-100 translate-x-0"
                                : "opacity-0 translate-x-2 pointer-events-none"
                            }`}
                          >
                            {/* Quick advance */}
                            <button
                              onClick={() => moveToNextStage(app)}
                              title="Move to next stage"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10 transition"
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
                                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                                />
                              </svg>
                            </button>
                            {/* Quick email */}
                            <a
                              href={`mailto:${app.email}`}
                              title={`Email ${fullName}`}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition"
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
                                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                />
                              </svg>
                            </a>
                          </div>
                        </div>
                      </TableCell>

                      {/* ── Applied For ────────────────────────────────── */}
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {app.job_posting?.title || "—"}
                      </TableCell>

                      {/* ── Email ──────────────────────────────────────── */}
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        <span className="truncate block max-w-[180px]">
                          {app.email}
                        </span>
                      </TableCell>

                      {/* ── Applied On ─────────────────────────────────── */}
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {formatDate(app.created_at)}
                      </TableCell>

                      {/* ── Status Badge ───────────────────────────────── */}
                      <TableCell className="px-4 py-3 text-start">
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
                      <TableCell className="px-4 py-3 text-start">
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
          setApplications((prev) => prev.map((a) => a.id === id ? { ...a, status: newStatus } : a));
        }}
      />

      {/* Toast */}
      <Toast visible={toast.visible} message={toast.message} type={toast.type} />
    </>
  );
}
