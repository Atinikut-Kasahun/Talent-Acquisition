import { useState, useEffect } from "react";
import PageMeta from "../components/common/PageMeta";
import Badge from "../components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import PageBreadcrumb from "../components/common/PageBreadCrumb";

const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "import.meta.env.VITE_API_BASE_URL";

interface Job {
  id: number;
  title: string;
  position?: string;
  department: string;
  location: string;
  status: "Active" | "Closed" | "Pending";
  applicants: number;
  // Add other fields as per your JobPosting model if needed
}

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication token not found.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/jobs`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || "Failed to fetch jobs.");
        }
        const data = await res.json();
        setJobs(
          data.map((job: any) => ({
            ...job,
            position: job.position?.trim() ? job.position : job.title,
          }))
        );
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  return (
    <>
      <PageMeta
        title="Jobs | Talent Acquisition System"
        description="Manage posted jobs in the Talent Acquisition System."
      />
      <PageBreadcrumb pageTitle="Jobs" />

      <div className="space-y-6">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="px-5 py-5 border-b border-gray-200 dark:border-white/[0.05]">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Posted Jobs
            </h3>
          </div>

          <div className="max-w-full overflow-x-auto">
            <Table>
              {/* Table Header */}
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 uppercase"
                  >
                    Position
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 uppercase"
                  >
                    Department
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 uppercase"
                  >
                    Location
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 uppercase"
                  >
                    Status
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 uppercase"
                  >
                    Applicants
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 uppercase"
                  >
                    Action
                  </TableCell>
                </TableRow>
              </TableHeader>

              {/* Table Body */}
              {loading ? (
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      Loading jobs...
                    </TableCell>
                  </TableRow>
                </TableBody>
              ) : error ? (
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-red-500">
                      Error: {error}
                    </TableCell>
                  </TableRow>
                </TableBody>
              ) : jobs.length === 0 ? (
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      No jobs posted yet.
                    </TableCell>
                  </TableRow>
                </TableBody>
              ) : (
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {job.position}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {job.department}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {job.location}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        <Badge
                          size="sm"
                          color={
                            job.status === "Active"
                              ? "success"
                              : job.status === "Pending"
                              ? "warning"
                              : "error"
                          }
                        >
                          {job.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {/* Placeholder for actual applicant images */}
                            <img className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-900" src="/images/user/user-17.jpg" alt="Applicant 1" />
                            <img className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-900" src="/images/user/user-18.jpg" alt="Applicant 2" />
                          </div>
                          <span>+{job.applicants}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        <button className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition">
                          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" clipRule="evenodd" d="M9 3C8.44772 3 8 3.44772 8 4V5H4C3.44772 5 3 5.44772 3 6C3 6.55228 3.44772 7 4 7H5V19C5 20.6569 6.34315 22 8 22H16C17.6569 22 19 20.6569 19 19V7H20C20.5523 7 21 6.55228 21 6C21 5.44772 20.5523 5 20 5H16V4C16 3.44772 15.5523 3 15 3H9ZM10 5V4H14V5H10ZM7 7H17V19C17 19.5523 16.5523 20 16 20H8C7.44772 20 7 19.5523 7 19V7ZM9 10C9.55228 10 10 10.4477 10 11V16C10 16.5523 9.55228 17 9 17C8.44772 17 8 16.5523 8 16V11C8 10.4477 8.44772 10 9 10ZM15 10C15.5523 10 16 10.4477 16 11V16C16 16.5523 15.5523 17 15 17C14.4477 17 14 16.5523 14 16V11C14 10.4477 14.4477 10 15 10Z" />
                          </svg>
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              )}
            </Table>
          </div>
        </div>
      </div>
    </>
  );
}
