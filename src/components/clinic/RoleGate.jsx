import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import {
  loadAccount,
  isParentAllowedPath,
  needsRoleSelection,
  isClinicianComplete,
} from "@/lib/clinic/account";
import { isLocalClinicSession } from "@/lib/clinic/localMode";
import { appParams } from "@/lib/app-params";
import { useI18n } from "@/lib/i18n";

export default function RoleGate() {
  const location = useLocation();
  const { t } = useI18n();
  const account = loadAccount();
  const localClinic = isLocalClinicSession({ appId: appParams.appId, token: appParams.token });

  if (needsRoleSelection(account, { localClinic })) {
    return <Navigate to="/register" replace />;
  }
  if (account.role === "parent" && !isParentAllowedPath(location.pathname)) {
    return <Navigate to="/parent" replace />;
  }

  const showLicenseBanner = !localClinic && account.role === "clinician" && !isClinicianComplete(account);

  return (
    <>
      {showLicenseBanner ? (
        <div className="no-print px-4 pt-2">
          <div className="clinic-wrap">
            <Link
              to="/register"
              className="block clinic-card py-2 px-3 text-[11px] leading-relaxed text-amber-950 hover:bg-amber-50"
            >
              {t("register.complete_license_banner")}
            </Link>
          </div>
        </div>
      ) : null}
      <Outlet />
    </>
  );
}
