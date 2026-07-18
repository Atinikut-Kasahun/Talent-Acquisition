import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  Plus,
  MoreVertical,
  Link as LinkIcon,
  Eye,
  Pencil,
  Trash2,
  X,
  ChevronDown,
  Globe,
} from "lucide-react";
import PageMeta from "../components/common/PageMeta";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import { authFetch } from "../utils/authFetch";
import { useToast } from "../components/ui/toast/useToast";
import Toast from "../components/ui/toast/Toast";

const API_URL = import.meta.env.VITE_API_BASE_URL || `${import.meta.env.VITE_API_URL}/api`;
const DEPARTMENTS = ["Sales", "Operations", "Finance", "Marketing", "IT", "HR", "Logistics", "Legal"];
const EMPLOYMENT_TYPES = ["Full Time", "Part Time", "Contract", "Internship"];

// ── Types ────────────────────────────────────────────────────────────────────
interface Branch {
  id: string;
  name: string;
}

interface Job {
  id: string;
  title: string;
  slug: string;
  department: string;
  employment_type: string;
  salary_range: string | null;
  about: string;
  status: "draft" | "published" | "closed";
  views: number;
  branches: Branch[];
  hiring_manager: { id: string; name: string; avatar: string | null } | null;
  funnel: { new: number; interviewing: number; offer: number; total: number };
  days_on_market: number;
  created_at: string;
}

type TabKey = "draft" | "published" | "closed";

const TABS: { key: TabKey; label: string }[] = [
  { key: "draft", label: "Action Required" },
  { key: "published", label: "Active Market" },
  { key: "closed", label: "Closed" },
];

