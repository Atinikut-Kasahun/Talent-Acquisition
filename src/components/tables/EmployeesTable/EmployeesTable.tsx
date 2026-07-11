import { useEffect, useRef, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { Modal } from "../../ui/modal";
import {
  DEPARTMENTS,
  Employee,
  EmployeeStatus,
  LOCATIONS,
  STATUS_CONFIG,
  STATUS_ORDER,
} from "./employeesData";

interface EmployeesTableProps {
  employees: Employee[];
  onStatusChange: (id: number, status: EmployeeStatus) => void;
  onEditSave: (updated: Employee) => void;
}

export default function EmployeesTable({
  employees,
  onStatusChange,
  onEditSave,
}: EmployeesTableProps) {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [openStatusId, setOpenStatusId] = useState<number | null>(null);
  const [viewProfile, setViewProfile] = useState<Employee | null>(null);
  const [editTarget, setEditTarget] = useState<Employee | null>(null);
  const [offboardTarget, setOffboardTarget] = useState<Employee | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  // Close popovers on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setOpenStatusId(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="max-w-full overflow-x-auto bg-transparent">
      <Table className="w-full border-collapse">
        <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
          <TableRow className="border-none">
            {["Employee Name", "Applied For", "Department", "Experience", "Status", "Hired On", "Applied On"].map(
              (h) => (
                <TableCell
                  key={h}
                  isHeader
                  className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-start align-middle"
                >
                  {h}
                </TableCell>
              )
            )}
            <TableCell
              isHeader
              className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-end align-middle"
            >
              Actions
            </TableCell>
          </TableRow>
        </TableHeader>

        <TableBody className="divide-y divide-gray-50/50 dark:divide-white/[0.02]">
          {employees.map((employee) => {
            const statusStyle = STATUS_CONFIG[employee.status];
            return (
              <TableRow
                key={employee.id}
                className="hover:bg-gray-50/40 dark:hover:bg-white/[0.01] transition-colors"
              >
                <TableCell className="px-5 py-4 text-start align-middle">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 overflow-hidden rounded-full flex-shrink-0 shadow-sm border border-gray-100 dark:border-white/[0.05]">
                      <img
                        width={40}
                        height={40}
                        src={employee.user.image}
                        alt={employee.user.name}
                        className="w-10 h-10 object-cover"
                      />
                    </div>
                    <div>
                      <span className="block font-semibold text-gray-900 text-sm dark:text-white/95">
                        {employee.user.name}
                      </span>
                      <span className="block text-gray-400 text-xs dark:text-gray-500 font-normal mt-0.5">
                        {employee.user.role}
                      </span>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="px-5 py-4 text-start align-middle text-gray-700 dark:text-gray-300 text-sm font-medium">
                  {employee.appliedFor}
                </TableCell>

                <TableCell className="px-5 py-4 text-start align-middle text-gray-400 dark:text-gray-500 text-xs font-normal">
                  {employee.department}
                </TableCell>

                <TableCell className="px-5 py-4 text-start align-middle text-gray-600 dark:text-gray-400 text-sm font-normal">
                  {employee.experience}
                </TableCell>

                {/* Status — click to open change-status popover */}
                <TableCell className="px-5 py-4 text-start align-middle">
                  <div
                    className="relative inline-block"
                    ref={openStatusId === employee.id ? statusRef : null}
                  >
                    <button
                      onClick={() =>
                        setOpenStatusId(openStatusId === employee.id ? null : employee.id)
                      }
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusStyle.bg} ${statusStyle.text} hover:opacity-80 transition`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                      {statusStyle.label}
                    </button>

                    {openStatusId === employee.id && (
                      <div className="absolute left-0 z-50 mt-2 w-40 rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800 py-1.5 animate-in fade-in slide-in-from-top-1">
                        {STATUS_ORDER.map((sk) => {
                          const cfg = STATUS_CONFIG[sk];
                          const isActive = employee.status === sk;
                          return (
                            <button
                              key={sk}
                              onClick={() => {
                                onStatusChange(employee.id, sk);
                                setOpenStatusId(null);
                              }}
                              className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-xs transition
                                ${isActive ? "bg-gray-50 dark:bg-gray-700/50 font-semibold" : "hover:bg-gray-50 dark:hover:bg-gray-700/30"}
                                ${cfg.text}`}
                            >
                              <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                              {cfg.label}
                              {isActive && (
                                <svg className="w-3 h-3 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </TableCell>

                <TableCell className="px-5 py-4 text-start align-middle text-gray-400 dark:text-gray-500 text-xs font-normal">
                  {employee.hiredOn}
                </TableCell>

                <TableCell className="px-5 py-4 text-start align-middle text-gray-400 dark:text-gray-500 text-xs font-normal">
                  {employee.appliedOn}
                </TableCell>

                {/* Actions (three-dot menu) */}
                <TableCell className="px-5 py-4 text-end align-middle">
                  <div
                    className="relative inline-block"
                    ref={openMenuId === employee.id ? menuRef : null}
                  >
                    <button
                      onClick={() =>
                        setOpenMenuId(openMenuId === employee.id ? null : employee.id)
                      }
                      className="flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-200 transition"
                      aria-label="Actions"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="5" cy="12" r="1.5" />
                        <circle cx="12" cy="12" r="1.5" />
                        <circle cx="19" cy="12" r="1.5" />
                      </svg>
                    </button>

                    {openMenuId === employee.id && (
                      <div className="absolute right-0 z-50 mt-1 w-48 rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800 py-1.5 text-left">
                        <button
                          onClick={() => {
                            setOpenMenuId(null);
                            setViewProfile(employee);
                          }}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700 transition"
                        >
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          View Profile
                        </button>

                        <button
                          onClick={() => {
                            setOpenMenuId(null);
                            setEditTarget(employee);
                          }}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700 transition"
                        >
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit Details
                        </button>

                        <div className="my-1 border-t border-gray-100 dark:border-gray-700" />

                        {/* Change Status sub-list, inline (no nested flyout needed at this size) */}
                        {STATUS_ORDER.filter((s) => s !== employee.status).map((sk) => {
                          const cfg = STATUS_CONFIG[sk];
                          return (
                            <button
                              key={sk}
                              onClick={() => {
                                setOpenMenuId(null);
                                onStatusChange(employee.id, sk);
                              }}
                              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700 transition"
                            >
                              <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                              Mark as {cfg.label}
                            </button>
                          );
                        })}

                        <div className="my-1 border-t border-gray-100 dark:border-gray-700" />

                        <button
                          onClick={() => {
                            setOpenMenuId(null);
                            setOffboardTarget(employee);
                          }}
                          disabled={employee.status === "Offboarded"}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-500 dark:hover:bg-red-900/20 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                          Offboard
                        </button>
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}

          {employees.length === 0 && (
            <TableRow>
              <TableCell className="px-5 py-10 text-center text-sm text-gray-400" colSpan={8}>
                No employees match the current filters.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* ── View Profile Modal ─────────────────────────────────── */}
      <Modal isOpen={!!viewProfile} onClose={() => setViewProfile(null)} className="max-w-md p-6">
        {viewProfile && (
          <div>
            <div className="flex items-center gap-4 mb-5">
              <img
                src={viewProfile.user.image}
                alt={viewProfile.user.name}
                className="w-14 h-14 rounded-full object-cover border border-gray-100 dark:border-white/[0.05]"
              />
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {viewProfile.user.name}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">{viewProfile.user.role}</p>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
              <dt className="text-gray-400">Department</dt>
              <dd className="text-gray-800 dark:text-gray-200">{viewProfile.department}</dd>
              <dt className="text-gray-400">Location</dt>
              <dd className="text-gray-800 dark:text-gray-200">{viewProfile.location}</dd>
              <dt className="text-gray-400">Experience</dt>
              <dd className="text-gray-800 dark:text-gray-200">{viewProfile.experience}</dd>
              <dt className="text-gray-400">Status</dt>
              <dd>
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_CONFIG[viewProfile.status].bg} ${STATUS_CONFIG[viewProfile.status].text}`}>
                  {STATUS_CONFIG[viewProfile.status].label}
                </span>
              </dd>
              <dt className="text-gray-400">Hired On</dt>
              <dd className="text-gray-800 dark:text-gray-200">{viewProfile.hiredOn}</dd>
              <dt className="text-gray-400">Email</dt>
              <dd className="text-gray-800 dark:text-gray-200">{viewProfile.email}</dd>
              <dt className="text-gray-400">Phone</dt>
              <dd className="text-gray-800 dark:text-gray-200">{viewProfile.phone}</dd>
            </dl>
            <p className="mt-5 text-xs text-gray-400">
              Full staff profile page coming once employee records move to the backend.
            </p>
          </div>
        )}
      </Modal>

      {/* ── Edit Details Modal ─────────────────────────────────── */}
      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} className="max-w-md p-6">
        {editTarget && (
          <EditEmployeeForm
            employee={editTarget}
            onCancel={() => setEditTarget(null)}
            onSave={(updated) => {
              onEditSave(updated);
              setEditTarget(null);
            }}
          />
        )}
      </Modal>

      {/* ── Offboard Confirm Modal ─────────────────────────────── */}
      <Modal isOpen={!!offboardTarget} onClose={() => setOffboardTarget(null)} className="max-w-sm p-6">
        {offboardTarget && (
          <div>
            <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
              Offboard {offboardTarget.user.name}?
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              This marks them as Offboarded and removes them from the active roster. This can be reversed later from Change Status.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setOffboardTarget(null)}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onStatusChange(offboardTarget.id, "Offboarded");
                  setOffboardTarget(null);
                }}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition"
              >
                Offboard
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ── Small inline edit form ─────────────────────────────────────────────────
function EditEmployeeForm({
  employee,
  onCancel,
  onSave,
}: {
  employee: Employee;
  onCancel: () => void;
  onSave: (updated: Employee) => void;
}) {
  const [form, setForm] = useState(employee);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
    >
      <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
        Edit {employee.user.name}
      </h4>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Role / Title
          </label>
          <input
            type="text"
            value={form.user.role}
            onChange={(e) => setForm({ ...form, user: { ...form.user, role: e.target.value } })}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Department
          </label>
          <select
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10"
          >
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Location
          </label>
          <select
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10"
          >
            {LOCATIONS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Phone
          </label>
          <input
            type="text"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-semibold rounded-lg bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-950 transition"
        >
          Save Changes
        </button>
      </div>
    </form>
  );
}
