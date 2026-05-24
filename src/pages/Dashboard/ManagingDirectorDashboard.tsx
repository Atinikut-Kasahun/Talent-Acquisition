import ReportMetrics from "../../components/reports/ReportMetrics";
import MonthlyApplicantsChart from "../../components/reports/MonthlyApplicantsChart";
import StatisticsChart from "../../components/reports/StatisticsChart";
import MonthlyTarget from "../../components/reports/MonthlyTarget";
import RecentApplicants from "../../components/reports/RecentApplicants";
import DemographicCard from "../../components/reports/DemographicCard";
import PageMeta from "../../components/common/PageMeta";

export default function ManagingDirectorDashboard() {
  return (
    <>
      <PageMeta
        title="Droga Group | Managing Director Dashboard"
        description="Droga Group Managing Director Dashboard - Overview and approvals."
      />
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
    </>
  );
}
