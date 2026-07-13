// Shared requisition data source for General Manager features
// (Hiring Plan page + GM Dashboard command center widget).
//
// NOTE: still mock data. When a real `requisitions` backend endpoint exists,
// swap MOCK_REQUISITIONS for a fetch — the shape here is designed to match
// what that API will likely return.

export type ReqStatus =
  | "Draft"
  | "Pending HR Approval"
  | "Pending MD Approval"
  | "Approved"
  | "Posted"
  | "Rejected"
  | "In Progress"
  | "Closed";

export interface Requisition {
  id: string;
  title: string;
  department: string;
  headcount: number;
  submittedAt: string; // ISO date
  approvedAt?: string; // ISO date — only set once status reaches "Approved"
  lastUpdatedAt: string; // ISO datetime — drives "2h ago" / "1d ago" display
  status: ReqStatus;
  reason: string;
}

export const STATUS_STYLES: Record<
  ReqStatus,
  { bg: string; text: string; dot: string }
> = {
  Draft: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400", dot: "bg-gray-400" },
  "Pending HR Approval": { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-700 dark:text-amber-400", dot: "bg-amber-400" },
  "Pending MD Approval": { bg: "bg-yellow-50 dark:bg-yellow-900/20", text: "text-yellow-700 dark:text-yellow-400", dot: "bg-yellow-400" },
  Approved: { bg: "bg-green-50 dark:bg-green-900/20", text: "text-green-700 dark:text-green-400", dot: "bg-green-500" },
  Posted: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  Rejected: { bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-700 dark:text-red-400", dot: "bg-red-500" },
  "In Progress": { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-400", dot: "bg-blue-500" },
  Closed: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-500 dark:text-gray-500", dot: "bg-gray-400" },
};

// The 4-stage lifecycle used for the horizontal timeline visualization.
// Every ReqStatus maps to one of these stage indices (0-3).
export const PIPELINE_STAGES = ["Initiated", "MD Approval", "HR Approval", "TA Posting"] as const;

export function stageIndexForStatus(status: ReqStatus): number {
  switch (status) {
    case "Draft":
      return 0;
    case "Pending MD Approval":
      return 0; // sitting between Initiated and MD Approval
    case "Pending HR Approval":
    case "Approved":
      return 2; // MD cleared, now at/entering HR stage
    case "Posted":
    case "In Progress":
    case "Closed":
      return 3;
    case "Rejected":
      return 1; // stopped at MD stage
    default:
      return 0;
  }
}

export const HEADCOUNT_BUDGET = {
  quarter: "FY 2026 · Q3",
  total: 40,
};

export const MOCK_REQUISITIONS: Requisition[] = [
  {
    id: "REQ-001",
    title: "Senior Sales Representative",
    department: "Sales",
    headcount: 3,
    submittedAt: "2026-05-10",
    approvedAt: "2026-05-14",
    lastUpdatedAt: "2026-05-14T09:00:00",
    status: "Approved",
    reason: "Business expansion into new region",
  },
  {
    id: "REQ-002",
    title: "Warehouse Supervisor",
    department: "Operations",
    headcount: 2,
    submittedAt: "2026-05-28",
    lastUpdatedAt: "2026-07-12T06:00:00",
    status: "Pending MD Approval",
    reason: "Replacement for 2 departing staff",
  },
  {
    id: "REQ-003",
    title: "Finance Officer",
    department: "Finance",
    headcount: 1,
    submittedAt: "2026-06-01",
    approvedAt: "2026-06-05",
    lastUpdatedAt: "2026-07-11T12:00:00",
    status: "In Progress",
    reason: "New project workload",
  },
  {
    id: "REQ-004",
    title: "Marketing Coordinator",
    department: "Marketing",
    headcount: 2,
    submittedAt: "2026-04-15",
    lastUpdatedAt: "2026-04-19T10:00:00",
    status: "Rejected",
    reason: "Campaign support",
  },
  {
    id: "REQ-005",
    title: "IT Support Specialist",
    department: "IT",
    headcount: 1,
    submittedAt: "2026-06-02",
    lastUpdatedAt: "2026-06-02T15:00:00",
    status: "Draft",
    reason: "Infrastructure growth",
  },
  {
    id: "REQ-006",
    title: "Senior React Developer",
    department: "Engineering",
    headcount: 1,
    submittedAt: "2026-07-10",
    lastUpdatedAt: "2026-07-13T04:00:00",
    status: "Pending HR Approval",
    reason: "New product squad",
  },
  {
    id: "REQ-007",
    title: "Office Assistant",
    department: "Admin",
    headcount: 1,
    submittedAt: "2026-07-07",
    approvedAt: "2026-07-08",
    lastUpdatedAt: "2026-07-10T08:00:00",
    status: "Posted",
    reason: "Front-desk coverage",
  },
];
