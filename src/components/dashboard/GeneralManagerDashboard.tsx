import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
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
  const navigate = useNavigate();
  const [requisitions] = useState<Requisition[]>(MOCK_REQUISITIONS);
  const [timelineTarget, setTimelineTarget] = useState<Requisition | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // ── Derived KPIs ───────────────────────────────────────────────────────
  const totalOpen = requisitions.filter(
    (r) => r.status !== "Closed" && r.status !== "Rejected"
  ).length;

  const awaitingApproval = requisitions.filter(
    (r) => r.status === "Pending MD Approval" || r.status === "Pending HR Approval"
  );

  const avgApprovalDays = useMemo(() => {
    const resolved = requisitions.filter((r) => r.approvedAt);
    if (resolved.length === 0) return null;
    const totalDays = resolved.reduce((sum, r) => {
      const submitted = new Date(r.submittedAt).getTime();
      const approved = new Date(r.approvedAt!).getTime();
      return sum + (approved - submitted) / (1000 * 60 * 60 * 24);
    }, 0);
    return totalDays / resolved.length;
  }, [requisitions]);

  const headcountUsed = requisitions
    .filter((r) => ["Approved", "In Progress", "Posted"].includes(r.status))
    .reduce((sum, r) => sum + r.headcount, 0);
  const budgetPct = Math.min(100, Math.round((headcountUsed / HEADCOUNT_BUDGET.total) * 100));

  // Bottlenecks: pending approval and untouched for 48h+
  const bottlenecks = requisitions.filter(
    (r) =>
      (r.status === "Pending MD Approval" || r.status === "Pending HR Approval") &&
      hoursSince(r.lastUpdatedAt) >= 48
  );

  function handleNudge(req: Requisition) {
    const approver = req.status === "Pending MD Approval" ? "Managing Director" : "HR";
    setToast(`Reminder sent to ${approver} about "${req.title}".`);
    setTimeout(() => setToast(null), 4000);
  }

  return (
    <div className="space-y-6">
      {/* ── Toast ─────────────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium shadow-2xl animate-in fade-in slide-in-from-top-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {toast}
        </div>
      )}

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
          onClick={() => navigate("/hiring-plan")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-950 text-sm font-semibold shadow-sm transition-all shrink-0"
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
          label="Avg. Approval Velocity"
          value={avgApprovalDays !== null ? `${avgApprovalDays.toFixed(1)}d` : "—"}
          sublabel="Time to clear full pipeline"
          icon={
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          }
        />
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Budget Utilization</span>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {headcountUsed}/{HEADCOUNT_BUDGET.total}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${budgetPct >= 90 ? "bg-red-500" : budgetPct >= 70 ? "bg-amber-400" : "bg-green-500"}`}
              style={{ width: `${budgetPct}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{budgetPct}% of quarterly headcount consumed</p>
        </div>
      </div>

      {/* ── Main grid: Pipeline + Attention panel ────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Requisition Pipeline Widget */}
        <div className="xl:col-span-9 min-w-0 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Requisition Pipeline</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Stage-by-stage accountability for every open request</p>
            </div>
            <button
              onClick={() => navigate("/hiring-plan")}
              className="text-xs font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              View all →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40">
                  {["Requisition Title", "Current Stage", "Last Updated", "Action"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap last:text-right last:pr-6">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {requisitions
                  .filter((r) => r.status !== "Closed")
                  .slice(0, 6)
                  .map((req) => {
                    const style = STATUS_STYLES[req.status];
                    const isBottleneck = bottlenecks.some((b) => b.id === req.id);
                    return (
                      <tr key={req.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors">
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="block font-medium text-gray-900 dark:text-white text-sm">{req.title}</span>
                          <span className="block text-xs text-gray-400 dark:text-gray-500 mt-0.5">{req.department}</span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                            {req.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs whitespace-nowrap">
                          <span className={isBottleneck ? "text-red-500 font-semibold" : "text-gray-400 dark:text-gray-500"}>
                            {timeAgo(req.lastUpdatedAt)}
                          </span>
                        </td>
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
              </tbody>
            </table>
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

// ── Horizontal timeline stepper ─────────────────────────────────────────
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
                    ? "bg-gray-900 dark:bg-white border-gray-900 dark:border-white text-white dark:text-gray-900"
                    : isCurrent
                    ? "border-gray-900 dark:border-white text-gray-900 dark:text-white bg-white dark:bg-gray-900"
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
              <span className={`text-[11px] font-medium text-center whitespace-nowrap ${isCurrent ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500"}`}>
                {stage}
              </span>
            </div>
            {i < PIPELINE_STAGES.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-5 ${isDone ? "bg-gray-900 dark:bg-white" : "bg-gray-200 dark:bg-gray-700"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
