import { BrowserRouter as Router, Routes, Route } from "react-router";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import SignIn from "./pages/SignIn";
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

          {/* ── Dashboard Layout (unchanged) ── */}
          <Route element={<AppLayout />}>
            <Route index path="/" element={<Home />} />

            {/* Others Page */}
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />

            {/* Tables */}
            <Route path="/basic-tables" element={<BasicTables />} />
          </Route>

          {/* Auth */}
          <Route path="/signin" element={<SignIn />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
