import { useEffect, useRef, useState } from "react";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string; // e.g. "employees", "applicants"
  showGoToPage?: boolean; // shows a "Go to page" jump input — useful for large datasets
}

// Builds a compact page-number sequence with ellipses, e.g.
// [1, "…", 4, 5, 6, "…", 12]
function buildPageSequence(current: number, total: number): (number | "…")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = Array.from(pages)
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  const withEllipses: (number | "…")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) {
      withEllipses.push("…");
    }
    withEllipses.push(p);
  });

  return withEllipses;
}

export default function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
  itemLabel = "items",
  showGoToPage = false,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.min(currentPage, totalPages);

  const rangeStart = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalItems);

  const pageSequence = buildPageSequence(page, totalPages);

  const buttonBase =
    "inline-flex items-center justify-center min-w-[2rem] h-8 px-2 text-sm font-medium rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed";
  const inactive =
    "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06]";
  const active =
    "bg-gray-900 text-white dark:bg-white dark:text-gray-950 font-semibold";

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-2 border-t border-gray-100 dark:border-white/[0.05]">
      {/* Left: range summary + rows-per-page */}
      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
        <span>
          Showing{" "}
          <span className="font-medium text-gray-700 dark:text-gray-200">
            {rangeStart}–{rangeEnd}
          </span>{" "}
          of{" "}
          <span className="font-medium text-gray-700 dark:text-gray-200">
            {totalItems}
          </span>{" "}
          {itemLabel}
        </span>

        <PageSizeDropdown
          value={pageSize}
          options={pageSizeOptions}
          onChange={onPageSizeChange}
        />
      </div>

      {/* Right: page navigation */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className={`${buttonBase} ${inactive}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {pageSequence.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm select-none">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`${buttonBase} ${p === page ? active : inactive}`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
          className={`${buttonBase} ${inactive}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {showGoToPage && totalPages > 1 && (
          <GoToPage totalPages={totalPages} onJump={onPageChange} />
        )}
      </div>
    </div>
  );
}

// ── "Go to page" jump input — shown only when explicitly enabled ──────────
function GoToPage({ totalPages, onJump }: { totalPages: number; onJump: (page: number) => void }) {
  const [value, setValue] = useState("");

  function submit() {
    const n = Number(value);
    if (Number.isInteger(n) && n >= 1 && n <= totalPages) {
      onJump(n);
      setValue("");
    }
  }

  return (
    <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-gray-200 dark:border-gray-700">
      <span className="text-xs text-gray-400 dark:text-gray-500">Go to</span>
      <input
        type="number"
        min={1}
        max={totalPages}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="#"
        className="w-12 h-8 px-1.5 text-center text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
    </div>
  );
}

// ── Custom "Rows per page" popover — matches the Department/Location/Status
// filter pills elsewhere in the app instead of a native browser <select> ──
function PageSizeDropdown({
  value,
  options,
  onChange,
}: {
  value: number;
  options: number[];
  onChange: (size: number) => void;
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
    <div ref={ref} className="relative flex items-center gap-1.5">
      <span>Rows per page</span>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:border-gray-300 dark:hover:border-gray-600 transition"
      >
        {value}
        <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-20 rounded-xl border border-gray-100 dark:border-white/[0.08] bg-white dark:bg-[#1A1C23] shadow-xl z-50 overflow-hidden py-1">
          {options.map((size) => (
            <button
              key={size}
              onClick={() => {
                onChange(size);
                setOpen(false);
              }}
              className={`w-full flex items-center justify-center px-3 py-1.5 text-sm transition-colors ${
                size === value
                  ? "bg-gray-50 dark:bg-white/[0.06] font-semibold text-gray-900 dark:text-white"
                  : "hover:bg-gray-50 dark:hover:bg-white/[0.04] text-gray-700 dark:text-gray-300"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
