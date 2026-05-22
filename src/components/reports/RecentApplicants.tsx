import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";

interface Applicant {
  id: number;
  name: string;
  image: string;
  appliedFor: string;
  department: string;
  experience: string;
  status: "Hired" | "Pending" | "Rejected";
  appliedOn: string;
}

const tableData: Applicant[] = [
  {
    id: 1,
    name: "Mena Melkamu",
    image: "/images/user/user-17.jpg",
    appliedFor: "Senior Web Designer",
    department: "Design",
    experience: "3 Years",
    status: "Hired",
    appliedOn: "05 Jan, 2024",
  },
  {
    id: 2,
    name: "Eyosiyas Dawit",
    image: "/images/user/user-18.jpg",
    appliedFor: "Lead Project Manager",
    department: "Management",
    experience: "5 Years",
    status: "Pending",
    appliedOn: "15 Feb, 2024",
  },
  {
    id: 3,
    name: "Sameawit Moges",
    image: "/images/user/user-17.jpg",
    appliedFor: "Content Writer",
    department: "Marketing",
    experience: "2 Years",
    status: "Hired",
    appliedOn: "20 Feb, 2024",
  },
  {
    id: 4,
    name: "Rediet Sisay",
    image: "/images/user/user-20.jpg",
    appliedFor: "Marketing Lead",
    department: "Marketing",
    experience: "4 Years",
    status: "Rejected",
    appliedOn: "10 Mar, 2024",
  },
  {
    id: 5,
    name: "Abrham Eyob",
    image: "/images/user/user-21.jpg",
    appliedFor: "React Developer",
    department: "Engineering",
    experience: "1 Year",
    status: "Hired",
    appliedOn: "01 Apr, 2024",
  },
];

export default function RecentApplicants() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Recent Applicants
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
            <svg
              className="stroke-current fill-white dark:fill-gray-800"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2.29004 5.90393H17.7067"
                stroke=""
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M17.7075 14.0961H2.29085"
                stroke=""
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12.0826 3.33331C13.5024 3.33331 14.6534 4.48431 14.6534 5.90414C14.6534 7.32398 13.5024 8.47498 12.0826 8.47498C10.6627 8.47498 9.51172 7.32398 9.51172 5.90415C9.51172 4.48432 10.6627 3.33331 12.0826 3.33331Z"
                fill=""
                stroke=""
                strokeWidth="1.5"
              />
              <path
                d="M7.91745 11.525C6.49762 11.525 5.34662 12.676 5.34662 14.0959C5.34661 15.5157 6.49762 16.6667 7.91745 16.6667C9.33728 16.6667 10.4883 15.5157 10.4883 14.0959C10.4883 12.676 9.33728 11.525 7.91745 11.525Z"
                fill=""
                stroke=""
                strokeWidth="1.5"
              />
            </svg>
            Filter
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
            See all
          </button>
        </div>
      </div>
      <div className="max-w-full overflow-x-auto">
        <Table>
          {/* Table Header */}
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
            <TableRow>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Applicant
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                APPLIED FOR
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                DEPARTMENT
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                EXPERIENCE
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                STATUS
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                APPLIED ON
              </TableCell>
            </TableRow>
          </TableHeader>

          {/* Table Body */}
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {tableData.map((applicant) => (
              <TableRow key={applicant.id}>
                <TableCell className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 overflow-hidden rounded-full">
                      <img
                        src={applicant.image}
                        className="w-10 h-10 object-cover"
                        alt={applicant.name}
                      />
                    </div>
                    <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                      {applicant.name}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {applicant.appliedFor}
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {applicant.department}
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {applicant.experience}
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  <Badge
                    size="sm"
                    color={
                      applicant.status === "Hired"
                        ? "success"
                        : applicant.status === "Pending"
                        ? "warning"
                        : "error"
                    }
                  >
                    {applicant.status}
                  </Badge>
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {applicant.appliedOn}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
