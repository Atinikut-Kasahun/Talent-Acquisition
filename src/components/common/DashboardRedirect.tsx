import { useEffect } from "react";
import { useNavigate } from "react-router";

export default function DashboardRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const userJson = localStorage.getItem("user");
    const user = userJson ? JSON.parse(userJson) : null;

    if (!user) {
      navigate("/signin", { replace: true });
      return;
    }

    // Route to dashboard based on role
    const roleRoutes: Record<string, string> = {
      superadmin: "/ta-dashboard",
      admin: "/ta-dashboard",
      hr: "/ta-dashboard",
      viewer: "/ta-dashboard",
      "managing director": "/md-dashboard",
      "general Manager": "/gm-dashboard",
      "HR manager": "/hr-dashboard",
    };

    const dashboardPath = roleRoutes[user.role] || "/ta-dashboard";
    navigate(dashboardPath, { replace: true });
  }, [navigate]);

  return <div>Loading...</div>;
}
