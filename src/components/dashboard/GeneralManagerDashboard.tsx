import { useEffect, useMemo, useRef, useState } from "react";
import { Send, BellRing } from "lucide-react";
import Pagination from "../ui/pagination/Pagination";
import NewRequisitionWizard from "./NewRequisitionWizard";
import { useToast } from "../ui/toast/useToast";
import Toast from "../ui/toast/Toast";
import {
  HEADCOUNT_BUDGET,
  MOCK_REQUISITIONS,
  PIPELINE_STAGES,
  Requisition,
  STATUS_STYLES,
  stageIndexForStatus,
} from "../../pages/HiringPlan/requisitionsData";

// ── Small time-formatting helper: "2h ago", "1d ago" ────────────────────────
function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function hoursSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60);
}

export default function GeneralManagerDashboard() {
  const [requisitions, setRequisitions] = useState<Requisition[]>(MOCK_REQUISITIONS);
  const [timelineTarget, setTimelineTarget] = useState<Requisition | null>(null);
  const { toast, showToast, dismiss } = useToast();
  const [wizardOpen, setWizardOpen] = useState(false);

  const storedUser = localStorage.getItem("user");
  const currentUserName = storedUser ? JSON.parse(storedUser)?.name ?? "" : "";

  const nextRequisitionId = useMemo(() => {
    const maxNum = requisitions.reduce((max, r) => {
      const match = r.id.match(/REQ-(\d+)/);
      const num = match ? parseInt(match[1], 10) : 0;
      return Math.max(max, num);
    }, 0);
    return `REQ-${String(maxNum + 1).padStart(3, "0")}`;
  }, [requisitions]);

  function handleWizardSubmit(newReq: Requisition) {
    setRequisitions((prev) => [newReq, ...prev]);
    setWizardOpen(false);
    showToast({
      title: "Requisition submitted",
      message: `${newReq.title} (${newReq.id}) is now awaiting MD approval.`,
      variant: "success",
      icon: Send,
    });
  }

  // ── Derived KPIs ───────────────────────────────────────────────────────
  const totalOpen = requisitions.filter(
    (r) => r.status !== "Closed" && r.status !== "Rejected"
  ).length;

  const awaitingApproval = requisitions.filter(
    (r) => r.status === "Pending MD Approval" || r.status === "Pending HR Approval"
  );

  const approvedCount = requisitions.filter((r) => r.status === "Approved").length;
  const rejectedCount = requisitions.filter((r) => r.status === "Rejected").length;

  // Bottlenecks: pending approval and untouched for 48h+ (always computed off the
  // full unfiltered set — this panel tracks urgency, not the table's current view)
  const bottlenecks = requisitions.filter(
    (r) =>
      (r.status === "Pending MD Approval" || r.status === "Pending HR Approval") &&
      hoursSince(r.lastUpdatedAt) >= 48
  );

  // ── Facet filters (multi-select, Jira/Linear-style) ───────────────────
  const allDepartments = useMemo(
    () => Array.from(new Set(requisitions.map((r) => r.department))).sort(),
    [requisitions]
  );
  const allStatuses = useMemo(
    () => Array.from(new Set(requisitions.map((r) => r.status))),
    [requisitions]
  );

  const [departmentFilter, setDepartmentFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  // ── Column visibility ("View Settings") ────────────────────────────────
  const [visibleCols, setVisibleCols] = useState({
    department: true,
    stage: true,
    lastUpdated: true,
  });

  // ── Pagination ──────────────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredRequisitions = useMemo(() => {
    return requisitions.filter((r) => {
      if (r.status === "Closed") return false;
      if (departmentFilter.length > 0 && !departmentFilter.includes(r.department)) return false;
      if (statusFilter.length > 0 && !statusFilter.includes(r.status)) return false;
      return true;
    });
  }, [requisitions, departmentFilter, statusFilter]);

  const paginatedRequisitions = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRequisitions.slice(start, start + pageSize);
  }, [filteredRequisitions, page, pageSize]);

  const hasActiveFilters = departmentFilter.length > 0 || statusFilter.length > 0;

  useEffect(() => {
    setPage(1);
  }, [departmentFilter, statusFilter]);

  function clearAllFilters() {
    setDepartmentFilter([]);
    setStatusFilter([]);
    setPage(1);
  }

  function handleNudge(req: Requisition) {
    const approver = req.status === "Pending MD Approval" ? "Managing Director" : "HR";
    showToast({
      title: "Reminder sent",
      message: `${approver} was notified about "${req.title}".`,
      variant: "info",
      icon: BellRing,
    });
  }

  return (
    <div className="space-y-6">
      {/* ── Toast ─────────────────────────────────────────────────────── */}
      {toast && <Toast toast={toast} onDismiss={dismiss} />}

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Requisition Command Center
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Governance view of your open headcount requests · {HEADCOUNT_BUDGET.quarter}
          </p>
        </div>
        <button
          onClick={() => setWizardOpen(true)}
          className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-[#1A1A1A] hover:bg-[#FCEE23] text-white hover:text-gray-900 text-sm font-semibold shadow-sm hover:shadow-lg transition-all duration-200 shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v16m8-8H4" />
          </svg>
          New Requisition Request
        </button>
      </div>

      {/* ── KPI Row ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Total Open Requisitions"
          value={totalOpen}
          icon={
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          }
        />
        <KpiCard
          label="Approval Pipeline"
          value={awaitingApproval.length}
          sublabel={awaitingApproval.length > 0 ? `${awaitingApproval.length} awaiting review` : "All clear"}
          accent={awaitingApproval.length > 0 ? "text-amber-500" : "text-green-500"}
          icon={
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          }
        />
        <KpiCard
          label="Approved"
          value={approvedCount}
          sublabel="Cleared full approval"
          accent="text-green-500"
          icon={
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          }
        />
        <KpiCard
          label="Rejected"
          value={rejectedCount}
          sublabel="Did not clear approval"
          accent={rejectedCount > 0 ? "text-red-500" : "text-gray-900 dark:text-white"}
          icon={
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          }
        />
      </div>

      {/* ── Main grid: Pipeline + Attention panel ────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Requisition Pipeline Widget */}
        <div className="xl:col-span-9 min-w-0 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Requisition Pipeline</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Stage-by-stage accountability for every open request</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 px-6 py-3 border-b border-gray-100 dark:border-gray-800">
            <FacetFilter
              label="Department"
              options={allDepartments}
              selected={departmentFilter}
              onChange={setDepartmentFilter}
            />
            <FacetFilter
              label="Status"
              options={allStatuses}
              selected={statusFilter}
              onChange={setStatusFilter}
              renderOption={(s) => (
                <span className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLES[s as Requisition["status"]].dot}`} />
                  {s}
                </span>
              )}
            />
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-xs font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors ml-1"
              >
                Clear all filters
              </button>
            )}

            <div className="ml-auto">
              <ColumnToggle visibleCols={visibleCols} onChange={setVisibleCols} />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">
                    Requisition Title
                  </th>
                  {visibleCols.stage && (
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">
                      Current Stage
                    </th>
                  )}
                  {visibleCols.lastUpdated && (
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">
                      Last Updated
                    </th>
                  )}
                  <th className="text-right px-4 py-3 pr-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {paginatedRequisitions.map((req) => {
                  const style = STATUS_STYLES[req.status];
                  const isBottleneck = bottlenecks.some((b) => b.id === req.id);
                  return (
                    <tr key={req.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="block font-medium text-gray-900 dark:text-white text-sm">{req.title}</span>
                        {visibleCols.department && (
                          <span className="block text-xs text-gray-400 dark:text-gray-500 mt-0.5">{req.department}</span>
                        )}
                      </td>
                      {visibleCols.stage && (
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                            {req.status}
                          </span>
                        </td>
                      )}
                      {visibleCols.lastUpdated && (
                        <td className="px-4 py-3.5 text-xs whitespace-nowrap">
                          <span className={isBottleneck ? "text-red-500 font-semibold" : "text-gray-400 dark:text-gray-500"}>
                            {timeAgo(req.lastUpdatedAt)}
                          </span>
                        </td>
                      )}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap pr-6">
                        <button
                          onClick={() => setTimelineTarget(req)}
                          className="text-xs font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                        >
                          View Timeline
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {paginatedRequisitions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-400">
                      No requisitions match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 pb-2">
            <Pagination
              currentPage={page}
              totalItems={filteredRequisitions.length}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
              itemLabel="requisitions"
              showGoToPage
            />
          </div>
        </div>

        {/* Attention Required Panel */}
        <div className="xl:col-span-3 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 h-fit">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </span>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Attention Required</h2>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
            Requisitions stuck for 48+ hours
          </p>

          {bottlenecks.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-8 text-gray-400 dark:text-gray-500">
              <svg className="w-8 h-8 mb-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm">No bottlenecks right now</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bottlenecks.map((req) => (
                <div key={req.id} className="p-3.5 rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{req.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Stuck at <span className="font-medium">{req.status}</span> · {timeAgo(req.lastUpdatedAt)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleNudge(req)}
                    className="mt-2.5 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-900 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    Nudge Approver
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Timeline Modal ────────────────────────────────────────────── */}
      {timelineTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setTimelineTarget(null)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{timelineTarget.title}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{timelineTarget.department} · {timelineTarget.id}</p>
              </div>
              <button
                onClick={() => setTimelineTarget(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-8">
              <TimelineStepper currentIndex={stageIndexForStatus(timelineTarget.status)} />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-6 text-center">
                Submitted {timelineTarget.submittedAt} · Last updated {timeAgo(timelineTarget.lastUpdatedAt)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── New Requisition Wizard ────────────────────────────────────── */}
      <NewRequisitionWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSubmit={handleWizardSubmit}
        requestedBy={currentUserName}
        nextId={nextRequisitionId}
      />
    </div>
  );
}

// ── KPI Card ────────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  sublabel,
  accent,
  icon,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  accent?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
        <span className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
            {icon}
          </svg>
        </span>
      </div>
      <div className={`text-2xl font-bold ${accent ?? "text-gray-900 dark:text-white"}`}>{value}</div>
      {sublabel && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sublabel}</p>}
    </div>
  );
}

// ── Facet filter: multi-select pill with popover, matching Jira/Linear-style
// "query builder" filtering. Active state = tinted pill + inline "x" to clear
// just this facet; "Clear all filters" (rendered by the parent) clears every
// facet at once. ──────────────────────────────────────────────────────────
function FacetFilter({
  label,
  options,
  selected,
  onChange,
  renderOption,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
  renderOption?: (opt: string) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function toggleOption(opt: string) {
    onChange(selected.includes(opt) ? selected.filter((o) => o !== opt) : [...selected, opt]);
  }

  const isActive = selected.length > 0;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 pl-3 pr-2.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
          isActive
            ? "bg-[#FCEE23]/10 border-[#FCEE23] text-gray-900 dark:text-white"
            : "bg-white dark:bg-white/[0.03] border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
        }`}
      >
        {label}
        {isActive && (
          <span className="inline-flex items-center justify-center min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-semibold">
            {selected.length}
          </span>
        )}
        {isActive ? (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onChange([]);
            }}
            className="ml-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 p-0.5"
            aria-label={`Clear ${label} filter`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </span>
        ) : (
          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-52 rounded-xl border border-gray-100 dark:border-white/[0.08] bg-white dark:bg-[#1A1C23] shadow-xl z-50 overflow-hidden py-1.5">
          {options.map((opt) => {
            const checked = selected.includes(opt);
            return (
              <button
                key={opt}
                onClick={() => toggleOption(opt)}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-left transition-colors ${
                  checked ? "bg-gray-50 dark:bg-white/[0.06] font-semibold" : "hover:bg-gray-50 dark:hover:bg-white/[0.04] text-gray-700 dark:text-gray-300"
                }`}
              >
                <span
                  className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                    checked ? "bg-gray-900 dark:bg-white border-gray-900 dark:border-white" : "border-gray-300 dark:border-gray-600"
                  }`}
                >
                  {checked && (
                    <svg className="w-2.5 h-2.5 text-white dark:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                {renderOption ? renderOption(opt) : opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Column visibility ("View Settings") popover ────────────────────────────
type VisibleCols = { department: boolean; stage: boolean; lastUpdated: boolean };

function ColumnToggle({
  visibleCols,
  onChange,
}: {
  visibleCols: VisibleCols;
  onChange: (cols: VisibleCols) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const options: { key: keyof VisibleCols; label: string }[] = [
    { key: "department", label: "Department (subtitle)" },
    { key: "stage", label: "Current Stage" },
    { key: "lastUpdated", label: "Last Updated" },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.03] text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
        </svg>
        View
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-56 rounded-xl border border-gray-100 dark:border-white/[0.08] bg-white dark:bg-[#1A1C23] shadow-xl z-50 overflow-hidden py-1.5">
          <p className="px-3.5 pt-1 pb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
            Toggle columns
          </p>
          {options.map(({ key, label }) => {
            const checked = visibleCols[key];
            return (
              <button
                key={key}
                onClick={() => onChange({ ...visibleCols, [key]: !checked })}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
              >
                <span
                  className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                    checked ? "bg-gray-900 dark:bg-white border-gray-900 dark:border-white" : "border-gray-300 dark:border-gray-600"
                  }`}
                >
                  {checked && (
                    <svg className="w-2.5 h-2.5 text-white dark:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
function TimelineStepper({ currentIndex }: { currentIndex: number }) {
  return (
    <div className="flex items-center">
      {PIPELINE_STAGES.map((stage, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <div key={stage} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                  isDone
                    ? "bg-[#22C55E] border-[#22C55E] text-white"
                    : isCurrent
                    ? "border-gray-900 dark:border-white text-gray-900 dark:text-white bg-[#FCEE23]/15"
                    : "border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 bg-white dark:bg-gray-900"
                }`}
              >
                {isDone ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span className={`text-[11px] text-center whitespace-nowrap ${isCurrent ? "text-gray-900 dark:text-white font-semibold" : isDone ? "text-gray-500 dark:text-gray-400 font-medium" : "text-gray-300 dark:text-gray-600 font-medium"}`}>
                {stage}
              </span>
            </div>
            {i < PIPELINE_STAGES.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-5 ${isDone ? "bg-[#22C55E]" : "bg-gray-100 dark:bg-gray-800"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
