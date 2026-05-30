import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./store";

/** Guards nested routes; redirects unauthenticated users to /login. */
export function ProtectedRoute() {
  const user = useAuth((s) => s.user);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return <Outlet />;
}
