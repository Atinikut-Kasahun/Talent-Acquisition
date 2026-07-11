import { useEffect, useMemo, useRef, useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import ComponentCard from "../components/common/ComponentCard";
import PageMeta from "../components/common/PageMeta";
import EmployeesTable from "../components/tables/EmployeesTable/EmployeesTable";
import Pagination from "../components/ui/pagination/Pagination";
import {
  DEPARTMENTS,
  Employee,
  EmployeeStatus,
  INITIAL_EMPLOYEES,
  LOCATIONS,
  STATUS_CONFIG,
  STATUS_ORDER,
} from "../components/tables/EmployeesTable/employeesData";

// ── Generic pill-style popover filter, matching the Applicants page ────────
function FilterPopover({
  label,
  value,
  options,
  onChange,
  renderOption,
}: {
  label: string;
  value: string | null;
  options: string[];
  onChange: (value: string | null) => void;
  renderOption?: (opt: string) => { dot?: string; text: string };
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

  const activeLabel = value ? (renderOption ? renderOption(value).text : value) : label;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs md:text-sm font-medium border transition-all duration-200 ${
          value
            ? "bg-[#FCEE23]/10 border-[#FCEE23] text-gray-900 dark:text-white"
            : "bg-white dark:bg-white/[0.03] border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:border-gray-300"
        }`}
      >
        {value && renderOption?.(value).dot && (
          <span className={`w-2 h-2 rounded-full ${renderOption(value).dot}`} />
        )}
        {activeLabel}
        <svg className={`w-3.5 h-3.5 transition-transform text-gray-400 ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-48 rounded-xl border border-gray-100 dark:border-white/[0.08] bg-white dark:bg-[#1A1C23] shadow-xl z-50 overflow-hidden py-1.5">
          <button
            onClick={() => { onChange(null); setOpen(false); }}
            className={`w-full flex items-center px-3.5 py-2 text-sm text-left transition-colors ${
              !value ? "bg-gray-50 dark:bg-white/[0.06] font-semibold" : "hover:bg-gray-50 dark:hover:bg-white/[0.04] text-gray-700 dark:text-gray-300"
            }`}
          >
            All {label}
          </button>
          {options.map((opt) => {
            const cfg = renderOption?.(opt);
            const isActive = value === opt;
            return (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3.5 py-2 text-sm text-left transition-colors ${
                  isActive ? "bg-gray-50 dark:bg-white/[0.06] font-semibold" : "hover:bg-gray-50 dark:hover:bg-white/[0.04] text-gray-700 dark:text-gray-300"
                }`}
              >
                {cfg?.dot && <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />}
                {cfg?.text ?? opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [department, setDepartment] = useState<string | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [status, setStatus] = useState<EmployeeStatus | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      if (department && e.department !== department) return false;
      if (location && e.location !== location) return false;
      if (status && e.status !== status) return false;
      return true;
    });
  }, [employees, department, location, status]);

  // Reset to page 1 whenever the filtered set changes (new filters applied)
  useEffect(() => {
    setPage(1);
  }, [department, location, status]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  function handleStatusChange(id: number, newStatus: EmployeeStatus) {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, status: newStatus } : e)));
  }

  function handleEditSave(updated: Employee) {
    setEmployees((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  }

  const hasActiveFilters = department || location || status;

  return (
    <>
      <PageMeta
        title="Employee Directory | Droga Group"
        description="Enterprise-grade employee talent directory"
      />

      <PageBreadcrumb pageTitle="Employee Directory" />

      {/* Command bar — filters only. Global search (top bar) is the single source of truth for search. */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 p-4 bg-white dark:bg-white/[0.03] rounded-xl border border-gray-100 dark:border-white/[0.05] shadow-sm">
        <div className="flex flex-wrap items-center gap-2 flex-1 w-full lg:w-auto">
          <FilterPopover
            label="Departments"
            value={department}
            options={DEPARTMENTS}
            onChange={setDepartment}
          />
          <FilterPopover
            label="Locations"
            value={location}
            options={LOCATIONS}
            onChange={setLocation}
          />
          <FilterPopover
            label="Statuses"
            value={status}
            options={STATUS_ORDER}
            onChange={(v) => setStatus(v as EmployeeStatus | null)}
            renderOption={(opt) => ({
              dot: STATUS_CONFIG[opt as EmployeeStatus].dot,
              text: STATUS_CONFIG[opt as EmployeeStatus].label,
            })}
          />
          {hasActiveFilters && (
            <button
              onClick={() => { setDepartment(null); setLocation(null); setStatus(null); }}
              className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors px-2"
            >
              Clear filters
            </button>
          )}
        </div>

        <button className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-950 font-semibold py-2 px-4.5 rounded-lg transition-all shadow-sm text-sm shrink-0">
          <svg className="w-4 h-4 stroke-current" fill="none" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path>
          </svg>
          Add New Employee
        </button>
      </div>

      <div className="space-y-6">
        <ComponentCard title={`Employee Roster (${filtered.length})`}>
          <EmployeesTable
            employees={paginated}
            onStatusChange={handleStatusChange}
            onEditSave={handleEditSave}
          />
          <Pagination
            currentPage={page}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            itemLabel="employees"
          />
        </ComponentCard>
      </div>
    </>
  );
}
