import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

interface ReleaseEntry {
  version: string;
  date: string;
  changes: string[];
}

const RELEASES: ReleaseEntry[] = [
  {
    version: "v1.0.0",
    date: "July 2026",
    changes: [
      "Initial production release of the Talent Acquisition platform.",
      "Role-based dashboards, including the General Manager Requisition Command Center.",
      "Employee Directory with filters, pagination, and lifecycle actions.",
      "Guided New Requisition wizard with department-based JD templates.",
    ],
  },
];

export default function Changelog() {
  return (
    <>
      <PageMeta
        title="Changelog | Droga Group"
        description="Release notes and version history for the Talent Acquisition platform."
      />
      <PageBreadcrumb pageTitle="Changelog" />

      <div className="max-w-2xl space-y-6">
        {RELEASES.map((release) => (
          <div
            key={release.version}
            className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="font-mono text-sm font-semibold px-2.5 py-1 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-950">
                {release.version}
              </span>
              <span className="text-sm text-gray-400 dark:text-gray-500">{release.date}</span>
            </div>
            <ul className="space-y-2">
              {release.changes.map((change, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 mt-1.5 shrink-0" />
                  {change}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}
