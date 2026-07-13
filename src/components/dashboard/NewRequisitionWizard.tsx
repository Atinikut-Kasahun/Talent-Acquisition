import { useEffect, useRef, useState } from "react";
import {
  DEPARTMENTS,
  JD_TEMPLATES,
  Requisition,
} from "../../pages/HiringPlan/requisitionsData";

const STEPS = ["Role Details", "Requirements", "Review"] as const;

interface NewRequisitionWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (req: Requisition) => void;
  requestedBy: string;
  nextId: string;
}

interface WizardForm {
  title: string;
  department: string;
  headcount: string; // kept as string while editing, parsed to number on submit
  requestedBy: string;
  reason: string;
  jobDescription: string;
}

const EMPTY_FORM: WizardForm = {
  title: "",
  department: "",
  headcount: "1",
  requestedBy: "",
  reason: "",
  jobDescription: "",
};

export default function NewRequisitionWizard({
  isOpen,
  onClose,
  onSubmit,
  requestedBy,
  nextId,
}: NewRequisitionWizardProps) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<WizardForm>(EMPTY_FORM);

  // Reset the wizard fresh every time it's opened, prefilling smart defaults
  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setForm({ ...EMPTY_FORM, requestedBy });
    }
  }, [isOpen, requestedBy]);

  if (!isOpen) return null;

  const step1Valid = form.title.trim().length > 0 && form.department.length > 0 && Number(form.headcount) >= 1;
  const step2Valid = form.jobDescription.trim().length > 0 && form.reason.trim().length > 0;

  function handleTemplateSelect(dept: string) {
    setForm((f) => ({ ...f, jobDescription: JD_TEMPLATES[dept] ?? f.jobDescription }));
  }

  function handleSubmit() {
    const newReq: Requisition = {
      id: nextId,
      title: form.title.trim(),
      department: form.department,
      headcount: Math.max(1, Number(form.headcount) || 1),
      submittedAt: new Date().toISOString().split("T")[0],
      lastUpdatedAt: new Date().toISOString(),
      status: "Pending MD Approval",
      reason: form.reason.trim(),
      requestedBy: form.requestedBy.trim(),
      jobDescription: form.jobDescription.trim(),
    };
    onSubmit(newReq);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">New Requisition Request</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{nextId} · Draft</p>
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

        {/* Progress */}
        <div className="px-6 pt-5">
          <WizardProgress steps={STEPS} currentIndex={step} />
        </div>

        {/* Body */}
        <div className="px-6 py-6 min-h-[300px]">
          <div key={step} className="animate-in fade-in slide-in-from-right-4 duration-300">
            {step === 0 && (
              <StepRoleDetails form={form} setForm={setForm} />
            )}
            {step === 1 && (
              <StepRequirements form={form} setForm={setForm} onTemplateSelect={handleTemplateSelect} />
            )}
            {step === 2 && <StepReview form={form} nextId={nextId} />}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-white/[0.02]">
          <button
            onClick={() => (step === 0 ? onClose() : setStep((s) => s - 1))}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {step === 0 ? "Cancel" : "Back"}
          </button>

          {step < 2 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 0 ? !step1Valid : !step2Valid}
              className="px-5 py-2 text-sm font-semibold rounded-lg bg-[#1A1A1A] hover:bg-[#FCEE23] hover:text-gray-900 text-white transition-all shadow-sm hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#1A1A1A] disabled:hover:text-white"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-5 py-2 text-sm font-semibold rounded-lg bg-[#1A1A1A] hover:bg-[#FCEE23] hover:text-gray-900 text-white transition-all shadow-sm hover:shadow-md"
            >
              Submit for Approval
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Progress bar ────────────────────────────────────────────────────────
function WizardProgress({ steps, currentIndex }: { steps: readonly string[]; currentIndex: number }) {
  return (
    <div className="flex items-center mb-2">
      {steps.map((label, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors shrink-0 ${
                  isDone
                    ? "bg-gray-900 dark:bg-white border-gray-900 dark:border-white text-white dark:text-gray-900"
                    : isCurrent
                    ? "border-gray-900 dark:border-white text-gray-900 dark:text-white bg-white dark:bg-gray-900"
                    : "border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 bg-white dark:bg-gray-900"
                }`}
              >
                {isDone ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span className={`text-xs font-medium whitespace-nowrap hidden sm:inline ${isCurrent ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500"}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 ${isDone ? "bg-gray-900 dark:bg-white" : "bg-gray-200 dark:bg-gray-700"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Floating-label input ────────────────────────────────────────────────
function FloatingInput({
  label,
  value,
  onChange,
  type = "text",
  min,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  min?: number;
}) {
  return (
    <div className="relative">
      <input
        type={type}
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder=" "
        className="peer w-full px-3.5 pt-4 pb-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10 focus:border-gray-400 dark:focus:border-gray-500 transition-colors"
      />
      <label className="absolute left-3.5 top-3.5 text-sm text-gray-400 transition-all pointer-events-none peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-gray-500 peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-gray-500 dark:text-gray-500">
        {label}
      </label>
    </div>
  );
}

// ── Custom single-select dropdown (no native <select>) ───────────────────
function CustomSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3.5 pt-4 pb-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-left hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
      >
        <span className={value ? "text-gray-900 dark:text-white" : "text-gray-400"}>
          {value || " "}
        </span>
        <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform shrink-0 ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <span className={`absolute left-3.5 text-gray-400 dark:text-gray-500 pointer-events-none transition-all ${value ? "top-1.5 text-[10px] text-gray-500" : "top-3.5 text-sm"}`}>
        {label}
      </span>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-full max-h-56 overflow-y-auto rounded-xl border border-gray-100 dark:border-white/[0.08] bg-white dark:bg-[#1A1C23] shadow-xl z-50 py-1.5">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={`w-full flex items-center px-3.5 py-2 text-sm text-left transition-colors ${
                opt === value ? "bg-gray-50 dark:bg-white/[0.06] font-semibold text-gray-900 dark:text-white" : "hover:bg-gray-50 dark:hover:bg-white/[0.04] text-gray-700 dark:text-gray-300"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Step 1: Role Definition ────────────────────────────────────────────
function StepRoleDetails({
  form,
  setForm,
}: {
  form: WizardForm;
  setForm: React.Dispatch<React.SetStateAction<WizardForm>>;
}) {
  return (
    <div className="space-y-4">
      <FloatingInput
        label="Job Title"
        value={form.title}
        onChange={(v) => setForm((f) => ({ ...f, title: v }))}
      />
      <CustomSelect
        label="Department"
        value={form.department}
        options={DEPARTMENTS}
        onChange={(v) => setForm((f) => ({ ...f, department: v }))}
      />
      <FloatingInput
        label="Headcount Required"
        type="number"
        min={1}
        value={form.headcount}
        onChange={(v) => setForm((f) => ({ ...f, headcount: v }))}
      />
      <FloatingInput
        label="Requested By"
        value={form.requestedBy}
        onChange={(v) => setForm((f) => ({ ...f, requestedBy: v }))}
      />
    </div>
  );
}

// ── Step 2: Justification & JD ─────────────────────────────────────────
function StepRequirements({
  form,
  setForm,
  onTemplateSelect,
}: {
  form: WizardForm;
  setForm: React.Dispatch<React.SetStateAction<WizardForm>>;
  onTemplateSelect: (dept: string) => void;
}) {
  return (
    <div className="space-y-4">
      <FloatingInput
        label="Business Reason"
        value={form.reason}
        onChange={(v) => setForm((f) => ({ ...f, reason: v }))}
      />

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Job Description</label>
          <TemplatePicker onSelect={onTemplateSelect} />
        </div>
        <textarea
          value={form.jobDescription}
          onChange={(e) => setForm((f) => ({ ...f, jobDescription: e.target.value }))}
          rows={6}
          placeholder="Describe the role's responsibilities and requirements, or pick a template above to auto-fill…"
          className="w-full px-3.5 py-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10 focus:border-gray-400 dark:focus:border-gray-500 transition-colors resize-none"
        />
      </div>
    </div>
  );
}

function TemplatePicker({ onSelect }: { onSelect: (dept: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const templateDepartments = Object.keys(JD_TEMPLATES);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Template
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1.5 w-44 max-h-56 overflow-y-auto rounded-xl border border-gray-100 dark:border-white/[0.08] bg-white dark:bg-[#1A1C23] shadow-xl z-50 py-1.5">
          {templateDepartments.map((dept) => (
            <button
              key={dept}
              type="button"
              onClick={() => {
                onSelect(dept);
                setOpen(false);
              }}
              className="w-full flex items-center px-3.5 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
            >
              {dept}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Step 3: Review ──────────────────────────────────────────────────────
function StepReview({ form, nextId }: { form: WizardForm; nextId: string }) {
  const rows: [string, string][] = [
    ["Requisition ID", nextId],
    ["Job Title", form.title],
    ["Department", form.department],
    ["Headcount", form.headcount],
    ["Requested By", form.requestedBy || "—"],
    ["Business Reason", form.reason],
  ];

  return (
    <div>
      <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-white/[0.02] p-4 space-y-2.5">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-4 text-sm">
            <span className="text-gray-400 dark:text-gray-500 shrink-0">{label}</span>
            <span className="text-gray-900 dark:text-white font-medium text-right">{value}</span>
          </div>
        ))}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <span className="text-gray-400 dark:text-gray-500 text-sm block mb-1">Job Description</span>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed max-h-32 overflow-y-auto">
            {form.jobDescription}
          </p>
        </div>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
        This will be routed to the Managing Director for approval.
      </p>
    </div>
  );
}
