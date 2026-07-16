import { BrowserRouter as Router, Routes, Route } from "react-router";
import NotFound from "./pages/OtherPage/NotFound";
import Changelog from "./pages/OtherPage/Changelog";
import UserProfiles from "./pages/UserProfiles";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import Employees from "./pages/Employees";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Dashboard from "./pages/Dashboard/Dashboard";
import ManageCompanies from "./pages/Organizations/ManageCompanies";
import ManageUsers from "./pages/Organizations/ManageUsers";
import SignIn from "./pages/SignIn";
import Jobs from "./pages/Jobs";
import Chat from "./pages/Chat";
import Candidates from "./pages/Candidates";
import ProtectedRoute from "./components/common/ProtectedRoute";
import DashboardRedirect from "./components/common/DashboardRedirect";
// Careers Public Pages
import LandingPage from "./components/Careers/LandingPage";
import JobDetail from "./components/Careers/JobDetail";
import HiringPlanGM from "./pages/HiringPlan/HiringPlanGM";

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* ── Public Careers Pages (standalone, no dashboard shell) ── */}
          <Route path="/careers" element={<LandingPage />} />
          <Route path="/careers/jobs/:id" element={<JobDetail />} />

          {/* ── Auth ── */}
          <Route path="/signin" element={<SignIn />} />

          {/* ── Protected Dashboard Layout ── */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Home page - redirects to /dashboard */}
            <Route index path="/" element={<DashboardRedirect />} />

            {/* ── Single unified dashboard for all roles ── */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* ── Changelog / Release Notes (linked from sidebar version tag) ── */}
            <Route path="/changelog" element={<Changelog />} />

            {/* ── Organizations (superadmin only) ── */}
            <Route
              path="/manage-companies"
              element={
                <ProtectedRoute requiredRoles={["superadmin"]}>
                  <ManageCompanies />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manage-users"
              element={
                <ProtectedRoute requiredRoles={["superadmin"]}>
                  <ManageUsers />
                </ProtectedRoute>
              }
            />

            {/* ── Hiring Plan ── */}
            <Route
              path="/hiring-plan"
              element={
                <ProtectedRoute requiredRoles={["general Manager"]}>
                  <HiringPlanGM />
                </ProtectedRoute>
              }
            />

            {/* ── Other Pages ── */}
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/candidates" element={<Candidates />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />

            {/* Tables */}
            <Route path="/basic-tables" element={<BasicTables />} />
            <Route path="/employees" element={<Employees />} />
          </Route>

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
