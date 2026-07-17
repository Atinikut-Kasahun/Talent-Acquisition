import { useMemo, useState } from "react";
import { Landmark, FileSignature, Gauge, CheckCircle2, Undo2, Award, type LucideIcon } from "lucide-react";
import { useToast } from "../ui/toast/useToast";
import Toast from "../ui/toast/Toast";
import {
  ActivityEntry,
  MOCK_REQUISITIONS,
  Requisition,
  STATUS_STYLES,
  TOTAL_BUDGET_CAP,
} from "../../pages/HiringPlan/requisitionsData";
import { Finalist, MOCK_FINALISTS } from "../../pages/HiringPlan/finalistsData";

function formatETB(n: number): string {
  if (n >= 1_000_000) return `ETB ${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `ETB ${(n / 1_000).toFixed(0)}K`;
  return `ETB ${n}`;
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function ManagingDirectorDashboard() {
  const [requisitions, setRequisitions] = useState<Requisition[]>(MOCK_REQUISITIONS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [amendOpen, setAmendOpen] = useState(false);
  const [amendMessage, setAmendMessage] = useState("");
  const [directiveMessage, setDirectiveMessage] = useState("");
  const { toast, showToast, dismiss } = useToast();
  const [activeFinalist, setActiveFinalist] = useState<Finalist | null>(null);
  const [signedOff, setSignedOff] = useState<Record<string, boolean>>({});

  const storedUser = localStorage.getItem("user");
  const currentUserName = storedUser ? JSON.parse(storedUser)?.name ?? "Managing Director" : "Managing Director";

  const pendingQueue = useMemo(
    () => requisitions.filter((r) => r.status === "Pending MD Approval"),
    [requisitions]
  );

  const selectedReq = useMemo(() => {
    if (selectedId) {
      const found = requisitions.find((r) => r.id === selectedId);
      if (found && found.status === "Pending MD Approval") return found;
    }
    return pendingQueue[0] ?? null;
  }, [selectedId, requisitions, pendingQueue]);

  // ── Executive KPIs ───────────────────────────────────────────────────────
  const committedLiability = useMemo(() => {
    return requisitions
      .filter((r) => ["Approved", "Posted", "In Progress"].includes(r.status))
      .reduce((sum, r) => sum + (r.annualSalary ?? 0) * r.headcount, 0);
  }, [requisitions]);

  const pendingLiability = useMemo(() => {
    return requisitions
      .filter((r) => ["Pending MD Approval", "Pending HR Approval"].includes(r.status))
      .reduce((sum, r) => sum + (r.annualSalary ?? 0) * r.headcount, 0);
  }, [requisitions]);

  const budgetLiability = committedLiability + pendingLiability;

  const pendingApprovalValue = useMemo(() => {
    return pendingQueue.reduce((sum, r) => sum + (r.annualSalary ?? 0) * r.headcount, 0);
  }, [pendingQueue]);

  const keyHireVelocity = useMemo(() => {
    const resolved = requisitions.filter((r) => r.approvedAt);
    if (resolved.length === 0) return null;
    const totalDays = resolved.reduce((sum, r) => {
      const submitted = new Date(r.submittedAt).getTime();
      const approved = new Date(r.approvedAt!).getTime();
      return sum + (approved - submitted) / (1000 * 60 * 60 * 24);
    }, 0);
    return totalDays / resolved.length;
  }, [requisitions]);

  function handleApprove(req: Requisition) {
    setRequisitions((prev) =>
      prev.map((r) =>
        r.id === req.id
          ? {
              ...r,
              status: "Approved",
              approvedAt: new Date().toISOString().split("T")[0],
              lastUpdatedAt: new Date().toISOString(),
            }
          : r
      )
    );
    showToast({
      title: "Requisition approved",
      message: `${req.title} (${req.id}) has cleared MD approval and moves to HR.`,
      variant: "success",
      icon: CheckCircle2,
    });
    setSelectedId(null);
  }

  function handleAmendSubmit() {
    if (!selectedReq || amendMessage.trim().length === 0) return;
    const entry: ActivityEntry = {
      author: `${currentUserName} (MD)`,
      message: amendMessage.trim(),
      timestamp: new Date().toISOString(),
    };
    setRequisitions((prev) =>
      prev.map((r) =>
        r.id === selectedReq.id
          ? {
              ...r,
              status: "Draft",
              lastUpdatedAt: new Date().toISOString(),
              activity: [...(r.activity ?? []), entry],
            }
          : r
      )
    );
    showToast({
      title: "Returned for revision",
      message: `${selectedReq.title} sent back to ${selectedReq.requestedBy ?? "the requestor"} (GM) with your note.`,
      variant: "info",
      icon: Undo2,
    });
    setAmendOpen(false);
    setAmendMessage("");
    setSelectedId(null);
  }

  function handleSendDirective() {
    if (!selectedReq || directiveMessage.trim().length === 0) return;
    const entry: ActivityEntry = {
      author: `${currentUserName} (MD)`,
      message: directiveMessage.trim(),
      timestamp: new Date().toISOString(),
    };
    setRequisitions((prev) =>
      prev.map((r) =>
        r.id === selectedReq.id ? { ...r, activity: [...(r.activity ?? []), entry] } : r
      )
    );
    setDirectiveMessage("");
  }

  function handleSignOff(finalist: Finalist) {
    setSignedOff((prev) => ({ ...prev, [finalist.id]: true }));
    showToast({
      title: "Sign-off recorded",
      message: `${finalist.name}'s hire for ${finalist.roleAppliedFor} has been finalized.`,
      variant: "success",
      icon: Award,
    });
  }

  const budgetPct = Math.min(100, Math.round((budgetLiability / TOTAL_BUDGET_CAP) * 100));
  const committedPct = Math.min(100, (committedLiability / TOTAL_BUDGET_CAP) * 100);
  const pendingPct = Math.min(100 - committedPct, (pendingLiability / TOTAL_BUDGET_CAP) * 100);
  const isHealthy = budgetPct < 80;
  const isWarning = budgetPct >= 80 && budgetPct < 90;
  const isCritical = budgetPct >= 90;

  return (
    <div className="space-y-6">
      {/* ── Toast ─────────────────────────────────────────────────────── */}
      {toast && <Toast toast={toast} onDismiss={dismiss} />}

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-950 dark:text-white tracking-tight">Executive Approval Center</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Corporate hiring health and pending sign-offs</p>
      </div>

      {/* ── Executive KPIs ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <ExecutiveKpiCard
          label="Total Headcount Budget Liability"
          value={`${formatETB(budgetLiability)} / ${formatETB(TOTAL_BUDGET_CAP)}`}
          trend={{ direction: "up", value: "2%", label: "vs last quarter" }}
          icon={Landmark}
        >
          <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden mt-3 flex">
            {/* Segment A: committed/spent — solid gradient with a soft glow */}
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isCritical
                  ? "bg-gradient-to-r from-red-500 to-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                  : isWarning
                  ? "bg-gradient-to-r from-orange-500 to-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.5)]"
                  : "bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
              }`}
              style={{ width: `${committedPct}%` }}
            />
            {/* Segment B: pending forecast — lighter tint + diagonal stripes */}
            {pendingPct > 0 && (
              <div
                className={`h-full rounded-full ml-0.5 transition-all duration-500 ${
                  isCritical ? "bg-red-300/60" : isWarning ? "bg-orange-300/60" : "bg-emerald-300/60"
                }`}
                style={{
                  width: `${pendingPct}%`,
                  backgroundImage:
                    "repeating-linear-gradient(45deg, rgba(255,255,255,0.35) 0, rgba(255,255,255,0.35) 3px, transparent 3px, transparent 7px)",
                }}
              />
            )}
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500">
              <span className={`w-2 h-2 rounded-full ${isCritical ? "bg-red-500" : isWarning ? "bg-orange-500" : "bg-emerald-500"}`} />
              Committed · {formatETB(committedLiability)}
            </span>
            {pendingLiability > 0 && (
              <span className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500">
                <span
                  className={`w-2 h-2 rounded-full ${isCritical ? "bg-red-300" : isWarning ? "bg-orange-300" : "bg-emerald-300"}`}
                />
                Pending · {formatETB(pendingLiability)}
              </span>
            )}
          </div>
          {isHealthy === false && (
            <p className={`text-[11px] mt-1.5 font-medium ${isCritical ? "text-red-500" : "text-orange-500"}`}>
              {isCritical ? "Budget cap nearly reached" : "Approaching budget cap"}
            </p>
          )}
        </ExecutiveKpiCard>

        <ExecutiveKpiCard
          label="Pending Approval Value"
          value={formatETB(pendingApprovalValue)}
          sublabel={`${pendingQueue.length} requisition${pendingQueue.length === 1 ? "" : "s"} awaiting sign-off`}
          trend={pendingQueue.length > 0 ? { direction: "up", value: `${pendingQueue.length}`, label: "in queue" } : undefined}
          icon={FileSignature}
        />

        <ExecutiveKpiCard
          label="Key Hire Velocity"
          value={keyHireVelocity !== null ? `${keyHireVelocity.toFixed(1)}d` : "—"}
          sublabel="Time to close critical roles"
          trend={{ direction: "down", value: "1d", label: "vs last quarter" }}
          icon={Gauge}
        />
      </div>

      {/* ── Action Queue: Split-Pane Master-Detail ───────────────────── */}
      {pendingQueue.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-16 px-6 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-full bg-gray-50 dark:bg-white/[0.04] flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Your queue is clear</h3>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 max-w-sm">
            No pending approvals require your attention.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden flex flex-col md:flex-row min-h-[440px]">
          {/* Left pane: list */}
          <div className="md:w-72 shrink-0 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-800">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Pending MD Approval ({pendingQueue.length})
              </span>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-[440px] overflow-y-auto">
              {pendingQueue.map((req) => {
                const isSelected = selectedReq?.id === req.id;
                return (
                  <button
                    key={req.id}
                    onClick={() => setSelectedId(req.id)}
                    className={`w-full text-left px-4 py-3.5 border-l-4 transition-colors ${
                      isSelected
                        ? "border-l-gray-950 dark:border-l-white bg-slate-50 dark:bg-white/[0.06]"
                        : "border-l-transparent hover:bg-gray-50/60 dark:hover:bg-white/[0.02]"
                    }`}
                  >
                    <span className={`block text-sm font-semibold ${isSelected ? "text-gray-950 dark:text-white" : "text-slate-500 dark:text-gray-400"}`}>
                      {req.title}
                    </span>
                    <span className={`block text-xs mt-0.5 ${isSelected ? "text-gray-500 dark:text-gray-400" : "text-slate-400 dark:text-gray-500"}`}>
                      {req.department}
                    </span>
                    <span className={`block text-xs mt-1 ${isSelected ? "text-gray-500 dark:text-gray-400" : "text-slate-400 dark:text-gray-500"}`}>
                      Requested by {req.requestedBy ?? "—"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right pane: detail */}
          {selectedReq && (
            <div className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <div className="flex items-start justify-between gap-4 mb-1">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-950 dark:text-white">{selectedReq.title}</h2>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
                      {selectedReq.department} · {selectedReq.id} · {selectedReq.headcount} headcount
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${STATUS_STYLES[selectedReq.status].bg} ${STATUS_STYLES[selectedReq.status].text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLES[selectedReq.status].dot}`} />
                    {selectedReq.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-4 mb-5 text-sm">
                  <span className="text-slate-500 dark:text-gray-400">Role:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{selectedReq.department}</span>
                  <span className="text-slate-300 dark:text-gray-600 mx-1">|</span>
                  <span className="text-slate-500 dark:text-gray-400">Headcount:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{selectedReq.headcount}</span>
                  <span className="text-slate-300 dark:text-gray-600 mx-1">|</span>
                  <span className="text-slate-500 dark:text-gray-400">Salary Band:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {selectedReq.annualSalary ? `${formatETB(selectedReq.annualSalary)}/yr` : "—"}
                  </span>
                  <span className="text-slate-300 dark:text-gray-600 mx-1">|</span>
                  <span className="text-slate-500 dark:text-gray-400">Submitted:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{selectedReq.submittedAt}</span>
                </div>

                <div className="mb-5">
                  <span className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Business Justification</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed max-w-[75ch]">{selectedReq.reason}</p>
                </div>

                {selectedReq.jobDescription && (
                  <div className="mb-6">
                    <span className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Job Description</span>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed max-w-[75ch]">{selectedReq.jobDescription}</p>
                  </div>
                )}

                {/* Activity & Directives */}
                <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                  <span className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2.5">Activity &amp; Directives</span>
                  <div className="space-y-3 mb-3 max-h-40 overflow-y-auto">
                    {(selectedReq.activity ?? []).length === 0 ? (
                      <p className="text-xs text-gray-300 dark:text-gray-600 italic">No activity yet.</p>
                    ) : (
                      selectedReq.activity!.map((entry, i) => (
                        <div key={i} className="text-sm">
                          <span className="font-semibold text-gray-800 dark:text-gray-200">{entry.author}</span>
                          <span className="text-gray-400 dark:text-gray-500 text-xs ml-2">{timeAgo(entry.timestamp)}</span>
                          <p className="text-gray-600 dark:text-gray-400 mt-0.5">{entry.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={directiveMessage}
                      onChange={(e) => setDirectiveMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendDirective()}
                      placeholder={`@${selectedReq.requestedBy ?? "GM"} — add a directive or note…`}
                      className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-white/[0.03] text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10"
                    />
                    <button
                      onClick={handleSendDirective}
                      disabled={directiveMessage.trim().length === 0}
                      className="px-3.5 py-2 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      Post Note
                    </button>
                  </div>
                </div>
              </div>

              {/* Gatekeeper actions */}
              <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-white/[0.02]">
                <button
                  onClick={() => handleApprove(selectedReq)}
                  className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-gray-950 hover:bg-gray-800 text-white transition-colors shadow-sm"
                >
                  Approve Requisition
                </button>
                <button
                  onClick={() => setAmendOpen(true)}
                  className="px-5 py-2.5 text-sm font-semibold rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Amend &amp; Return
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Finalist Review carousel ──────────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold text-gray-950 dark:text-white mb-1">Executive Review Candidates</h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Finalists shortlisted for key roles, awaiting sign-off</p>

        <div className="flex gap-4 overflow-x-auto pb-2">
          {MOCK_FINALISTS.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFinalist(f)}
              className="shrink-0 w-64 text-left rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-950 flex items-center justify-center text-sm font-semibold shrink-0">
                  {initials(f.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{f.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{f.department}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{f.roleAppliedFor}</p>
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                    f.recommendationScore >= 85
                      ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                      : f.recommendationScore >= 70
                      ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {f.recommendationScore}/100
                </span>
                {signedOff[f.id] && (
                  <span className="text-xs font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Signed off
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Amend & Return drawer ─────────────────────────────────────── */}
      {amendOpen && selectedReq && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setAmendOpen(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-gray-900 h-full shadow-2xl border-l border-gray-200 dark:border-gray-800 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Amend &amp; Return</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{selectedReq.title} · {selectedReq.id}</p>
              </div>
              <button
                onClick={() => setAmendOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="flex-1 px-6 py-5">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                Directive to {selectedReq.requestedBy ?? "the requestor"} (GM)
              </label>
              <textarea
                value={amendMessage}
                onChange={(e) => setAmendMessage(e.target.value)}
                rows={6}
                placeholder="e.g. Reduce salary band by 10% and resubmit."
                className="w-full px-3.5 py-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10 resize-none"
              />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                This requisition will be returned to Draft and routed back to the requesting GM with your note attached.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-white/[0.02]">
              <button
                onClick={() => setAmendOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAmendSubmit}
                disabled={amendMessage.trim().length === 0}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-gray-950 hover:bg-gray-800 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Return to GM
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Finalist "Executive Summary" modal ────────────────────────── */}
      {activeFinalist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setActiveFinalist(null)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-950 flex items-center justify-center text-sm font-semibold shrink-0">
                  {initials(activeFinalist.name)}
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">{activeFinalist.name}</h2>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{activeFinalist.roleAppliedFor} · {activeFinalist.department}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveFinalist(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Recommendation Score</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">{activeFinalist.recommendationScore}/100</span>
              </div>

              <span className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Resume Highlights</span>
              <ul className="space-y-1.5 mb-4">
                {activeFinalist.resumeHighlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 mt-1.5 shrink-0" />
                    {h}
                  </li>
                ))}
              </ul>

              <span className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Interview Panel Notes</span>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{activeFinalist.panelNotes}</p>
            </div>

            <div className="flex justify-end px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-white/[0.02]">
              <button
                onClick={() => handleSignOff(activeFinalist)}
                disabled={!!signedOff[activeFinalist.id]}
                className="px-5 py-2 text-sm font-semibold rounded-lg bg-gray-950 hover:bg-gray-800 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {signedOff[activeFinalist.id] ? "Signed Off ✓" : "Final Sign-Off"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Executive KPI card — icon + trend pill on top, muted title, bold value ──
function ExecutiveKpiCard({
  label,
  value,
  sublabel,
  trend,
  icon: Icon,
  children,
}: {
  label: string;
  value: string;
  sublabel?: string;
  trend?: { direction: "up" | "down"; value: string; label: string };
  icon: LucideIcon;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
      {/* Top row: icon + trend pill */}
      <div className="flex items-center justify-between mb-3">
        <span className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/[0.05] flex items-center justify-center">
          <Icon className="w-5 h-5 text-gray-700 dark:text-gray-300" strokeWidth={1.75} />
        </span>

        {trend && (
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
              trend.direction === "up"
                ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                : "bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400"
            }`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              {trend.direction === "up" ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              )}
            </svg>
            {trend.value}
          </span>
        )}
      </div>

      {/* Middle row: muted title */}
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>

      {/* Bottom row: bold value */}
      <div className="text-3xl font-bold text-gray-950 dark:text-white mt-1.5 tracking-tight">{value}</div>

      {sublabel && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">{sublabel}</p>}
      {trend?.label && <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{trend.label}</p>}
      {children}
    </div>
  );
}
