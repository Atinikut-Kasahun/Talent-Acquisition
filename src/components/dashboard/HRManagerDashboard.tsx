import { useEffect, useMemo, useState } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import {
  Users,
  TrendingUp,
  Clock,
  Wallet,
  CheckCircle2,
  Undo2,
  ChevronRight,
  X,
  Info,
} from "lucide-react";
import { authFetch } from "../../utils/authFetch";
import { useToast } from "../ui/toast/useToast";
import Toast from "../ui/toast/Toast";
import {
  MOCK_REQUISITIONS,
  Requisition,
  ActivityEntry,
  TOTAL_BUDGET_CAP,
  AUTHORIZED_HEADCOUNT_CAP,
  ILLUSTRATIVE_CURRENT_HEADCOUNT,
} from "../../pages/HiringPlan/requisitionsData";

const API_URL = import.meta.env.VITE_API_BASE_URL || `${import.meta.env.VITE_API_URL}/api`;

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

function hoursSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60);
}

// ── Types for real API data ─────────────────────────────────────────────────
interface PipelineStats {
  status_counts: Record<string, number>;
  avg_days_in_status: Record<string, number>;
  offer_acceptance_rate: number | null;
}

interface OfferedApplicant {
  id: string;
  first_name: string;
  last_name: string;
  job_posting?: { title: string };
  updated_at: string;
}

const STAGE_LABELS: Record<string, string> = {
  new: "New",
  reviewing: "Reviewing",
  shortlisted: "Shortlisted",
  interviewed: "Interviewed",
  offered: "Offered",
};

