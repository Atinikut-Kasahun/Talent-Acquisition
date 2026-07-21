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
  X,
  Info,
  Building2,
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

// Lighten a hex color toward white by `amt` (0-1) — used to fade
// non-hovered donut slices in the custom legend without needing raw rgba.
function fadeColor(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const mix = (c: number) => Math.round(c + (255 - c) * amt);
  return `#${[mix(r), mix(g), mix(b)].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

// ── Types for real API data ─────────────────────────────────────────────────
interface PipelineStats {
  status_counts: Record<string, number>;
  avg_days_in_status: Record<string, number>;
  offer_acceptance_rate: number | null;
}

interface Branch {
  id: string;
  name: string;
}

const STAGE_LABELS: [string, string][] = [
  ["reviewing", "Reviewing"],
  ["shortlisted", "Shortlisted"],
  ["written_exam", "Written Exam"],
  ["technical_exam", "Technical Exam"],
  ["interviewed", "Interviewed"],
];

const BUSINESS_UNIT_COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EC4899"];

export default function HRManagerDashboard() {
  const [requisitions, setRequisitions] = useState<Requisition[]>(MOCK_REQUISITIONS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviseOpen, setReviseOpen] = useState(false);
  const [reviseMessage, setReviseMessage] = useState("");
  const [routing, setRouting] = useState(false);
  const { toast, showToast, dismiss } = useToast();

  const [pipelineStats, setPipelineStats] = useState<PipelineStats | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [drawerSalary, setDrawerSalary] = useState<number>(0);
  const [drawerBranchId, setDrawerBranchId] = useState<string>("");

  const [buMetric, setBuMetric] = useState<"count" | "budget">("count");
  const [hoveredBU, setHoveredBU] = useState<string | null>(null);

  const storedUser = localStorage.getItem("user");
  const currentUserName = storedUser ? JSON.parse(storedUser)?.name ?? "HR Manager" : "HR Manager";

  useEffect(() => {
    authFetch(`${API_URL}/admin/applications/pipeline-stats`)
      .then((r) => r.json())
      .then(setPipelineStats)
      .catch(() => setPipelineStats(null));

    authFetch(`${API_URL}/branches`)
      .then((r) => r.json())
      .then((data) => setBranches(Array.isArray(data) ? data : []))
      .catch(() => setBranches([]));
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

  function openReview(req: Requisition) {
    setSelectedId(req.id);
    setDrawerSalary(req.annualSalary ?? 0);
    setDrawerBranchId(branches[0]?.id ?? "");
    setReviewOpen(true);
  }

  // ── Row 1 KPIs ────────────────────────────────────────────────────────────
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

  // ── Segmented headcount capacity bar ─────────────────────────────────────
  const recruitingHeadcount = useMemo(
    () =>
      requisitions
        .filter((r) => ["Approved", "Posted", "In Progress"].includes(r.status))
        .reduce((sum, r) => sum + r.headcount, 0),
    [requisitions]
  );
  const openSlots = Math.max(0, AUTHORIZED_HEADCOUNT_CAP - ILLUSTRATIVE_CURRENT_HEADCOUNT - recruitingHeadcount);
  const activePct = (ILLUSTRATIVE_CURRENT_HEADCOUNT / AUTHORIZED_HEADCOUNT_CAP) * 100;
  const recruitingPct = (recruitingHeadcount / AUTHORIZED_HEADCOUNT_CAP) * 100;
  const committedPct = Math.round(activePct + recruitingPct);
  const capBadge =
    committedPct >= 95
      ? { bg: "bg-red-50 dark:bg-red-500/10", text: "text-red-700 dark:text-red-400", label: "Critical" }
      : committedPct >= 85
      ? { bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-700 dark:text-amber-400", label: "Near Cap" }
      : { bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-400", label: "Healthy" };

  // ── Row 3: real stage-friction chart (5 active-evaluation stages only) ──
  const frictionSeries = STAGE_LABELS.map(([key]) => pipelineStats?.avg_days_in_status?.[key] ?? 0);

  const frictionOptions: ApexOptions = {
    chart: { type: "bar", toolbar: { show: false }, fontFamily: "Outfit, sans-serif" },
    plotOptions: { bar: { borderRadius: 6, columnWidth: "45%", distributed: true } },
    colors: ["#60A5FA", "#818CF8", "#A78BFA", "#F472B6", "#34D399"],
    legend: { show: false },
    dataLabels: { enabled: true, formatter: (v: number) => `${v}d`, style: { colors: ["#374151"], fontSize: "12px" } },
    xaxis: { categories: STAGE_LABELS.map(([, label]) => label), labels: { style: { fontSize: "12px" } } },
    yaxis: { title: { text: "Avg. days in stage" } },
    grid: { borderColor: "#F1F5F9" },
    tooltip: { y: { formatter: (v: number) => `${v} days` } },
  };

  // ── Business unit donut ──────────────────────────────────────────────────
  const businessUnitData = useMemo(() => {
    const active = requisitions.filter((r) => ["Approved", "Posted", "In Progress"].includes(r.status));
    const map = new Map<string, { count: number; budget: number }>();
    active.forEach((r) => {
      const bu = r.company ?? "Unassigned";
      const entry = map.get(bu) ?? { count: 0, budget: 0 };
      entry.count += 1;
      entry.budget += (r.annualSalary ?? 0) * r.headcount;
      map.set(bu, entry);
    });
    return Array.from(map.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.count - a.count);
  }, [requisitions]);

  const buTotalCount = businessUnitData.reduce((s, d) => s + d.count, 0);
  const buTotalBudget = businessUnitData.reduce((s, d) => s + d.budget, 0);
  const buSeries = businessUnitData.map((d) => (buMetric === "count" ? d.count : d.budget));
  const buColors = businessUnitData.map((d, i) => {
    const base = BUSINESS_UNIT_COLORS[i % BUSINESS_UNIT_COLORS.length];
    return hoveredBU && hoveredBU !== d.name ? fadeColor(base, 0.7) : base;
  });

  const hoveredEntry = hoveredBU ? businessUnitData.find((d) => d.name === hoveredBU) : null;
  const centerLabel = hoveredEntry
    ? buMetric === "count"
      ? `${hoveredEntry.count}`
      : `${Math.round(hoveredEntry.budget / 1000)}K`
    : buMetric === "count"
    ? `${buTotalCount}`
    : `${Math.round(buTotalBudget / 1000)}K`;
  const centerSub = hoveredEntry ? hoveredEntry.name : buMetric === "count" ? "Active Requisitions" : "ETB Committed";

  const buOptions: ApexOptions = {
    chart: { type: "donut", fontFamily: "Outfit, sans-serif" },
    labels: businessUnitData.map((d) => d.name),
    colors: buColors,
    legend: { show: false },
    dataLabels: { enabled: false },
    stroke: { width: 2, colors: ["#fff"] },
    plotOptions: {
      pie: {
        donut: {
          size: "72%",
          labels: {
            show: true,
            name: { show: false },
            value: {
              show: true,
              fontSize: "22px",
              fontWeight: 700,
              offsetY: -4,
              formatter: () => centerLabel,
            },
            total: {
              show: true,
              label: centerSub,
              fontSize: "11px",
              color: "#94A3B8",
              formatter: () => centerLabel,
            },
          },
        },
      },
    },
    tooltip: {
      y: {
        formatter: (v: number) => (buMetric === "count" ? `${v} roles` : `ETB ${v.toLocaleString()}`),
      },
    },
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  async function handleApproveAndRoute() {
    if (!selectedReq) return;
    if (!drawerBranchId) {
      showToast({ title: "Error", message: "Select a location before routing to the TA team.", variant: "error", icon: X });
      return;
    }
    setRouting(true);
    try {
      const res = await authFetch(`${API_URL}/admin/jobs`, {
        method: "POST",
        body: JSON.stringify({
          title: selectedReq.title,
          department: selectedReq.department,
          employment_type: "Full Time",
          salary_range: `ETB ${drawerSalary.toLocaleString()}/yr`,
          about: selectedReq.jobDescription || selectedReq.reason,
          what_you_do: selectedReq.jobDescription ? [selectedReq.jobDescription] : ["Responsibilities to be finalized by the TA team."],
          about_you: ["Requirements to be finalized by the TA team."],
          status: "draft",
          branches: [drawerBranchId],
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Failed to route this requisition to the TA team.");
      }
      setRequisitions((prev) =>
        prev.map((r) =>
          r.id === selectedReq.id
            ? { ...r, status: "Posted", annualSalary: drawerSalary, lastUpdatedAt: new Date().toISOString() }
            : r
        )
      );
      showToast({
        title: "Success",
        message: `${selectedReq.title} (${selectedReq.id}) is now in the TA team's Action Required tab.`,
        variant: "success",
        icon: CheckCircle2,
      });
      setReviewOpen(false);
      setSelectedId(null);
    } catch (err: any) {
      showToast({ title: "Error", message: err.message || "Something went wrong.", variant: "error" });
    } finally {
      setRouting(false);
    }
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
    setReviewOpen(false);
    setReviseMessage("");
    setSelectedId(null);
  }

  return (
    <div className="space-y-6">
      {/* ── Row 1: Strategic Health ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Headcount vs Capacity — segmented */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/[0.05] dark:bg-white/[0.03] sm:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </span>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Headcount vs. Capacity</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {ILLUSTRATIVE_CURRENT_HEADCOUNT + recruitingHeadcount} <span className="text-sm text-gray-400 font-normal">/ {AUTHORIZED_HEADCOUNT_CAP}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span title="Illustrative — no employee headcount data source exists yet" className="text-gray-300 dark:text-gray-600">
                <Info className="w-3.5 h-3.5" />
              </span>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${capBadge.bg} ${capBadge.text}`}>
                {committedPct}% Cap · {capBadge.label}
              </span>
            </div>
          </div>

          <div className="h-3 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden flex">
            <div className="h-full bg-blue-600" style={{ width: `${activePct}%` }} />
            <div
              className="h-full bg-amber-400"
              style={{
                width: `${recruitingPct}%`,
                backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.5) 0, rgba(255,255,255,0.5) 4px, transparent 4px, transparent 8px)",
              }}
            />
            <div className="h-full bg-gray-200 dark:bg-white/10" style={{ width: `${Math.max(0, 100 - activePct - recruitingPct)}%` }} />
          </div>

          <div className="flex items-center gap-5 mt-3">
            <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <span className="w-2 h-2 rounded-full bg-blue-600" /> {ILLUSTRATIVE_CURRENT_HEADCOUNT} Active
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> {recruitingHeadcount} Recruiting
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-white/20" /> {openSlots} Open Slots
            </span>
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
      </div>

      {/* Active Requisition Budget */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="flex items-center justify-between mb-3">
            <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-500/10">
              <Wallet className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Active Requisition Budget</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">ETB {activeBudget.toLocaleString()}</p>
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
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={() => openReview(req)}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                        >
                          Review
                        </button>
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
          <p className="text-xs text-gray-400 mb-4">Avg. days the current cohort has sat in each active-evaluation stage</p>
          <Chart options={frictionOptions} series={[{ name: "Avg. days", data: frictionSeries }]} type="bar" height={280} />
        </div>

        {/* Active Requisitions by Business Unit — center-stat donut + legend grid */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-400" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">By Business Unit</h3>
            </div>
            <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 p-0.5 text-xs">
              <button
                onClick={() => setBuMetric("count")}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${buMetric === "count" ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" : "text-gray-500 dark:text-gray-400"}`}
              >
                Count
              </button>
              <button
                onClick={() => setBuMetric("budget")}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${buMetric === "budget" ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" : "text-gray-500 dark:text-gray-400"}`}
              >
                Budget
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-400 mb-3">Recruitment bandwidth across sister companies</p>

          {businessUnitData.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">No active requisitions.</div>
          ) : (
            <>
              <Chart options={buOptions} series={buSeries} type="donut" height={220} />
              <div className="mt-3 space-y-1 border-t border-gray-100 dark:border-white/[0.06] pt-3">
                {businessUnitData.map((d, i) => {
                  const pct = buMetric === "count" ? (d.count / buTotalCount) * 100 : (d.budget / buTotalBudget) * 100;
                  return (
                    <div
                      key={d.name}
                      onMouseEnter={() => setHoveredBU(d.name)}
                      onMouseLeave={() => setHoveredBU(null)}
                      className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-default"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: BUSINESS_UNIT_COLORS[i % BUSINESS_UNIT_COLORS.length] }} />
                        <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{d.name}</span>
                      </span>
                      <span className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-semibold text-gray-900 dark:text-white">
                          {buMetric === "count" ? `${d.count} Roles` : `ETB ${Math.round(d.budget / 1000)}K`}
                        </span>
                        <span className="text-[11px] text-gray-400 w-12 text-right">{pct.toFixed(1)}%</span>
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="flex items-center gap-1 text-[11px] text-gray-300 dark:text-gray-600 mt-3">
                <Info className="w-3 h-3" /> Business unit is illustrative — no live link to requisitions yet
              </p>
            </>
          )}
        </div>
      </div>

      {/* ── Review & Approve slide-over drawer ───────────────────────────── */}
      {reviewOpen && selectedReq && (
        <>
          <div onClick={() => setReviewOpen(false)} className="fixed inset-0 z-[999998] bg-gray-900/40 backdrop-blur-[2px]" />
          <div className="fixed top-0 right-0 z-[999999] h-full w-full max-w-[520px] bg-white dark:bg-gray-900 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-white/[0.06]">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Review Requisition</h3>
                <p className="text-xs text-gray-400 mt-0.5">{selectedReq.id} · {selectedReq.company ?? "—"}</p>
              </div>
              <button onClick={() => setReviewOpen(false)} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-white/5">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedReq.title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {selectedReq.department} · {selectedReq.headcount} headcount · Requested by {selectedReq.requestedBy ?? "—"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Business Justification</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{selectedReq.reason}</p>
              </div>

              {selectedReq.jobDescription && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Job Description</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{selectedReq.jobDescription}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                  Target Salary (ETB / year) <span className="normal-case text-gray-400">— HR can adjust to comply with pay scales</span>
                </label>
                <input
                  type="number"
                  value={drawerSalary}
                  onChange={(e) => setDrawerSalary(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Location</label>
                <select
                  value={drawerBranchId}
                  onChange={(e) => setDrawerBranchId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                >
                  <option value="">Select a location</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                {branches.length === 0 && <p className="text-xs text-gray-400 mt-1">No branches configured yet.</p>}
              </div>

              {selectedReq.activity && selectedReq.activity.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Activity</p>
                  <div className="space-y-2">
                    {selectedReq.activity.map((a, idx) => (
                      <div key={idx} className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/5 rounded-lg px-3 py-2">
                        <span className="font-medium text-gray-700 dark:text-gray-300">{a.author}:</span> {a.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 px-6 py-4 border-t border-gray-100 dark:border-white/[0.06]">
              <button
                disabled={routing}
                onClick={handleApproveAndRoute}
                className="w-full px-4 py-3 rounded-xl text-sm font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                {routing ? "Routing..." : "Approve & Route to TA"}
              </button>
              <button
                onClick={() => setReviseOpen(true)}
                className="w-full px-4 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                Return for Revision
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Return-for-revision note modal (nested above the drawer) ────── */}
      {reviseOpen && selectedReq && (
        <div className="fixed inset-0 z-[9999999] flex items-center justify-center bg-gray-900/50 backdrop-blur-[2px] p-4">
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
