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

    // All roles share the single unified dashboard
    navigate("/dashboard", { replace: true });
  }, [navigate]);

  return <div>Loading...</div>;
}