export default function HRManagerDashboard() {
  const [requisitions, setRequisitions] = useState<Requisition[]>(MOCK_REQUISITIONS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reviseOpen, setReviseOpen] = useState(false);
  const [reviseMessage, setReviseMessage] = useState("");
  const { toast, showToast, dismiss } = useToast();

  const [pipelineStats, setPipelineStats] = useState<PipelineStats | null>(null);
  const [offeredApplicants, setOfferedApplicants] = useState<OfferedApplicant[]>([]);
  const [onboardingChecks, setOnboardingChecks] = useState<Record<string, { bg: boolean; contract: boolean; it: boolean }>>({});

  const storedUser = localStorage.getItem("user");
  const currentUserName = storedUser ? JSON.parse(storedUser)?.name ?? "HR Manager" : "HR Manager";

  useEffect(() => {
    authFetch(`${API_URL}/admin/applications/pipeline-stats`)
      .then((r) => r.json())
      .then(setPipelineStats)
      .catch(() => setPipelineStats(null));

    authFetch(`${API_URL}/admin/applications?status=offered&per_page=50`)
      .then((r) => r.json())
      .then((data) => setOfferedApplicants(data?.data ?? []))
      .catch(() => setOfferedApplicants([]));
  }, []);

  // ── Governance queue: requisitions MD has cleared, sitting with HR ──────
  const pendingQueue = useMemo(() => requisitions.filter((r) => r.status === "Approved"), [requisitions]);

  const selectedReq = useMemo(() => {
    if (selectedId) {
      const found = requisitions.find((r) => r.id === selectedId);
      if (found && found.status === "Approved") return found;
    }
    return pendingQueue[0] ?? null;
  }, [selectedId, requisitions, pendingQueue]);

  // ── Row 1 KPIs ────────────────────────────────────────────────────────────
  const headcountPct = Math.round((ILLUSTRATIVE_CURRENT_HEADCOUNT / AUTHORIZED_HEADCOUNT_CAP) * 100);

  const oar = pipelineStats?.offer_acceptance_rate;

  const timeToFillDays = useMemo(() => {
    const resolved = requisitions.filter((r) => r.approvedAt);
    if (resolved.length === 0) return null;
    const total = resolved.reduce((sum, r) => {
      const submitted = new Date(r.submittedAt).getTime();
      const approved = new Date(r.approvedAt!).getTime();
      return sum + (approved - submitted) / (1000 * 60 * 60 * 24);
    }, 0);
    return Math.round(total / resolved.length);
  }, [requisitions]);

  const activeBudget = useMemo(() => {
    return requisitions
      .filter((r) => ["Approved", "Posted", "In Progress"].includes(r.status))
      .reduce((sum, r) => sum + (r.annualSalary ?? 0) * r.headcount, 0);
  }, [requisitions]);

  // ── Row 3: real stage-friction chart data ────────────────────────────────
  const frictionCategories = Object.keys(STAGE_LABELS);
  const frictionSeries = frictionCategories.map((k) => pipelineStats?.avg_days_in_status?.[k] ?? 0);

  const frictionOptions: ApexOptions = {
    chart: { type: "bar", toolbar: { show: false }, fontFamily: "Outfit, sans-serif" },
    plotOptions: { bar: { borderRadius: 6, columnWidth: "45%", distributed: true } },
    colors: ["#60A5FA", "#818CF8", "#A78BFA", "#F472B6", "#34D399"],
    legend: { show: false },
    dataLabels: { enabled: true, formatter: (v: number) => `${v}d`, style: { colors: ["#374151"], fontSize: "12px" } },
    xaxis: { categories: frictionCategories.map((k) => STAGE_LABELS[k]), labels: { style: { fontSize: "12px" } } },
    yaxis: { title: { text: "Avg. days in stage" } },
    grid: { borderColor: "#F1F5F9" },
    tooltip: { y: { formatter: (v: number) => `${v} days` } },
  };

  // ── Illustrative source-of-hire donut (no source field in schema yet) ───
  const sourceOptions: ApexOptions = {
    chart: { type: "donut", fontFamily: "Outfit, sans-serif" },
    labels: ["Direct Careers Page", "Employee Referral", "LinkedIn", "Agency"],
    colors: ["#10B981", "#6366F1", "#F59E0B", "#94A3B8"],
    legend: { position: "bottom", fontSize: "12px" },
    dataLabels: { enabled: true },
  };
  const sourceSeries = [46, 27, 18, 9];

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleApprove(req: Requisition) {
    setRequisitions((prev) =>
      prev.map((r) =>
        r.id === req.id ? { ...r, status: "Posted", lastUpdatedAt: new Date().toISOString() } : r
      )
    );
    showToast({
      title: "Requisition cleared",
      message: `${req.title} (${req.id}) has passed HR review and is now visible to the TA team.`,
      variant: "success",
      icon: CheckCircle2,
    });
    setSelectedId(null);
  }

  function handleReviseSubmit() {
    if (!selectedReq || reviseMessage.trim().length === 0) return;
    const entry: ActivityEntry = {
      author: `${currentUserName} (HR Manager)`,
      message: reviseMessage.trim(),
      timestamp: new Date().toISOString(),
    };
    setRequisitions((prev) =>
      prev.map((r) =>
        r.id === selectedReq.id
          ? { ...r, status: "Draft", lastUpdatedAt: new Date().toISOString(), activity: [...(r.activity ?? []), entry] }
          : r
      )
    );
    showToast({
      title: "Sent back for revision",
      message: `${selectedReq.title} returned to ${selectedReq.requestedBy ?? "the requestor"} with your note.`,
      variant: "info",
      icon: Undo2,
    });
    setReviseOpen(false);
    setReviseMessage("");
    setSelectedId(null);
  }

  function toggleCheck(id: string, key: "bg" | "contract" | "it") {
    setOnboardingChecks((prev) => {
      const current = prev[id] ?? { bg: false, contract: false, it: false };
      return { ...prev, [id]: { ...current, [key]: !current[key] } };
    });
  }

  return (
    <div className="space-y-6">
      {/* ── Row 1: Strategic Health ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Headcount vs Capacity */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="flex items-center justify-between mb-3">
            <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10">
              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </span>
            <span title="Illustrative — no employee headcount data source exists yet" className="text-gray-300 dark:text-gray-600">
              <Info className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Headcount vs. Capacity</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
            {ILLUSTRATIVE_CURRENT_HEADCOUNT} <span className="text-sm text-gray-400 font-normal">/ {AUTHORIZED_HEADCOUNT_CAP}</span>
          </p>
          <div className="mt-3 h-1.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-blue-500" style={{ width: `${headcountPct}%` }} />
          </div>
        </div>

        {/* Offer Acceptance Rate */}
        <div className={`rounded-2xl border bg-white p-5 dark:bg-white/[0.03] ${oar !== null && oar !== undefined && oar < 80 ? "border-red-300 dark:border-red-500/40" : "border-gray-200 dark:border-white/[0.05]"}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Offer Acceptance Rate</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
            {oar !== null && oar !== undefined ? `${oar}%` : "—"}
          </p>
          <p className="text-xs text-gray-400 mt-1">Offered ÷ (Offered + Rejected)</p>
        </div>

        {/* Time to Fill */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="flex items-center justify-between mb-3">
            <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-500/10">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Avg. Time-to-Fill</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
            {timeToFillDays !== null ? `${timeToFillDays} Days` : "—"}
          </p>
          <p className="text-xs text-gray-400 mt-1">Industry benchmark: ~40 days</p>
        </div>

        {/* Active Requisition Budget */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="flex items-center justify-between mb-3">
            <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-500/10">
              <Wallet className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Active Requisition Budget</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
            ETB {activeBudget.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-1">of ETB {TOTAL_BUDGET_CAP.toLocaleString()} annual cap</p>
        </div>
      </div>

      {/* ── Row 2: Governance — Pending Requisitions ────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/[0.05]">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Pending Requisitions <span className="text-gray-400 font-normal">({pendingQueue.length})</span>
          </h3>
          <p className="text-xs text-gray-400">MD-cleared · awaiting HR review before TA posting</p>
        </div>

        {pendingQueue.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">Nothing awaiting HR review right now.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/[0.05]">
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Role & Department</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Requested By</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Salary Band</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">SLA</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {pendingQueue.map((req) => {
                  const hoursLeft = Math.max(0, Math.round(48 - hoursSince(req.lastUpdatedAt)));
                  const overdue = hoursLeft === 0;
                  return (
                    <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{req.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{req.department} · {req.id}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 dark:bg-white/10 text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                            {initials(req.requestedBy ?? "GM")}
                          </span>
                          <span className="text-sm text-gray-700 dark:text-gray-300">{req.requestedBy ?? "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {req.annualSalary ? `ETB ${Math.round(req.annualSalary / 1000)}K/yr` : "—"}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${overdue ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400" : "bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-gray-400"}`}>
                          {overdue ? "Overdue" : `${hoursLeft} hrs remaining`}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setSelectedId(req.id); setReviseOpen(true); }}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                          >
                            Request Revision
                          </button>
                          <button
                            onClick={() => handleApprove(req)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                          >
                            Review & Approve <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Row 3: Pipeline Bottleneck Analysis ─────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/[0.05] dark:bg-white/[0.03]">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Stage Friction</h3>
          <p className="text-xs text-gray-400 mb-4">Avg. days the current cohort has sat in each active stage</p>
          <Chart options={frictionOptions} series={[{ name: "Avg. days", data: frictionSeries }]} type="bar" height={280} />
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Source of Hire</h3>
            <span title="Illustrative — no source-tracking field exists on applications yet" className="text-gray-300 dark:text-gray-600">
              <Info className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-xs text-gray-400 mb-4">Where successful hires came from</p>
          <Chart options={sourceOptions} series={sourceSeries} type="donut" height={260} />
        </div>
      </div>

      {/* ── Row 4: Awaiting Onboarding ───────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.05]">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Awaiting Onboarding <span className="text-gray-400 font-normal">({offeredApplicants.length})</span>
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">Candidates with an active offer, transitioning to employee</p>
        </div>

        {offeredApplicants.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">No candidates are currently in the offer stage.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
            {offeredApplicants.map((a) => {
              const checks = onboardingChecks[a.id] ?? { bg: false, contract: false, it: false };
              const name = `${a.first_name} ${a.last_name}`;
              return (
                <div key={a.id} className="rounded-xl border border-gray-100 dark:border-white/[0.06] p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="flex items-center justify-center w-9 h-9 rounded-full bg-brand-50 dark:bg-brand-500/10 text-xs font-semibold text-brand-600 dark:text-brand-400">
                      {initials(name)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{name}</p>
                      <p className="text-xs text-gray-400 truncate">{a.job_posting?.title ?? "—"}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {([
                      ["bg", "Background Check"],
                      ["contract", "Contract Signed"],
                      ["it", "IT Provisioning"],
                    ] as const).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checks[key]}
                          onChange={() => toggleCheck(a.id, key)}
                          className="w-3.5 h-3.5 rounded border-gray-300 text-brand-500 focus:ring-brand-500/30"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Revision request drawer ──────────────────────────────────────── */}
      {reviseOpen && selectedReq && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-gray-900/40 backdrop-blur-[2px] p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Request Revision</h3>
              <button onClick={() => setReviseOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              {selectedReq.title} ({selectedReq.id}) will be sent back to {selectedReq.requestedBy ?? "the requestor"} as a draft.
            </p>
            <textarea
              value={reviseMessage}
              onChange={(e) => setReviseMessage(e.target.value)}
              rows={4}
              placeholder="e.g. Salary band exceeds the department's approved range — please revise."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 resize-none"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setReviseOpen(false)} className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5">
                Cancel
              </button>
              <button
                disabled={reviseMessage.trim().length === 0}
                onClick={handleReviseSubmit}
                className="px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Back
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast toast={toast} onDismiss={dismiss} />}
    </div>
  );
}