const STATUS_STYLE: Record<Job["status"], { bg: string; text: string; label: string }> = {
  draft: { bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-700 dark:text-amber-400", label: "Action Required" },
  published: { bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-400", label: "Live" },
  closed: { bg: "bg-slate-100 dark:bg-white/[0.06]", text: "text-slate-600 dark:text-gray-400", label: "Closed" },
};

function StatusPill({ status }: { status: Job["status"] }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

function reqId(job: Job): string {
  return `REQ-${job.id.slice(0, 6).toUpperCase()}`;
}

function Avatar({ name, url }: { name: string; url: string | null }) {
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const colors = ["bg-blue-500", "bg-purple-500", "bg-emerald-500", "bg-orange-500", "bg-pink-500", "bg-teal-500"];
  const color = colors[name.charCodeAt(0) % colors.length];
  if (url) {
    return <img src={url} alt={name} className="w-7 h-7 rounded-full object-cover ring-2 ring-white dark:ring-gray-900 flex-shrink-0" />;
  }
  return (
    <div className={`${color} w-7 h-7 flex items-center justify-center rounded-full text-white text-[11px] font-semibold flex-shrink-0 ring-2 ring-white dark:ring-gray-900`}>
      {initials || "?"}
    </div>
  );
}

// ── Slide-over drawer (create / edit) ───────────────────────────────────────
interface DrawerForm {
  title: string;
  department: string;
  employment_type: string;
  salary_range: string;
  about: string;
  what_you_do: string; // newline-separated, converted to array on save
  about_you: string; // newline-separated, converted to array on save
  status: Job["status"];
  branch_ids: string[];
}

const EMPTY_FORM: DrawerForm = {
  title: "",
  department: "",
  employment_type: "Full Time",
  salary_range: "",
  about: "",
  what_you_do: "",
  about_you: "",
  status: "draft",
  branch_ids: [],
};

function JobDrawer({
  isOpen,
  job,
  branches,
  onClose,
  onSaved,
}: {
  isOpen: boolean;
  job: Job | null;
  branches: Branch[];
  onClose: () => void;
  onSaved: (savedJob: Job, isNew: boolean) => void;
}) {
  const [form, setForm] = useState<DrawerForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const isEdit = !!job;

  useEffect(() => {
    if (job) {
      setForm({
        title: job.title,
        department: job.department,
        employment_type: job.employment_type,
        salary_range: job.salary_range ?? "",
        about: job.about,
        what_you_do: "",
        about_you: "",
        status: job.status,
        branch_ids: job.branches.map((b) => b.id),
      });
    } else if (isOpen) {
      setForm(EMPTY_FORM);
    }
  }, [job, isOpen]);

  const toggleBranch = (id: string) => {
    setForm((f) => ({
      ...f,
      branch_ids: f.branch_ids.includes(id) ? f.branch_ids.filter((b) => b !== id) : [...f.branch_ids, id],
    }));
  };

  const handleSave = async (publish: boolean) => {
    setSaving(true);
    const finalStatus = publish ? "published" : form.status;
    try {
      const payload: any = {
        title: form.title,
        department: form.department,
        employment_type: form.employment_type,
        salary_range: form.salary_range || null,
        about: form.about,
        status: finalStatus,
        branches: form.branch_ids,
      };
      // what_you_do / about_you are required (non-empty arrays) on create,
      // and only sent on edit if the TA actually typed something new.
      const bullets = (text: string) => text.split("\n").map((l) => l.trim()).filter(Boolean);
      if (!isEdit || form.what_you_do.trim()) payload.what_you_do = isEdit ? bullets(form.what_you_do) : (bullets(form.what_you_do).length ? bullets(form.what_you_do) : ["Responsibilities to be added"]);
      if (!isEdit || form.about_you.trim()) payload.about_you = isEdit ? bullets(form.about_you) : (bullets(form.about_you).length ? bullets(form.about_you) : ["Requirements to be added"]);

      const url = isEdit ? `${API_URL}/admin/jobs/${job!.id}` : `${API_URL}/admin/jobs`;
      const res = await authFetch(url, {
        method: isEdit ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Failed to save requisition.");
      }
      const saved = await res.json();
      onSaved(saved, !isEdit);
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[999998] bg-gray-900/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      <div
        className={`fixed top-0 right-0 z-[999999] h-full w-full max-w-[560px] bg-white dark:bg-gray-900 shadow-2xl flex flex-col transition-transform duration-[350ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-white/[0.06]">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {isEdit ? "Edit Requisition" : "Create Requisition"}
            </h3>
            {isEdit && <p className="text-xs text-gray-400 mt-0.5">{reqId(job!)}</p>}
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Job Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Enterprise Account Executive"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Department</label>
              <select
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              >
                <option value="">Select department</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Employment Type</label>
              <select
                value={form.employment_type}
                onChange={(e) => setForm({ ...form, employment_type: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              >
                {EMPLOYMENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Salary Band</label>
            <input
              value={form.salary_range}
              onChange={(e) => setForm({ ...form, salary_range: e.target.value })}
              placeholder="e.g. ETB 60K - 80K / month"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Location(s)</label>
            <div className="flex flex-wrap gap-2">
              {branches.map((b) => {
                const active = form.branch_ids.includes(b.id);
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => toggleBranch(b.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      active
                        ? "bg-brand-500 border-brand-500 text-white"
                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-brand-300"
                    }`}
                  >
                    {b.name}
                  </button>
                );
              })}
              {branches.length === 0 && <p className="text-xs text-gray-400">No branches configured yet.</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">About the Role</label>
            <textarea
              value={form.about}
              onChange={(e) => setForm({ ...form, about: e.target.value })}
              rows={4}
              placeholder="Short overview shown at the top of the job description..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              What You'll Do <span className="text-gray-400 font-normal">(one bullet per line)</span>
            </label>
            <textarea
              value={form.what_you_do}
              onChange={(e) => setForm({ ...form, what_you_do: e.target.value })}
              rows={4}
              placeholder={isEdit ? "Leave blank to keep existing bullets" : "Own the full sales cycle...\nBuild relationships with C-level buyers..."}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              About You <span className="text-gray-400 font-normal">(one bullet per line)</span>
            </label>
            <textarea
              value={form.about_you}
              onChange={(e) => setForm({ ...form, about_you: e.target.value })}
              rows={4}
              placeholder={isEdit ? "Leave blank to keep existing bullets" : "5+ years enterprise SaaS sales...\nExisting C-level network..."}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-white/[0.06]">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={saving || !form.title.trim() || !form.department}
            onClick={() => handleSave(false)}
            className="px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Draft
          </button>
          <button
            disabled={saving || !form.title.trim() || !form.department}
            onClick={() => handleSave(true)}
            className="px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : isEdit ? "Save & Publish" : "Create & Publish"}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tab, setTab] = useState<TabKey>("published");
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerJob, setDrawerJob] = useState<Job | null>(null);

  const { toast, showToast: showToastRaw, dismiss: dismissToast } = useToast();
  const showToast = (message: string, type: "success" | "error" = "success") => {
    showToastRaw({ title: type === "success" ? "Success" : "Error", message, variant: type });
  };

  const fetchJobs = async () => {
    try {
      const res = await authFetch(`${API_URL}/admin/jobs`);
      if (!res.ok) throw new Error("Failed to fetch job postings.");
      const data = await res.json();
      setJobs(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    authFetch(`${API_URL}/branches`)
      .then((r) => r.json())
      .then((data) => setBranches(Array.isArray(data) ? data : []))
      .catch(() => setBranches([]));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenuId(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const counts = useMemo(
    () => ({
      draft: jobs.filter((j) => j.status === "draft").length,
      published: jobs.filter((j) => j.status === "published").length,
      closed: jobs.filter((j) => j.status === "closed").length,
    }),
    [jobs]
  );

  const filteredJobs = useMemo(() => {
    return jobs
      .filter((j) => j.status === tab)
      .filter((j) => deptFilter === "all" || j.department === deptFilter)
      .filter((j) => !search.trim() || j.title.toLowerCase().includes(search.toLowerCase()) || j.department.toLowerCase().includes(search.toLowerCase()));
  }, [jobs, tab, deptFilter, search]);

  const openCreateDrawer = () => {
    setDrawerJob(null);
    setDrawerOpen(true);
  };
  const openEditDrawer = (job: Job) => {
    setDrawerJob(job);
    setDrawerOpen(true);
    setOpenMenuId(null);
  };

  const handleSaved = async (isNew: boolean) => {
    setDrawerOpen(false);
    await fetchJobs();
    showToast(isNew ? "Requisition created" : "Requisition updated");
  };

  const quickSetStatus = async (job: Job, status: Job["status"]) => {
    setOpenMenuId(null);
    try {
      const res = await authFetch(`${API_URL}/admin/jobs/${job.id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update requisition status.");
      await fetchJobs();
      showToast(
        status === "published" ? "Job published to the careers page" : status === "closed" ? "Job closed" : "Job moved to draft"
      );
    } catch (err: any) {
      showToast(err.message || "Something went wrong.", "error");
    }
  };

  const deleteJob = async (job: Job) => {
    setOpenMenuId(null);
    if (!window.confirm(`Delete "${job.title}"? This can't be undone.`)) return;
    try {
      const res = await authFetch(`${API_URL}/admin/jobs/${job.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete requisition.");
      setJobs((prev) => prev.filter((j) => j.id !== job.id));
      showToast("Requisition deleted");
    } catch (err: any) {
      showToast(err.message || "Something went wrong.", "error");
    }
  };

  const copyLink = (job: Job) => {
    const url = `${window.location.origin}/careers/jobs/${job.slug}`;
    navigator.clipboard.writeText(url);
    showToast("Public job link copied to clipboard");
  };

  return (
    <>
      <PageMeta title="Active Postings | Talent Acquisition System" description="Manage active job postings for the Talent Acquisition team." />
      <PageBreadcrumb pageTitle="Active Postings" />

      <div className="space-y-5">
        {/* ── Command bar ────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search postings..."
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
          </div>

          <div className="relative">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="appearance-none pl-3.5 pr-9 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            >
              <option value="all">All Departments</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          <div className="flex-1" />

          <button
            onClick={openCreateDrawer}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Requisition
          </button>
        </div>

        {/* ── Card ───────────────────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          {/* Tabs */}
          <div className="flex items-center gap-1 px-5 pt-4 border-b border-gray-100 dark:border-white/[0.05]">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                  tab === t.key
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                {t.label}
                <span
                  className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold ${
                    tab === t.key ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" : "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400"
                  }`}
                >
                  {counts[t.key]}
                </span>
                {tab === t.key && <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-gray-900 dark:bg-white rounded-full" />}
              </button>
            ))}
          </div>

          <div className="max-w-full overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/[0.05]">
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Position</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Hiring Team</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Pipeline</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Days Active</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-sm text-gray-400">Loading postings...</td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-sm text-red-500">{error}</td>
                  </tr>
                ) : filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-sm text-gray-400">No postings in this view.</td>
                  </tr>
                ) : (
                  filteredJobs.map((job) => (
                    <tr key={job.id} className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{job.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {reqId(job)} • {job.department}
                          {job.branches.length > 0 && ` • ${job.branches.map((b) => b.name).join(", ")}`}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {job.hiring_manager ? (
                          <div className="flex items-center gap-2">
                            <Avatar name={job.hiring_manager.name} url={job.hiring_manager.avatar} />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{job.hiring_manager.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {job.funnel.total === 0 ? (
                          <span className="text-sm text-gray-400">No applicants yet</span>
                        ) : (
                          <div className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            <span className="font-semibold text-brand-600 dark:text-brand-400">{job.funnel.new} New</span>
                            {" | "}
                            {job.funnel.interviewing} Interviewing
                            {" | "}
                            {job.funnel.offer} Offer
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {job.status === "draft" ? "—" : `${job.days_on_market}d`}
                      </td>
                      <td className="px-4 py-4">
                        <StatusPill status={job.status} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {/* Hover-reveal quick actions */}
                          <div className="hidden group-hover:flex items-center gap-1">
                            <button
                              onClick={() => copyLink(job)}
                              title="Copy public link"
                              className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-white/5 dark:hover:text-gray-200 transition-colors"
                            >
                              <LinkIcon className="w-4 h-4" />
                            </button>
                            <a
                              href={`/careers/jobs/${job.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Preview job page"
                              className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-white/5 dark:hover:text-gray-200 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </a>
                          </div>

                          {/* Always-visible menu */}
                          <div className="relative" ref={openMenuId === job.id ? menuRef : null}>
                            <button
                              onClick={() => setOpenMenuId(openMenuId === job.id ? null : job.id)}
                              className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-white/5 dark:hover:text-gray-200 transition-colors"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            {openMenuId === job.id && (
                              <div className="absolute right-0 z-50 mt-1 w-52 rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 py-1">
                                <button
                                  onClick={() => openEditDrawer(job)}
                                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                                >
                                  <Pencil className="w-4 h-4 text-gray-400" /> Edit Job
                                </button>
                                {job.status !== "published" && (
                                  <button
                                    onClick={() => quickSetStatus(job, "published")}
                                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                                  >
                                    <Globe className="w-4 h-4" /> Publish
                                  </button>
                                )}
                                {job.status === "published" && (
                                  <button
                                    onClick={() => quickSetStatus(job, "closed")}
                                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                                  >
                                    <X className="w-4 h-4" /> Close
                                  </button>
                                )}
                                {job.status === "closed" && (
                                  <button
                                    onClick={() => quickSetStatus(job, "published")}
                                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                                  >
                                    <Globe className="w-4 h-4" /> Reopen
                                  </button>
                                )}
                                <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
                                <button
                                  onClick={() => deleteJob(job)}
                                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <JobDrawer
        isOpen={drawerOpen}
        job={drawerJob}
        branches={branches}
        onClose={() => setDrawerOpen(false)}
        onSaved={(_saved, isNew) => handleSaved(isNew)}
      />

      {toast && <Toast toast={toast} onDismiss={dismissToast} />}
    </>
  );
}
