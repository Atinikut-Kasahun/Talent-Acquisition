import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

export default function SuperAdminDashboard() {
  return (
    <>
      <PageMeta
        title="Droga Group | Super Admin Dashboard"
        description="Droga Group Super Admin Dashboard - Manage users, companies, and system settings."
      />
      <PageBreadcrumb pageTitle="Super Admin Dashboard" />

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* Empty - Ready for customization */}
      </div>
    </>
  );
}
