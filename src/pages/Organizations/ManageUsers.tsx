import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";

export default function ManageUsers() {
  return (
    <>
      <PageMeta
        title="Droga Group | Manage Users"
        description="Manage system users and permissions for Droga Group superadmin."
      />
      <PageBreadcrumb pageTitle="Manage Users" />

      <div className="grid gap-4 md:grid-cols-12 md:gap-6">
        <div className="col-span-12 lg:col-span-8">
          <ComponentCard title="Users Management">
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Create, edit, and manage system users and access permissions.
              </p>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                Manage Users
              </button>
            </div>
          </ComponentCard>
        </div>
      </div>
    </>
  );
}
