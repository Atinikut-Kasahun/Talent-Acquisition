import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type ReqStatus =
  | "Draft"
  | "Pending MD Approval"
  | "Approved"
  | "Rejected"
  | "In Progress"
  | "Closed";

interface Requisition {
  id: string;
  title: string;
  department: string;
  headcount: number;
  submittedAt: string;
  status: ReqStatus;
  reason: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock data — replace with real API calls when backend is ready
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_REQUISITIONS: Requisition[] = [
  {
    id: "REQ-001",
    title: "Senior Sales Representative",
    department: "Sales",
    headcount: 3,
    submittedAt: "2025-05-10",
    status: "Approved",
    reason: "Business expansion into new region",
  },
  {
    id: "REQ-002",
    title: "Warehouse Supervisor",
    department: "Operations",
    headcount: 2,
    submittedAt: "2025-05-28",
    status: "Pending MD Approval",
    reason: "Replacement for 2 departing staff",
  },
  {
    id: "REQ-003",
    title: "Finance Officer",
    department: "Finance",
    headcount: 1,
    submittedAt: "2025-06-01",
    status: "In Progress",
    reason: "New project workload",
  },
  {
    id: "REQ-004",
    title: "Marketing Coordinator",
    department: "Marketing",
    headcount: 2,
    submittedAt: "2025-04-15",
    status: "Rejected",
    reason: "Campaign support",
  },
  {
    id: "REQ-005",
    title: "IT Support Specialist",
    department: "IT",
    headcount: 1,
    submittedAt: "2025-06-02",
    status: "Draft",
    reason: "Infrastructure growth",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Status badge helper
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<ReqStatus, { bg: string; text: string; dot: string }> = {
  "Draft":                { bg: "bg-gray-100 dark:bg-gray-800",     text: "text-gray-600 dark:text-gray-400",   dot: "bg-gray-400" },
  "Pending MD Approval":  { bg: "bg-yellow-50 dark:bg-yellow-900/20", text: "text-yellow-700 dark:text-yellow-400", dot: "bg-yellow-400" },
  "Approved":             { bg: "bg-green-50 dark:bg-green-900/20", text: "text-green-700 dark:text-green-400",  dot: "bg-green-500" },
  "Rejected":             { bg: "bg-red-50 dark:bg-red-900/20",     text: "text-red-700 dark:text-red-400",     dot: "bg-red-500"   },
  "In Progress":          { bg: "bg-blue-50 dark:bg-blue-900/20",   text: "text-blue-700 dark:text-blue-400",   dot: "bg-blue-500"  },
  "Closed":               { bg: "bg-gray-100 dark:bg-gray-800",     text: "text-gray-500 dark:text-gray-500",   dot: "bg-gray-400"  },
};

function StatusBadge({ status }: { status: ReqStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// New Requisition Modal
// ─────────────────────────────────────────────────────────────────────────────
interface ModalProps {
  onClose: () => void;
  onSubmit: (req: Requisition) => void;
}

function NewRequisitionModal({ onClose, onSubmit }: ModalProps) {
  const [form, setForm] = useState({
    title: "",
    department: "",
    headcount: 1,
    reason: "",
  });
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      const newReq: Requisition = {
        id: `REQ-${String(Math.floor(Math.random() * 900) + 100)}`,
        title: form.title,
        department: form.department,
        headcount: form.headcount,
        submittedAt: new Date().toISOString().split("T")[0],
        status: "Pending MD Approval",
        reason: form.reason,
      };
      onSubmit(newReq);
      setSubmitting(false);
    }, 600);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal card */}
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              New Headcount Request
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Submit a requisition for MD approval
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Position Title <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Senior Sales Representative"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Department <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
              >
                <option value="">Select department</option>
                {["Sales", "Operations", "Finance", "Marketing", "IT", "HR", "Logistics", "Legal"].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Headcount <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="number"
                min={1}
                max={50}
                value={form.headcount}
                onChange={(e) => setForm({ ...form, headcount: +e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Business Justification <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="Describe the reason for this headcount request…"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all resize-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Submitting…
                </>
              ) : (
                "Submit for Approval"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function HiringPlanGM() {
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const gmName = user?.name ?? "General Manager";

  const [requisitions, setRequisitions] = useState<Requisition[]>(MOCK_REQUISITIONS);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<ReqStatus | "All">("All");
  const [successMsg, setSuccessMsg] = useState("");

  // Derived stats
  const totalApproved    = requisitions.filter(r => r.status === "Approved").length;
  const totalPending     = requisitions.filter(r => r.status === "Pending MD Approval").length;
  const totalRejected    = requisitions.filter(r => r.status === "Rejected").length;
  const totalInProgress  = requisitions.filter(r => r.status === "In Progress").length;

  // Filtered list
  const filtered = filterStatus === "All"
    ? requisitions
    : requisitions.filter(r => r.status === filterStatus);

  function handleNewReq(req: Requisition) {
    setRequisitions(prev => [req, ...prev]);
    setShowModal(false);
    setSuccessMsg(`Requisition "${req.title}" submitted successfully and is pending MD approval.`);
    setTimeout(() => setSuccessMsg(""), 5000);
  }

  return (
    <>
      <PageMeta
        title="Hiring Plan | Droga Group"
        description="GM Hiring Plan – Submit headcount requests and track requisition status."
      />

      {/* ── Modal ── */}
      {showModal && (
        <NewRequisitionModal onClose={() => setShowModal(false)} onSubmit={handleNewReq} />
      )}

      <div className="space-y-6">

        {/* ── Page Header ── */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              Hiring Plan
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Welcome back, <span className="font-medium text-gray-700 dark:text-gray-300">{gmName}</span> · Manage headcount requests for your company
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            FY 2025 · Q2
          </div>
        </div>

        {/* ── Success toast ── */}
        {successMsg && (
          <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-sm text-green-700 dark:text-green-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 mt-0.5 flex-shrink-0 text-green-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {successMsg}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            WIDGET 1 — REQUISITION INITIATION PANEL
        ══════════════════════════════════════════════════════════════════ */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
          {/* Hero CTA band */}
          <div className="relative px-6 py-8 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 overflow-hidden">
            {/* Decorative grid */}
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg,transparent,transparent 31px,#fff 31px,#fff 32px),repeating-linear-gradient(90deg,transparent,transparent 31px,#fff 31px,#fff 32px)",
              }}
            />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 text-white">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </span>
                  <span className="text-xs font-semibold text-white/50 uppercase tracking-widest">
                    Requisition Initiation
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white mb-1">
                  Submit a New Headcount Request
                </h2>
                <p className="text-sm text-white/60 max-w-md">
                  Initiate a formal requisition for new or replacement headcount.
                  It will be routed directly to the Managing Director for approval.
                </p>
              </div>
              <button
                id="btn-submit-headcount-request"
                onClick={() => setShowModal(true)}
                className="flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl bg-[#FCEE23] hover:bg-yellow-300 text-gray-900 text-sm font-bold shadow-lg shadow-yellow-400/20 transition-all hover:scale-105 active:scale-100"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Submit New Request
              </button>
            </div>
          </div>

          {/* Quick-stat strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100 dark:divide-gray-800">
            {[
              { label: "Pending Approval", value: totalPending,    color: "text-yellow-500" },
              { label: "Approved",         value: totalApproved,   color: "text-green-500"  },
              { label: "In Progress",      value: totalInProgress, color: "text-blue-500"   },
              { label: "Rejected",         value: totalRejected,   color: "text-red-500"    },
            ].map(stat => (
              <div key={stat.label} className="px-6 py-4 flex flex-col gap-1">
                <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            WIDGET 2 — REQUEST STATUS TRACKER
        ══════════════════════════════════════════════════════════════════ */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 text-gray-600 dark:text-gray-300">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </span>
                Request Status Tracker
              </h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                All requisitions submitted by your company
              </p>
            </div>
            {/* Filter pills */}
            <div className="flex flex-wrap gap-1.5">
              {(["All", "Pending MD Approval", "Approved", "In Progress", "Rejected", "Draft"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s as ReqStatus | "All")}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    filterStatus === s
                      ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40">
                  {["Req ID", "Position", "Department", "HC", "Submitted", "Status", "Reason"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-gray-400 dark:text-gray-600 text-sm">
                      No requisitions found for this filter.
                    </td>
                  </tr>
                ) : (
                  filtered.map((req) => (
                    <tr
                      key={req.id}
                      className="group hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-mono text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                        {req.id}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                        {req.title}
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {req.department}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold">
                          {req.headcount}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 whitespace-nowrap text-xs">
                        {req.submittedAt}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 dark:text-gray-500 max-w-[200px] truncate text-xs">
                        {req.reason}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400 dark:text-gray-600">
            Showing {filtered.length} of {requisitions.length} requisitions
          </div>
        </div>

      </div>
    </>
  );
}
