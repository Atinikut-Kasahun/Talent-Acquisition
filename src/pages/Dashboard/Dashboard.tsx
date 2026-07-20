import ReportMetrics from "../../components/reports/ReportMetrics";
import MonthlyApplicantsChart from "../../components/reports/MonthlyApplicantsChart";
import StatisticsChart from "../../components/reports/StatisticsChart";
import MonthlyTarget from "../../components/reports/MonthlyTarget";
import RecentApplicants from "../../components/reports/RecentApplicants";
import DemographicCard from "../../components/reports/DemographicCard";
import PageMeta from "../../components/common/PageMeta";
import GeneralManagerDashboard from "../../components/dashboard/GeneralManagerDashboard";
import ManagingDirectorDashboard from "../../components/dashboard/ManagingDirectorDashboard";
import HRManagerDashboard from "../../components/dashboard/HRManagerDashboard";

export default function Dashboard() {
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const hideReportsForSuperAdmin = user?.email === "superadmin@droga-group.com";
  const isGeneralManager = user?.role === "general Manager";
  const isManagingDirector = user?.role === "managing director";
  const isHRManager = user?.role === "HR manager";

  return (
    <>
      <PageMeta
        title="Droga Group | Dashboard"
        description="Droga Group HR Management Dashboard - Manage job postings, applicants, and recruitment."
      />

      {isGeneralManager ? (
        <GeneralManagerDashboard />
      ) : isManagingDirector ? (
        <ManagingDirectorDashboard />
      ) : isHRManager ? (
        <HRManagerDashboard />
      ) : hideReportsForSuperAdmin ? null : (
        <div className="grid grid-cols-12 gap-4 md:gap-6">
          <div className="col-span-12 space-y-6 xl:col-span-7">
            <ReportMetrics />

            <MonthlyApplicantsChart />
          </div>

          <div className="col-span-12 xl:col-span-5">
            <MonthlyTarget />
          </div>

          <div className="col-span-12">
            <StatisticsChart />
          </div>

          <div className="col-span-12 xl:col-span-5">
            <DemographicCard />
          </div>

          <div className="col-span-12 xl:col-span-7">
            <RecentApplicants />
          </div>
        </div>
      )}
    </>
  );
}
