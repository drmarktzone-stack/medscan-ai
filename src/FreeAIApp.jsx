import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";
import { I18nProvider } from "@/lib/i18n";
import { routerBasename } from "@/lib/clinic/standalone";
import PageNotFound from "@/lib/PageNotFound";
import { R } from "@/freeai/lib/routes.js";

import FreeAIHub from "@/freeai/pages/FreeAIHub";
import FreeAIPlannerPage from "@/freeai/pages/FreeAIPlannerPage";
import FreeAIProvidersPage from "@/freeai/pages/FreeAIProvidersPage";
import FreeAIWorkspacePage from "@/freeai/pages/FreeAIWorkspacePage";
import FreeAIStudio from "@/freeai/pages/FreeAIStudio";
import FreeAIPricingPage from "@/freeai/pages/FreeAIPricingPage";
import FreeAICheckoutPage from "@/freeai/pages/FreeAICheckoutPage";
import FreeAIMarketingPage from "@/freeai/pages/FreeAIMarketingPage";
import CreditPassportPage from "@/freeai/pages/CreditPassportPage";
import KidsHubPage from "@/freeai/kids/pages/KidsHubPage";
import KidsStudyPage from "@/freeai/kids/pages/KidsStudyPage";
import KidsCreatePage from "@/freeai/kids/pages/KidsCreatePage";
import KidsGamePage from "@/freeai/kids/pages/KidsGamePage";
import KidsGalleryPage from "@/freeai/kids/pages/KidsGalleryPage";
import KidsBodyPage from "@/freeai/kids/pages/KidsBodyPage";

/** Standalone FreeAI Hub + Kids — no MedScan, no auth, no clinic. */
export default function FreeAIApp() {
  return (
    <I18nProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router basename={routerBasename(import.meta.env.BASE_URL)}>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Navigate to={R.hub} replace />} />

            <Route path={R.hub} element={<FreeAIHub />} />
            <Route path={R.create} element={<FreeAIWorkspacePage />} />
            <Route path={R.studio} element={<FreeAIStudio />} />
            <Route path={R.pricing} element={<FreeAIPricingPage />} />
            <Route path={R.checkout} element={<FreeAICheckoutPage />} />
            <Route path={R.marketing} element={<FreeAIMarketingPage />} />
            <Route path={R.passport} element={<CreditPassportPage />} />
            <Route path={R.planner} element={<FreeAIPlannerPage />} />
            <Route path={R.providers} element={<FreeAIProvidersPage />} />

            <Route path={R.kids} element={<KidsHubPage />} />
            <Route path={R.kidsStudy} element={<KidsStudyPage />} />
            <Route path={R.kidsBody} element={<KidsBodyPage />} />
            <Route path={R.kidsCreate} element={<KidsCreatePage />} />
            <Route path={R.kidsGame} element={<KidsGamePage />} />
            <Route path={R.kidsGallery} element={<KidsGalleryPage />} />

            {/* Legacy /freeai/* → new paths (old bookmarks) */}
            <Route path="/freeai" element={<Navigate to={R.hub} replace />} />
            <Route path="/freeai/create" element={<Navigate to={R.create} replace />} />
            <Route path="/freeai/studio" element={<Navigate to={R.studio} replace />} />
            <Route path="/freeai/pricing" element={<Navigate to={R.pricing} replace />} />
            <Route path="/freeai/checkout" element={<Navigate to={R.checkout} replace />} />
            <Route path="/freeai/marketing" element={<Navigate to={R.marketing} replace />} />
            <Route path="/freeai/passport" element={<Navigate to={R.passport} replace />} />
            <Route path="/freeai/planner" element={<Navigate to={R.planner} replace />} />
            <Route path="/freeai/providers" element={<Navigate to={R.providers} replace />} />
            <Route path="/freeai/kids" element={<Navigate to={R.kids} replace />} />
            <Route path="/freeai/kids/study" element={<Navigate to={R.kidsStudy} replace />} />
            <Route path="/freeai/kids/body" element={<Navigate to={R.kidsBody} replace />} />
            <Route path="/freeai/kids/create" element={<Navigate to={R.kidsCreate} replace />} />
            <Route path="/freeai/kids/game" element={<Navigate to={R.kidsGame} replace />} />
            <Route path="/freeai/kids/gallery" element={<Navigate to={R.kidsGallery} replace />} />

            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </I18nProvider>
  );
}
