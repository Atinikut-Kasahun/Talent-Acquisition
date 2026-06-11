import {
  CalenderIcon,
  GridIcon,
  BoxIcon,
  PageIcon,
  GroupIcon,
  UserCircleIcon,
  MailIcon,
} from "../icons";

/**
 * All recognized user roles in the system.
 * Keep this list in sync with your backend role definitions.
 */
export type UserRole =
  | "superadmin"
  | "admin"
  | "hr"
  | "viewer"
  | "managing director"
  | "general Manager"
  | "HR manager";

export type NavSubItem = {
  name: string;
  path: string;
  pro?: boolean;
  new?: boolean;
};

export type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  roles: UserRole[]; // Which roles can see this top-level item
  subItems?: (NavSubItem & { roles?: UserRole[] })[]; // Optional per-subitem role guard
};

/** Every role that exists — used as a convenience shorthand */
const ALL_ROLES: UserRole[] = [
  "superadmin",
  "admin",
  "hr",
  "viewer",
  "managing director",
  "general Manager",
  "HR manager",
];

/**
 * SIDEBAR_NAV_CONFIG
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for the sidebar navigation.
 * Add / remove items here — the sidebar component filters automatically.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const SIDEBAR_NAV_CONFIG: NavItem[] = [
  {
    name: "Dashboard",
    icon: <GridIcon />,
    roles: ALL_ROLES,
    subItems: [
      {
        name: "REPORT",
        path: "/dashboard",
        pro: false,
        // visible to all roles — each role sees the same /dashboard but the
        // page renders content conditionally by role
        roles: ALL_ROLES,
      },
    ],
  },

  // ── Organizations (superadmin only) ──────────────────────────────────────
  {
    name: "Organizations",
    icon: <GroupIcon />,
    roles: ["superadmin"],
    subItems: [
      { name: "Manage Companies", path: "/manage-companies", roles: ["superadmin"] },
      { name: "Manage Users", path: "/manage-users", roles: ["superadmin"] },
    ],
  },

  // ── Calendar ─────────────────────────────────────────────────────────────
  {
    name: "Calendar",
    icon: <CalenderIcon />,
    path: "/calendar",
    roles: ALL_ROLES,
  },

  // ── Active Postings ───────────────────────────────────────────────────────
  {
    name: "Active Postings",
    icon: <BoxIcon />,
    path: "/jobs",
    roles: ALL_ROLES,
  },

  // ── Applicants ───────────────────────────────────────────────────────────
  {
    name: "Applicants",
    icon: <UserCircleIcon />,
    path: "/candidates",
    roles: ["superadmin", "admin", "hr", "viewer", "managing director", "HR manager"],
  },

  // ── Hiring Plan ──────────────────────────────────────────────────────────
  {
    name: "HIRING PLAN",
    icon: <PageIcon />,
    path: "/hiring-plan",
    roles: ["general Manager"],
  },

  // ── User Profile ─────────────────────────────────────────────────────────
  {
    name: "User Profile",
    icon: <UserCircleIcon />,
    path: "/profile",
    roles: ALL_ROLES,
  },

  // ── Chat ─────────────────────────────────────────────────────────────────
  {
    name: "Chat",
    icon: <MailIcon />,
    path: "/chat",
    roles: ALL_ROLES,
  },

  // ── Employees ────────────────────────────────────────────────────────────
  {
    name: "EMPLOYEES",
    icon: <GroupIcon />,
    roles: ["superadmin", "admin", "hr", "HR manager"],
    subItems: [
      {
        name: "View Employees",
        path: "/basic-tables",
        pro: false,
        roles: ["superadmin", "admin", "hr", "HR manager"],
      },
    ],
  },

  // ── Pages (dev / utility) ────────────────────────────────────────────────
  {
    name: "Pages",
    icon: <PageIcon />,
    roles: ["superadmin", "admin"],
    subItems: [
      { name: "Blank Page", path: "/blank", pro: false },
      { name: "404 Error", path: "/error-404", pro: false },
    ],
  },
];
