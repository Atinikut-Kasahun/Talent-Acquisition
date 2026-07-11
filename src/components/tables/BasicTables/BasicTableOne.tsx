import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { MoreDotIcon } from "../../../icons";

interface Employee {
  id: number;
  user: {
    image: string;
    name: string;
    role: string;
  };
  appliedFor: string;
  department: string;
  experience: string;
  status: "Active" | "Pending" | "Cancel";
  hiredOn: string;
  appliedOn: string;
}

// Table data definition
const tableData: Employee[] = [
  {
    id: 1,
    user: {
      image: "/images/user/user-17.jpg",
      name: "Abraham Dawit",
      role: "Web Designer",
    },
    appliedFor: "Senior Web Designer",
    department: "Design",
    experience: "3 Years",
    status: "Active",
    hiredOn: "12 Jan, 2023",
    appliedOn: "05 Jan, 2023",
  },
  {
    id: 2,
    user: {
      image: "/images/user/user-18.jpg",
      name: "Dagim Girma",
      role: "Project Manager",
    },
    appliedFor: "Lead Project Manager",
    department: "Management",
    experience: "5 Years",
    status: "Pending",
    hiredOn: "N/A",
    appliedOn: "15 Feb, 2023",
  },
  {
    id: 3,
    user: {
      image: "/images/user/user-17.jpg",
      name: "Bereket Mena",
      role: "Content Writing",
    },
    appliedFor: "Content Writer",
    department: "Marketing",
    experience: "2 Years",
    status: "Active",
    hiredOn: "01 Mar, 2023",
    appliedOn: "20 Feb, 2023",
  },
  {
    id: 4,
    user: {
      image: "/images/user/user-20.jpg",
      name: "Abram Melkamu",
      role: "Digital Marketer",
    },
    appliedFor: "Marketing Lead",
    department: "Marketing",
    experience: "4 Years",
    status: "Cancel",
    hiredOn: "N/A",
    appliedOn: "10 Mar, 2023",
  },
  {
    id: 5,
    user: {
      image: "/images/user/user-21.jpg",
      name: "Mehiret Tsegaye",
      role: "Front-end Developer",
    },
    appliedFor: "React Developer",
    department: "Engineering",
    experience: "1 Year",
    status: "Active",
    hiredOn: "15 Apr, 2023",
    appliedOn: "01 Apr, 2023",
  },
];

// Status badge styles configuration matching the Applicant status design for complete visual consistency
const STATUS_CONFIG = {
  Active: {
    label: "Active",
    bg: "bg-green-50 dark:bg-green-500/10",
    text: "text-green-600 dark:text-green-400",
    dot: "bg-green-500",
  },
  Pending: {
    label: "Pending",
    bg: "bg-amber-50 dark:bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  Cancel: {
    label: "Cancel",
    bg: "bg-red-50 dark:bg-red-500/10",
    text: "text-red-500 dark:text-red-400",
    dot: "bg-red-500",
  },
};

export default function BasicTableOne() {
  return (
    <div className="max-w-full overflow-x-auto bg-transparent">
      <Table className="w-full border-collapse">
        {/* Table Header with minimalist border */}
        <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
          <TableRow className="border-none">
            <TableCell
              isHeader
              className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-start align-middle"
            >
              Employee Name
            </TableCell>
            <TableCell
              isHeader
              className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-start align-middle"
            >
              Applied For
            </TableCell>
            <TableCell
              isHeader
              className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-start align-middle"
            >
              Department
            </TableCell>
            <TableCell
              isHeader
              className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-start align-middle"
            >
              Experience
            </TableCell>
            <TableCell
              isHeader
              className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-start align-middle"
            >
              Status
            </TableCell>
            <TableCell
              isHeader
              className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-start align-middle"
            >
              Hired On
            </TableCell>
            <TableCell
              isHeader
              className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-start align-middle"
            >
              Applied On
            </TableCell>
            <TableCell
              isHeader
              className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-end align-middle"
            >
              Actions
            </TableCell>
          </TableRow>
        </TableHeader>

        {/* Table Body with minimalist borders & rows that breathe */}
        <TableBody className="divide-y divide-gray-50/50 dark:divide-white/[0.02]">
          {tableData.map((employee) => {
            const statusStyle = STATUS_CONFIG[employee.status] || STATUS_CONFIG.Active;
            return (
              <TableRow 
                key={employee.id} 
                className="hover:bg-gray-50/40 dark:hover:bg-white/[0.01] transition-colors"
              >
                {/* Employee Name (slightly bolder primary focus, secondary role text) */}
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

                {/* Applied For */}
                <TableCell className="px-5 py-4 text-start align-middle text-gray-700 dark:text-gray-300 text-sm font-medium">
                  {employee.appliedFor}
                </TableCell>

                {/* Department (lighter secondary text) */}
                <TableCell className="px-5 py-4 text-start align-middle text-gray-400 dark:text-gray-500 text-xs font-normal">
                  {employee.department}
                </TableCell>

                {/* Experience */}
                <TableCell className="px-5 py-4 text-start align-middle text-gray-600 dark:text-gray-400 text-sm font-normal">
                  {employee.experience}
                </TableCell>

                {/* Status Badges (exact same size, font-weight, and dot indicator style as Applicants) */}
                <TableCell className="px-5 py-4 text-start align-middle">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                    {statusStyle.label}
                  </span>
                </TableCell>

                {/* Hired On (lighter secondary text) */}
                <TableCell className="px-5 py-4 text-start align-middle text-gray-400 dark:text-gray-500 text-xs font-normal">
                  {employee.hiredOn}
                </TableCell>

                {/* Applied On (lighter secondary text) */}
                <TableCell className="px-5 py-4 text-start align-middle text-gray-400 dark:text-gray-500 text-xs font-normal">
                  {employee.appliedOn}
                </TableCell>

                {/* Actions Button */}
                <TableCell className="px-5 py-4 text-end align-middle">
                  <button className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-white/[0.03] transition-all">
                    <MoreDotIcon className="w-5 h-5" />
                  </button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
