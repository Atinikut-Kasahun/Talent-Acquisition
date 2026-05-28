import PageBreadcrumb from "../components/common/PageBreadCrumb";
import ComponentCard from "../components/common/ComponentCard";
import PageMeta from "../components/common/PageMeta";
import ApplicantsTable from "../components/tables/ApplicantsTables/ApplicantsTable";

export default function Candidates() {
  return (
    <>
      <PageMeta
        title="Applicants Dashboard | Talent Acquisition"
        description="View and manage job applicants and their application details"
      />
      <PageBreadcrumb pageTitle="Applicants" />
      <div className="space-y-6">
        <ComponentCard title="Applicants List">
          <ApplicantsTable />
        </ComponentCard>
      </div>
    </>
  );
}
