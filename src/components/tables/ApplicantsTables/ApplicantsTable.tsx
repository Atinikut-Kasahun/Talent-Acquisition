import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";

interface Applicant {
  id: number;
  name: string;
  image: string;
  appliedFor: string;
  department: string;
  experience: string;
  appliedOn: string;
}

// Sample applicants data
const applicantsData: Applicant[] = [
  {
    id: 1,
    name: "Sarah Johnson",
    image: "/images/user/user-17.jpg",
    appliedFor: "Senior Frontend Developer",
    department: "Engineering",
    experience: "5 Years",
    appliedOn: "15 May, 2026",
  },
  {
    id: 2,
    name: "Michael Chen",
    image: "/images/user/user-18.jpg",
    appliedFor: "Product Manager",
    department: "Product",
    experience: "7 Years",
    appliedOn: "12 May, 2026",
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    image: "/images/user/user-17.jpg",
    appliedFor: "UI/UX Designer",
    department: "Design",
    experience: "3 Years",
    appliedOn: "10 May, 2026",
  },
  {
    id: 4,
    name: "David Thompson",
    image: "/images/user/user-20.jpg",
    appliedFor: "Backend Engineer",
    department: "Engineering",
    experience: "6 Years",
    appliedOn: "08 May, 2026",
  },
  {
    id: 5,
    name: "Jessica Martinez",
    image: "/images/user/user-21.jpg",
    appliedFor: "Marketing Manager",
    department: "Marketing",
    experience: "4 Years",
    appliedOn: "05 May, 2026",
  },
  {
    id: 6,
    name: "Robert Williams",
    image: "/images/user/user-18.jpg",
    appliedFor: "Data Analyst",
    department: "Analytics",
    experience: "2 Years",
    appliedOn: "02 May, 2026",
  },
];

export default function ApplicantsTable() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          {/* Table Header */}
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Name
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                APPLIED FOR
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                DEPARTMENT
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                EXPERIENCE
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                APPLIED ON
              </TableCell>
            </TableRow>
          </TableHeader>

          {/* Table Body */}
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {applicantsData.map((applicant) => (
              <TableRow key={applicant.id}>
                <TableCell className="px-5 py-4 sm:px-6 text-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 overflow-hidden rounded-full">
                      <img
                        width={40}
                        height={40}
                        src={applicant.image}
                        alt={applicant.name}
                      />
                    </div>
                    <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                      {applicant.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {applicant.appliedFor}
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {applicant.department}
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {applicant.experience}
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
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
