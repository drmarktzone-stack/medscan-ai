import { Navigate, Outlet, useLocation } from "react-router-dom";
import {
  loadAccount,
  isParentAllowedPath,
  needsRoleSelection,
  mustCompleteClinicianProfile,
  CLINICIAN_SWITCH_PATH,
} from "@/lib/clinic/account";

export default function RoleGate() {
  const location = useLocation();
  const account = loadAccount();

  if (needsRoleSelection(account) || mustCompleteClinicianProfile(account)) {
    return <Navigate to="/register" replace />;
  }
  if (account.role === "parent" && !isParentAllowedPath(location.pathname)) {
    if (location.pathname === "/doctorped" || location.pathname === "/") {
      return <Navigate to={CLINICIAN_SWITCH_PATH} replace />;
    }
    return <Navigate to="/parent" replace />;
  }

  return <Outlet />;
}
