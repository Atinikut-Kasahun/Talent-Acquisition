import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import BasicTableOne from "../../components/tables/BasicTables/BasicTableOne";

export default function BasicTables() {
  return (
    <>
      <PageMeta
        title="Emplpoyees  module  | Droga Group"
        description="This is the employee module of the Droga Group talent acquisition portal"
      />
      <PageBreadcrumb pageTitle="View Employees" />
      <div className="space-y-6">
        <ComponentCard title="Employee Roster">
          <BasicTableOne />
        </ComponentCard>
      </div>
    </>
  );
}
