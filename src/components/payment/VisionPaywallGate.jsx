import { Outlet } from "react-router-dom";
import { visionPaywallOn } from "@/lib/clinic/billingGroups";
import { hasVisionAccess } from "@/lib/clinic/visionSubscription";
import VisionUpsellPage from "@/pages/VisionUpsellPage";

/** Blocks paid vision routes until subscription active (standalone + Bit configured). */
export default function VisionPaywallGate() {
  if (!visionPaywallOn() || hasVisionAccess()) {
    return <Outlet />;
  }
  return <VisionUpsellPage />;
}
