import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

export default function ManageCompanies() {
  return (
    <>
      <PageMeta
        title="Droga Group | Manage Companies"
        description="Manage companies dashboard for Droga Group superadmin."
      />
      <PageBreadcrumb pageTitle="Manage Companies" />

      <div className="grid gap-4 md:grid-cols-12 md:gap-6">
        {/* Empty - Ready for customization */}
      </div>
    </>
  );
}
