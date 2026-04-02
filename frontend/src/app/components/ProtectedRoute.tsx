import { Navigate, Outlet } from "react-router";

export function ProtectedRoute() {
  const token = localStorage.getItem("access_token");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
