import { Navigate, Outlet, useLocation } from "react-router-dom";
import { loadAccount, isAccountReady, isParentAllowedPath } from "@/lib/clinic/account";

export default function RoleGate() {
  const location = useLocation();
  const account = loadAccount();

  if (!isAccountReady(account)) {
    return <Navigate to="/register" replace />;
  }
  if (account.role === "parent" && !isParentAllowedPath(location.pathname)) {
    return <Navigate to="/parent" replace />;
  }
  return <Outlet />;
}
