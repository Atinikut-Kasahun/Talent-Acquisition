import { BrowserRouter as Router, Routes, Route } from "react-router";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import TADashboard from "./pages/Dashboard/TADashboard";
import SuperAdminDashboard from "./pages/Dashboard/SuperAdminDashboard";
import ManagingDirectorDashboard from "./pages/Dashboard/ManagingDirectorDashboard";
import GeneralManagerDashboard from "./pages/Dashboard/GeneralManagerDashboard";
import HRManagerDashboard from "./pages/Dashboard/HRManagerDashboard";
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
            {/* Home page - shows dashboard based on role */}
            <Route index path="/" element={<DashboardRedirect />} />

            {/* Role-specific dashboards (accessible directly by URL) */}
            <Route
              path="/ta-dashboard"
              element={
                <ProtectedRoute requiredRoles={["superadmin", "admin", "hr", "viewer"]}>
                  <TADashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/superadmin-dashboard"
              element={
                <ProtectedRoute requiredRoles={["superadmin"]}>
                  <SuperAdminDashboard />
                </ProtectedRoute>
              }
            />
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
            <Route
              path="/md-dashboard"
              element={
                <ProtectedRoute requiredRoles={["managing director"]}>
                  <ManagingDirectorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gm-dashboard"
              element={
                <ProtectedRoute requiredRoles={["general Manager"]}>
                  <GeneralManagerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hr-dashboard"
              element={
                <ProtectedRoute requiredRoles={["HR manager"]}>
                  <HRManagerDashboard />
                </ProtectedRoute>
              }
            />

            {/* Other Pages */}
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/candidates" element={<Candidates />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />

            {/* Tables */}
            <Route path="/basic-tables" element={<BasicTables />} />
          </Route>

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
